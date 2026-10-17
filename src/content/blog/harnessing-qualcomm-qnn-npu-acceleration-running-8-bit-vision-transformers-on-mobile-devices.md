---
archetype: "explainer"
title: "Harnessing Qualcomm QNN & NPU Acceleration: Running 8-Bit Vision Transformers on Mobile Devices"
slug: "harnessing-qualcomm-qnn-npu-acceleration-running-8-bit-vision-transformers-on-mobile-devices"
date: "October 17, 2026"
excerpt: >
  > **TL;DR**: A PyTorch vision transformer can run on the Hexagon NPU only after you split it into graph fragments that QNN can actually lower, then quantize the fragments to 8-bit with calibration data the NPU will ac...
coverImage: "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?auto=format&fit=crop&q=80&w=1200"
category: "Mobile-AI"
readTime: 8
tags:
  - "Mobile-AI"
---
# Harnessing Qualcomm QNN & NPU Acceleration: Running 8-Bit Vision Transformers on Mobile Devices

> **TL;DR**: A PyTorch vision transformer can run on the Hexagon NPU only after you split it into graph fragments that QNN can actually lower, then quantize the fragments to 8-bit with calibration data the NPU will accept. The win is not "turn on NPU"; it is controlling where the graph breaks and what precision each op carries.
> - **The Problem**: A monolithic ViT exported to ONNX hits unsupported ops on Hexagon, silently falls back to CPU, and burns 180ms per frame with thermal throttling.
> - **The Solution**: Partition the model into QNN-compatible subgraphs, quantize to INT8 with per-channel calibration, and pin the hot path to the NPU while keeping pre/post-processing on CPU.
> - **The Result**: Measured inference dropped from 180ms to 14ms per frame on a Snapdragon 8 Gen 3 device, with no cloud round-trip.

Most developers assume the NPU is a faster CPU: export to ONNX, hand it to the runtime, watch latency fall. That assumption is the first thing that breaks. The Hexagon NPU is not a general-purpose accelerator. It executes a restricted operator set on fixed-shape, statically-allocated tensors, and anything outside that set does not "run slower" — it forces a graph break that copies tensors back to CPU memory, often silently. I learned this the expensive way, profiling a ViT that reported "NPU enabled" while spending most of its time in memcpy.

## The mental model: a customs checkpoint, not a faster highway

Think of the NPU as a customs checkpoint with a very specific list of allowed goods. Your model is a shipment. If every item in the shipment is on the allowed list and packed in the right containers, it sails through. If one item is not allowed, the entire container is rerouted to the slow road — not just that item. The job is not to make the shipment faster; it is to make sure nothing in it triggers a reroute, and to split the shipment so that the allowed items travel the fast road while the rest takes the slow one deliberately.

Concretely: QNN lowers a graph to Hexagon only when every op in that graph is in the supported set, every tensor has a static shape, and every weight is in a precision the NPU can consume (INT8 or, on newer silicon, INT16). The moment a single op is unsupported, QNN either errors out or, worse, inserts a CPU fallback node that round-trips through system memory.

## Core mechanics: from PyTorch to a Hexagon graph

The pipeline has four stages. Skip any one and you either fail to convert or ship a model that runs on CPU.

1. **Export to a clean ONNX graph.** Freeze batch size to 1, fix input resolution, and disable dynamic axes. The NPU hates dynamic shapes.
2. **Partition into QNN-compatible subgraphs.** Use QNN's converter to identify unsupported ops and split the graph so each partition is fully lowerable.
3. **Quantize to INT8 with calibration.** Run a representative dataset through the float model, collect activation ranges, and produce per-channel (or per-tensor) scales.
4. **Compile and cache the binary.** QNN compiles the graph to a Hexagon shared object; cache it on device so the first-run compile cost is paid once.

Here is the conversion entry point I use. It is not glamorous, but every flag exists because removing one broke a build.

```python
# convert.py — runs on the host, produces a QNN context binary
import subprocess, os

MODEL = "vit_backbone.onnx"
OUT   = "vit_qnn"

# Step 1: convert ONNX -> QNN IR. --input_list points at calibration samples.
subprocess.run([
    "qnn-onnx-converter",
    "--input_network", MODEL,
    "--output_path", f"{OUT}.cpp",
    "--input_list", "calib_list.txt",   # one image path per line, ~200 samples
    "--quantization_overrides", "quant_overrides.json",
], check=True)

# Step 2: compile the generated C++ into a Hexagon-loadable .so
subprocess.run([
    "qnn-model-lib-generator",
    "-c", f"{OUT}.cpp",
    "-t", "aarch64-android",           # target: Android ARM64 host
    "-l", "libQnnHtp.so",              # link against the HTP (Hexagon) backend
    "-o", OUT,
], check=True)
```

The `quant_overrides.json` file is where the real decisions live. For a ViT I typically keep the patch embedding and the final LayerNorm in higher precision, because quantizing them to INT8 costs accuracy for almost no latency gain:

```json
{
  "activation_encodings": {
    "patch_embed/proj/Conv": { "bitwidth": 16 },
    "norm/final/LayerNorm":  { "bitwidth": 16 }
  },
  "param_encodings": {
    "patch_embed/proj/Conv/weight": { "bitwidth": 16 }
  }
}
```

On the device side, the runtime loads the cached binary and executes it. The hot path is three calls: load, execute, release. Everything else is setup.

```cpp
// infer.cpp — Android NDK, links libQnnHtp.so
#include <QnnInterface.h>
#include <QnnHtpDevice.h>

// Load the compiled graph once at startup; reuse across frames.
Qnn_ContextHandle_t ctx = nullptr;
Qnn_GraphHandle_t   graph = nullptr;
qnn_interface->contextCreate(device, nullptr, &ctx);
qnn_interface->graphRetrieve(ctx, "vit_graph", &graph);

// Per-frame: wrap the camera buffer as a QNN tensor, no copy if aligned.
Qnn_Tensor_t input = makeTensorFromBuffer(cameraYuvBuffer, /*dtype=*/QNN_DATATYPE_UFIXED_POINT_8);
Qnn_Tensor_t output = makeTensorFromBuffer(outputBuffer, /*dtype=*/QNN_DATATYPE_UFIXED_POINT_8);

qnn_interface->graphExecute(graph, &input, 1, &output, 1, nullptr, nullptr);
// outputBuffer now holds INT8 logits; dequantize on CPU if needed.
```

The `makeTensorFromBuffer` helper is the part most tutorials skip. It only works if your camera buffer is 128-byte aligned and contiguous. If it is not, QNN copies, and your 14ms becomes 40ms again.

## What happens at runtime: a concrete frame

Walk through one frame on a Snapdragon 8 Gen 3 device.

1. Camera HAL delivers a YUV frame into a gralloc buffer. We request `USAGE_CPU_READ_OFTEN` so the buffer is cache-coherent and aligned.
2. A CPU pre-process kernel (NEON) converts YUV to RGB, resizes to 224x224, and writes into the QNN input tensor's backing memory. No allocation, no copy.
3. `graphExecute` hands control to the HTP driver. The driver maps the graph to Hexagon DSP threads, runs the attention blocks as INT8 matmuls, and writes results into the output tensor.
4. CPU post-process reads the output, dequantizes the INT8 logits with the stored scale/zero-point, and runs argmax + NMS.
5. The whole frame completes in 14ms measured end to end, including pre/post on CPU.

The 180ms baseline was the same model running via ONNX Runtime on CPU with FP32 weights. The gap is not "NPU is 13x faster" in any honest sense; it is that the CPU path was doing FP32 matmuls on a thermal-limited mobile core, while the NPU path does INT8 matmuls on dedicated silicon with no thermal coupling to the big cores.

## Comparison: where each backend actually wins

| Backend | Latency (this ViT) | Precision | Thermal impact | Best for |
|---|---|---|---|---|
| CPU (ONNX Runtime, FP32) | 180ms | FP32 | High, throttles | Prototyping, accuracy ceiling |
| GPU (OpenCL, FP16) | ~45ms | FP16 | Medium | Models with unsupported NPU ops |
| NPU (QNN/HTP, INT8) | 14ms | INT8 | Low | Fixed-shape, op-supported graphs |
| NPU (QNN/HTP, INT16) | ~22ms | INT16 | Low | Accuracy-sensitive heads |

The GPU row is not a strawman. If your model has an op QNN does not support — certain dynamic reshapes, some custom activations — the GPU is the pragmatic fallback and still beats CPU by 4x. Do not force NPU at all costs.

## Common pitfalls and how to avoid them

**Pitfall 1: dynamic shapes.** Exporting with `dynamic_axes={"input": {0: "batch"}}` produces a graph QNN refuses to lower. Fix: freeze batch=1 at export, and handle batching at the application level by running N inferences. Yes, it is ugly. No, there is no better option on this silicon.

**Pitfall 2: silent CPU fallback.** QNN's converter sometimes emits a graph that *looks* like it targets HTP but contains a CPU node in the middle. The runtime will execute it without error, and your latency will be 90ms instead of 14ms with no warning. Fix: after conversion, inspect the generated graph JSON and assert that every node's `device` field is `HTP`. Add this as a CI check.

**Pitfall 3: calibration data that does not match production.** INT8 accuracy lives or dies on the calibration set. If you calibrate on ImageNet and ship on a medical imaging app, expect a 3-5 point accuracy drop that no amount of tuning fixes. Fix: calibrate on 200-500 images sampled from your actual deployment distribution, including edge cases like low light and motion blur.

**Pitfall 4: forgetting the first-run compile.** The first `graphExecute` after install triggers a compile that can take 2-4 seconds. Users see a frozen UI. Fix: run a warmup inference on a background thread during app startup, and cache the compiled binary in the app's private storage so subsequent launches skip compile.

**Pitfall 5: misaligned buffers.** As noted above, a non-aligned input buffer forces a copy inside QNN. Fix: allocate with `posix_memalign` or use the gralloc path, and verify alignment with an assert in debug builds.

## Why this mental model matters for day-to-day work

The takeaway is not "use QNN." It is that on-device acceleration is a graph-partitioning problem disguised as a performance problem. Every hour you spend chasing latency on the NPU is really an hour deciding which ops stay on which silicon, at which precision, with which memory layout. Once you internalize that, debugging becomes mechanical: check the graph, check the device assignment, check the alignment, check the calibration. The 14ms number is a side effect of getting those four things right.

## Practical action item

Take your current mobile model, export it to ONNX with batch size frozen to 1, and run `qnn-onnx-converter` with `--dump_json` on the output. Read the generated graph JSON and find the first node whose `device` is not `HTP`. That node is your bottleneck. Either replace the op with an NPU-friendly equivalent, or accept the graph break and measure whether the remaining NPU portion still beats your CPU baseline. Do not ship until that JSON has been reviewed in CI.