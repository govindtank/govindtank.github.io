---
archetype: "comparison"
title: "KMP Binary Size and Startup Time Benchmarking: ProGuard, R8, and Objective-C Frameworks"
slug: "kmp-binary-size-and-startup-time-benchmarking-proguard-r8-and-objective-c-frameworks"
date: "September 14, 2026"
excerpt: >
  A benchmark of KMP artifact footprints on Android and iOS. Measures R8 dead-code elimination against Xcode strip levels and dSYM handling to track binary size and cold startup impact.
coverImage: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&q=80&w=1200"
category: "Kotlin"
readTime: 9
tags:
  - "Kotlin"
---
# KMP Binary Size and Startup Time Benchmarking: ProGuard, R8, and Objective-C Frameworks

You have finished architecting your domain logic, repositories, and state machines in Kotlin Multiplatform (KMP). On paper, you unified 60% of your codebase across Android and iOS. Then you run your release builds and check the metrics. 

Your Android APK download size increased, though R8 did a reasonable job containing it. But your iOS IPA grew substantially, cold-start metrics drifted by tens of milliseconds on older iPhones, and you are staring at a 45MB release binary inside your CocoaPods or Swift Package Manager framework wrapper.

Every mobile architect adopting KMP hits this inflection point: do you treat dead-code elimination (DCE), linking, and symbol stripping as separate native concerns, or can you homogenize them within the Gradle build pipeline? 

The toolchains behave differently on each target. Android leverages R8 and ProGuard rules to strip unreachable bytecode and dex instructions at compile time. iOS relies on the Kotlin/Native LLVM backend (`konan`), generating an Objective-C framework or an XCFramework that must subsequently survive Apple's Mach-O static linker (`ld64`/`lld`), symbol stripping (`strip`), and dSYM separation.

Understanding how to tune both pipelines is mandatory if you want cross-platform code sharing without paying a penalty in binary bloat and app launch latency.

---

## The two compilation models: JVM bytecode vs. native Mach-O

When you compile a shared KMP module, Gradle routes artifacts down two distinct pipelines.

```
[Shared Kotlin Common Code]
           │
     ┌─────┴─────────────────────────┐
     ▼                               ▼
[Kotlin/JVM]                   [Kotlin/Native (Konan)]
     │                               │
[JVM Bytecode (.class)]        [LLVM Bitcode / IR]
     │                               │
[D8 / R8 Compiler]             [LLVM Backend / Linker]
     │                               │
[Android DEX (.dex)]           [Mach-O Dynamic/Static Framework]
     │                               │
[APK / AAB Package]            [Xcode Build Phase: strip & dSYM]
                                     │
                               [App Store IPA]
```

On Android, the Kotlin code compiles to standard JVM bytecode. The Android Gradle Plugin (AGP) passes these `.class` files through D8 and R8. R8 operates as a single-pass shrinker, optimizer, and dexer, resolving virtual method calls, inlining trivial accessors, and stripping unused classes based on the reachability roots defined in your keep rules.

On iOS, the Kotlin/Native compiler compiles Kotlin down to LLVM intermediate representation (IR), links against the Kotlin/Native runtime (which includes its own garbage collector and memory allocators), and produces either a static or dynamic Mach-O binary. Because Kotlin/Native exposes an Objective-C/Swift header bridge, every public declaration in your shared module can become a root export. The LLVM linker will not aggressively strip public symbols unless explicitly instructed, because it assumes the consuming Objective-C/Swift code in Xcode might invoke them dynamically via the Objective-C runtime.

---

## Android binary footprint: R8 and ProGuard configuration

R8 is enabled by default in Android release builds. It handles three distinct phases:
1. **Tree shaking (shrinking):** Traces reachable code starting from entry points (Activities, Services, BroadcastReceivers, and custom `-keep` rules).
2. **Optimization:** Inlines classes, merges interfaces, strips unused parameters, and flattens package hierarchies.
3. **Obfuscation and Dexing:** Renames identifiers to short characters and outputs single or multi-DEX files.

### Kotlin reflection and serialization bloat

The most common cause of binary bloat in KMP on Android is unoptimized reflection metadata and serialization models. If you use `kotlinx.serialization` alongside custom models, overly broad ProGuard rules defeat R8's optimizer.

Here is a common anti-pattern in `consumer-rules.pro` that inflates binary size:

```proguard
# BAD: Defeats R8 tree-shaking across the entire shared module
-keep class com.example.shared.domain.models.** { *; }
-keepclassmembers class * implements kotlinx.serialization.KSerializer {
    *;
}
```

Instead, write targeted rules that retain only the serialization hooks required by Kotlin's compiler plugin while permitting R8 to eliminate unused properties and inline data classes:

```proguard
# GOOD: Keep only synthetic serializer instances and generated descriptors
-keepclassmembers class * {
    static null kotlinx.serialization.KSerializer Companion;
}

-keepclasseswithmembers class * {
    kotlinx.serialization.KSerializer serializer(...);
}

# Allow R8 to rename and remove unused model fields if not serialized by name
-keepclassmembers class * extends kotlinx.serialization.internal.GeneratedSerializer {
    private final kotlinx.serialization.descriptors.SerialDescriptor descriptor;
}
```

### Measuring R8 impact on startup

To verify R8's impact on Android startup, inspect your DEX distribution. Method count and uncompressed DEX size directly influence class pre-verification and compilation overhead during Android runtime (ART) verification on cold boot:

```bash
# Analyze DEX composition
./gradlew assembleRelease
apkanalyzer dex packages app/build/outputs/apk/release/app-release.apk
```

Enabling full mode in `gradle.properties` yields maximum dead-code elimination:

```properties
android.enableR8.fullMode=true
```

R8 Full Mode optimizes constructor invocations, removes dead proto fields, and aggressively merges single-implementation interfaces common in KMP repositories.

---

## iOS binary footprint: Kotlin/Native, strip configurations, and dSYMs

The iOS output from KMP is fundamentally different. Kotlin/Native bundles its own runtime, including an allocator, reference tracking infrastructure, and garbage collector. 

### Static vs. dynamic frameworks

You can configure your shared Gradle build to produce either a static or dynamic framework:

```kotlin
// shared/build.gradle.kts
kotlin {
    listOf(
        iosX64(),
        iosArm64(),
        iosSimulatorArm64()
    ).forEach { iosTarget ->
        iosTarget.binaries.framework {
            baseName = "SharedEngine"
            
            // Choose between static or dynamic
            isStatic = true // or false
            
            // Linker options for LLVM
            linkerOpts("-Xlinker", "-dead_strip")
        }
    }
}
```

- **Dynamic frameworks (`isStatic = false`):** The framework compiles into a standalone Mach-O dylib. The Kotlin/Native runtime is packaged inside it. At runtime, the iOS dynamic linker (`dyld`) must load the binary into memory, resolve rebase and bind pointers, and run initializers before reaching `main()`. This introduces a measurable cold-start penalty on older devices if many dynamic libraries exist.
- **Static frameworks (`isStatic = true`):** The framework compiles into a `.a` archive inside an `.xcframework` wrapper. During the final Xcode application build, `ld64` links only the referenced object files directly into the main app binary. This eliminates the `dyld` load time at startup and allows global dead-code stripping across the boundary if dead code stripping is enabled in Xcode.

### Exporting and LLVM dead code stripping

By default, any symbol exposed in Kotlin/Native's Objective-C header will be retained unless you restrict exports. If your shared module includes dependencies like Ktor, SQLDelight, or Coroutines, exporting them blindly into the umbrella header inflates your binary:

```kotlin
// Avoid exporting third-party libraries unless Swift directly calls them
framework {
    baseName = "SharedEngine"
    isStatic = true
    
    // Only export specific APIs needed by Swift UI layers
    export(projects.core.model)
    // Avoid: export(libs.kotlinx.coroutines.core)
}
```

### Xcode stripping configurations

Xcode must be configured correctly to strip debug symbols and dead code from the resulting static framework during the archive step.

In your Xcode project build settings:
- **Dead Code Stripping (`DEAD_CODE_STRIPPING`):** Set to `YES`. This instructs `ld64` to remove unreachable functions and data blocks.
- **Strip Style (`STRIP_STYLE`):** Set to `All Symbols` (`all`) for release builds.
- **Strip Linked Product (`STRIP_INSTALLED_PRODUCT`):** Set to `YES`.
- **Debug Information Format (`DEBUG_INFORMATION_FORMAT`):** Set to `DWARF with dSYM File`.

To inspect symbols and sizes directly inside your compiled binary:

```bash
# Check size of Mach-O binary sections
size -m SharedEngine.framework/SharedEngine

# Verify stripped symbols
nm -j SharedEngine.framework/SharedEngine | wc -l

# Extract dSYM to isolate debug data from the executable binary
dsymutil SharedEngine.framework/SharedEngine -o SharedEngine.framework.dSYM
strip -S SharedEngine.framework/SharedEngine
```

Generating a separate `.dSYM` file ensures you can symbolicate crash reports from production without shipping dwarf debugging tables to user devices.

---

## Head-to-head comparison

The trade-offs between Android's R8 toolchain and the iOS Kotlin/Native pipeline reflect the divergence between Java virtual machine optimizations and ahead-of-time (AOT) compiled native code.

| Architectural Dimension | Android (R8 Full Mode) | iOS Static Framework (`isStatic = true`) | iOS Dynamic Framework (`isStatic = false`) |
| :--- | :--- | :--- | :--- |
| **Dead-Code Elimination** | Single-pass, whole-program analysis. Removes unused methods, classes, and fields across module boundaries. | `ld64` strips unreferenced Mach-O sections if symbol exports are properly isolated. | LLVM strips internal unreferenced symbols, but all exported Objective-C headers remain roots. |
| **Debug Info Separation** | Mapping files (`mapping.txt`) generated and stripped from DEX automatically. | Separates into external `.dSYM` bundles via `dsymutil` during Xcode archive. | Separates into external `.dSYM` bundles during Xcode archive. |
| **Impact on Cold Startup** | Minimal impact on modern ART runtimes; baseline profiles can pre-compile hot paths. | Zero `dyld` image loading overhead; linked directly into executable text segment. | Adds measurable `dyld3` / `dyld4` dylib loading, fixup, and rebase overhead during pre-main. |
| **Runtime Overhead** | Minimal; shares standard Android ART garbage collector and runtime. | Bundles Kotlin/Native GC and allocator inside the final app binary (fixed base cost). | Bundles Kotlin/Native GC and allocator inside the dynamic framework binary. |
| **Build Time Cost** | Moderate to high during release compilation due to iterative whole-program analysis. | High due to LLVM native code generation and IR linking phases. | High due to LLVM compilation; linking phase is slightly faster than static whole-app link. |
| **Symbol Visibility** | Controlled via ProGuard rules (`-keep`, `-assumenosideeffects`). | Controlled via Kotlin/Native `export` declarations and Xcode strip flags. | Controlled via Kotlin/Native `export` declarations and Mach-O dynamic export lists. |

---

## Decision framework

Use these architectural patterns to decide how to structure and optimize your shared KMP distribution.

### Choose an iOS static framework with custom exports when:
- **Cold-start performance is critical:** Eliminating `dyld` dynamic library loading overhead reduces initial process launch time.
- **Your shared codebase is large:** You have a mono-repo containing repositories, business logic, and multiple domain features, but specific iOS targets only use a subset of the exposed APIs.
- **You are shipping a direct-to-consumer application:** Static linking allows Xcode to perform whole-program dead-code elimination across both Swift and Kotlin boundaries simultaneously.

### Choose an iOS dynamic framework when:
- **You ship modular frameworks to third parties:** You distribute an SDK or internal binary framework across multiple apps in an enterprise environment without distributing source code.
- **You have multiple iOS app extensions:** Your main iOS app, a Share Extension, and a Widget Extension all share the same KMP code. Using a shared dynamic framework inside an App Group container prevents bundling the Kotlin/Native runtime into three separate binaries, saving overall installation disk space.

### Choose R8 Full Mode with strict keep rules when:
- **You use Kotlin serialization and Coroutines extensively:** Full Mode removes generated synthetic classes that standard ProGuard skips.
- **DEX method count limits matter:** You need to keep secondary DEX overhead minimal to accelerate ART compilation during installation and updates.

---

If you are optimizing a consumer application, configure Kotlin/Native for static linking (`isStatic = true`), restrict your `export` declarations to the exact boundary APIs consumed by Swift, and ensure Xcode's dead-code stripping is active. Pairing that with R8 Full Mode on Android ensures your multiplatform code sharing will not come at the expense of your app's startup performance or binary size.