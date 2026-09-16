---
archetype: "explainer"
title: "Building Production-Grade Model Context Protocol (MCP) Clients in Kotlin Multiplatform"
slug: "building-production-grade-model-context-protocol-mcp-clients-in-kotlin-multiplatform"
date: "September 16, 2026"
excerpt: >
  Architect an on-device orchestration engine in Kotlin Multiplatform. Connect local Small Language Models with native device APIs and remote tools using the MCP specification.
coverImage: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=1200"
category: "AI-Engineering"
readTime: 9
tags:
  - "AI-Engineering"
---
# Building Production-Grade Model Context Protocol (MCP) Clients in Kotlin Multiplatform

Most mobile developers assume that running an on-device Small Language Model (SLM) means you have to write monolithic bridge code for every platform-specific sensor, database, or API you want the model to access. They stitch together ad-hoc JSON parsers, brittle switch statements, and fragile background threads to handle tool-calling. When a tool changes or moves to a remote server, the mobile client requires a full re-architecting and release cycle.

The Model Context Protocol (MCP) changes this paradigm, but running an MCP client on iOS and Android inside a Kotlin Multiplatform (KMP) codebase reveals sharp memory and concurrency realities that desktop implementations never have to consider.

Here is how an MCP client operates under the hood on resource-constrained mobile hardware, how to implement it cleanly in KMP, and where it fails if you do not respect lifecycle and platform boundaries.

## The mental model: A standardized IPC hub inside your pocket

Think of the Model Context Protocol as a universal peripheral bus for AI models, analogous to USB-C for hardware.

Instead of writing custom platform bindings for every single tool (e.g., querying SQLite, reading HealthKit, capturing GPS, or invoking a remote search API), an MCP client acts as a standardized broker:

1. The client establishes transport channels (JSON-RPC over standard I/O for embedded local sub-processes or Server-Sent Events/HTTP for remote microservices).
2. It queries tool schemas during a capability discovery phase and feeds these JSON schemas to the model as function definitions.
3. When the local SLM emits a structured tool call, the client routes that call to the appropriate MCP server, validates the payload, executes the routine, and feeds the output back into the model's context window.

```
+-------------------------------------------------------------------+
|                        Kotlin Multiplatform                       |
|                                                                   |
|   +-------------+       Structured JSON       +---------------+   |
|   |  Local SLM  | <-------------------------> |  MCP Client   |   |
|   |  (On-Device)|        Tool Payloads        |  (KMP Engine) |   |
|   +-------------+                             +---------------+   |
|                                                  |         |      |
+--------------------------------------------------|---------|------+
                                                   |         |
                      Native Loopback / In-Memory  |         |  Ktor Engine
                      JSON-RPC 2.0                 |         |  (SSE / HTTP)
                                                   v         v
                     +-------------------------------+     +----------------+
                     | Native Device Server (In-App) |     | Remote Servers |
                     | - Contacts & Calendar         |     | - Enterprise DB|
                     | - CoreLocation / Sensors      |     | - Live Search  |
                     +-------------------------------+     +----------------+
```

In a mobile client, we cannot afford to spin up arbitrary long-lived background daemons via Node or Python as desktop MCP clients do. We must implement both local in-memory transports and remote streaming transports completely in native, memory-efficient Kotlin.

## Core mechanics and architecture

An MCP client has three core responsibilities:
1. **Transport abstraction**: Handling bidirectional JSON-RPC 2.0 messages over streams without blocking UI threads.
2. **Protocol lifecycle management**: Executing the `initialize` handshake, tracking negotiated capabilities, and dynamically rebuilding prompt contexts.
3. **Execution routing**: Resolving namespaced tool calls (e.g., `device_contacts__query` vs `remote_analytics__fetch`) and marshaling payloads safely across Kotlin/Native and Kotlin/JVM boundaries.

### The transport layer

Everything in MCP is JSON-RPC 2.0. Mobile transports need to handle two types of targets: in-memory native handlers (to query device capabilities without process boundaries) and remote SSE connections (via Ktor).

Here is a lean, non-blocking transport interface built with Kotlin Coroutines:

```kotlin
package com.mobile.mcp.client.transport

import kotlinx.coroutines.flow.Flow
import kotlinx.serialization.json.JsonObject

sealed interface TransportMessage {
    data class Request(val id: Long, val method: String, val params: JsonObject? = null) : TransportMessage
    data class Response(val id: Long, val result: JsonObject? = null, val error: JsonObject? = null) : TransportMessage
    data class Notification(val method: String, val params: JsonObject? = null) : TransportMessage
}

interface McpTransport {
    val incoming: Flow<TransportMessage>
    suspend fun send(message: TransportMessage)
    suspend fun open()
    suspend fun close()
}
```

### The protocol engine

The client coordinates discovery and execution. It retains a map of pending requests using Kotlin `CompletableDeferred` instances to match async JSON-RPC responses to outgoing requests.

```kotlin
package com.mobile.mcp.client

import com.mobile.mcp.client.transport.McpTransport
import com.mobile.mcp.client.transport.TransportMessage
import kotlinx.atomicfu.atomic
import kotlinx.coroutines.*
import kotlinx.serialization.json.*

class ProductionMcpClient(
    private val transport: McpTransport,
    private val coroutineScope: CoroutineScope
) {
    private val requestId = atomic(0L)
    private val pendingRequests = ConcurrentHashMap<Long, CompletableDeferred<JsonObject>>()
    private val json = Json { ignoreUnknownKeys = true; encodeDefaults = true }

    fun start() {
        coroutineScope.launch {
            transport.incoming.collect { message ->
                when (message) {
                    is TransportMessage.Response -> {
                        pendingRequests.remove(message.id)?.let { deferred ->
                            if (message.error != null) {
                                deferred.completeExceptionally(
                                    McpRpcException(message.error.toString())
                                )
                            } else {
                                deferred.complete(message.result ?: JsonObject(emptyMap()))
                            }
                        }
                    }
                    is TransportMessage.Notification -> {
                        handleNotification(message)
                    }
                    is TransportMessage.Request -> {
                        // Handle server-to-client sampling or root requests
                    }
                }
            }
        }
    }

    suspend fun initialize(): JsonObject {
        val params = buildJsonObject {
            put("protocolVersion", "2024-11-05")
            putJsonObject("capabilities") {
                putJsonObject("roots") { put("listChanged", true) }
            }
            putJsonObject("clientInfo") {
                put("name", "KmpNativeClient")
                put("version", "1.0.0")
            }
        }
        return sendRequest("initialize", params)
    }

    suspend fun callTool(name: String, arguments: JsonObject): JsonObject {
        val params = buildJsonObject {
            put("name", name)
            put("arguments", arguments)
        }
        return sendRequest("tools/call", params)
    }

    private suspend fun sendRequest(method: String, params: JsonObject): JsonObject {
        val id = requestId.incrementAndGet()
        val deferred = CompletableDeferred<JsonObject>()
        pendingRequests[id] = deferred

        transport.send(TransportMessage.Request(id, method, params))
        
        return withTimeout(15_000) {
            deferred.await()
        }
    }

    private fun handleNotification(notification: TransportMessage.Notification) {
        if (notification.method == "notifications/tools/list_changed") {
            // Signal local registry invalidation
        }
    }
}

class McpRpcException(message: String) : Exception(message)
```

## What happens at runtime

To understand the end-to-end flow, consider a local SLM running on-device via a native runtime like llama.cpp through JNI/C-interop. The user asks: *"Check my next calendar event and send the location to our team channel."*

```
User Prompt
    │
    ▼
Local SLM Evaluates Context
    │ (Needs Tool: get_calendar_events)
    ▼
KMP MCP Client
    │
    ├── 1. Looks up `get_calendar_events` in Registry
    ├── 2. Routes to `NativeCalendarTransport` (In-Memory)
    │       └── Executes Platform Calendar API
    │       └── Returns JSON array of events
    │
    ▼
KMP MCP Client Feeds Tool Result to Local SLM Context
    │
    ▼
Local SLM Evaluates Next Step
    │ (Needs Tool: post_slack_message)
    ▼
KMP MCP Client
    │
    ├── 1. Looks up `post_slack_message` in Registry
    ├── 2. Routes to `RemoteServerTransport` (SSE over HTTP)
    │       └── Dispatches POST request via Ktor
    │       └── Returns status: 200 OK
    │
    ▼
Final Output Synthesized by Local SLM -> UI Rendered
```

1. **Context Initialization**: On app startup, the MCP client performs the `initialize` handshake with all registered transports (native in-memory modules and remote endpoints). It requests `tools/list` from each, aggregates schemas, and loads their functional signatures directly into the SLM prompt configuration.
2. **Inference Loop**: The user prompt is submitted. The on-device engine produces a structured tool call requesting `get_calendar_events` with the parameter `{"range": "today"}`.
3. **Dispatch to Native Handler**: The KMP client detects the tool call name, resolves it to the local platform-level transport, executes the system permission check, queries `EKEventStore` (on iOS) or `CalendarContract` (on Android), and formats the raw rows into clean JSON.
4. **Context Injection**: The resulting payload is returned to the client as a `TransportMessage.Response`. The client injects this response back into the SLM conversation history as a `tool` role message.
5. **Secondary Remote Hop**: The model evaluates the updated context and emits a second call: `post_slack_message` with `{"channel": "#team", "text": "Meeting at Room 4B"}`. The client routes this over the network via its remote Ktor SSE transport to an external enterprise MCP server.
6. **Completion**: The remote server responds with success. The SLM receives this confirmation and generates the final user-facing text: *"I found your 2 PM meeting in Room 4B and posted the location to the team channel."*

## Edge cases and gotchas

When running this architecture on iOS and Android, desktop-centric assumptions fall apart quickly.

### 1. The memory budget and context window limits

On mobile, memory pressure is constant. An unoptimized schema registry containing dozens of tools can easily consume 40,000 tokens just describing the available tools. A quantized 3B or 7B parameter on-device model typically operates with a context window of 2,048 to 8,192 tokens. 

If your MCP client blindly registers every tool schema into the model's system prompt on startup, you will cause immediate context window overflow, degraded generation quality, or Out-Of-Memory (OOM) process termination by the mobile OS.

**Mitigation**: Implement dynamic tool filtering. Do not dump the entire tool catalog into the prompt. Keep a vector index or a lightweight BM25 keyword index of your tools on-device. Use a two-pass approach: retrieve only the top 3-5 most relevant tool schemas for the current user turn, and dynamically register those schemas with the local model session.

### 2. Battery drain from persistent Server-Sent Events

Desktop MCP clients maintain persistent, open SSE streams indefinitely. On mobile, holding an open TCP socket over cellular radio prevents the device's baseband processor from dropping into low-power sleep modes, draining the battery in hours.

**Mitigation**: Implement demand-driven transport lifecycle management. Suspend or tear down remote SSE connections after a short inactivity timeout (e.g., 30 seconds). Re-establish the transport only when the model's inference loop triggers an external tool call or when the user enters an active prompt session.

### 3. iOS background suspension and Kotlin/Native concurrency

When the user moves your app to the background mid-tool-execution, iOS suspends app threads aggressively within seconds. If an active Ktor call or an asynchronous JSON-RPC deferred handle is left hanging, Kotlin/Native coroutine dispatchers can freeze. Upon resuming, pending requests may time out or throw unhandled socket exceptions.

**Mitigation**: Use platform-specific background tasks (`beginBackgroundTask` on iOS, `WorkManager` on Android) when dispatching tool executions that cannot be dropped. Set aggressive deterministic timeouts on all transport requests (e.g., 10-15 seconds) so that calls fail predictably rather than leaving pending promises indefinitely leaked in memory.

### 4. Schema validation failures from local SLM hallucinations

Unlike GPT-4o or Claude 3.5 Sonnet, a 3-billion-parameter on-device model will often output malformed JSON, drop required properties, or invent imaginary arguments that violate the MCP tool schema.

**Mitigation**: Place a strict serialization validator inside the client before routing the call to the transport:

```kotlin
fun validateArguments(schema: JsonObject, arguments: JsonObject): Result<Unit> {
    val requiredFields = schema["required"]?.jsonArray?.map { it.jsonPrimitive.content } ?: emptyList()
    for (field in requiredFields) {
        if (!arguments.containsKey(field)) {
            return Result.failure(
                IllegalArgumentException("Missing required parameter: $field")
            )
        }
    }
    return Result.success(Unit)
}
```

If validation fails on-device, intercept the error and return the schema violation back into the model's context loop as a tool error immediately. This allows the model to self-correct its JSON generation without triggering network or native OS crashes.

## Practical takeaway

Structuring an on-device orchestration engine around the Model Context Protocol in Kotlin Multiplatform decouples your local AI models from concrete OS APIs and cloud integrations. By treating the MCP client as a lightweight, lifecycle-aware message broker rather than a persistent background daemon, you preserve device battery, respect tight mobile memory constraints, and build a modular tool-calling architecture that runs natively across both iOS and Android.