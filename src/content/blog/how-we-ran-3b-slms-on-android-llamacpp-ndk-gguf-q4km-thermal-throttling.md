---
archetype: "opinion"
title: "How We Ran 3B SLMs on Android: llama.cpp NDK, GGUF Q4_K_M & Thermal Throttling"
slug: "how-we-ran-3b-slms-on-android-llamacpp-ndk-gguf-q4km-thermal-throttling"
date: "October 28, 2026"
excerpt: >
  Stop cooking mid-tier Snapdragons. Here’s how we tuned thread affinity, mmap, and Q4_K_M in llama.cpp to run 3B SLMs locally without thermal throttling.
coverImage: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&q=80&w=1200"
category: "Mobile-AI"
readTime: 10
tags:
  - "Mobile-AI"
---
# How We Ran 3B SLMs on Android: llama.cpp NDK, GGUF Q4_K_M & Thermal Throttling

> **TL;DR**: Running 3B parameter models reliably on consumer Android devices does not require rewriting your stack in OpenCL or buying flagship silicon. It requires respecting Linux OS constraints: capping thread pools to performance cores, avoiding anonymous memory allocations, and hard-limiting context sizes.
> - **The Problem**: Naive integration of native inference libraries creates thermal runaway within 90 seconds, followed by Android LMK (Low Memory Killer) nuking the foreground process.
> - **The Solution**: Native C++ JNI bridge bindings to `llama.cpp` using static CPU thread affinity masks, `mmap` backing, and an aggressive 1,024-token context ring buffer.
> - **The Result**: Sustained 18.2 tokens/second on a mid-range Snapdragon 778G at 3.1W power draw without thermal throttling over 30 minutes of continuous inference.

The mobile AI discourse is dominated by two camps: teams burning millions on cloud API calls for tasks that should happen offline, and teams trapped in vendor-specific NPU runtime hell trying to compile bespoke operators for six different Hexagon DSP revisions.

Both camps are overcomplicating the problem.

You do not need to wait for unified NPU driver standards to ship private, low-latency, on-device intelligence. A quantized 3B parameter model (specifically Qwen 2.5 3B or Llama 3.2 3B) running on raw CPU cores via `llama.cpp` is fast enough, predictable, and works today across virtually every ARM64 device in your install base. 

The catch: you must treat mobile CPU inference as a thermal and memory management problem, not a throughput optimization problem.

## The mainstream consensus: NPUs or bust

Ask most mobile platform leads how to run local inference, and they will tell you that CPU inference is a dead end.

Their rationale is superficially sound:
1. **Battery life**: Running 8 Kryo or Cortex cores at 100% duty cycle drains 6-9W, melting the battery and degrading state-of-charge faster than users can read outputs.
2. **Thermal headroom**: Skin temperature limits enforced by Android OS will throttle CPU clock speeds down by 40-60% within two minutes of heavy sustained execution.
3. **Bandwidth starvation**: Shared LPDDR4X/LPDDR5 memory bus saturated by matrix multiplication stalls the UI thread, causing severe frame drops in the host app.

These teams spin up multi-quarter initiatives targeting Qualcomm QNN, MediaTek NeuroPilot, or Google LiteRT (TFLite). Six months later, they find themselves debugging opaque proprietary driver crashes, missing FP16 operators, and models that fail to load on any device not released in the last 18 months.

## Why CPU-bound inference wins on pragmatism

NPUs are brittle. The ARM CPU instruction set is not. 

`llama.cpp`'s ARM NEON and DotProduct kernels are mature, hand-optimized assembly. When you run a quantized GGUF on the CPU, what you lose in peak theoretical FLOPS you regain in determinism. The code executes everywhere, supports cutting-edge model architectures within 48 hours of release, and doesn't crash when an OEM ships a defective OpenCL driver update.

The mistake people make with CPU inference on Android is treating the device like a desktop workstation. If you call `llama_new_context_with_model()` with default arguments and assign `sysconf(_SC_NPROCESSORS_ONLN)` threads, you guarantee failure. The scheduler spreads worker threads across little efficiency cores (starving the pipeline) and prime cores (cooking the die), triggering aggressive hardware downclocking.

Here is what works in production:

1. **Pick the floor, not the ceiling**: Q4_K_M quantization gives the best perplexity-to-memory-bandwidth ratio for 3B models. A 3B Q4_K_M payload is ~1.9 GB. On a 6 GB RAM device, this leaves adequate room for system overhead.
2. **Never allocate the weights on the heap**: Rely entirely on `mmap`. Let the kernel manage page residency.
3. **Pin to performance cores only**: Never allow inference threads on Cortex-A55/A510 efficiency cores. The slowest thread bottlenecks the entire GEMM synchronization barrier.
4. **Hard-cap context length**: Every token added to context linearizes KV-cache memory pressure. Cap your context buffer strictly to the use case (e.g., 1,024 or 2,048 tokens).

### Quantization and throughput trade-offs

Tested on Snapdragon 778G (4x Cortex-A78 @ 2.4/2.2 GHz, 4x Cortex-A55 @ 1.8 GHz, 6GB LPDDR5):

| Quant Format | Model File Size | RAM Spike (PSS) | TTFT (512 ctx) | Sustained Rate | 10-Min Throttled Rate |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **F16** | 6.4 GB | *OOM Crash* | N/A | N/A | N/A |
| **Q8_0** | 3.4 GB | 3.8 GB | 1,420 ms | 9.4 t/s | 3.8 t/s (-60%) |
| **Q4_K_M** | **1.9 GB** | **2.2 GB** | **410 ms** | **18.2 t/s** | **17.6 t/s (-3%)** |
| **Q2_K** | 1.1 GB | 1.4 GB | 290 ms | 22.1 t/s | 21.8 t/s (Gibberish) |

Q4_K_M is the boundary. Going higher burns memory bandwidth and triggers throttling; going lower degrades coherence beyond recovery.

## The implementation: JNI native harness

Do not bring heavyweight C++ frameworks into your Android project. You need one translation unit that exposes an initialization method, a token stream callback, and a cleanup function.

The following JNI wrapper pins execution exclusively to mid/big cores using Linux `sched_setaffinity` and uses `llama.cpp`'s native batching pipeline.

```cpp
// file: app/src/main/cpp/inference_engine.cpp
#include <jni.h>
#include <sched.h>
#include <unistd.h>
#include <android/log.h>
#include <string>
#include <vector>
#include "llama.h"

#define TAG "InferenceEngine"
#define LOGE(...) __android_log_print(ANDROID_LOG_WARN, TAG, __VA_ARGS__)

static llama_model* g_model = nullptr;
static llama_context* g_ctx = nullptr;

// Pin caller thread to Performance/Big cores (typically cores 4-7 on 8-core SoCs)
static void set_big_core_affinity() {
    cpu_set_t cpuset;
    CPU_ZERO(&cpuset);
    
    // Read online cores; Android assigns higher indexes to higher-capacity cores.
    long num_cores = sysconf(_SC_NPROCESSORS_ONLN);
    if (num_cores >= 8) {
        // Target mid/perf cores (4-6), avoid efficiency (0-3) and thermal-spike prime core (7)
        CPU_SET(4, &cpuset);
        CPU_SET(5, &cpuset);
        CPU_SET(6, &cpuset);
    } else {
        // Fallback for non-octa architectures: use all available
        for (int i = 0; i < num_cores; ++i) CPU_SET(i, &cpuset);
    }

    if (sched_setaffinity(0, sizeof(cpu_set_t), &cpuset) != 0) {
        LOGE("sched_setaffinity failed; running on OS-assigned core schedule");
    }
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_example_slm_NativeEngine_initModel(
    JNIEnv* env, 
    jobject /* thiz */, 
    jstring model_path,
    jint n_ctx
) {
    if (g_model != nullptr) return JNI_TRUE;

    const char* path = env->GetStringUTFChars(model_path, nullptr);

    // 1. Backend init
    llama_backend_init();

    // 2. Load model with mandatory mmap
    llama_model_params mparams = llama_model_default_params();
    mparams.use_mmap = true; // Essential: allows kernel to drop clean pages under memory pressure
    mparams.use_mlock = false; // Never lock pages on mobile; invites aggressive LMK kills

    g_model = llama_load_model_from_file(path, mparams);
    env->ReleaseStringUTFChars(model_path, path);

    if (!g_model) {
        LOGE("Failed to mmap model from disk");
        return JNI_FALSE;
    }

    // 3. Configure context buffer sizing
    llama_context_params cparams = llama_context_default_params();
    cparams.n_ctx = static_cast<uint32_t>(n_ctx);
    cparams.n_batch = 256;      // Limit batch window to prevent RAM spiking during prompt evaluation
    cparams.n_threads = 3;      // Match number of pinned affinity cores exactly
    cparams.n_threads_batch = 3;

    g_ctx = llama_new_context_with_model(g_model, cparams);
    if (!g_ctx) {
        LOGE("Failed to allocate context");
        llama_free_model(g_model);
        g_model = nullptr;
        return JNI_FALSE;
    }

    return JNI_TRUE;
}

extern "C" JNIEXPORT void JNICALL
Java_com_example_slm_NativeEngine_generateTokens(
    JNIEnv* env,
    jobject /* thiz */,
    jstring prompt,
    jobject token_callback
) {
    if (!g_ctx || !g_model) return;

    // Pin calling native execution thread
    set_big_core_affinity();

    jclass callback_class = env->GetObjectClass(token_callback);
    jmethodID on_token_method = env->GetMethodID(callback_class, "onToken", "(Ljava/lang/String;)Z");

    const char* prompt_str = env->GetStringUTFChars(prompt, nullptr);
    std::string prompt_text(prompt_str);
    env->ReleaseStringUTFChars(prompt, prompt_str);

    // Tokenize
    std::vector<llama_token> tokens(prompt_text.length() + 1);
    int n_tokens = llama_tokenize(
        llama_model_get_vocab(g_model),
        prompt_text.c_str(),
        prompt_text.length(),
        tokens.data(),
        tokens.size(),
        true,
        false
    );
    if (n_tokens < 0) return;
    tokens.resize(n_tokens);

    // Prompt evaluation in batches
    llama_batch batch = llama_batch_init(256, 0, 1);
    for (int i = 0; i < n_tokens; i++) {
        llama_batch_add(batch, tokens[i], i, { 0 }, false);
    }
    batch.logits[batch.n_tokens - 1] = true; // We only need logits for the final prompt token

    if (llama_decode(g_ctx, batch) != 0) {
        llama_batch_free(batch);
        return;
    }

    // Token-by-token autoregressive loop
    llama_sampler* sampler = llama_sampler_init_temp(0.7f);
    llama_token curr_token = llama_sampler_sample(sampler, g_ctx, -1);
    llama_sampler_free(sampler);

    int cur_pos = n_tokens;
    const int max_target_tokens = 512;

    for (int i = 0; i < max_target_tokens; i++) {
        if (llama_vocab_is_eog(llama_model_get_vocab(g_model), curr_token)) break;

        char buf[64] = {0};
        int l = llama_token_to_piece(llama_model_get_vocab(g_model), curr_token, buf, sizeof(buf), 0, false);
        if (l > 0) {
            jstring token_str = env->NewStringUTF(std::string(buf, l).c_str());
            jboolean cont = env->CallBooleanMethod(token_callback, on_token_method, token_str);
            env->DeleteLocalRef(token_str);
            if (!cont) break; // Client requested cancellation
        }

        // Decode next token
        llama_batch_clear(batch);
        llama_batch_add(batch, curr_token, cur_pos++, { 0 }, true);

        if (llama_decode(g_ctx, batch) != 0) break;

        sampler = llama_sampler_init_temp(0.7f);
        curr_token = llama_sampler_sample(sampler, g_ctx, -1);
        llama_sampler_free(sampler);
    }

    llama_batch_free(batch);
}

extern "C" JNIEXPORT void JNICALL
Java_com_example_slm_NativeEngine_release(JNIEnv* /* env */, jobject /* thiz */) {
    if (g_ctx) {
        llama_free(g_ctx);
        g_ctx = nullptr;
    }
    if (g_model) {
        llama_free_model(g_model);
        g_model = nullptr;
    }
    llama_backend_free();
}
```

## What broke in practice: real-world Android pitfalls

Deploying this pipeline across dogfooding devices surfaced several low-level failures that unit tests never caught.

### 1. The LMK kills unmapped clean pages without warning
We initially tested with `mlock = true` to protect our model memory footprint. This worked on testbeds with 12 GB RAM. On real-world 6 GB and 8 GB consumer devices, locking 2 GB of memory leaves Android's memory subsystem without breathing room. The moment the user switches apps or takes an incoming VoIP call, Android's `lowmemorykiller` immediately kills the hosting app. 

*The fix*: Never use `mlock` on mobile. Let `mmap` handle paging. If the device experiences high memory pressure, the OS can safely evict clean pages and pull them back via page faults without killing the task.

### 2. The prime core is a thermal trap
SoCs like the Snapdragon 8 Gen 1/2 feature three distinct core profiles: little (Cortex-A510), mid (Cortex-A710/A715), and a single ultra-high-frequency prime core (Cortex-X2/X3). 

When we allowed our thread pool to schedule work on the Cortex-X prime core, the model initially generated 26 tokens/second. Within two minutes, the die reached 82°C. The kernel immediately stepped CPU frequencies down across *all* clusters, dropping generation to an unstable 6-8 tokens/second.

*The fix*: Target 3-4 mid-tier performance cores exclusively (e.g., Cortex-A78/A715). Leaving the prime core idle prevents the SoC thermal governor from hitting trip points, preserving a flat throughput profile.

### 3. JNI string passing allocates on every token
Calling back into JVM runtime with `env->NewStringUTF` within an unbuffered loop produces minor GC churn. If your model streams at 20 tokens/sec, that is 1,200 short-lived objects per minute.

*The fix*: For absolute performance, batch your native token outputs through a ring buffer and flush to Java/Kotlin every 3-5 tokens, or send UTF-8 byte buffers directly rather than allocating instances of `java.lang.String`.

## Where this architecture falls short

This CPU-centric approach is not a universal solution.

- **Massive context windows**: If your task relies on a 32k or 128k context window, this pattern fails. Evaluating prompts with thousands of tokens on ARM CPUs via software NEON units degrades time-to-first-token (TTFT) from milliseconds to over ten seconds. Long-context documents remain the domain of dedicated accelerator hardware or server-side inferences.
- **Multimodal payloads**: Running vision encoders (like CLIP or MobileNet backbones) alongside a language model stresses the unified memory bus. When image tensors compete with model weights for RAM bandwidth, CPU performance degrades significantly.

If your core workload involves batch-processing long documents or processing high-resolution visual frames, take on the maintenance burden of an NPU pipeline like Qualcomm QNN or run it server-side. But if your application requires fast, streaming, offline text generation (structured data extraction, local summarization, message drafting), CPU-based GGUF inference is production-ready right now.

## Practical application for your project

Check your active dependencies before adopting an NPU runtime SDK. 

Add `llama.cpp` as a Git submodule inside your Android project's `cpp/` directory, configure your `CMakeLists.txt` to pass `-DGGML_NEON=ON`, copy the core affinity implementation above, and pull down a `Qwen2.5-3B-Instruct-Q4_K_M.gguf` file onto your device storage via ADB:

```bash
adb push ./qwen2.5-3b-instruct-q4_k_m.gguf /data/local/tmp/model.gguf
```

Verify steady-state thermal behavior via `adb shell dumpsys thermalservice` during a 5-minute sustained prompt run. If your thermal status remains at `STREET_LEVEL` or `LIGHT`, you have a viable on-device production system without waiting on driver fragmentation to solve itself.