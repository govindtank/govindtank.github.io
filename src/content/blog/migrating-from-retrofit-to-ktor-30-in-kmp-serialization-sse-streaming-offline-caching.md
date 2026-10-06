---
archetype: "explainer"
title: "Migrating from Retrofit to Ktor 3.0 in KMP: Serialization, SSE Streaming & Offline Caching"
slug: "migrating-from-retrofit-to-ktor-30-in-kmp-serialization-sse-streaming-offline-caching"
date: "October 06, 2026"
excerpt: >
  Break free from Retrofit’s JVM lock-in. Learn how to migrate to Ktor 3.0 with custom auth plugins, multiplatform offline caching, and live SSE streaming for LLMs.
coverImage: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&q=80&w=1200"
category: "Mobile-Architecture"
readTime: 8
tags:
  - "Mobile-Architecture"
---
# Migrating from Retrofit to Ktor 3.0 in KMP: Serialization, SSE Streaming & Offline Caching

> **TL;DR**: Migrating from Retrofit/OkHttp to Ktor 3.0 requires abandoning reflection-based adapters in favor of explicit pipeline interceptors and non-blocking I/O byte channels. 
> - **The Problem**: Retrofit's coupling to the JVM runtime, blocking interceptor chains, and OkHttp's memory buffers make it unusable for Kotlin Multiplatform, causing high heap consumption when streaming large LLM responses.
> - **The Solution**: Build a unified multiplatform networking layer using Ktor 3.0's coroutine-native engine pipelines, `ByteReadChannel` for SSE/chunked streaming, and engine-agnostic disk-backed caching.
> - **The Result**: Zero JVM-specific reflection dependencies, shared iOS/Android networking codebases with sub-megabyte memory allocations during LLM token streaming, and deterministic offline cache invalidation across targets.

Most engineers view Ktor as just "Retrofit for multiplatform." That assumption causes subtle production bugs. 

If you configure Ktor the way you configure Retrofit, you will leak memory during long-lived streams, fail token refreshes under concurrent load, and discover that your HTTP cache writes zero bytes to disk on iOS. 

Retrofit is a declarative proxy generator that wraps OkHttp's synchronous dispatch engine. Ktor 3.0 is a structured, asynchronous interceptor pipeline that processes raw byte channels inside Kotlin coroutines. Understanding how this pipeline executes across both Dalvik/ART and the Kotlin/Native runtime is essential for a clean migration.

---

## The mental model: Proxies vs. execution pipelines

In Retrofit, an interface defines an HTTP transaction:

```
Interface Method -> Dynamic Proxy -> CallAdapter -> OkHttp Interceptor Chain -> Socket (Blocking I/O)
```

Retrofit relies on `java.lang.reflect.Proxy`. When you invoke a method, it reflects over runtime annotations (`@GET`, `@Body`), serializes data through a converter factory (like Moshi or Gson), and queues a synchronous `Call<T>` on OkHttp's dispatcher thread pool.

Ktor eliminates dynamic proxies entirely. An HTTP request in Ktor is a context-driven data structure pushed through a two-way asynchronous pipeline:

```
HttpClient -> [Setup] -> [Transform] -> [Send] -> Engine Pipeline -> Target Network Stack
                 ^                                    |
                 |-------- [Receive] <----------------|
```

Every request enters a pipeline divided into phases (`Setup`, `Transform`, `Send`). Every response returns through an inverted pipeline (`Receive`, `Transform`). 

Plugins (formerly features) attach lambda interceptors to specific phases. There are no reflection lookups at runtime; everything resolves through compile-time inline serialization and coroutine context propagation.

---

## Core mechanics: Migrating from OkHttp/Retrofit to Ktor 3.0

Ktor 3.0 migrated from the `io.ktor` namespace artifacts over to the unified KotlinX I/O architecture. This transition changes how bytes are buffered and parsed on non-JVM targets.

### 1. Unified client configuration with custom token refresh

In OkHttp, automatic authentication is handled via `okhttp3.Authenticator`, which allows blocking calls to refresh an expired token. In Ktor, all auth transformations happen asynchronously inside the `Auth` plugin using the `BearerAuthProvider`.

Here is the production setup for handling concurrent 401 recovery without token thrashing:

```kotlin
// Multiplatform Network Client Initialization
import io.ktor.client.HttpClient
import io.ktor.client.engine.HttpClientEngine
import io.ktor.client.plugins.auth.Auth
import io.ktor.client.plugins.auth.providers.BearerTokens
import io.ktor.client.plugins.auth.providers.bearer
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.plugins.logging.LogLevel
import io.ktor.client.plugins.logging.Logging
import io.ktor.http.HttpHeaders
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json

class NetworkClientFactory(
    private val tokenStorage: TokenStorage
) {
    fun createClient(engine: HttpClientEngine): HttpClient {
        return HttpClient(engine) {
            // Replaces MoshiConverterFactory / GsonConverterFactory
            install(ContentNegotiation) {
                json(
                    Json {
                        ignoreUnknownKeys = true
                        isLenient = false
                        encodeDefaults = true
                    }
                )
            }

            // Replaces okhttp3.Authenticator and auth interceptors
            install(Auth) {
                bearer {
                    loadTokens {
                        val access = tokenStorage.getAccessToken() ?: return@loadTokens null
                        val refresh = tokenStorage.getRefreshToken() ?: return@loadTokens null
                        BearerTokens(accessToken = access, refreshToken = refresh)
                    }

                    refreshTokens {
                        // Ktor guarantees only one coroutine enters this block;
                        // concurrent 401s suspend and await this single execution.
                        val oldRefresh = oldTokens?.refreshToken ?: return@refreshTokens null
                        
                        try {
                            val response: TokenResponse = client.post("/v1/auth/refresh") {
                                markAsRefreshTokenRequest()
                                headers.append(HttpHeaders.Authorization, "Bearer $oldRefresh")
                            }.body()

                            tokenStorage.persistTokens(response.accessToken, response.refreshToken)
                            BearerTokens(response.accessToken, response.refreshToken)
                        } catch (e: Exception) {
                            tokenStorage.clearTokens()
                            null
                        }
                    }

                    sendWithoutRequest { request ->
                        // Only attach headers to non-auth domain endpoints
                        !request.url.encodedPath.contains("/auth/")
                    }
                }
            }
        }
    }
}
```

### 2. Streaming LLM tokens via Server-Sent Events (SSE)

Retrofit and Moshi buffer incoming chunks into memory or require raw `ResponseBody` conversions that bridge back to synchronous Okio sources. This creates memory overhead on Android and breaks garbage collection heuristics on iOS.

Ktor 3.0 provides native SSE support over non-blocking coroutines without loading the complete payload into heap memory:

```kotlin
import io.ktor.client.HttpClient
import io.ktor.client.plugins.sse.sse
import io.ktor.sse.ServerSentEvent
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.serialization.json.Json

@kotlinx.serialization.Serializable
data class StreamChunk(val delta: String, val finishReason: String?)

class LlmRepository(
    private val httpClient: HttpClient,
    private val json: Json
) {
    fun streamInference(prompt: String): Flow<String> = flow {
        httpClient.sse(
            urlString = "/v1/chat/completions",
            request = {
                url { parameters.append("stream", "true") }
            }
        ) {
            // Incoming events are parsed directly off the ByteReadChannel
            incoming.collect { event: ServerSentEvent ->
                val data = event.data ?: return@collect
                if (data == "[DONE]") return@collect

                val chunk = json.decodeFromString<StreamChunk>(data)
                emit(chunk.delta)
            }
        }
    }
}
```

### 3. Multiplatform disk caching

OkHttp ships with `okhttp3.Cache`, which relies directly on the Java filesystem API (`java.io.File`). For KMP, we configure the `HttpCache` plugin using target-specific storage directories backed by `okio.Path` or `kotlinx-io`:

```kotlin
import io.ktor.client.HttpClientConfig
import io.ktor.client.plugins.cache.HttpCache
import io.ktor.client.plugins.cache.storage.FileStorage

// Common Multiplatform Configuration
expect fun getCacheDirectoryPath(): okio.Path

fun HttpClientConfig<*>.configurePlatformCache() {
    install(HttpCache) {
        // Multiplatform file-backed caching
        val cacheDir = getCacheDirectoryPath()
        val fileStorage = FileStorage(cacheDir.toFile())
        publicStorage(fileStorage)
    }
}
```

---

## Architectural shift: Retrofit vs. Ktor 3.0

| Feature | Retrofit 2 + OkHttp | Ktor 3.0 (KMP) |
| :--- | :--- | :--- |
| **Code Generation** | Runtime Dynamic Proxy (`Proxy.newProxyInstance`) | Zero reflection; pure static compile-time contracts |
| **Threading Model** | Thread pools per dispatcher (`Dispatcher.executorService`) | Structured concurrency (`CoroutineDispatcher`) |
| **I/O Engine** | Blocking Java sockets (`Okio.Source` / `Okio.Sink`) | Non-blocking NIO (`ByteReadChannel` / `ByteWriteChannel`) |
| **Multiplatform Targets**| JVM / Android only | Android, iOS (Darwin), JVM, macOS, Linux, WebAssembly |
| **Auth Concurrency** | Mutex/locks required inside `Authenticator` | Native mutex synchronization inside `BearerAuthProvider` |
| **Binary Size Overhead** | High reflection metadata | Minimal (pure Kotlin symbol trees) |

---

## What happens at runtime

Let's walk through an authenticated request sending an SSE stream request under the hood.

```
+-------------------------------------------------------------+
| 1. App layer calls `httpClient.sse("/v1/chat/completions")` |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
| 2. Auth Plugin: Intercepts Phase: `Transform`               |
|    - Appends Cached Bearer Token                            |
|    - Validates Token TTL                                    |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
| 3. Engine Dispatch (Darwin on iOS / OkHttp or CIO on Android)|
|    - Passes non-blocking Coroutine Context to Socket        |
|    - Server returns HTTP 200 with text/event-stream         |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
| 4. SSE Parser Phase:                                        |
|    - Reads incoming frames off `ByteReadChannel`            |
|    - Parses frame delimiter `\n\n` without buffering stream |
|    - Emits `ServerSentEvent` to flow collector              |
+-------------------------------------------------------------+
```

1. **Pipeline initialization**: Ktor instantiates an `HttpRequestPipeline` execution context. 
2. **Phase resolution**: The `Auth` plugin checks its token state. If expired, it suspends execution, acquires an internal `kotlinx.coroutines.sync.Mutex`, executes the refresh block, and retries the original request with the fresh token.
3. **Engine execution**: On iOS, the `Darwin` engine forwards the raw bytes using `NSURLSessionDataTask` delegate callbacks directly into Ktor's `ByteReadChannel`. On Android, `OkHttpEngine` or `CIO` executes through Kotlin non-blocking sockets.
4. **Channel consumption**: The `ServerSentEvent` parser monitors the channel delimiter (`\r\n\r\n` or `\n\n`). As bytes arrive off the wire, they are translated into instances of `ServerSentEvent` and passed directly into the pipeline without intermediate string allocations.

---

## Common pitfalls and how to avoid them

### 1. Using CIO engine across the board on iOS

The Coroutine I/O (`CIO`) engine seems attractive because it is written entirely in Kotlin without platform-specific dependencies. 

**The failure mode**: On iOS, `CIO` bypasses Apple's system proxy settings, lacks background upload/download task handling, and fails enterprise VPN routing. 

**The fix**: Always use `io.ktor:ktor-client-darwin` on iOS and `io.ktor:ktor-client-okhttp` or `CIO` on Android/JVM.

```kotlin
// iosMain
actual fun getPlatformEngine(): HttpClientEngine = Darwin.create {
    configureRequest {
        setAllowsCellularAccess(true)
    }
}

// androidMain
actual fun getPlatformEngine(): HttpClientEngine = OkHttp.create {
    config {
        retryOnConnectionFailure(true)
    }
}
```

### 2. Double serialization with kotlinx.serialization

In Retrofit, Moshi/Gson will catch any missing fields if you parse into a nullable field. 

**The failure mode**: In Ktor 3.0, if `Json` configuration has `encodeDefaults = false` and `explicitNulls = true`, missing keys in the response will throw an uncaught `SerializationException` at runtime instead of mapping as `null`, crashing the client pipeline before hitting your repository layer.

**The fix**: Explicitly define fallback behavior in your common Json configuration:

```kotlin
val jsonConfig = Json {
    ignoreUnknownKeys = true
    coerceInputValues = true // Converts unexpected nulls to default property values
    explicitNulls = false
}
```

### 3. Leaking Darwin engine sessions on iOS

Every instance of `HttpClient(Darwin)` that is not explicitly closed retains the underlying `NSURLSession`. If you instantiate your client dynamically (e.g., inside view models or transient factories), you will leak native memory, eventually causing an iOS system watchdog crash (OOM termination).

**The fix**: Keep the `HttpClient` as a long-lived singleton across your application's lifecycle:

```kotlin
class AppContainer(platformEngine: HttpClientEngine) {
    // Single shared instance across the entire runtime
    val client: HttpClient by lazy {
        NetworkClientFactory(tokenStorage).createClient(platformEngine)
    }
}
```

---

## Action item for your codebase

Audit your existing network module today:
1. Grep your dependencies for `com.squareup.retrofit2` and `com.squareup.okhttp3`.
2. Extract your API service interfaces into pure Kotlin interfaces that return your domain data classes instead of Retrofit `Call<T>` types.
3. Swap dynamic proxies for concrete implementation classes that consume an injected `HttpClient` configured with Ktor 3.0's `ContentNegotiation` and `Auth` plugins.