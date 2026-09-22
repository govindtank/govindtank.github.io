---
archetype: "explainer"
title: "On-Device SLM Inference with Llama.cpp and NPU Acceleration via Android NNAPI & Qualcomm QNN"
slug: "on-device-slm-inference-with-llamacpp-and-npu-acceleration-via-android-nnapi-qualcomm-qnn"
date: "September 22, 2026"
excerpt: >
  Compile and run quantized GGUF models natively on Android. Uses llama.cpp, JNI, NNAPI/Qualcomm QNN, and memory-mapped I/O to maximize NPU throughput and avoid OOM crashes.
coverImage: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=1200"
category: "Mobile-AI"
readTime: 9
tags:
  - "Mobile-AI"
---
# On-Device SLM Inference with Llama.cpp and NPU Acceleration via Android NNAPI & Qualcomm QNN

Most teams porting small language models (SLMs) to Android treat the hardware like a miniature Linux server with an oversized battery. They cross-compile `llama.cpp`, bundle a 1.5B or 3B GGUF file into their app assets, run a standard warm-up prompt, and watch the Linux Low Memory Killer (LMK) terminate their process within three minutes.

The culprit is almost never raw compute throughput. It is the mismatch between how Unix-like runtimes allocate memory and how Android's page cache and virtual memory subsystem enforce physical budget constraints. If you allocate a 2.1 GB buffer in user space on a device with 6 GB of RAM, Android does not gracefully swap to disk; it kills your foreground process before your first matrix multiplication completes.

To ship on-device inference that survives user interaction and background transitions, you must bypass the standard runtime allocation patterns entirely.

## The memory-first mental model

Think of an Android mobile SoC not as a desktop CPU with attached RAM, but as an asymmetrical system on a chip where the operating system acts as an aggressive landlord. 

Standard desktop runtimes read a model file from the file system and deserialize it into heap allocations (`malloc` or `new`). On Android, this heap allocation is classified as dirty memory (anonymous pages). Dirty pages cannot be evicted by the kernel under memory pressure; they can only be cleared by terminating the process holding them.

```
Standard Heap Loading (Process dies under pressure):
Storage (.gguf) ──> [ Read File ] ──> Heap Allocate (Dirty Pages) ──> LMK SIGKILL

Memory-Mapped Zero-Copy (Pages evictable under pressure):
Storage (.gguf) ──> [ mmap(PROT_READ) ] ──> VMA File Pages (Clean Memory) ──> Compute Kernels
```

When you use memory-mapped I/O (`mmap`), the OS maps the file directly into your process's virtual address space backed by the file itself. These mapped pages are clean. If the system experiences high memory pressure, the kernel can evict clean pages without writing anything to swap, reloading them transparently on the next memory access. 

Your inference engine cannot manage memory dynamically at execution time. It must be built around a zero-copy, read-only memory map for weights, coupled with a fixed-budget scratchpad for the key-value (KV) cache.

## Core architecture and hardware acceleration

Running models like `SmolLM2-1.7B` or `DeepSeek-R1-Distill-Qwen-1.5B` requires coordinating three components: the JNI translation layer, the C++ compute engine (`llama.cpp`), and the hardware backend (CPU NEON, Android NNAPI, or Qualcomm QNN via Hexagon HTP).

```
+-------------------------------------------------------------+
|                     Android App (Kotlin)                    |
+-------------------------------------------------------------+
                              |
                              v JNI (C ABI)
+-------------------------------------------------------------+
|                   Native Interface Wrapper                  |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                      llama.cpp Engine                       |
|   +-------------------+  +------------------------------+   |
|   |   mmap GGUF File  |  | KV Cache Allocator (Static)  |   |
|   +-------------------+  +------------------------------+   |
+-------------------------------------------------------------+
                              |
       +----------------------+----------------------+
       |                      |                      |
       v                      v                      v
+--------------+      +--------------+      +-----------------+
|  ARM NEON    |      | Android      |      | Qualcomm QNN    |
|  (CPU Float) |      | NNAPI (HAL)  |      | (Hexagon HTP)   |
+--------------+      +--------------+      +-----------------+
```

### JNI model initialization with zero-copy mapping

The native interface initializes the execution context using native file descriptors passed from Android's `AssetFileDescriptor` to avoid copying assets out of the APK.

```cpp
#include <jni.h>
#include <android/log.h>
#include <sys/mman.h>
#include <unistd.h>
#include "llama.h"

#define TAG "NativeInference"
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, TAG, __VA_ARGS__)

struct InferenceContext {
    llama_model* model = nullptr;
    llama_context* ctx = nullptr;
    void* mmap_addr = nullptr;
    size_t mmap_size = 0;
};

extern "C" JNIEXPORT jlong JNICALL
Java_com_example_inference_ModelBridge_initModel(
    JNIEnv* env,
    jobject /* thiz */,
    jint file_descriptor,
    jlong offset,
    jlong length,
    jint n_threads,
    jint n_ctx
) {
    auto* native_ctx = new InferenceContext();

    // Map model file directly into address space using the asset FD
    native_ctx->mmap_size = static_cast<size_t>(length);
    native_ctx->mmap_addr = mmap(
        nullptr,
        native_ctx->mmap_size,
        PROT_READ,
        MAP_SHARED,
        file_descriptor,
        offset
    );

    if (native_ctx->mmap_addr == MAP_FAILED) {
        LOGE("mmap failed with errno: %d", errno);
        delete native_ctx;
        return 0;
    }

    llama_model_params model_params = llama_model_default_params();
    model_params.use_mmap = true;
    model_params.use_mlock = false; // Never lock pages into RAM on Android

    // Load model from pointer rather than disk path
    native_ctx->model = llama_load_model_from_file_with_params(
        native_ctx->mmap_addr,
        native_ctx->mmap_size,
        model_params
    );

    if (!native_ctx->model) {
        LOGE("Failed to parse GGUF structures from mapped buffer");
        munmap(native_ctx->mmap_addr, native_ctx->mmap_size);
        delete native_ctx;
        return 0;
    }

    llama_context_params ctx_params = llama_context_default_params();
    ctx_params.n_ctx = static_cast<uint32_t>(n_ctx);
    ctx_params.n_threads = n_threads;
    ctx_params.n_threads_batch = n_threads;
    ctx_params.type_k = GGML_TYPE_Q8_0; // Quantize KV cache to save SRAM
    ctx_params.type_v = GGML_TYPE_Q8_0;

    native_ctx->ctx = llama_new_context_with_model(native_ctx->model, ctx_params);
    if (!native_ctx->ctx) {
        LOGE("Failed to create llama context");
        llama_free_model(native_ctx->model);
        munmap(native_ctx->mmap_addr, native_ctx->mmap_size);
        delete native_ctx;
        return 0;
    }

    return reinterpret_cast<jlong>(native_ctx);
}
```

### Offloading execution: NNAPI vs. Qualcomm QNN

CPU inference using ARM NEON handles variable-length sequence decoding reliably, but it drains power quickly under sustained generation. Hardware offloading relies on two paths:

1. **Android NNAPI**: Provides a vendor-agnostic abstraction layer across GPUs and DSPs. However, NNAPI introduces high compilation overhead at runtime and lacks first-class support for dynamically reshaped dynamic tensors used in attention mechanisms. It often falls back to standard CPU ops.
2. **Qualcomm QNN (Qualcomm Neural Network SDK)**: Targets the Hexagon Tensor Processor (HTP) directly. QNN requires quantization formats compatible with Hexagon hardware (typically INT8 or INT4 weights with symmetric INT8/INT16 activations).

When using QNN for quantized transformer blocks, the linear projections ($W_q, W_k, W_v, W_o$) execute as quantized integer matrix multiplications inside the HTP. Non-linear activation functions (like SiLU or RMSNorm) often execute faster when retained on the CPU vector units to avoid frequent tensor marshaling across the shared memory bus.

```cpp
// Configuring execution providers within the GGML backend registry
#if defined(GGML_USE_QNN)
#include "ggml-qnn.h"

void configure_qnn_backend(llama_context_params& params) {
    ggml_backend_qnn_params qnn_params = {
        .backend_type = GGML_QNN_BACKEND_HTP,
        .soc_model = GGML_QNN_SOC_SNAPDRAGON_GEN3,
        .performance_mode = GGML_QNN_PERF_BURST,
        .profiling_level = GGML_QNN_PROFILE_OFF
    };
    params.cb_eval = ggml_backend_qnn_callback;
    params.cb_eval_user_data = &qnn_params;
}
#endif
```

## Runtime execution flow

Here is what happens during a single autoregressive decoding step when generating a completion from a prompt:

```
1. Prompt Tokens: [T_0, T_1, ..., T_k]
      │
      ▼
2. Prefill Phase (Batch evaluation of prompt)
      │  ├─ CPU/HTP: Computes embeddings
      │  ├─ Multi-thread GEMM: Calculates K, V projections
      │  └─ KV Cache Insertion: Tokens written to static slot ring buffer
      ▼
3. Generation Loop (Token-by-token)
      │
      ├─► Step A: Fetch token T_n
      │
      ├─► Step B: Memory Subsystem
      │     └─ OS brings model weight pages from disk -> RAM on-demand
      │
      ├─► Step C: Compute Execution
      │     ├─ QNN HTP computes QKV projections (INT8 quantized)
      │     ├─ CPU NEON computes RoPE (Rotary Positional Embeddings)
      │     └─ Softmax & Attention pooling against cached K, V states
      │
      ├─► Step D: Logit Sampling
      │     └─ CPU evaluates top-p / temperature filtering
      │
      └─► Step E: Yield Token T_(n+1) -> Loop to Step A
```

1. **Token processing and ingestion**: The raw UTF-8 input string is tokenized via the internal vocabulary mapped directly from the GGUF metadata block.
2. **Prefill phase**: The prompt tokens are submitted as a single sequence. The model evaluates the batch, writing the resulting keys and values into the pre-allocated KV cache. Because this is compute-bound, `llama.cpp` assigns all available high-performance CPU cores (Cortex-X and Cortex-A performance cores) to this phase.
3. **Autoregressive decoding loop**:
   - The single last token is passed to the execution graph.
   - Weights for the linear layers are accessed through the mapped virtual address space. If the OS had previously evicted those pages to free memory for a system event, a minor page fault occurs, pulling the required 4-bit blocks into the page cache.
   - For layers routed to the NPU, the mapped addresses are sent via direct memory access (DMA) buffers to the Hexagon HTP subsystem, which evaluates the matrix-vector products.
   - Softmax calculation and sampling logic (Greedy, Top-P, or Min-P) run on the CPU to evaluate the output logits.
   - The selected token ID is appended to the KV cache, and the next cycle begins.

## Edge cases and production failure modes

### 1. The `mlock` trap and thermal throttling

On desktop systems, developers commonly set `use_mlock = true` to lock all model memory into RAM, preventing disk reads. 

On Android, doing this is a mistake. The kernel reserves little headroom for active apps. If you lock 1.8 GB of anonymous memory, the system cannot drop those pages during memory pressure. When an incoming phone call, push notification, or system service demands memory, the kernel will kill your app immediately via `SIGKILL` instead of temporarily reclaiming page cache buffers.

Always keep `use_mlock = false`. Let Android manage page lifecycle through normal file-backed memory eviction.

### 2. Big-Little core scheduling anomalies

Modern mobile chipsets feature heterogeneous CPU architectures: Prime cores, Performance cores, and Efficiency cores.

If you set `n_threads = 8` on an 8-core processor, the pthread scheduler will place worker threads across all cores, including the slow Efficiency cores. The batch compute time will block on the slowest thread in the thread pool, degrading overall token processing speed:

```
Core Layout:  [Prime Core] [Perf 1] [Perf 2] [Perf 3] [Eff 1] [Eff 2] [Eff 3] [Eff 4]
Workload:     [=== 2ms ==] [== 2ms =] [== 2ms =] [== 2ms =] [======= 11ms =======]
Result: Entire inference step blocks until Efficiency cores complete (11ms bottleneck)
```

Determine thread pool sizing based only on the device's high-performance core count:

```cpp
#include <sys/sysconf.h>

int get_optimal_thread_count() {
    // Read performance core count directly from sysfs topologies
    // Never default to standard sysconf(_SC_NPROCESSORS_ONLN)
    int total_cores = sysconf(_SC_NPROCESSORS_ONLN);
    if (total_cores <= 4) return 2;
    if (total_cores <= 8) return 4; // Typical configuration: 1 Prime + 3 Perf cores
    return 4;
}
```

### 3. KV cache allocation fragmentation

The KV cache can grow dynamically if it is not properly bounded, consuming hundreds of megabytes of heap space over extended context lengths.

```
Dynamic Allocation (Anti-Pattern):
[Ctx: 512] -> Heap Realloc -> [Ctx: 1024] -> Heap Realloc -> [Ctx: 2048] -> Fragmentation & OOM

Static Ring Buffer:
[Fixed Context Buffer: 2048 tokens (Pre-allocated, 8-bit quantized)]
```

If the KV cache allocates memory incrementally during prompt expansion, it fragments the heap and risks triggering an out-of-memory crash. Fix the context buffer limit (`n_ctx`) at initialization time, and configure 8-bit or 4-bit KV quantization (`type_k = GGML_TYPE_Q8_0`) to keep the cache size predictable throughout the app lifecycle.

A clear understanding of how mobile operating systems handle memory mapping, page eviction, and heterogeneous scheduling is what separates unstable experiments from reliable on-device SLM runtimes that hold up under real deployment conditions.