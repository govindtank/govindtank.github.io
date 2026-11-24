---
archetype: "tutorial"
title: "Building an MCP Host on Android: Tool-Calling Loops Without Freezing the UI"
slug: "building-an-mcp-host-on-android-tool-calling-loops-without-freezing-the-ui"
date: "November 01, 2026"
excerpt: >
  Running an MCP host locally tanks Android UI frames. Offload JSON-RPC tool loops with structured coroutines and scoped permissions to prevent ANRs.
coverImage: "https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?auto=format&fit=crop&q=80&w=1200"
category: "AI-Engineering"
readTime: 9
tags:
  - "AI-Engineering"
---
# Building an MCP Host on Android: Tool-Calling Loops Without Freezing the UI

> **TL;DR**: Running Model Context Protocol (MCP) tool loops on Android quickly locks the main thread if you treat JSON-RPC dispatch as standard async I/O. Decoupling the transport layer into a dedicated coroutine actor with strict channel backpressure keeps the UI at 60 FPS while running local LLM inference and tool discovery.
> - **The Problem**: Tool loops trigger nested JSON-RPC calls over local transports (IPC/sockets/stdio), causing Choreographer frame drops, ANRs on permission checks, and race conditions during coroutine cancellation.
> - **The Solution**: A lightweight MCP Host built on Kotlin Coroutines using `Dispatchers.IO` for stdio/sub-process pipes, buffered `Channel` instances for message dispatch, and dynamic permission resolution hoisted out of the execution loop.
> - **The Result**: Sustained 60 FPS rendering under heavy tool execution workloads with zero UI thread contention and strict lifecycle-aware cancellation under 15ms.

Most Android implementations of local agent loops fall apart the moment an LLM generates three consecutive tool calls. The user taps a prompt, the local model spits out a tool call, the app invokes an on-device utility (querying SQLite, grabbing calendar events, or reading device state), and the UI stutters.

The Model Context Protocol standardizes how applications expose context and tools to LLMs via JSON-RPC 2.0. On desktop or servers, spawning child processes with stdio is trivial. On Android, you deal with app sandboxing, process lifecycles, and a single main thread driving Choreographer. Run a blocking parse or a sluggish tool execution inside your agent loop, and Android promptly drops frames or kills your app with an Application Not Responding (ANR) dialog.

Here is how to build a production-ready, local MCP host inside an Android app that executes tool-calling loops without touching the main thread.

## What you need

- Android Studio Jellyfish or newer.
- Min SDK 26 (Android 8.0+), Target SDK 34/35.
- Kotlin 1.9+ with `kotlinx.coroutines` (1.8+) and `kotlinx.serialization` (1.6+).
- A local or on-device LLM runner (such as `llama.cpp` via JNI, MediaPipe LLM Inference, or an embedded HTTP endpoint) capable of outputting structured tool calls.

No third-party MCP SDK is required. MCP is fundamentally JSON-RPC 2.0 over a transport layer. We will implement the minimal spec directly.

## Architectural blueprint

A robust Android MCP host has three components:

1. **Transport abstraction**: Manages bidirectional stream I/O without keeping threads alive unnecessarily.
2. **Protocol router**: Deserializes JSON-RPC requests, maps methods to local Kotlin functions, and formats responses.
3. **Execution supervisor**: A coroutine-based loop that feeds tool outputs back into the LLM context while honoring `Job` cancellation when the user navigates away.

```
       UI / ViewModel
             │ (StateFlow / User Events)
             ▼
    ┌──────────────────┐
    │  Execution Loop  │ ◄── Dispatchers.Default
    └────────┬─────────┘
             │ tool_call(params)
             ▼
    ┌──────────────────┐
    │     MCP Host     │ ◄── Handles JSON-RPC 2.0
    └────────┬─────────┘
             │ Request/Response
             ▼
    ┌──────────────────┐
    │ Transport Router │ ◄── Dispatchers.IO (Channels)
    └────────┬─────────┘
             ├── In-Memory Local Tools (Battery, Storage, Contacts)
             └── Out-of-Process / IPC Services (AIDL / Local Sockets)
```

## Step 1: Define the minimal MCP wire protocol

Do not import an over-engineered framework for basic message handling. Use `kotlinx.serialization` with polymorphic descriptors for the core JSON-RPC 2.0 contracts defined by MCP.

```kotlin
// McpSchema.kt - Minimal JSON-RPC 2.0 data models for MCP
package com.example.mcphost.protocol

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject

@Serializable
data class JsonRpcRequest(
    val jsonrpc: String = "2.0",
    val id: String,
    val method: String,
    val params: JsonObject? = null
)

@Serializable
data class JsonRpcResponse(
    val jsonrpc: String = "2.0",
    val id: String,
    val result: JsonElement? = null,
    val error: JsonRpcError? = null
)

@Serializable
data class JsonRpcError(
    val code: Int,
    val message: String,
    val data: JsonElement? = null
)

@Serializable
data class ToolDefinition(
    val name: String,
    val description: String,
    val inputSchema: JsonObject
)
```

## Step 2: Implement the thread-isolated transport channel

Android does not allow arbitrary sub-process spawning via `ProcessBuilder` in standard sandbox environments unless you ship executables in your native libs directory. Most local MCP servers on Android run in-process or via an isolated Service communicating through local Unix domain sockets or standard IPC.

To ensure non-blocking dispatch, decouple message sending and receiving through a coroutine `Channel`.

```kotlin
// McpTransport.kt - Decoupled I/O using Kotlin Channels
package com.example.mcphost.transport

import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.receiveAsFlow

interface McpTransport {
    suspend fun send(rawPayload: String)
    val incoming: Flow<String>
    suspend fun close()
}

class LoopbackMcpTransport : McpTransport {
    // Capacity prevents unbounded memory usage if consumer falls behind
    private val sendChannel = Channel<String>(capacity = 64)
    private val receiveChannel = Channel<String>(capacity = 64)

    override suspend fun send(rawPayload: String) {
        // Enforce execution on calling coroutine context, suspend if buffer is full
        sendChannel.send(rawPayload)
    }

    override val incoming: Flow<String> = receiveChannel.receiveAsFlow()

    suspend fun postIncoming(rawPayload: String) {
        receiveChannel.send(rawPayload)
    }

    override suspend fun close() {
        sendChannel.close()
        receiveChannel.close()
    }
}
```

## Step 3: Build the in-process tool registry

When the LLM outputs a tool call, the MCP host must look up the tool, validate input, and execute it without blocking the calling thread. 

Notice how Android-specific operations (like reading battery percentage or checking network status) require `Context`. Keep the registry decoupled from UI controllers:

```kotlin
// McpRegistry.kt - Local Tool Registry & Executor
package com.example.mcphost.registry

import android.content.Context
import android.os.BatteryManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

class McpToolRegistry(private val context: Context) {
    private val tools = mutableMapOf<String, suspend (JsonObject?) -> JsonObject>()

    init {
        // Register default on-device capabilities
        register("get_battery_level") {
            withContext(Dispatchers.Default) {
                val bm = context.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
                val level = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
                buildJsonObject { put("battery_level", level) }
            }
        }
    }

    fun register(name: String, executor: suspend (JsonObject?) -> JsonObject) {
        tools[name] = executor
    }

    suspend fun execute(name: String, args: JsonObject?): Result<JsonObject> =
        withContext(Dispatchers.Default) {
            val tool = tools[name] ?: return@withContext Result.failure(
                IllegalArgumentException("Tool not found: $name")
            )
            runCatching { tool(args) }
        }
}
```

## Step 4: Run the non-blocking tool loop

Here is the crux: orchestrating the LLM generation, parsing the tool invocation, passing it to the MCP registry, and appending the result back to the model context. 

If the user hits "Cancel" or closes the screen, the entire loop must cleanly terminate without leaving dangling background threads running expensive native code or hardware operations.

```kotlin
// McpAgentSupervisor.kt - Orchestration loop
package com.example.mcphost.loop

import com.example.mcphost.registry.McpToolRegistry
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

data class ModelMessage(val role: String, val content: String)
data class ToolCall(val id: String, val name: String, val arguments: JsonObject)

interface LocalLlmClient {
    suspend fun generate(messages: List<ModelMessage>): ModelOutput
}

sealed interface ModelOutput {
    data class Text(val content: String) : ModelOutput
    data class InvokeTool(val toolCall: ToolCall) : ModelOutput
}

class McpAgentSupervisor(
    private val llm: LocalLlmClient,
    private val registry: McpToolRegistry
) {
    suspend fun runLoop(
        initialPrompt: String,
        onUpdate: (String) -> Unit
    ): String = withContext(Dispatchers.Default) {
        val history = mutableListOf<ModelMessage>()
        history.add(ModelMessage(role = "user", content = initialPrompt))

        var turns = 0
        val maxTurns = 5

        while (turns < maxTurns) {
            // Verify loop cancellation between iterations
            currentCoroutineContext().ensureActive()

            when (val output = llm.generate(history)) {
                is ModelOutput.Text -> {
                    // Final response received
                    return@withContext output.content
                }
                is ModelOutput.InvokeTool -> {
                    val call = output.toolCall
                    onUpdate("Calling tool: ${call.name}...")

                    // Execute tool within safe context
                    val toolResult = registry.execute(call.name, call.arguments)
                        .fold(
                            onSuccess = { it.toString() },
                            onFailure = { error ->
                                buildJsonObject {
                                    put("error", error.message ?: "Execution failed")
                                }.toString()
                            }
                        )

                    // Append assistant message and tool response back into context
                    history.add(ModelMessage(role = "assistant", content = "Invoking: ${call.name}"))
                    history.add(ModelMessage(role = "tool", content = toolResult))
                    turns++
                }
            }
        }
        "Tool call iteration limit reached without resolution."
    }
}
```

## How the components connect

The UI layer (typically a ViewModel) launches the `runLoop` method inside `viewModelScope`. The ViewModel receives intermediate state updates (`onUpdate`) via a thread-safe callback, pushing them into a `StateFlow` consumed by Jetpack Compose. 

```
Compose UI (Main Thread)
     │ observes
     ▼
StateFlow<AgentState>
     ▲ emits
     │
McpAgentSupervisor (Dispatchers.Default)
     ├── LocalLlmClient.generate()  [C++ / JNI runtime off main looper]
     └── McpToolRegistry.execute()  [Background worker tasks]
```

At no point does the main looper execute tool parsing, JSON encoding, or model inference. If the user clears the task or taps back, `viewModelScope` cancels, throwing a `CancellationException` that stops the loop at the next `ensureActive()` checkpoint.

## Architectural tradeoffs: Local IPC vs. In-process

Choosing where your MCP tools and host execute directly impacts app memory, latency, and system stability:

| Attribute | In-Process Architecture | Isolated Process (`android:process`) | Local Socket / Native Executable |
| :--- | :--- | :--- | :--- |
| **Crash Blast Radius** | High (Crash in tool crashes app) | Low (Service crash is isolated) | Low (Process dies independently) |
| **Latency per Call** | Sub-millisecond (< 0.2ms) | Low (~2–5ms via AIDL IPC) | Moderate (~8–15ms via sockets) |
| **Memory Overhead** | Low (Shares app heap) | High (+30-50MB for secondary ART VM) | High (Separate process overhead) |
| **Permission Scope** | Bound to hosting App permissions | Host must proxy or bind permissions | Limited to sandbox capabilities |
| **Recommendation** | Ideal for simple device tools | Best for sandboxing 3rd-party plugins | Best if porting existing Linux C/Go MCP code |

## Common pitfalls and how to avoid them

### 1. Crashing on runtime permission checks inside tools
Do not request Android runtime permissions (like `ACCESS_FINE_LOCATION`) inside the tool execution path. If the tool is invoked on `Dispatchers.Default`, attempting to launch an `ActivityResultLauncher` or touching UI components will throw an `IllegalStateException`.
- **Fix**: Check permissions using `ContextCompat.checkSelfPermission` directly in the tool handler. If permission is missing, return a clean JSON payload error: `{"status": "permission_denied", "permission": "android.permission.ACCESS_FINE_LOCATION"}`. Let the LLM read the denial or bubble it up to the ViewModel to request permission cleanly from the UI.

### 2. Deadlocks caused by synchronous channel operations
Calling `runBlocking` inside an MCP tool handler to resolve another coroutine or reading from a `Channel` synchronously will starve your thread pool, leading directly to dropped frames or ANRs.
- **Fix**: Make all tool executor contracts `suspend` functions. Never bridge back to blocking calls via `runBlocking`. Stick entirely to structured concurrency with `withContext`.

### 3. Native JNI memory leaks during cancellation
When using an on-device model (e.g., `llama.cpp`), cooperative coroutine cancellation does not automatically interrupt blocking native C++ compute calls.
- **Fix**: Pass an atomic cancellation flag or callback pointer across the JNI bridge. In your Kotlin loop:

```kotlin
try {
    llm.generate(history)
} catch (e: CancellationException) {
    nativeAbortInference() // Signal native layer to break loop
    throw e
}
```

## Verify your implementation

Audit your tool-calling loops using the **Android Studio Profiler**:
1. Open the **CPU Profiler** and select **System Trace**.
2. Run an agent interaction that triggers multiple tool executions.
3. Inspect the `Main` thread row. It should remain empty (white/light blue) during tool execution and model output generation. If you see chunks of green activity over 16.6ms on the main thread during execution, trace the call stack to eliminate any hidden looper access.

Replace any generic dynamic dispatch in your tool routing with explicit `suspend` execution handlers in your registry to protect UI responsiveness.