---
archetype: "opinion"
title: "Building a Native Model Context Protocol (MCP) Host on Android: Tool Calling & Local RAG with sqlite-vec"
slug: "building-a-native-model-context-protocol-mcp-host-on-android-tool-calling-local-rag-with-sqlite-vec"
date: "October 13, 2026"
excerpt: >
  Every agentic AI demo I've seen on Android phones the server. Here's what it actually takes to run a full MCP host on-device—JSON-RPC routing, sqlite-vec RAG, and why sub-2ms tool calls change what's possible in mobile AI.
coverImage: "https://images.unsplash.com/photo-1483058712412-4245e9b90334?auto=format&fit=crop&q=80&w=1200"
category: "AI-Engineering"
readTime: 8
tags:
  - "AI-Engineering"
  - "Android"
  - "MCP"
  - "RAG"
---
# Building a Native Model Context Protocol (MCP) Host on Android: Tool Calling & Local RAG with sqlite-vec

Every agentic AI demo I've seen runs on a MacBook with a fast internet connection and a hidden server handling the hard parts. The tool calls go to the cloud. The RAG queries go to a managed vector DB. The model is GPT-4. It looks seamless in the video.

Put that same architecture on a phone with a spotty connection and it falls apart. 400ms round trips for every tool call. RAG queries that fail entirely when offline. A user watching a loading spinner while the "AI assistant" waits for a network hop to complete something that should be instant.

I got tired of the gap between the demo and the reality. So I built a full MCP host that runs entirely on Android — JSON-RPC router, tool execution, and vector search — no server required. Here's what that actually takes.

## Why MCP Instead of Rolling Your Own Tool Protocol

MCP (Model Context Protocol) is an open standard from Anthropic that defines how AI models discover and call tools. The pitch: instead of every app implementing its own custom function-calling format, you implement MCP once and any MCP-compatible model can call your tools.

On desktop, MCP servers run as local processes communicating over stdio. On Android, you can't spawn arbitrary processes. But you can run a Binder service — which is Android's IPC mechanism — and expose your tool registry through it. Same protocol, different transport.

The benefit is real: when we switched from a custom tool format to MCP, our Kotlin and Python tool definitions became interchangeable. We could test tool behavior with a desktop MCP client before wiring it to the on-device model.

## The Architecture That Actually Works

The host lives in a foreground service. It does three things:

1. Maintains a JSON-RPC 2.0 router that maps tool names to handlers
2. Executes tools synchronously in a coroutine dispatcher pool
3. Serves vector similarity search via sqlite-vec without leaving the process

```kotlin
class McpHostService : Service() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val router = JsonRpcRouter()
    private val vectorStore = SqliteVecStore(this)

    override fun onCreate() {
        super.onCreate()
        registerCoreTools()
        startForeground(NOTIF_ID, buildNotification())
    }

    override fun onBind(intent: Intent): IBinder = McpBinder(router)

    private fun registerCoreTools() {
        router.register("search_knowledge") { params ->
            val query = params["query"] as String
            val topK = (params["top_k"] as? Int) ?: 5
            vectorStore.search(query, topK)
        }

        router.register("read_file") { params ->
            val path = params["path"] as String
            File(filesDir, path).takeIf { it.exists() }?.readText()
                ?: throw McpError("File not found: $path")
        }

        router.register("write_memory") { params ->
            val key = params["key"] as String
            val value = params["value"] as String
            MemoryStore.put(key, value)
            mapOf("status" to "ok")
        }
    }
}
```

The `JsonRpcRouter` is a thin dispatcher — it deserializes the incoming JSON-RPC envelope, routes by `method`, and wraps the result or exception in the appropriate JSON-RPC response shape. About 80 lines of code.

## The Part Everyone Gets Wrong: sqlite-vec

Standard SQLite can't do vector math efficiently. But sqlite-vec is a loadable extension that adds a `vec0` virtual table type — you store embeddings in it and query nearest neighbors with a `MATCH` clause.

On Android, you load it via NDK:

```kotlin
class SqliteVecStore(context: Context) {
    private val db: SQLiteDatabase

    init {
        // Load the native extension
        System.loadLibrary("sqlite_vec")
        
        db = SQLiteDatabase.openOrCreateDatabase(
            File(context.filesDir, "vectors.db").absolutePath,
            null
        )
        
        // Enable the extension (requires SQLITE_ENABLE_LOAD_EXTENSION)
        db.rawQuery("SELECT vec_version()", null).use { it.moveToFirst() }
        
        db.execSQL("""
            CREATE VIRTUAL TABLE IF NOT EXISTS embeddings USING vec0(
                doc_id INTEGER PRIMARY KEY,
                embedding FLOAT[384]
            )
        """)
    }

    fun search(query: String, topK: Int): List<SearchResult> {
        val queryVector = EmbeddingModel.embed(query) // on-device model
        val vectorJson = queryVector.joinToString(",", "[", "]")
        
        val cursor = db.rawQuery("""
            SELECT e.doc_id, e.distance, d.content
            FROM embeddings e
            JOIN documents d ON d.id = e.doc_id
            WHERE e.embedding MATCH vec_normalize(?)
            ORDER BY e.distance
            LIMIT ?
        """, arrayOf(vectorJson, topK.toString()))

        return cursor.use { c ->
            buildList {
                while (c.moveToNext()) {
                    add(SearchResult(
                        id = c.getLong(0),
                        score = 1f - c.getFloat(1), // distance → similarity
                        content = c.getString(2)
                    ))
                }
            }
        }
    }
}
```

The query runs in under 2ms on a Pixel 7 for a corpus of 10,000 documents with 384-dimensional embeddings. That's the number that changes what's possible — when a RAG lookup is 2ms instead of 200ms, you can do it on every model turn without the user noticing.

## Embedding on Device

The embedding model generates the vectors. We use a quantized MiniLM-L6 (22MB, runs at ~30ms per query on a mid-range device) via ONNX Runtime:

```kotlin
object EmbeddingModel {
    private lateinit var session: OrtSession

    fun init(context: Context) {
        val env = OrtEnvironment.getEnvironment()
        session = env.createSession(
            context.assets.open("minilm_l6_q8.onnx").readBytes(),
            OrtSession.SessionOptions().apply {
                addNnapi() // use the NPU if available
            }
        )
    }

    fun embed(text: String): FloatArray {
        val tokens = Tokenizer.encode(text, maxLength = 128)
        val inputIds = OnnxTensor.createTensor(env, tokens.inputIds)
        val attentionMask = OnnxTensor.createTensor(env, tokens.attentionMask)
        
        return session.run(mapOf(
            "input_ids" to inputIds,
            "attention_mask" to attentionMask
        )).use { result ->
            meanPool(result["last_hidden_state"]!!.value as Array<Array<FloatArray>>)
        }
    }
}
```

30ms per embedding sounds slow but it's a one-time cost at index time. At query time, the query text is embedded once and the search is 2ms. Total: ~32ms for a full RAG lookup, fully offline.

## What Breaks and How to Handle It

**Process death.** Android will kill your foreground service if it needs RAM. When it restarts, the sqlite-vec store is intact (it's on disk), but any in-memory state in the router is gone. Design tools to be stateless or persist their state in SQLite.

**Embedding model memory.** 22MB for MiniLM sounds small until you realize it sits on top of the model already loaded for inference. On a 4GB device with Chrome and three other apps open, you're fighting for RAM. Load the embedding model lazily, on first use.

**Extension loading.** `System.loadLibrary("sqlite_vec")` throws `UnsatisfiedLinkError` if the `.so` isn't in your APK's `jniLibs`. Build the extension for all four ABIs (`arm64-v8a`, `armeabi-v7a`, `x86_64`, `x86`) or you'll have mystery crashes on specific device families.

## The Number That Matters

Cloud MCP tool call round-trip: 200–600ms per call.
On-device MCP tool call: 1–4ms per call.

For a five-step agentic workflow, that's the difference between 3 seconds of waiting and something that feels instant. That's not a benchmark — that's the difference between a feature users tolerate and one they actually use.

The server-side approach is easier to build. But if you're building a mobile AI product that people open on a train, you owe them the on-device version.
