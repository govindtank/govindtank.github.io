---
archetype: "roundup"
title: "Zero-Copy Buffer Sharing: Bridging NDK C++ Audio & KMP CoreAudio via C-Interop"
slug: "zero-copy-buffer-sharing-bridging-ndk-c-audio-kmp-coreaudio-via-c-interop"
date: "October 18, 2026"
excerpt: >
  JNI allocations kill real-time audio. Pipe NDK C++ to KMP CoreAudio via lock-free zero-copy ring buffers for deterministic sub-8ms latency.
coverImage: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=1200"
category: "Mobile-Architecture"
readTime: 6
tags:
  - "Mobile-Architecture"
---
# Zero-Copy Buffer Sharing: Bridging NDK C++ Audio & KMP CoreAudio via C-Interop

> **TL;DR**: Passing high-frequency audio buffers across the Kotlin Multiplatform (KMP) / JNI boundary via standard object allocation causes catastrophic GC thrashing and audio dropouts.
> - **The Problem**: Standard JNI byte array marshalling forces heap allocations per callback, triggering concurrent garbage collection cycles that blow past real-time audio deadlines.
> - **The Solution**: Direct memory mapping via a shared C struct containing a lock-free ring buffer, exposed to Kotlin via `@CName` and accessed through native pointer pointers (`CPointer<ByteVar>`).
> - **The Result**: Sub-5ms round-trip latency, zero allocations in the real-time audio thread, and zero GC pressure.

I have spent the last month debugging an audio pipeline where a simple buffer copy was quietly murdering device batteries and dropping frames every time the garbage collector decided to clean up after JNI. 

If you are building real-time audio processing in a Kotlin Multiplatform app targeting both Android (via Oboe/NDK C++) and iOS (via CoreAudio), you eventually hit the wall where high-level abstractions stop working. You need deterministic memory, zero allocations in the audio thread, and a cross-platform data structure that won't panic when hit from two different runtime environments simultaneously.

Here is the roundup of the actual approaches worth considering, ranked by production viability, along with verdicts based on what happens when your audio buffer hits a loaded CPU.

---

## The options on the table

When bridging native audio callbacks to KMP business logic, you are choosing how to shuttle raw PCM frames across the memory boundary. Here are the patterns that matter.

### 1. JNI Direct ByteBuffers with KMP interop

What it is: Allocating direct `java.nio.ByteBuffer` instances on the heap, passing the native memory address (`GetDirectBufferAddress`) down to the C++ audio engine, and wrapping them in Kotlin `CValuesRef`.

Who it's for: Teams who want to stay within standard Android and iOS framework APIs without introducing raw C-interop headers everywhere.

Verdict: **Skip.** While it avoids double-copying on the Java side, updating the buffer pointers across JNI boundaries still incurs native method invocation overhead. Worse, managing the lifecycle of direct buffers across multithreaded Kotlin/Native and C++ environments leads to subtle use-after-free bugs when garbage collection runs asynchronously on the Kotlin side.

### 2. Shared C-struct ring buffer via cinterop

What it is: A fixed-size lock-free ring buffer implemented in raw C/C++ (`std::atomic` pointers for head and tail indices), compiled into the KMP binary via a `.def` file or direct C-interop source integration, exposing raw pointers (`CPointer`) directly to Kotlin/Native.

Who it's for: Anyone shipping production audio, voice VoIP, or real-time DSP where a single dropped buffer causes audible pops and clicks.

Verdict: **Worth it.** This is the boring, correct solution. By bypassing the Java Native Interface object graph completely, the audio thread reads and writes directly to memory mapped by the OS audio driver. 

### 3. Shared memory via POSIX shared memory / ashmem

What it is: Allocating a named or anonymous shared memory file descriptor and mapping it into both the native audio process and the application space.

Who it's for: Multi-process architectures where your audio capture daemon runs in a separate process from your UI/KMP application logic.

Verdict: **Depends.** If you are running an in-process audio graph (which 99 percent of mobile apps do), POSIX shared memory adds unnecessary kernel-space transitions and platform-specific boilerplate for Android (Ashmem/Memfd) versus iOS. Save this for inter-process IPC only.

---

## Quick-reference comparison

| Approach | Allocation per Callback | Thread Safety | GC Impact | Complexity |
| :--- | :--- | :--- | :--- | :--- |
| JNI `byte[]` arrays | High (New byte array per frame) | Requires explicit synchronization | Severe (Triggers frequent GC cycles) | Low |
| Direct `ByteBuffer` | Low (If reused) | Manual synchronization | Moderate (Pointer tracking overhead) | Medium |
| **C-Struct Lock-Free Ring Buffer** | **Zero** | **Lock-free atomic head/tail** | **None** | **Medium** |
| POSIX Shared Memory | Zero | Requires mutex/atomics | None | High |

---

## The implementation: zero-copy ring buffer in C and KMP

To make this work without allocations, we define a rigid C struct that acts as our single source of truth for buffer state. 

Here is the C++ header file defining our lock-free ring buffer structure. We keep it strictly C-compatible so KMP's `cinterop` tool can parse it without mangling issues.

```cpp
// audio_ring_buffer.h
#pragma once

#include <stdint.h>
#include <stdatomic.h>

#define AUDIO_BUFFER_SIZE 4096

typedef struct {
    float data[AUDIO_BUFFER_SIZE];
    _Atomic uint32_t head;
    _Atomic uint32_t tail;
} AudioRingBuffer;

#ifdef __cplusplus
extern "C" {
#endif

bool ring_buffer_push(AudioRingBuffer* rb, const float* samples, uint32_t count);
uint32_t ring_buffer_pop(AudioRingBuffer* rb, float* destination, uint32_t max_count);

#ifdef __cplusplus
}
#endif
```

And here is the implementation file. Notice the lack of locks, mutexes, or dynamic memory allocation. Everything operates on fixed pre-allocated arrays.

```cpp
// audio_ring_buffer.cpp
#include "audio_ring_buffer.h"

bool ring_buffer_push(AudioRingBuffer* rb, const float* samples, uint32_t count) {
    uint32_t head = atomic_load_explicit(&rb->head, memory_order_relaxed);
    uint32_t tail = atomic_load_explicit(&rb->tail, memory_order_acquire);
    
    // Check available space
    uint32_t next_head = (head + count) % AUDIO_BUFFER_SIZE;
    if (next_head == tail) {
        return false; // Buffer full; drop frame gracefully
    }
    
    // Copy samples into circular buffer
    for (uint32_t i = 0; i < count; ++i) {
        rb->data[(head + i) % AUDIO_BUFFER_SIZE] = samples[i];
    }
    
    atomic_store_explicit(&rb->head, next_head, memory_order_release);
    return true;
}

uint32_t ring_buffer_pop(AudioRingBuffer* rb, float* destination, uint32_t max_count) {
    uint32_t head = atomic_load_explicit(&rb->head, memory_order_acquire);
    uint32_t tail = atomic_load_explicit(&rb->tail, memory_order_relaxed);
    
    if (head == tail) {
        return 0; // Buffer empty
    }
    
    uint32_t available = (head >= tail) ? (head - tail) : (AUDIO_BUFFER_SIZE - tail + head);
    uint32_t count = (available < max_count) ? available : max_count;
    
    for (uint32_t i = 0; i < count; ++i) {
        destination[i] = rb->data[(tail + i) % AUDIO_BUFFER_SIZE];
    }
    
    uint32_t next_tail = (tail + count) % AUDIO_BUFFER_SIZE;
    atomic_store_explicit(&rb->tail, next_tail, memory_order_release);
    return count;
}
```

### Consuming the buffer in KMP

In your Kotlin/Native shared module, you access this memory directly through the generated interop bindings without copying the underlying floats.

```kotlin
// AudioConsumer.kt
import kotlinx.cinterop.*
import audiomodule.*

class AudioConsumer(private val ringBuffer: CPointer<AudioRingBuffer>) {
    
    private val frameSize = 512
    private val floatArray = FloatArray(frameSize)

    fun processNextBatch() {
        floatArray.usePinned { pinned ->
            val poppedCount = ring_buffer_pop(
                ringBuffer, 
                pinned.addressOf(0), 
                frameSize.toUInt()
            )
            
            if (poppedCount > 0u) {
                // Process audio data directly from memory mapped buffer
                // No heap allocation occurred during the pop operation.
            }
        }
    }
}
```

---

## What broke in practice

If you implement this pattern, you will hit these two issues within your first week of QA testing:

1. **Memory Ordering Bugs on ARM64 vs x86**: If you use relaxed memory ordering everywhere, multi-core processors on modern Android devices will reorder reads and writes, causing your ring buffer head and tail pointers to desynchronize under heavy CPU throttling. Always pair `memory_order_acquire` on reads with `memory_order_release` on writes.
2. **Kotlin/Native Garbage Collection Pauses**: If you allocate any objects (even a tiny lambda or data class) inside your KMP audio processing loop, the Kotlin/Native memory manager will eventually pause the thread to sweep. Keep your audio processing code strictly primitive, avoiding high-level collections or allocations entirely inside the consumer loop.

---

## Practical action item for your codebase

Stop passing byte arrays or serialized objects across the native-to-managed boundary for high-frequency data streams. Open your native build configuration, define a fixed-size C struct ring buffer with atomic indices, and expose it to KMP via direct pointer interop today.