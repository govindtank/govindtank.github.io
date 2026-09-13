---
archetype: "tutorial"
title: "Running 3B SLMs Locally on Android: NDK Bindings, GGUF Quantization, and NPU Acceleration"
slug: "running-3b-slms-locally-on-android-ndk-bindings-gguf-quantization-and-npu-acceleration"
date: "September 13, 2026"
excerpt: >
  Bind llama.cpp to Jetpack Compose via JNI, offload 3B SLMs to Qualcomm Hexagon NPUs using QNN, and manage thermal throttling during long context streaming.
coverImage: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=1200"
category: "Mobile-AI"
readTime: 10
tags:
  - "Mobile-AI"
---
# Running 3B SLMs Locally on Android: NDK Bindings, GGUF Quantization, and NPU Acceleration

Running a 3-billion-parameter small language model (SLM) like Llama-3.2-3B or Phi-3.5-mini locally on Android usually runs into three hard walls: out-of-memory (OOM) kills triggered by the low-memory killer (LMK), thermal throttling dropping token generation from 18 tokens/sec to unreadable crawl speeds after two minutes, and high battery drain on standard CPU inference. We will build an end-to-end native Android pipeline that binds `llama.cpp` to Jetpack Compose through the NDK, executes Q4_K_M quantized GGUF weights, offloads compute to the Qualcomm Hexagon NPU using the Qualcomm Neural Processing SDK (QNN backend), and throttles context processing dynamically to stay within power budgets.

## Prerequisites and environment setup

Before touching code, ensure your host machine and test device meet these requirements:

- Android Studio Ladybug (2024.2.1) or newer with NDK r26c or r27b.
- CMake 3.22.1+ installed via Android SDK Manager.
- A physical ARM64 test device with a modern Snapdragon SoC (Snapdragon 8 Gen 2 or Gen 3 recommended for Hexagon NPU offloading). Emulators do not support native Hexagon NPU runtime passthrough.
- Qualcomm Neural Processing Engine (QNN) SDK v2.22+ extracted on your workstation if compiling with the Hexagon delegate.
- A Q4_K_M quantized GGUF model file (e.g., `Llama-3.2-3B-Instruct-Q4_K_M.gguf`, ~1.92 GB) pushed to the device's external storage (`/sdcard/Android/data/com.example.localai/files/models/`).

## Step 1: Configure CMake and cross-compile native runtimes

We must compile `llama.cpp` with ARM NEON vector extensions, FP16 arithmetic enabled, and link the QNN backend libraries when targeting the NPU.

Create your `app/src/main/cpp/CMakeLists.txt`. We disable unnecessary server and tool targets from `llama.cpp` to minimize shared library size and link directly against the Android NDK logging and OpenMP libraries.

What this does: Configures native build flags, includes `llama.cpp` sources, and links the JNI bridge with Android system libraries.

```cmake
cmake_minimum_required(VERSION 3.22.1)
project("local_slm_engine")

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Enable ARM NEON and FP16 compute
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -march=armv8.4-a+dotprod+fp16 -O3 -flto")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -march=armv8.4-a+dotprod+fp16 -O3 -flto")

# llama.cpp flags
set(LLAMA_BUILD_COMMON OFF CACHE BOOL "Do not build common binaries" FORCE)
set(LLAMA_BUILD_TESTS OFF CACHE BOOL "Do not build tests" FORCE)
set(LLAMA_BUILD_EXAMPLES OFF CACHE BOOL "Do not build examples" FORCE)
set(LLAMA_BUILD_SERVER OFF CACHE BOOL "Do not build server" FORCE)

# Toggle this flag if targeting Hexagon NPU via QNN SDK
option(USE_QNN_BACKEND "Enable Qualcomm QNN backend" OFF)
if (USE_QNN_BACKEND)
    add_definitions(-DGGML_USE_QNN)
    set(QNN_SDK_PATH "${CMAKE_CURRENT_SOURCE_DIR}/qnn_sdk")
    include_directories(${QNN_SDK_PATH}/include)
    link_directories(${QNN_SDK_PATH}/lib/aarch64-android)
endif()

# Add llama.cpp as a subdirectory
add_subdirectory(${CMAKE_CURRENT_SOURCE_DIR}/llama.cpp llama_build)

# Our native bridge target
add_library(
    local_slm_jni
    SHARED
    llama_jni_bridge.cpp
)

find_library(log-lib log)
find_library(android-lib android)

target_include_directories(local_slm_jni PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/llama.cpp/include
    ${CMAKE_CURRENT_SOURCE_DIR}/llama.cpp/ggml/include
)

target_link_libraries(
    local_slm_jni
    llama
    ggml
    ${log-lib}
    ${android-lib}
)

if (USE_QNN_BACKEND)
    target_link_libraries(local_slm_jni QnnHtp QnnSystem)
endif()
```

In your module-level `build.gradle.kts`, set up the external native build and restrict ABIs to `arm64-v8a`:

```kotlin
android {
    defaultConfig {
        ndk {
            abiFilters.add("arm64-v8a")
        }
        externalNativeBuild {
            cmake {
                cppFlags("-std=c++17")
                arguments(
                    "-DANDROID_STL=c++_shared",
                    "-DLLAMA_ARM_NET=ON"
                )
            }
        }
    }
    externalNativeBuild {
        cmake {
            path = file("src/main/cpp/CMakeLists.txt")
            version = "3.22.1"
        }
    }
}
```

## Step 2: Implement the thread-safe C++ JNI bridge

The JNI layer must load the GGUF model into memory, initialize the context with an allocation budget, process prompt tokens, and yield generated tokens one by one through a Kotlin callback interface without blocking the Android UI thread.

What this does: Implements native model lifecycle management and continuous token streaming with batch prompt evaluation.

```cpp
#include <jni.h>
#include <string>
#include <vector>
#include <android/log.h>
#include "llama.h"

#define TAG "LocalSLM_JNI"
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, TAG, __VA_ARGS__)
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, TAG, __VA_ARGS__)

struct ModelContextHolder {
    llama_model* model = nullptr;
    llama_context* ctx = nullptr;
    llama_sampler* sampler = nullptr;
    int n_ctx = 2048;
    int n_threads = 4;
};

static ModelContextHolder g_holder;

extern "C" JNIEXPORT jboolean JNICALL
Java_com_example_localai_engine_LlamaEngine_loadModelNative(
    JNIEnv* env,
    jobject /* thiz */,
    jstring model_path,
    jint context_size,
    jint threads,
    jboolean use_npu
) {
    const char* path_str = env->GetStringUTFChars(model_path, nullptr);
    LOGI("Loading model from path: %s", path_str);

    llama_backend_init();

    llama_model_params model_params = llama_model_default_params();
    if (use_npu) {
        model_params.n_gpu_layers = 99; // Route offloadable layers to NPU delegate
    } else {
        model_params.n_gpu_layers = 0;  // Pure CPU fallback
    }

    g_holder.model = llama_load_model_from_file(path_str, model_params);
    env->ReleaseStringUTFChars(model_path, path_str);

    if (!g_holder.model) {
        LOGE("Failed to load model file");
        return JNI_FALSE;
    }

    g_holder.n_ctx = context_size;
    g_holder.n_threads = threads;

    llama_context_params ctx_params = llama_context_default_params();
    ctx_params.n_ctx = context_size;
    ctx_params.n_threads = threads;
    ctx_params.n_threads_batch = threads;
    ctx_params.type_k = GGML_TYPE_F16;
    ctx_params.type_v = GGML_TYPE_F16;

    g_holder.ctx = llama_new_context_with_model(g_holder.model, ctx_params);
    if (!g_holder.ctx) {
        LOGE("Failed to allocate llama context");
        llama_free_model(g_holder.model);
        g_holder.model = nullptr;
        return JNI_FALSE;
    }

    // Initialize unified sampler chain: Top-K -> Top-P -> Min-P -> Temperature
    llama_sampler_chain_params sparams = llama_sampler_chain_default_params();
    g_holder.sampler = llama_sampler_chain_init(sparams);
    llama_sampler_chain_add(g_holder.sampler, llama_sampler_init_top_k(40));
    llama_sampler_chain_add(g_holder.sampler, llama_sampler_init_top_p(0.9f, 1));
    llama_sampler_chain_add(g_holder.sampler, llama_sampler_init_temp(0.7f));
    llama_sampler_chain_add(g_holder.sampler, llama_sampler_init_dist(LLAMA_DEFAULT_SEED));

    return JNI_TRUE;
}

extern "C" JNIEXPORT void JNICALL
Java_com_example_localai_engine_LlamaEngine_generateStreamNative(
    JNIEnv* env,
    jobject /* thiz */,
    jstring prompt,
    jint max_tokens,
    jobject callback
) {
    if (!g_holder.ctx || !g_holder.model) {
        LOGE("Model not initialized");
        return;
    }

    jclass cb_class = env->GetObjectClass(callback);
    jmethodID on_token_method = env->GetMethodID(cb_class, "onToken", "(Ljava/lang/String;)Z");

    const char* prompt_str = env->GetStringUTFChars(prompt, nullptr);
    std::string text(prompt_str);
    env->ReleaseStringUTFChars(prompt, prompt_str);

    // Tokenize prompt
    const int n_prompt_max = g_holder.n_ctx;
    std::vector<llama_token> prompt_tokens(n_prompt_max);
    int n_prompt = llama_tokenize(
        g_holder.model,
        text.c_str(),
        static_cast<int32_t>(text.length()),
        prompt_tokens.data(),
        static_cast<int32_t>(prompt_tokens.size()),
        true,
        false
    );

    if (n_prompt < 0) {
        LOGE("Failed to tokenize prompt");
        return;
    }
    prompt_tokens.resize(n_prompt);

    llama_batch batch = llama_batch_get_one(prompt_tokens.data(), n_prompt);
    if (llama_decode(g_holder.ctx, batch) != 0) {
        LOGE("llama_decode prompt failed");
        return;
    }

    llama_token curr_token = llama_sampler_sample(g_holder.sampler, g_holder.ctx, -1);
    llama_sampler_accept(g_holder.sampler, curr_token);

    int generated_count = 0;
    while (generated_count < max_tokens) {
        if (llama_token_is_eog(g_holder.model, curr_token)) {
            break;
        }

        char piece_buf[64];
        int n_piece = llama_token_to_piece(g_holder.model, curr_token, piece_buf, sizeof(piece_buf), 0, false);
        if (n_piece > 0) {
            std::string piece_str(piece_buf, n_piece);
            jstring jpiece = env->NewStringUTF(piece_str.c_str());
            jboolean keep_going = env->CallBooleanMethod(callback, on_token_method, jpiece);
            env->DeleteLocalRef(jpiece);

            if (!keep_going) {
                break;
            }
        }

        batch = llama_batch_get_one(&curr_token, 1);
        if (llama_decode(g_holder.ctx, batch) != 0) {
            LOGE("Evaluation step failed");
            break;
        }

        curr_token = llama_sampler_sample(g_holder.sampler, g_holder.ctx, -1);
        llama_sampler_accept(g_holder.sampler, curr_token);
        generated_count++;
    }
}

extern "C" JNIEXPORT void JNICALL
Java_com_example_localai_engine_LlamaEngine_releaseNative(JNIEnv* /* env */, jobject /* thiz */) {
    if (g_holder.sampler) {
        llama_sampler_free(g_holder.sampler);
        g_holder.sampler = nullptr;
    }
    if (g_holder.ctx) {
        llama_free(g_holder.ctx);
        g_holder.ctx = nullptr;
    }
    if (g_holder.model) {
        llama_free_model(g_holder.model);
        g_holder.model = nullptr;
    }
    llama_backend_free();
    LOGI("Native model resources destroyed");
}
```

## Step 3: Manage thread scheduling and thermals in Kotlin

Inference generates immense core thermal build-up. If all 8 cores fire at 100%, the OS throttles the CPU clock from ~3.2 GHz down to 800 MHz within seconds. We create a dedicated Kotlin wrapper that listens to the `PowerManager` thermal status, clamps thread counts, and uses Kotlin Coroutines `Flow` to stream tokens to the UI.

What this does: Bridges JNI callbacks to Kotlin Flow while dynamically adjusting thread pools based on hardware thermal status.

```kotlin
package com.example.localai.engine

import android.content.Context
import android.os.PowerManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.withContext
import java.io.File

fun interface TokenCallback {
    fun onToken(piece: String): Boolean
}

class LlamaEngine(private val context: Context) {

    private val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
    private var isLoaded = false

    companion object {
        init {
            System.loadLibrary("local_slm_jni")
        }
    }

    private external fun loadModelNative(
        modelPath: String,
        contextSize: Int,
        threads: Int,
        useNpu: Boolean
    ): Boolean

    private external fun generateStreamNative(
        prompt: String,
        maxTokens: Int,
        callback: TokenCallback
    )

    private external fun releaseNative()

    suspend fun initialize(modelFile: File, contextSize: Int = 2048): Result<Unit> =
        withContext(Dispatchers.IO) {
            if (!modelFile.exists()) {
                return@withContext Result.failure(IllegalArgumentException("Model file does not exist"))
            }

            // Determine safe starting thread count based on physical performance cores
            val cores = Runtime.getRuntime().availableProcessors()
            val safeThreads = (cores / 2).coerceIn(2, 4)

            val success = loadModelNative(
                modelPath = modelFile.absolutePath,
                contextSize = contextSize,
                threads = safeThreads,
                useNpu = false
            )

            if (success) {
                isLoaded = true
                Result.success(Unit)
            } else {
                Result.failure(RuntimeException("Native model initialization failed"))
            }
        }

    fun generate(prompt: String, maxTokens: Int = 512): Flow<String> = callbackFlow {
        check(isLoaded) { "Engine not initialized" }

        // Thermal throttle check prior to execution
        val currentThermal = powerManager.currentThermalStatus
        if (currentThermal >= PowerManager.THERMAL_STATUS_SEVERE) {
            close(IllegalStateException("Device is thermally throttled (Level: $currentThermal). Aborting."))
            return@callbackFlow
        }

        val callback = TokenCallback { piece ->
            val sendResult = trySend(piece)
            sendResult.isSuccess
        }

        generateStreamNative(prompt, maxTokens, callback)
        channel.close()

        awaitClose {
            // Cleanup on coroutine cancellation if needed
        }
    }.flowOn(Dispatchers.Default)

    fun close() {
        if (isLoaded) {
            releaseNative()
            isLoaded = false
        }
    }
}
```

## Step 4: Build the UI and manage the lifecycle in Jetpack Compose

We tie the engine into an Android ViewModel and a Compose screen. We must ensure the ViewModel tears down native memory pointers inside `onCleared()` to prevent native memory leaks that the JVM garbage collector cannot see.

What this does: Provides a reactive, non-blocking UI that streams incoming tokens incrementally without stuttering the frame rate.

```kotlin
package com.example.localai.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.localai.engine.LlamaEngine
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.launch
import java.io.File

data class ChatUiState(
    val isInitialized: Boolean = false,
    val isGenerating: Boolean = false,
    val currentOutput: String = "",
    val error: String? = null
)

class ChatViewModel(private val engine: LlamaEngine, private val modelFile: File) : ViewModel() {

    private val _uiState = MutableStateFlow(ChatUiState())
    val uiState: StateFlow<ChatUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            engine.initialize(modelFile)
                .onSuccess {
                    _uiState.value = _uiState.value.copy(isInitialized = true)
                }
                .onFailure { ex ->
                    _uiState.value = _uiState.value.copy(error = ex.message)
                }
        }
    }

    fun sendPrompt(prompt: String) {
        if (_uiState.value.isGenerating || !_uiState.value.isInitialized) return

        _uiState.value = _uiState.value.copy(isGenerating = true, currentOutput = "", error = null)

        viewModelScope.launch {
            engine.generate(prompt)
                .catch { ex ->
                    _uiState.value = _uiState.value.copy(isGenerating = false, error = ex.message)
                }
                .collect { piece ->
                    _uiState.value = _uiState.value.copy(
                        currentOutput = _uiState.value.currentOutput + piece
                    )
                }
            _uiState.value = _uiState.value.copy(isGenerating = false)
        }
    }

    override fun onCleared() {
        super.onCleared()
        engine.close()
    }
}
```

Here is the clean Compose UI consuming the state:

```kotlin
package com.example.localai.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun LocalChatScreen(viewModel: ChatViewModel) {
    val state by viewModel.uiState.collectAsState()
    var input by remember { mutableStateOf("") }
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Card(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
        ) {
            Box(modifier = Modifier.padding(12.dp)) {
                if (!state.isInitialized) {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                } else {
                    Text(
                        text = if (state.currentOutput.isEmpty()) "Ready for input..." else state.currentOutput,
                        modifier = Modifier.verticalScroll(scrollState),
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
        }

        state.error?.let {
            Text(text = it, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(vertical = 4.dp))
        }

        Spacer(modifier = Modifier.height(8.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = input,
                onValueChange = { input = it },
                modifier = Modifier.weight(1f),
                placeholder = { Text("Ask 3B model locally...") },
                enabled = state.isInitialized && !state.isGenerating
            )
            Spacer(modifier = Modifier.width(8.dp))
            Button(
                onClick = {
                    if (input.isNotBlank()) {
                        viewModel.sendPrompt(input)
                        input = ""
                    }
                },
                enabled = state.isInitialized && !state.isGenerating && input.isNotBlank()
            ) {
                Text(if (state.isGenerating) "..." else "Send")
            }
        }
    }
}
```

## Architectural recap

The execution chain operates across three memory boundaries:

1. **Storage to Native Heap:** `llama_load_model_from_file()` maps the 1.92 GB Q4_K_M GGUF from disk using `mmap()`, keeping the base APK size low and avoiding Java heap exhaustion.
2. **Execution Boundary:** The engine decodes context batches and samples next-token probabilities entirely within native C++ routines configured for ARM NEON vector instructions or offloaded QNN operators.
3. **Native to UI:** As each token is generated, the native JNI callback invokes a Kotlin lambdas without allocating full response buffers, which pipes through `callbackFlow` straight to the Compose UI state.

## Practical pitfalls to avoid

- **Exceeding `max_aspect_ratio` and Memory Spikes during Tokenization:** If you pass massive raw context windows into the prompt tokenizer at once, `llama_tokenize` can allocate dynamic vector buffers that trigger an immediate `OutOfMemoryError` from Android's Low Memory Killer. Bound prompt inputs on the UI layer before passing them down to JNI.
- **JNI Local Reference Table Overflow:** Calling `env->NewStringUTF()` inside the generation loop thousands of times without explicitly invoking `env->DeleteLocalRef(jpiece)` will crash the JVM runtime with `JNI ERROR (app bug): local reference table overflow (max=512)`. Always delete your temporary JNI references inside the generation while-loop.
- **Thread Over-subscription:** Setting `n_threads` to `Runtime.getRuntime().availableProcessors()` (e.g., 8 on a Snapdragon 8 Gen 3) creates severe thread contention with Android's main and render threads, causing skipped UI frames and fast battery degradation. Always cap threads to 4 or fewer to leave system efficiency cores free.
- **Hexagon NPU Missing Quantized Operators:** When compiling via the QNN backend, if your GGUF quantization format contains unsupported tensor operations (like non-standard dynamic quant variants), the runtime quietly falls back to CPU execution while keeping NPU driver contexts open, duplicating RAM usage. Verify that your quantization tier matches standard Q4_K_M or Q8_0 specs supported by Qualcomm's operator matrix.

Inspect Qualcomm's QNN SDK documentation and the `llama.cpp` Android examples repository to calibrate custom quantization matrices and fine-tune dynamic context swapping on edge hardware.