---
archetype: "war-story"
title: "Android NPU Acceleration: Implementing ONNX Runtime for ML Inference"
slug: "android-npu-acceleration-implementing-onnx-runtime-for-ml-inference"
date: "September 07, 2026"
excerpt: >
  This guide covers end-to-end implementation of ONNX Runtime for Android NPU-accelerated ML inference, including model quantization, compatibility validation, and side-by-side latency benchmarks against CPU and GPU exe...
coverImage: "/covers/android-npu-acceleration-implementing-onnx-runtime-for-ml-inference.svg"
category: "Mobile-Architecture"
readTime: 3
tags:
  - "Mobile-Architecture"
---
# Android NPU Acceleration: Implementing ONNX Runtime for ML Inference

I led the ML inference migration for our Android camera app’s new photo enhancement feature last quarter, and the first week post-launch was a disaster. Users reported 15% shorter battery life during camera use, and our live preview frame drop rate jumped from 2% to 14%, spiking support tickets by 40% in three days. We had migrated from TensorFlow Lite CPU inference to ONNX Runtime with the default NNAPI delegate, expecting lower latency and better battery life. We were wrong on both counts.

Our setup was standard for consumer ML features: we exported our PyTorch photo enhancement model to ONNX format, assuming ONNX Runtime’s broad NPU support across Qualcomm, MediaTek, and Samsung silicon would handle offload automatically. We ran initial benchmarks on a Pixel 7 emulator and a single flagship test device, which showed 30% lower compute latency than our old TFLite CPU pipeline. We shipped without testing midrange and budget devices, assuming the NNAPI abstraction would handle hardware differences.

The first sign something was wrong was our internal telemetry showing NPU active time was 2x higher than our old CPU inference pipeline, even though the model was 40% smaller. My first wrong guess was broken quantization: I spent two days re-exporting the model to int8, with no change to battery or latency. Next I blamed Qualcomm’s NNAPI implementation, but the same issues appeared on MediaTek Dimensity 7000 and Exynos 2200 devices. I even suspected silent CPU fallback, but `adb shell dumpsys nnapilog` confirmed the NPU was active for every inference run. The only metric that made sense was that total inference wall time was 20% slower than our old CPU pipeline, even though compute time was faster.

I dug into ONNX Runtime’s built-in performance tracing next, and the numbers jumped out: 42% of each inference’s wall time was spent copying tensors between the app’s Java heap memory and the NPU driver’s memory space. Our 2.3MB photo enhancement model had a 256x256x3 input tensor, small enough that the overhead of copying data to the NPU completely erased its compute speed advantage. Worse, the repeated memory copies kept the NPU’s power domain active for longer than necessary, spiking battery drain. For larger models like our 18MB video segmentation pipeline, the copy overhead was negligible, and NPU performance was exactly as we expected.

```kotlin
// Original broken initialization: default NNAPI delegate, no memory optimizations
val sessionOptions = OrtSession.SessionOptions().apply {
    addNnapiDelegate()
    setIntraOpNumThreads(4)
}
val enhancementSession = OrtEnvironment.getEnvironment()
    .createSession(assets.open("photo_enhance.onnx").readBytes(), sessionOptions)
```

```kotlin
// Fixed initialization: shared memory enabled, size-based fallback to CPU
val nnapiOptions = NnapiDelegate.Options().apply {
    // Eliminate full tensor copies for small tensors
    setSharedMemoryEnabled(true)
    setPreferredMemoryAllocation(NnapiDelegate.MemoryAllocation.SHARED)
}

fun createInferenceSession(modelBytes: ByteArray, modelSizeMb: Int): OrtSession {
    val baseOptions = OrtSession.SessionOptions().apply {
        setSessionOptimizationLevel(OrtSession.SessionOptions.OptLevel.ORT_ENABLE_ALL)
    }
    // Skip NPU for models <5MB: copy overhead outweighs compute gains on our target devices
    return if (modelSizeMb < 5) {
        baseOptions.createSession(modelBytes)
    } else {
        baseOptions.apply { addNnapiDelegate(nnapiOptions) }.createSession(modelBytes)
    }
}

val enhancementSession = createInferenceSession(
    modelBytes = assets.open("photo_enhance.onnx").readBytes(),
    modelSizeMb = 2.3
)
```

## Lessons
- Profile full end-to-end inference wall time, not just compute time. Memory copy overhead can completely negate NPU speed gains for small models, and software profilers often hide this cost.
- Test on actual target device silicon, not just flagship reference devices or emulators. Midrange and budget NPUs have higher memory copy overhead that doesn’t show up on high-end hardware.
- Don’t assume NPU offload is always better. Build explicit fallback logic for small models, where optimized CPU inference is faster and more power efficient.
- Measure real power draw with hardware tools during early testing, not just software battery estimates. Software metrics masked the NPU power spike until we used a Monsoon power meter on test devices.

The biggest misconception I see teams make with Android NPU acceleration is that offloading inference to the NPU is a free win. For small models, the memory overhead of moving data to the NPU can make it slower and less efficient than optimized CPU inference. Always measure the full end-to-end cost of your pipeline, and build fallbacks for workloads where the NPU doesn’t provide a net benefit.