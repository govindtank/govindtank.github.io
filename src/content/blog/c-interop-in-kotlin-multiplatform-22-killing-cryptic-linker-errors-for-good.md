---
archetype: "opinion"
title: "C-Interop in Kotlin Multiplatform 2.2: Killing Cryptic Linker Errors For Good"
slug: "c-interop-in-kotlin-multiplatform-22-killing-cryptic-linker-errors-for-good"
date: "November 02, 2026"
excerpt: >
  Fix cryptic duplicate symbol collisions in KMP 2.2. Tweak def files and module maps once to make your XCFramework cinterop builds reproducible.
coverImage: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&q=80&w=1200"
category: "Kotlin"
readTime: 5
tags:
  - "Kotlin"
---
# C-Interop in Kotlin Multiplatform 2.2: Killing Cryptic Linker Errors For Good

> **TL;DR**: Stop pasting arbitrary `-linker-options` into your Gradle builds when bridging static C/Objective-C libraries to Kotlin Multiplatform. Nine out of ten linker explosions (`duplicate symbol`, `undefined symbol for architecture`) stem from letting `cinterop` compile bundled headers into static artifacts while CocoaPods or SPM simultaneously statically links the same binary.
> - **The Problem**: Duplicate symbol collisions and mismatched target ABIs when pulling third-party XCFrameworks into KMP via standard `def` files.
> - **The Solution**: Strip library binary definitions from `.def` files entirely, decouple declaration indexing from binary linkage, and let Kotlin 2.2's `linkerOpts` route directly through an explicit module map.
> - **The Result**: 0 duplicate symbol collisions across universal iOS targets and clean incremental builds.

The mainstream consensus around Kotlin Multiplatform's C-interop layer is wrong: developers treat `cinterop` as a black-box build packager that should compile, bind, and link your native binaries in one step. 

It shouldn't. 

Treating `cinterop` as a linker orchestration tool instead of a pure header parser is why teams burn sprints wading through thousands of lines of `ld: duplicate symbol '_OBJC_CLASS_$_...'` or unhelpful Clang driver failures. The tool was designed to synthesize Kotlin stubs from C/Objective-C declarations. When you force it to also resolve binary dependencies via `staticLibraries` in `.def` files, you sign up for silent ABI drift, duplicate object registration, and non-deterministic linker flags across Apple targets.

## The mainstream approach and why it breaks

The standard recipe circulating in tutorials looks straightforward:

1. Drag a static `.a` or `.xcframework` into your project tree.
2. Create a `myvendor.def` containing `headers = Vendor.h` and `staticLibraries = libvendor.a`.
3. Add a `cinterops` block inside your Gradle target.
4. Run `./gradlew build` and hope Apple Clang figures out transitive dependencies.

This works only for trivial, zero-dependency C libraries.

As soon as that C/Objective-C library relies on a system framework (e.g., `Security`, `CommonCrypto`, or `SystemConfiguration`) or is also consumed by an iOS application via Swift Package Manager or CocoaPods, Apple's `ld64`/`lld` receives two copies of the object files: one compiled into the Kotlin Native `.klib` artifact, and one bundled in the outer CocoaPods/SPM tree.

The result is instant symbol pollution:

```text
ld: duplicate symbol '_VendorInit' in:
    /Users/runner/work/app/build/bin/iosArm64/debugShared/libshared.a[arm64][2](Vendor.o)
    /Users/runner/Library/Developer/Xcode/DerivedData/App/Build/Products/Debug-iphoneos/libVendor.a[arm64][2](Vendor.o)
clang: error: linker command failed with exit code 1 (use -v to see invocation)
```

The typical hack to silence this is worse than the error: developers start throwing `-z muldefs`, `-Wl,-force_load`, or `-Wl,-commons,use_linker_donuts` into `freeCompilerArgs`. You do not need dynamic linker overrides. You need clean target separation.

## Decouple declaration from linkage

The fix is minimal: **`.def` files should only parse types; your native build targets should manage the linkage.**

Never declare `staticLibraries` or `libraryPaths` inside `.def` files if the consuming Apple target already links against that vendor binary, or if you plan to link multiple Native targets (like `iosArm64` and `iosSimulatorArm64`). 

Here is how you do it properly in Kotlin 2.2.

### 1. The minimal definition file

Create `src/nativeInterop/cinterop/sqlite3_custom.def`. Do not specify paths to `.a` files. Keep it strictly scoped to headers and compilation flags:

```properties
# sqlite3_custom.def
# Only provide declarations, macro definitions, and header locations.
headers = sqlite3.h
headerFilter = sqlite3*.h

# Prevent cinterop from pulling in standard POSIX types that KMP stdlib already models
excludeDependentModules = true

# Strict compiler flags: prevent Clang from assuming implicit 32-bit int conversions
compilerOpts = -DSQLITE_ENABLE_FTS5 -DSQLITE_OMIT_DEPRECATED
```

### 2. The Gradle linkage configuration

Route the binary linkage exclusively through the Kotlin Native binary block using target-aware evaluation:

```kotlin
// build.gradle.kts
plugins {
    kotlin("multiplatform") version "2.2.0"
}

kotlin {
    iosArm64()
    iosSimulatorArm64()

    targets.withType<org.jetbrains.kotlin.gradle.plugin.mpp.KotlinNativeTarget> {
        compilations.getByName("main") {
            cinterops {
                create("sqlite3_custom") {
                    definitionFile.set(file("src/nativeInterop/cinterop/sqlite3_custom.def"))
                    includeDirs(file("src/nativeInterop/include"))
                }
            }
        }

        binaries.framework {
            baseName = "SharedCore"
            isStatic = true

            // Pass linkage to ld64 explicitly per target architecture
            linkerOpts(
                "-L${projectDir}/libs/native/${konanTarget.name}",
                "-lsqlite3_custom",
                "-framework", "Security"
            )
        }
    }
}
```

```
[Vendor Headers] ---> (cinterop) ---------> [SharedCore.klib (Kotlin Stubs)]
                                                   |
[Vendor .a / XCF] --> (target linkerOpts) -> [SharedCore.framework (Final Binary)]
```

By separating definition analysis from actual static library embedding:
1. `cinterop` runs once per target to create the `.klib` metadata containing pure function pointers and struct layouts.
2. The platform linker receives `-l` and `-L` instructions only when producing the final artifact (`framework` or `executable`).
3. If Xcode compiles the final product, you can drop `linkerOpts` entirely from Gradle and let Xcode link the binary once at the top level.

## Where this model fails

This approach requires discipline:

1. **Target Matrix Overhead**: If you don't use XCFrameworks and instead keep raw arch-specific `.a` archives (`iosArm64`, `iosSimulatorArm64`), you must maintain distinct folders per `konanTarget.name` (`libs/native/iosArm64/libfoo.a`). Missing one target will break your build during the link step, not the compile step.
2. **Swift Packaging Mismatch**: If you distribute an engine as a self-contained `.XCFramework` for consumption by external iOS developers without SPM, stripping internal binaries will force *them* to link your underlying static dependencies manually.

| Linker Strategy | Setup Cost | Duplicate Symbol Risk | Incremental Speed |
| :--- | :--- | :--- | :--- |
| **All-in-.def (`staticLibraries = ...`)** | Low | High (collides with Xcode deps) | Slow |
| **Gradle `freeCompilerArgs += "-linker-options"`** | Low | Extremely High (bypasses cache) | Terrible |
| **Separated Def + Explicit `linkerOpts`** | Moderate | Zero | Fast |
| **Xcode Linkage via CocoaPods/SPM Plugin** | High | Low (delegated to build system) | Fast |

## Common pitfalls and how to avoid them

### 1. Clang module isolation failures

When binding modern Apple libraries, using `headers = Foo.h` without modules often leads to:
`fatal error: could not build module 'Foundation'`

Avoid explicit file header inclusions if an XCFramework contains a `module.modulemap`. Instead, rely on `modules`:

```properties
# vendor.def
modules = VendorCore
compilerOpts = -fmodules -F/path/to/frameworks
```

And in Gradle, instruct the compiler where to resolve framework headers:

```kotlin
compilerOpts("-F${projectDir}/libs/Frameworks")
```

### 2. Missing `headerFilter`

If you omit `headerFilter` from your `.def` file, `cinterop` will traverse every transitive `#include`—including Apple's system headers—and generate Kotlin representations for system symbols. This balloons the size of your `.klib`, increases IDE indexing times, and produces type name clashes against `platform.*` packages.

Always set:

```properties
headerFilter = VendorCore/**
```

This limits stub generation strictly to the vendor API boundary.

## Concrete action for your project

Check your `.def` files right now:

```bash
grep -E "staticLibraries|libraryPaths" src/nativeInterop/cinterop/*.def
```

If these keys return matches, delete them. Move the library search paths and static flags to your `build.gradle.kts` inside `binaries.framework { linkerOpts(...) }`. Keep your header definitions isolated to header ingestion, and let the native linker handle binary symbols at compile boundaries.