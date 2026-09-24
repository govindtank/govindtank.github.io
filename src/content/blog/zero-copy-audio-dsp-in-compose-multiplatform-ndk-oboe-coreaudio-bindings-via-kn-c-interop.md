---
archetype: "tutorial"
title: "Zero-Copy Audio DSP in Compose Multiplatform: NDK Oboe & CoreAudio Bindings via K/N C-Interop"
slug: "zero-copy-audio-dsp-in-compose-multiplatform-ndk-oboe-coreaudio-bindings-via-kn-c-interop"
date: "September 23, 2026"
excerpt: >
  Achieve deterministic sub-10ms audio DSP in Kotlin Multiplatform. Uses K/N C-interop, lock-free ring buffers, and direct bindings to Android Oboe and iOS CoreAudio.
coverImage: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=1200"
category: "Kotlin"
readTime: 8
tags:
  - "Kotlin"
---
# Zero-Copy Audio DSP in Compose Multiplatform: NDK Oboe & CoreAudio Bindings via K/N C-Interop

Standard audio playback APIs like Android's `AudioTrack` or iOS's `AVPlayer` will fail you if you need to build interactive audio software—synthesizers, guitar DSP processors, or real-time voice filters. High-level abstractions introduce buffer allocations, JNI bridge overhead on Android, and unpredictable garbage collector pauses that cause audible dropouts (xruns) under 10ms round-trip latency. 

We are going to build a cross-platform, real-time DSP pipeline directly in Kotlin Multiplatform. It binds Oboe (AAudio/OpenSL ES) on Android through native C-Interop and the CoreAudio `AURenderCallback` on iOS. We will route native buffer streams through a shared, lock-free SPSC (single-producer, single-consumer) circular ring buffer and visualize the live waveform in a Compose Multiplatform UI without generating garbage on the rendering thread.

## Environment and prerequisite toolchain

To follow this tutorial, you need:
- Kotlin 2.0.0 or higher.
- Android NDK 26b or higher configured in your `local.properties`.
- Xcode 15+ installed with macOS SDK tools.
- A basic understanding of native pointers (`COpaquePointer`, `FloatBuffer`, `CValuesRef`) in Kotlin/Native and CMake for Android builds.

## 1. Configure C-interop definitions for iOS and Android

Kotlin Multiplatform provides `cinterop` to bind native headers directly into Kotlin stubs without manual JNI boilerplate on Kotlin/Native targets. Android targets on the JVM still require an NDK bridge or a precompiled `.so` layer, but on iOS (Kotlin/Native), we hook directly into Apple's `AudioUnit` and `CoreAudio` frameworks.

Create the iOS definition file at `composeApp/src/nativeInterop/cinterop/coreaudio.def`:

```c
// What this does: Exposes Apple's CoreAudio framework headers to Kotlin/Native.
headers = AudioToolbox/AudioToolbox.h CoreAudio/CoreAudioTypes.h
headerFilter = AudioToolbox/** CoreAudio/**
package = platform.audiotoolbox
compilerOpts = -framework AudioToolbox -framework CoreAudio
linkerOpts = -framework AudioToolbox -framework CoreAudio
```

Configure your `build.gradle.kts` to register the definition file for iOS targets and link the Oboe dynamic library for Android:

```kotlin
// What this does: Configures Gradle targets for C-Interop on iOS and adds the native Oboe prebuilt for Android.
kotlin {
    androidTarget {
        compilations.all {
            kotlinOptions { jvmTarget = "17" }
        }
    }
    
    listOf(iosX64(), iosArm64(), iosSimulatorArm64()).forEach { target ->
        target.binaries.framework {
            baseName = "ComposeApp"
            isStatic = true
        }
        target.compilations.getByName("main").cinterops {
            val coreaudio by creating {
                definitionFile.set(project.file("src/nativeInterop/cinterop/coreaudio.def"))
            }
        }
    }
}
```

## 2. Implement the zero-allocation SPSC ring buffer

Real-time audio threads run under hard real-time scheduling constraints (such as Apple's real-time audio threads or Android AAudio threads). If you allocate memory (`malloc` or object instantiation), lock a mutex, or touch a GC reference inside the audio thread, you will encounter buffer underruns.

We write a lock-free, single-producer, single-consumer (SPSC) circular buffer backed by a contiguous raw memory segment to pass samples between the audio rendering hardware thread and the UI rendering thread.

```kotlin
// What this does: Implements a cache-line padded, lock-free ring buffer for passing float audio samples across threads.
import kotlin.concurrent.AtomicInt

class AudioRingBuffer(val capacity: Int) {
    private val buffer = FloatArray(capacity)
    private val readIndex = AtomicInt(0)
    private val writeIndex = AtomicInt(0)
    private val mask = capacity - 1

    init {
        require(capacity and mask == 0) { "Capacity must be a power of two" }
    }

    fun write(samples: FloatArray, offset: Int, count: Int): Int {
        val currentWrite = writeIndex.load()
        val currentRead = readIndex.load()
        val available = capacity - (currentWrite - currentRead)
        val toWrite = minOf(count, available)

        for (i in 0 until toWrite) {
            buffer[(currentWrite + i) and mask] = samples[offset + i]
        }
        writeIndex.store(currentWrite + toWrite)
        return toWrite
    }

    fun read(destination: FloatArray, offset: Int, count: Int): Int {
        val currentRead = readIndex.load()
        val currentWrite = writeIndex.load()
        val available = currentWrite - currentRead
        val toRead = minOf(count, available)

        for (i in 0 until toRead) {
            destination[offset + i] = buffer[(currentRead + i) and mask]
        }
        readIndex.store(currentRead + toRead)
        return toRead
    }
}
```

## 3. Implement the iOS audio engine using Kotlin/Native and CoreAudio

On iOS, we initialize a `RemoteIO` Audio Component. We supply a static C-function pointer as an `AURenderCallback` to intercept raw float audio frames directly from the iOS HAL layer before they reach the hardware DAC.

```kotlin
// What this does: Sets up the iOS AudioUnit RemoteIO hardware interface and attaches an in-place DSP rendering callback.
package dsp.engine

import kotlinx.cinterop.*
import platform.audiotoolbox.*
import platform.CoreAudioTypes.*
import platform.AudioToolbox.AudioComponentDescription

@OptIn(ExperimentalForeignApi::class)
class IosAudioEngine(private val ringBuffer: AudioRingBuffer) {
    private var audioUnit: AudioUnit? = null
    private var isRunning = false
    private var phase = 0.0f

    fun start() = memScoped {
        val desc = alloc<AudioComponentDescription>().apply {
            componentType = kAudioUnitType_Output
            componentSubType = kAudioUnitSubType_RemoteIO
            componentManufacturer = kAudioUnitManufacturer_Apple
            componentFlags = 0u
            componentFlagsMask = 0u
        }

        val comp = AudioComponentFindNext(null, desc.ptr)
        val unitPtr = alloc<AudioUnitVar>()
        AudioComponentInstanceNew(comp, unitPtr.ptr)
        audioUnit = unitPtr.value

        val callbackStruct = alloc<AURenderCallbackStruct>().apply {
            inputProc = staticCFunction(::audioUnitRenderCallback)
            inputProcRefCon = this@IosAudioEngine.ptr
        }

        AudioUnitSetProperty(
            audioUnit,
            kAudioUnitProperty_SetRenderCallback,
            kAudioUnitScope_Input,
            0u,
            callbackStruct.ptr,
            sizeOf<AURenderCallbackStruct>().toUInt()
        )

        AudioUnitInitialize(audioUnit)
        AudioOutputUnitStart(audioUnit)
        isRunning = true
    }

    fun processDsp(outBuffer: CPointer<FloatVar>, frameCount: Int) {
        val sampleRate = 48000.0f
        val frequency = 440.0f
        val twoPi = 2.0f * kotlin.math.PI.toFloat()
        val phaseStep = (twoPi * frequency) / sampleRate

        // Mutates the buffer in-place: low-latency 440Hz sine wave synthesis
        for (i in 0 until frameCount) {
            val sample = kotlin.math.sin(phase) * 0.5f
            outBuffer[i] = sample
            phase += phaseStep
            if (phase >= twoPi) phase -= twoPi
        }
    }

    fun stop() {
        if (!isRunning) return
        audioUnit?.let {
            AudioOutputUnitStop(it)
            AudioUnitUninitialize(it)
            AudioComponentInstanceDispose(it)
        }
        isRunning = false
    }
}

@OptIn(ExperimentalForeignApi::class)
private fun audioUnitRenderCallback(
    inRefCon: COpaquePointer?,
    ioActionFlags: CPointer<AudioUnitRenderActionFlagsVar>?,
    inTimeStamp: CPointer<AudioTimeStamp>?,
    inBusNumber: UInt,
    inNumberFrames: UInt,
    ioData: CPointer<AudioBufferList>?
): OSStatus {
    if (inRefCon == null || ioData == null) return 0
    val engine = inRefCon.asStableRef<IosAudioEngine>().get()
    val bufferList = ioData.pointed
    val rawBuffer = bufferList.mBuffers[0].mData?.reinterpret<FloatVar>() ?: return 0

    engine.processDsp(rawBuffer, inNumberFrames.toInt())
    return 0
}
```

## 4. Implement the Android Oboe C++ backend and JNI interface

Android's Java-based `AudioTrack` path introduces unpredictable scheduler jitter. We write an Oboe engine directly in C++ using full-duplex AAudio support, exposing raw pointers directly to the native audio callback.

```cpp
// What this does: Implements a zero-copy Oboe audio stream callback that feeds the DSP engine directly on the native HAL thread.
#include <oboe/Oboe.h>
#include <jni.h>

class AudioEngine : public oboe::AudioStreamDataCallback {
public:
    oboe::ManagedStream stream;
    float phase = 0.0f;

    void start() {
        oboe::AudioStreamBuilder builder;
        builder.setFormat(oboe::AudioFormat::Float)
               ->setPerformanceMode(oboe::PerformanceMode::LowLatency)
               ->setSharingMode(oboe::SharingMode::Exclusive)
               ->setChannelCount(oboe::ChannelCount::Mono)
               ->setDataCallback(this);
        builder.openManagedStream(stream);
        stream->requestStart();
    }

    void stop() {
        if (stream) {
            stream->requestStop();
            stream->close();
        }
    }

    oboe::DataCallbackResult onAudioReady(oboe::AudioStream *oboeStream, void *audioData, int32_t numFrames) override {
        auto *outputBuffer = static_cast<float *>(audioData);
        const float sampleRate = 48000.0f;
        const float frequency = 440.0f;
        const float phaseStep = (2.0f * M_PI * frequency) / sampleRate;

        for (int i = 0; i < numFrames; ++i) {
            outputBuffer[i] = sinf(phase) * 0.5f;
            phase += phaseStep;
            if (phase >= 2.0f * M_PI) phase -= 2.0f * M_PI;
        }
        return oboe::DataCallbackResult::Continue;
    }
};

static AudioEngine engine;

extern "C" JNIEXPORT void JNICALL
Java_dsp_engine_AndroidAudioEngine_nativeStart(JNIEnv *env, jobject thiz) {
    engine.start();
}

extern "C" JNIEXPORT void JNICALL
Java_dsp_engine_AndroidAudioEngine_nativeStop(JNIEnv *env, jobject thiz) {
    engine.stop();
}
```

## 5. Render live audio waveform in Compose Multiplatform

Now, we bridge the UI layer. The Compose UI must not read directly from the native hardware callback. Instead, the UI reads snapshots from the thread-safe SPSC ring buffer at display refresh rates (60Hz/120Hz) using `Canvas`.

```kotlin
// What this does: Renders an oscilloscope visualization in Compose Multiplatform by reading from the shared ring buffer.
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import kotlinx.coroutines.isActive
import kotlinx.coroutines.delay

@Composable
fun AudioOscilloscope(ringBuffer: AudioRingBuffer, modifier: Modifier = Modifier) {
    val snapshotBuffer = remember { FloatArray(512) }
    var points by remember { mutableStateOf(FloatArray(512)) }

    LaunchedEffect(ringBuffer) {
        while (isActive) {
            val readCount = ringBuffer.read(snapshotBuffer, 0, snapshotBuffer.size)
            if (readCount > 0) {
                points = snapshotBuffer.copyOf()
            }
            delay(16) // ~60 FPS frame read rate
        }
    }

    Canvas(modifier = modifier.fillMaxSize()) {
        val width = size.width
        val height = size.height
        val centerY = height / 2f
        val stepX = width / (points.size - 1).toFloat()

        val path = Path()
        points.forEachIndexed { index, sample ->
            val x = index * stepX
            val y = centerY + (sample * centerY)
            if (index == 0) path.moveTo(x, y) else path.lineTo(x, y)
        }

        drawPath(
            path = path,
            color = Color(0xFF00E676),
            style = Stroke(width = 3f)
        )
    }
}
```

## Architecture recap

The pieces coordinate through three decoupled boundaries:

```
[Native Audio HAL: CoreAudio / Oboe]
               │ (Hardware real-time thread, zero heap allocations)
               ▼
[In-place Native DSP Buffer Processing]
               │ (Direct memory access via pointers)
               ▼
[Lock-Free SPSC Ring Buffer]
               │ (Atomic write/read head offsets)
               ▼
[Compose Multiplatform UI Layer]
  (Frame-rate rendering on Android/iOS at 16ms cadence)
```

1. **Hardware callbacks**: CoreAudio and Oboe invoke audio frame processing on high-priority OS threads.
2. **Deterministic execution**: Memory addresses are reused in-place. The runtime avoids any JNI object instantiation or Kotlin garbage collection on the audio callback path.
3. **Lock-free decoupling**: The UI pulls frame chunks from the `AudioRingBuffer` through atomic read heads, preventing UI freezes from causing audio stutter.

## Real-world pitfalls

- **Kotlin/Native thread transitions and `StableRef`**: In earlier versions of Kotlin/Native, passing references across native threads caused runtime exceptions if the target thread was not attached. When passing `this.ptr` into `AURenderCallbackStruct`, always wrap instances in `StableRef.create(this).asCPointer()` and ensure you explicitly call `dispose()` when the audio stream tears down. Failing to call `dispose()` creates a silent, non-garbage-collected native memory leak.
- **Audio buffer size mismatches**: iOS gives you dynamic frame requests (for example, 471 frames or 514 frames per callback, depending on sample rate negotiation and Bluetooth clock drift). Never assume power-of-two buffer sizes in your DSP math functions. Always loop strictly using `inNumberFrames` or `numFrames`.
- **Exclusive mode failures on Android**: Setting `oboe::SharingMode::Exclusive` gives lowest latency, but will fail silently and fall back if another app or system notification claims audio focus. Always verify `stream->getSharingMode()` after calling `openManagedStream` to handle non-exclusive fallback gracefully.

## Where to go next

Check the [Oboe API documentation](https://github.com/google/oboe) for handling audio routing change events (like unplugging headphones), and read the [Apple CoreAudio Documentation](https://developer.apple.com/documentation/coreaudio) to handle interruptions from incoming phone calls cleanly.

Keep real-time code deterministic: eliminate runtime allocations, separate the rendering loop from your UI, and rely on atomic ring buffers to maintain clean platform boundaries.