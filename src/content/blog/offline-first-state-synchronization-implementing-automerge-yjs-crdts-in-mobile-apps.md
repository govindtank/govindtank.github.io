---
archetype: "explainer"
title: "Offline-First State Synchronization: Implementing Automerge & Yjs CRDTs in Mobile Apps"
slug: "offline-first-state-synchronization-implementing-automerge-yjs-crdts-in-mobile-apps"
date: "September 18, 2026"
excerpt: >
  A technical guide to embedding Automerge and Yjs in mobile apps, using SQLite for local persistence and WebSockets for conflict-free state sync.
coverImage: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1200"
category: "Architecture"
readTime: 9
tags:
  - "Architecture"
---
# Offline-First State Synchronization: Implementing Automerge & Yjs CRDTs in Mobile Apps

Most mobile engineers assume that "offline-first" is an API caching problem. The standard playbook is predictable: stash HTTP responses in SQLite or Room, queue outbound mutation payloads in an offline queue, and replay them when the connectivity monitor emits a network available callback.

This pattern falls apart the moment two users edit the same nested record while disconnected. Last-Write-Wins (LWW) strategies using client timestamps silently overwrite valid user input due to clock drift or network race conditions. Three-way merge algorithms fail because mobile clients do not retain the common ancestor state without massive storage overhead.

If you want collaborative, partition-tolerant mobile apps that do not destroy user data, you have to stop synchronizing snapshots of state and start synchronizing deterministic operations. This requires Conflict-free Replicated Data Types (CRDTs).

Here is how embedded CRDT engines like Automerge (Rust core) and Yjs actually work under the hood inside an iOS or Android process, along with the performance trade-offs you must manage to keep your app from draining the device battery or blowing through memory limits.

---

## The mental model: Git without merge conflicts

Think of state-based and operation-based CRDTs as a directed acyclic graph (DAG) of atomic edits, similar to Git commit trees, but designed with mathematical properties—specifically semilattice structures that guarantee commutativity, associativity, and idempotence:

*   **Commutativity:** Operations can arrive in any order: `Apply(A, B) == Apply(B, A)`.
*   **Associativity:** Operations can be grouped in any order: `Apply(A, (B, C)) == Apply((A, B), C)`.
*   **Idempotence:** Duplicate network deliveries do not change the outcome: `Apply(A, A) == Apply(A)`.

Instead of viewing a document as a static JSON tree, a CRDT views it as an append-only sequence of immutable identity-tagged operations (atoms or items). When User A and User B insert a character at index 0 at the exact same millisecond, the engine does not pick a winner based on wall-clock timestamps. Instead, it assigns each operation an immutable Lamport timestamp combined with an assigned client identifier (e.g., `Lamport: 42, ClientId: "user_a"`).

The engines evaluate these deterministic logical clocks to weave the edits into an identical linked list on every device, without a central coordinator making arbitrary merge decisions.

---

## Core mechanics under the hood

Running CRDTs on mobile devices requires embedding engines compiled down to native machine code. Automerge provides a native Rust core (`automerge-rs`) that binds cleanly to Swift and Kotlin via C-FFI / UniFFI. Yjs is natively written in JavaScript, requiring either a lightweight embedded JavaScript runtime (like JavaScriptCore or QuickJS) or its high-performance native Rust port, `yrs` (Yrs / Y-CRDT).

Let's look at the storage and memory architecture required to make this production-ready on a client device.

```
+-------------------------------------------------------------+
|                     Mobile UI Layer                         |
|           (Jetpack Compose / SwiftUI / StateFlow)           |
+-------------------------------------------------------------+
                              |
                     Dispatches Mutations /
                     Subscribes to Materialized State
                              v
+-------------------------------------------------------------+
|                   Local CRDT Engine                         |
|     (Automerge-rs / Yrs via UniFFI or C-FFI Bindings)       |
|                                                             |
|  +-------------------------------------------------------+  |
|  | In-Memory Struct: Document Graph & Block Vector Clock  |  |
|  +-------------------------------------------------------+  |
+-------------------------------------------------------------+
           |                                     |
    Persists Binary                       Exchanges Encoded
     Incremental Diffs                     Update Chunks
           |                                     |
           v                                     v
+-----------------------+             +-----------------------+
|  Local SQLite Store   |             | WebSocket Client /    |
| (WAL mode, Blob rows) |             | Peer-to-Peer Network  |
+-----------------------+             +-----------------------+
```

### 1. The in-memory data structures

Automerge and Yrs do not store plain arrays or strings. 

*   **Yrs / Yjs** structures text and arrays as doubly linked lists of `Item` blocks. Consecutive edits by the same author are compressed into single run-length blocks to minimize pointer overhead.
*   **Automerge** represents its document tree as an R-Tree index over an append-only columnar log of operations (OpSet).

When you mutate the document locally, the engine generates an encoded binary update block containing the operation metadata, vector clock deltas, and the compressed payload.

### 2. Native bindings and state updates

On Android and iOS, you should keep the CRDT instance off the main UI thread. Mutations and sync decodings must execute inside dedicated background workers (such as Kotlin Coroutines with an unconfined/single-thread dispatcher or a Swift Actor).

Here is a practical Swift implementation showing how a native document wrapper manages local mutations and produces portable sync increments using Rust FFI bindings:

```swift
import Foundation
import Automerge

actor DocumentStore {
    private var doc: Document
    private let dbQueue: DatabaseQueue // SQLite wrapper (e.g., GRDB)
    private let docId: String

    init(docId: String, initialData: Data? = nil, dbQueue: DatabaseQueue) throws {
        self.docId = docId
        self.dbQueue = dbQueue
        if let initialData = initialData {
            self.doc = try Document(initialData)
        } else {
            self.doc = Document()
        }
    }

    func updateText(path: [String], text: String) throws -> Data {
        let textObj = try doc.putObject(obj: .root, key: path[0], ty: .Text)
        try doc.spliceText(obj: textObj, start: 0, delete: doc.length(obj: textObj), value: text)
        
        // Generate delta chunk containing only the new operations
        let incrementalChange = doc.saveIncremental()
        
        // Persist delta to disk inside SQLite
        try persistChunk(docId: docId, chunk: incrementalChange)
        
        return incrementalChange
    }

    func integrateRemoteChunk(_ chunk: Data) throws {
        try doc.loadIncremental(data: chunk)
        try persistChunk(docId: docId, chunk: chunk)
    }

    private func persistChunk(docId: String, chunk: Data) throws {
        try dbQueue.write { db in
            try db.execute(
                sql: "INSERT INTO crdt_mutations (doc_id, chunk, created_at) VALUES (?, ?, ?)",
                arguments: [docId, chunk, Date().timeIntervalSince1970]
            )
        }
    }
}
```

### 3. Local persistence with SQLite

Never save the entire materialized document back to disk on every keystroke. Storing a 500 KB document binary repeatedly will saturate the mobile flash storage bus and cause I/O bottlenecks.

Instead, structure SQLite as an append-only log of binary blobs:

```sql
CREATE TABLE crdt_snapshots (
    doc_id TEXT PRIMARY KEY,
    snapshot BLOB NOT NULL,
    compaction_clock INTEGER NOT NULL,
    updated_at REAL NOT NULL
);

CREATE TABLE crdt_mutations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doc_id TEXT NOT NULL,
    chunk BLOB NOT NULL,
    created_at REAL NOT NULL
);

CREATE INDEX idx_mutations_doc ON crdt_mutations(doc_id);
```

On app launch:
1. Load the latest entry from `crdt_snapshots`.
2. Replay all pending incremental `chunk` records from `crdt_mutations` using `loadIncremental()`.
3. Compact state asynchronously if the log exceeds an operation threshold (e.g., every 500 operations).

---

## What happens at runtime: an end-to-end sync trace

Let us trace what occurs during a transient connection drop when two mobile devices edit a shared canvas concurrently.

```
Client A (Offline)                      Server / Relay                  Client B (Online)
       |                                      |                                 |
       |-- Local Edit: Insert "X"             |                                 |
       |   (Op: Lamport 1, Client A)          |                                 |
       |   Write chunk to SQLite              |                                 |
       |                                      |                                 |
       |                                      |<-- Local Edit: Insert "Y" ------|
       |                                      |    (Op: Lamport 1, Client B)    |
       |                                      |    Write chunk to SQLite        |
       |                                      |                                 |
       |=== NETWORK RECONNECTED =============|                                 |
       |                                      |                                 |
       |-- 1. Send Vector Clock [A:1] ------->|                                 |
       |<-- 2. Send Server Clock [B:1] -------|                                 |
       |                                      |                                 |
       |-- 3. Send Missing Chunk (A:1) ------>|                                 |
       |                                      |-- 4. Forward Chunk (A:1) ------>|
       |<-- 5. Send Missing Chunk (B:1) ------|                                 |
       |                                      |                                 |
       |-- 6. Apply B:1 locally               |                                 |-- Apply A:1 locally
       |   State resolves: "YX"               |                                 |   State resolves: "YX"
```

1. **Disconnected execution:** Device A inserts `"X"` at index 0. Device A's vector clock increases to `{A: 1}`. SQLite commits the binary patch.
2. **Concurrent remote execution:** Device B inserts `"Y"` at index 0. Device B's vector clock increases to `{B: 1}`. Device B broadcasts this update to the relay server.
3. **State reconciliation handshake:** Device A re-establishes its WebSocket connection. Rather than transmitting its entire document, it emits a state vector: `StateVector: [A: 1]`.
4. **Delta negotiation:** The server compares Device A's state vector with its own clock state (`[A: 0, B: 1]`). The server determines that Device A lacks `{B: 1}`, while the server lacks `{A: 1}`.
5. **Bidirectional exchange:** The server requests update payload `A:1` from Device A and transmits `B:1` to Device A.
6. **Deterministic convergence:** Device A receives `B:1`. Device A's CRDT engine notes that both operations share identical Lamport sequence positions (`Lamport 1`). The engine falls back to comparing `ClientId`: `"client_b"` takes precedence over `"client_a"`. Device A re-orders internal memory pointers to put `"Y"` before `"X"`. Both devices converge to `"YX"` without central server intervention.

---

## Edge cases and gotchas: the real trade-offs

CRDTs are not a magic drop-in replacement for traditional backends. When migrating mobile applications to full peer-to-peer or offline-first CRDTs, you will encounter distinct mechanical failure modes.

### 1. Document bloat and tombstone accumulation
When a user deletes a block of text, an item in an array, or an image key, the CRDT engine cannot simply wipe the memory location. It must preserve a placeholder—a **tombstone**—along with the original Lamport timestamp to correctly nullify any delayed operations that may arrive from an offline peer months later.

If your document frequently mutates long-running arrays or text fields, the document metadata can expand until it is 10x larger than the visible state.
*   *Mitigation:* Implement periodic epoch compaction. When all clients in a known group confirm they have synchronized past a given state vector, you can truncate history, snapshot the materialized state into a clean document, and reset the vector clocks.

### 2. Mobile memory exhaustion on load
Deserializing a 50 MB raw Automerge or Yrs historical binary into dynamic heap objects can easily require 200–300 MB of working RAM. On an entry-level Android device running with a 192 MB heap budget, this triggers an immediate `OutOfMemoryError`.
*   *Mitigation:* Keep documents fragmented by bounded contexts. Do not build an entire workspace into a single CRDT document. Split documents at logical entity boundaries (e.g., one CRDT document per note or per sheet, rather than one per project).

### 3. Native bridge crossing bottlenecks
Every time your UI layer interacts with the native Rust core over C-FFI or JNI, you pay a serialization/deserialization tax. If you bind every single keystroke from a Jetpack Compose `TextField` directly through JNI into the native CRDT memory model, frame render times will degrade past the 16ms budget.
*   *Mitigation:* Buffer user input locally in the platform's native string format during active typing. Flush the buffered edits down to the native CRDT instance during pauses or on un-focus events, rather than bridging every keystroke synchronously.

### 4. Semantic correctness vs. structural convergence
CRDTs guarantee *structural convergence*—every device computes the exact same raw data structures. They do **not** guarantee *semantic correctness*.

For instance, if two mobile users concurrently add items to a shared bank account balance, a set-based CRDT will cleanly preserve both withdrawal records. However, it will not prevent the account from dipping below zero. Business logic invariants must still be validated above the CRDT layer.

---

Shifting to an offline-first architecture requires you to stop treating network updates as authoritative payloads and start treating them as asynchronous, commutative signals. Once you structure your mobile persistence layer around vector clocks and append-only operations, reliable offline sync stops being a fragile edge case and becomes the default behavior of your system.