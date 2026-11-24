---
archetype: "war-story"
title: "NDK Zero-Copy Audio/Video: Cutting Latency Between HAL, MediaCodec & Kotlin"
slug: "ndk-zero-copy-audiovideo-cutting-latency-between-hal-mediacodec-kotlin"
date: "November 04, 2026"
excerpt: >
  Stop eating buffer copy tax. Use AHardwareBuffer, Oboe, and direct surfaces to ditch JVM memcpy and cut pipeline latency by sub-10ms.
coverImage: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&q=80&w=1200"
category: "Mobile-Architecture"
readTime: 7
tags:
  - "Mobile-Architecture"
---
# NDK Zero-Copy Audio/Video: Cutting Latency Between HAL, MediaCodec & Kotlin

> **TL;DR**: Passing media buffers through JNI using byte arrays or direct ByteBuffers incurs implicit copies and cache invalidations that wreck real-time performance. By binding native `AHardwareBuffer` instances directly to `MediaCodec` input surfaces and feeding Oboe PCM callbacks directly into C++ circular ring buffers, we eliminated user-space memory copies entirely.
> - **The Problem**: End-to-end AV pass-through latency sat at 68ms, thermal throttling kicked in within 4 minutes on mid-tier test units, and garbage collection pauses triggered frequent audio glitches.
> - **The Solution**: Removed all JVM hops for media payloads; bridged Camera2 native outputs directly to an NDK `ANativeWindow` feeding `AMediaCodec`, paired with AAudio/Oboe low-latency audio streams.
> - **The Result**: Total AV processing latency dropped to 8.2ms, memory bandwidth usage plummeted by 410 MB/s at 1080p60, and runtime allocations dropped to zero bytes per frame.

## The 68-millisecond wake-up call

I was debugging an interactive video-booth project running on a mid-range Qualcomm device. The user speaks into the mic, looks into the camera, and sees their processed feed composited on-screen while audio loops back through low-latency monitors.

The specification required less than 15ms total audio loopback and sub-30ms glass-to-glass video latency. We were seeing 68ms glass-to-glass and 42ms on audio. Even worse: after four minutes of active streaming, frames started dropping from 60 FPS down to 34 FPS. The back of the device was hot enough to cook an egg.

Our team's initial assumption was that the shader pipeline was choking the GPU. We spent two days profiling fragment shaders in RenderDoc, gutting post-processing passes, and dialing down filter math. The latency did not budge. The GPU wasn't struggling; it was starving while waiting for memory synchronization.

## The actual bottleneck: death by `memcpy`

I opened `simpleperf` alongside Perfetto to inspect the kernel trace during an active session. The flame graph was humiliating.

We were not spending time in compute. We were spending 38% of our frame budget in `art::JNI::GetByteArrayElements` and `memcpy`. 

Here is what our "clean" architecture actually did on every single frame:
1. Camera2 delivered a `YUV_420_888` `Image` in Kotlin via `ImageReader`.
2. A Kotlin coroutine extracted the three plane buffers.
3. The planes were copied into a direct `ByteBuffer` and shuttled across JNI.
4. Native C++ code converted YUV to RGB into a new native heap allocation.
5. The processed frame was written back into an input `ByteBuffer` owned by `MediaCodec`.
6. On the audio side, an `AudioRecord` read short arrays into Kotlin, did gain checks, and pushed them down to native OpenSL ES buffers.

Every frame was copied five times between the HAL, kernel drivers, the ART heap, and native memory. At 1080p60, each uncompressed YUV frame is roughly 3.1 MB. Copying 3.1 MB five times per frame at 60 FPS equates to shoveling roughly 930 MB/s across the mobile memory bus just to hand pixels between our own layers. The CPU cache was constantly thrashing, and ART was forced to run GC sweeps to collect the discarded JNI references.

The fix was straightforward: the JVM should never touch an audio sample or a video pixel. Kotlin orchestrates state; the NDK processes buffers.

## The architecture shift: hardware buffers and native surfaces

Android gives you direct access to the HAL's underlying gralloc buffers through `AHardwareBuffer` and `ANativeWindow`. If you hook those directly into `AMediaCodec` and Oboe, memory never leaves the hardware-accessible address space.

```
+------------------+         Zero-Copy Hardware Handle         +--------------------+
|  Camera2 Output  | ========================================> | NDK ANativeWindow  |
|  (HAL / Gralloc) |   (AHardwareBuffer / OES Texture Bind)    | (AMediaCodec Input)|
+------------------+                                           +--------------------+
                                                                          |
                                                                   Hardware Encoder
                                                                          |
+------------------+            Zero-Copy Direct Pipe          +--------------------+
|   HAL Capture    | ========================================> |  Oboe Output Stream|
|  (AAudio Native) |    (Lock-Free Lockless Ring Buffer)       | (Direct HAL Pass)  |
+------------------+                                           +--------------------+
```

### Video: Binding `AMediaCodec` directly to an `ANativeWindow`

Instead of polling buffers via `AMediaCodec_dequeueInputBuffer`, create an input surface using `AMediaCodec_createInputSurface`. This exposes an `ANativeWindow` handle that you supply directly to the Camera2 native session (`ACameraCaptureSession`) or your EGL/Vulkan context.

```cpp
// native-media-pipeline.cpp
#include <media/NdkMediaCodec.h>
#include <media/NdkMediaFormat.h>
#include <android/native_window.h>
#include <android/native_window_jni.h>
#include <android/log.h>

#define TAG "ZeroCopyPipeline"

struct CodecPipeline {
    AMediaCodec* codec{nullptr};
    ANativeWindow* inputWindow{nullptr};
};

CodecPipeline* init_codec_surface_pipeline(const char* mimeType, int32_t width, int32_t height) {
    auto* pipeline = new CodecPipeline();

    // 1. Instantiate the NDK MediaCodec encoder by mime type
    pipeline->codec = AMediaCodec_createEncoderByType(mimeType);
    if (!pipeline->codec) {
        delete pipeline;
        return nullptr;
    }

    AMediaFormat* format = AMediaFormat_new();
    AMediaFormat_setString(format, AMEDIAFORMAT_KEY_MIME, mimeType);
    AMediaFormat_setInt32(format, AMEDIAFORMAT_KEY_WIDTH, width);
    AMediaFormat_setInt32(format, AMEDIAFORMAT_KEY_HEIGHT, height);
    AMediaFormat_setInt32(format, AMEDIAFORMAT_KEY_COLOR_FORMAT, 0x7F000789); // COLOR_FormatSurface
    AMediaFormat_setInt32(format, AMEDIAFORMAT_KEY_BIT_RATE, 6000000);        // 6 Mbps
    AMediaFormat_setInt32(format, AMEDIAFORMAT_KEY_FRAME_RATE, 60);
    AMediaFormat_setInt32(format, AMEDIAFORMAT_KEY_I_FRAME_INTERVAL, 1);

    media_status_t status = AMediaCodec_configure(
        pipeline->codec, 
        format, 
        nullptr, // No surface output (we are encoding)
        nullptr, // Crypto object
        AMEDIACODEC_CONFIGURE_FLAG_ENCODE
    );
    AMediaFormat_delete(format);

    if (status != AMEDIA_OK) {
        AMediaCodec_delete(pipeline->codec);
        delete pipeline;
        return nullptr;
    }

    // 2. Extract the hardware-backed ANativeWindow input surface.
    // Writing to this window writes directly to the encoder's input buffers.
    status = AMediaCodec_createInputSurface(pipeline->codec, &pipeline->inputWindow);
    if (status != AMEDIA_OK || !pipeline->inputWindow) {
        AMediaCodec_delete(pipeline->codec);
        delete pipeline;
        return nullptr;
    }

    // 3. Start the encoder. Surface is now ready to receive frames from HAL/Camera.
    AMediaCodec_start(pipeline->codec);
    return pipeline;
}

void release_pipeline(CodecPipeline* pipeline) {
    if (!pipeline) return;
    if (pipeline->codec) {
        AMediaCodec_stop(pipeline->codec);
        AMediaCodec_delete(pipeline->codec);
    }
    if (pipeline->inputWindow) {
        ANativeWindow_release(pipeline->inputWindow);
    }
    delete pipeline;
}
```

### Audio: Lock-free Oboe callback passing pointers, not arrays

For audio, do not push buffers across JNI boundaries. Set up an `oboe::AudioStream` in direct callback mode. The callback runs on a high-priority RT kernel thread (`SCHED_FIFO`). Any allocation, mutex lock, or JNI call inside this callback causes an immediate underrun.

```cpp
// native-audio-engine.h
#pragma once
#include <oboe/Oboe.h>
#include <atomic>

class ZeroCopyAudioEngine : public oboe::AudioStreamDataCallback {
public:
    bool start() {
        oboe::AudioStreamBuilder builder;
        builder.setDirection(oboe::Direction::Input)
               ->setPerformanceMode(oboe::PerformanceMode::LowLatency)
               ->setSharingMode(oboe::SharingMode::Exclusive) // Direct HAL access
               ->setFormat(oboe::AudioFormat::Float)
               ->setChannelCount(oboe::ChannelCount::Mono)
               ->setSampleRate(48000)
               ->setDataCallback(this);

        oboe::Result r = builder.openStream(stream_);
        if (r != oboe::Result::OK) return false;

        r = stream_->requestStart();
        return (r == oboe::Result::OK);
    }

    // Runs on real-time thread. ZERO allocations. NO JNI calls.
    oboe::DataCallbackResult onAudioReady(
        oboe::AudioStream *oboeStream, 
        void *audioData, 
        int32_t numFrames
    ) override {
        auto *inputSamples = static_cast<const float*>(audioData);

        // Process audio in-place or write pointers into an atomic ring buffer.
        // Direct pointer pass: no byte arrays, no conversions.
        for (int32_t i = 0; i < numFrames; ++i) {
            float sample = inputSamples[i];
            // Simple hardware gain staging without buffer duplication
            outputBuffer_[writeIndex_.load(std::memory_order_relaxed)] = sample * 1.2f;
            writeIndex_.store((writeIndex_.load(std::memory_order_relaxed) + 1) % kBufferMask, 
                              std::memory_order_release);
        }

        return oboe::DataCallbackResult::Continue;
    }

private:
    static constexpr size_t kBufferMask = 4095;
    std::shared_ptr<oboe::AudioStream> stream_;
    float outputBuffer_[kBufferMask + 1];
    std::atomic<size_t> writeIndex_{0};
};
```

## Buffer strategy trade-offs

| Transport Method | Latency Impact | CPU / Bus Load | Zero-Copy? | Architectural Complexity |
| :--- | :--- | :--- | :--- | :--- |
| **Direct JNI `ByteBuffer`** | High (+18-35ms) | High (Cache dirtying, GC thrash) | No (Mirrored memory) | Low (Idiomatic Android) |
| **NDK `AHardwareBuffer`** | Lowest (<2ms) | Negligible (Direct DMA / gralloc) | Yes (True physical backing) | Medium (NDK API 26+) |
| **`ANativeWindow` Surface**| Lowest (<4ms) | Low (GPU/HW Composer direct) | Yes (Direct pipeline) | Low-Medium (Native Codec) |
| **Oboe `Exclusive` Stream**| Lowest (<5ms) | Low (HAL kernel interrupt direct)| Yes (Pre-allocated ring) | Low (C++ callback) |

## Common pitfalls and how to avoid them

### 1. `AHardwareBuffer` format mismatches
If you request `AHARDWAREBUFFER_FORMAT_R8G8B8A8_UNORM` from a camera source that only supports `AHARDWAREBUFFER_FORMAT_Y8Cb8Cr8_420`, the allocation silently falls back to standard shared memory emulation or outright fails during `AHardwareBuffer_allocate`. 
*Fix*: Always inspect supported usage flags via `AHardwareBuffer_isSupported()` before binding surfaces to an external hardware context.

### 2. Leaking `ANativeWindow` handles
`AMediaCodec_createInputSurface` gives you an `ANativeWindow` with a reference count of 1. Calling `ANativeWindow_release` while the encoder is still running will not crash immediately; it will corrupt frames once the driver attempts to reclaim queued slots.
*Fix*: Shut down `AMediaCodec` (`AMediaCodec_stop`), wait for downstream drain, and then call `ANativeWindow_release`.

### 3. JNI calls inside the audio callback
Even a single benign-looking JNI call (like posting a meter level via `CallVoidMethod`) inside `onAudioReady` requires grabbing the thread's `JNIEnv*`. If ART triggers a stop-the-world pause, your real-time audio thread blocks. The HAL runs dry, and the user hears an audible click or drop.
*Fix*: Write metrics into a `std::atomic<float>` and poll it from Kotlin using a coroutine ticking at 30Hz on `Dispatchers.Default`.

## Action item for your codebase

Audit your JNI boundaries today: search for any occurrence of `GetByteArrayElements`, `GetPrimitiveArrayCritical`, or `ByteBuffer.allocateDirect` in your media pipeline. 

Replace array-passing JNI functions with a persistent `Surface` acquired via `AMediaCodec_createInputSurface` or `MediaCodec.createInputSurface()`, and pass that target surface directly into your capture source. Keep the payload in silicon; keep the JVM for control flow.