---
archetype: "roundup"
title: "C-Interop in Kotlin Multiplatform: Writing High-Performance Rust & C++ Bridges Without Overhead"
slug: "c-interop-in-kotlin-multiplatform-writing-high-performance-rust-c-bridges-without-overhead"
date: "October 10, 2026"
excerpt: >
  Stop writing brittle JNI wrappers. Learn to bridge Rust and C++ crypto/compression engines directly to iOS and Android with zero-overhead KMP cinterop def files.
coverImage: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=1200"
category: "Kotlin"
readTime: 7
tags:
  - "Kotlin"
---
# C-Interop in Kotlin Multiplatform: Writing High-Performance Rust & C++ Bridges Without Overhead

> **TL;DR**: Stop building duplicated, manually synchronized JNI bindings on Android and dynamic framework wrappers on iOS when bridging native engines to Kotlin Multiplatform. Standardizing on a pure C ABI layer paired with Kotlin/Native's `cinterop` and Android JNI fast-paths gives you a single source of truth across platforms.
> - **The Problem**: High-throughput engines (Zstandard compression, libsodium crypto, custom signal processing) incur massive overhead when marshaling objects across JNI on Android and bridging through dynamic Objective-C runtimes on iOS, leading to GC pressure, buffer copies, and maintenance hell.
> - **The Solution**: Expose a flat, zero-allocation C ABI (`extern "C"`) in Rust/C++, generate zero-overhead Kotlin/Native bindings via Gradle `.def` declarations, and bypass JNI object allocation on JVM using direct `ByteBuffer` pointers.
> - **The Result**: Zero heap allocations on the hot path, eliminated cross-platform serialization layers, and sub-microsecond call overhead across both targets.

You have a high-performance compression algorithm in C++ or a hardened cryptographic engine in Rust. You need it running on both iOS and Android inside a Kotlin Multiplatform (KMP) shared module. 

Most teams pick one of two bad paths: they either handwrite fragile JNI wrappers for Android alongside a completely separate Swift/C-interop layer for iOS, or they pull in high-level bridging tools that box every integer and allocate memory on every call.

This review cuts through the options. We evaluated five distinct strategies for integrating Rust and C++ codebases into production KMP apps, testing them for invocation overhead, build maintenance complexity, and memory safety.

---

## Evaluation criteria

To make this list, an approach had to survive real-world constraints:

1. **Call overhead & allocations**: Does the bridge allocate heap memory during simple buffer passing, or can it operate strictly on pinned/direct pointers?
2. **Build-chain sanity**: How much Gradle/Cargo/CMake glue is required to keep target architectures (x86_64 simulators, arm64 devices) in sync?
3. **ABI stability**: Can you update native engine logic without breaking client code on both platforms?

---

## The approaches: analysis and verdicts

### 1. Direct Kotlin/Native `cinterop` with a flat C ABI

What it is: You compile your Rust or C++ engine to a static library (`.a`) exposing an `extern "C"` API. Kotlin/Native’s `cinterop` tool parses the header file via a Gradle `.def` file, producing typed Kotlin bindings that compile directly down to LLVM bitcode on Apple targets.

Who it's for: Teams that control their native build pipeline and want zero-cost native execution on iOS, paired with an idiomatic C-level JNI implementation for Android.

```kotlin
// nativeInterop/cinterop/engine.def
headers = engine.h
headerFilter = engine.h
package = com.engine.native
staticLibraries = libengine.a
libraryPaths = src/nativeInterop/cinterop/libs/iosArm64
```

```rust
// lib.rs - Rust side exposing flat C ABI
#[no_mangle]
pub unsafe extern "C" fn engine_compress(
    input_ptr: *const u8,
    input_len: usize,
    output_ptr: *mut u8,
    output_capacity: usize,
) -> i64 {
    if input_ptr.is_null() || output_ptr.is_null() {
        return -1;
    }
    let input = std::slice::from_raw_parts(input_ptr, input_len);
    let output = std::slice::from_raw_parts_mut(output_ptr, output_capacity);

    match zstd::bulk::compress_to_buffer(input, output, 3) {
        Ok(written) => written as i64,
        Err(_) => -2,
    }
}
```

```kotlin
// iOS Kotlin/Native actual implementation: zero buffer copy
actual class FastCompressor {
    actual fun compress(input: ByteArray, output: ByteArray): Long {
        return input.usePinned { pinnedInput ->
            output.usePinned { pinnedOutput ->
                com.engine.native.engine_compress(
                    pinnedInput.addressOf(0).reinterpret(),
                    input.size.toULong(),
                    pinnedOutput.addressOf(0).reinterpret(),
                    output.size.toULong()
                )
            }
        }
    }
}
```

**Verdict: Worth it.** This is the gold standard for performance. Kotlin/Native invokes the C symbol directly without going through any intermediate virtual machine layer.

---

### 2. UniFFI (Mozilla) multi-language scaffold generation

What it is: An interface definition language (IDL) and macro system developed by Mozilla that generates bindings for Rust across Kotlin (JNA/JNI) and Swift simultaneously.

Who it's for: Rust-heavy organizations that prefer writing high-level interfaces (returning structured types, `Result<T, E>`) and are willing to accept serialization overhead on function calls.

```rust
// engine.udl
namespace engine {
    u64 compress_bytes(sequence<u8> input, sequence<u8> output);
};
```

**Verdict: Depends.** Great for high-level SDKs (e.g., auth, networking state machines) where business logic dominates. Skip it for high-throughput crypto or streaming media—UniFFI serializes types across the boundary by default, which tanks performance on large buffers.

---

### 3. Java Native Access (JNA) + Swift bridge wrappers

What it is: Using JNA on the Android/JVM side to dynamically load symbols at runtime without compiling C JNI stubs, alongside a separate Swift Package Manager export for iOS.

Who it's for: Quick prototypes where you refuse to write C glue code or JNI export functions.

```kotlin
// Android-only side-effect: dynamically searches lib at runtime
interface NativeEngine : com.sun.jna.Library {
    fun engine_compress(input: ByteArray, inLen: Long, output: ByteArray, outLen: Long): Long
}
```

**Verdict: Skip.** JNA relies on `libffi` to construct calls dynamically, which adds substantial microsecond-level overhead per invocation and bloats Android binary size. It fails completely on Kotlin/Native, forcing you to maintain two disparate bridging mechanisms.

---

### 4. Custom JNI fast-paths + K/N `usePinned` dual bridge

What it is: A structured pattern where you write a single Rust/C++ codebase with two explicit targets:
1. `extern "C"` flat functions for Kotlin/Native (`cinterop`).
2. `Java_com_...` JNI entry points using direct `GetPrimitiveArrayCritical` or `GetDirectBufferAddress` for the Android JVM engine.

```cpp
// engine_jni.cpp - Android JVM bridge
#include <jni.h>
#include "engine.h"

extern "C" JNIEXPORT jlong JNICALL
Java_com_engine_FastCompressor_compressNative(
    JNIEnv* env,
    jobject /* this */,
    jbyteArray input,
    jint input_len,
    jbyteArray output,
    jint output_cap
) {
    // Avoids GC copy overhead by getting direct access to JVM pinned memory
    jbyte* in_bytes = (jbyte*) env->GetPrimitiveArrayCritical(input, nullptr);
    jbyte* out_bytes = (jbyte*) env->GetPrimitiveArrayCritical(output, nullptr);

    if (!in_bytes || !out_bytes) {
        if (in_bytes) env->ReleasePrimitiveArrayCritical(input, in_bytes, JNI_ABORT);
        if (out_bytes) env->ReleasePrimitiveArrayCritical(output, out_bytes, 0);
        return -1;
    }

    int64_t written = engine_compress(
        reinterpret_cast<const uint8_t*>(in_bytes),
        (size_t) input_len,
        reinterpret_cast<uint8_t*>(out_bytes),
        (size_t) output_cap
    );

    // Commit changes to output, discard input changes
    env->ReleasePrimitiveArrayCritical(output, out_bytes, 0);
    env->ReleasePrimitiveArrayCritical(input, in_bytes, JNI_ABORT);

    return (jlong) written;
}
```

**Verdict: Worth it.** Demands more upfront boilerplate, but it delivers maximum throughput on both Android JVM and iOS Kotlin/Native. Zero runtime memory allocation during execution.

---

### 5. Djinni (Forked / Mobile-CPP)

What it is: A legacy IDL generator originally created by Dropbox that creates C++ and Java/Objective-C bindings.

Who it's for: Legacy codebases already deeply wired with Djinni definitions.

**Verdict: Skip.** Djinni bridges into Objective-C, not Kotlin/Native. On modern KMP, this forces an unnecessary translation layer (`Kotlin -> Obj-C -> C++`) on iOS, preventing Kotlin/Native from optimizing direct LLVM call sites.

---

## Comparison matrix

| Strategy | iOS Overhead | Android Overhead | Build Tooling Complexity | GC Pressure |
| :--- | :--- | :--- | :--- | :--- |
| **1. Direct `cinterop` (C ABI)** | Zero (Direct LLVM call) | Requires separate JNI | Moderate (`.def` files + Cargo/CMake) | None |
| **2. UniFFI** | Low-Moderate | Moderate (JNA/JNI auto) | Low (Rust-managed) | High on buffers |
| **3. JNA + Swift Bridge** | N/A (Manual Swift) | High (`libffi` call dispatch)| Low | High |
| **4. Dual Bridge (C ABI + JNI Critical)** | Zero | Zero | High (Two binding layers) | None |
| **5. Djinni (Forked)** | Moderate (Obj-C boundary) | Low-Moderate | High | Moderate |

---

## Common pitfalls and how to avoid them

### Pointer pinning deadlocks in Kotlin/Native
When calling `input.usePinned { }`, the Kotlin GC is barred from moving that memory block. If your native code long-polls or invokes blocking IO while holding a pinned Kotlin pointer, GC sweeps on background worker threads will freeze.

*Rule*: Only pin memory for the exact duration of computation. If the native side requires background processing, allocate an unmanaged buffer via native memory (`nativeHeap.allocArray`), copy the data, and release the pinned Kotlin object immediately.

### Android `GetPrimitiveArrayCritical` stalls
`GetPrimitiveArrayCritical` disables the JVM Garbage Collector on the running thread. If your C++ function runs for more than a few milliseconds, other threads trying to allocate memory will lock up, leading to noticeable frame drops.

*Rule*: For payloads larger than ~2MB or tasks lasting longer than 1ms, pass `java.nio.ByteBuffer.allocateDirect` instances and read their pointers in C via `env->GetDirectBufferAddress()`. This avoids stalling the GC entirely.

### Target architecture mismatch on iOS Simulators
A classic CI failure happens when building native static archives for iOS simulators on Apple Silicon (M-series) Macs. Both the simulator and the host are `arm64`, but the library target for the simulator must explicitly be `aarch64-apple-ios-sim`, not `aarch64-apple-ios` or `aarch64-apple-darwin`.

---

## Action item for your codebase

Stop looking for a magic generator that translates complex object graphs across native boundaries. 

Refactor your native engine to expose exactly one header consisting of flat C functions that take primitive pointers and lengths. Wire that header directly to Kotlin/Native via a `.def` file for Apple targets, and write a straightforward JNI file utilizing `GetPrimitiveArrayCritical` or Direct `ByteBuffer`s for Android. You eliminate runtime bridging libraries and cut data marshaling costs down to raw memory reads.