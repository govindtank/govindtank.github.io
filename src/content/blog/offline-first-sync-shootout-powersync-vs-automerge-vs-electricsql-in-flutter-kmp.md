---
archetype: "explainer"
title: "Offline-First Sync Shootout: PowerSync vs Automerge vs ElectricSQL in Flutter & KMP"
slug: "offline-first-sync-shootout-powersync-vs-automerge-vs-electricsql-in-flutter-kmp"
date: "September 27, 2026"
excerpt: >
  Payload bloat and sync lag kill offline-first apps. Benchmark replication latency, wire size, and conflict resolution across PowerSync, Automerge, and ElectricSQL for Flutter and KMP.
coverImage: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&q=80&w=1200"
category: "Mobile-Architecture"
readTime: 12
tags:
  - "Mobile-Architecture"
---
# Offline-First Sync Shootout: PowerSync vs Automerge vs ElectricSQL in Flutter & KMP

> **TL;DR**: Active-active sync between mobile clients (Flutter/KMP) and backend Postgres systems breaks down into two distinct philosophies: CRDT-driven peer replication vs Postgres logical replication log streaming. For relational data with foreign-key constraints, streaming partitioned change logs via SQLite-compatible engines (PowerSync, ElectricSQL) prevents the memory bloat and schema-migration disasters typical of pure JSON CRDTs (Automerge).
> - **The Problem**: Mobile state management libraries disguise network failures as asynchronous delays, leading to unbounded client-side mutation queues, massive local document size growth, and unresolvable foreign-key graph fractures during reconnects.
> - **The Solution**: Match the sync engine to the data shape: run CRDTs only on isolated leaf documents (rich text, canvas states), and use transactional change-data-capture (CDC) log tails against local embedded SQLite for relational domain entities.
> - **The Result**: 4x-10x reduction in wire payload size over JSON REST sync, deterministic sub-15ms local query times across 100k local records, and zero split-brain relational integrity errors under poor network conditions.

Most engineering teams evaluate offline-first architectures by building a basic counter or todo list app, watching it sync across two browser tabs, and declaring victory. That prototype tells you almost nothing about how the engine survives an airplane flight where a field technician modifies 400 relational records across 8 database tables, followed by a reconnection over a lossy 2G cell tower.

The hard part of offline-first mobile sync isn't moving bytes when the network is online. The hard part is preserving relational invariants, maintaining bounded memory profiles on constrained mobile runtimes, and migrating schemas across thousands of distributed devices that may not phone home for three weeks.

Let's look under the hood of three fundamentally different sync primitives across Flutter and Kotlin Multiplatform (KMP): **PowerSync**, **Automerge**, and **ElectricSQL**.

---

## The mental model: State replication vs log streaming

Sync systems fall into two architectural buckets:

1. **State/Operation-based CRDTs (Automerge)**: The client stores the complete operation history or causal state graph of every document. Conflict resolution happens automatically via mathematically proven convergence algorithms (like Lamport timestamps + deterministic tie-breaking or fractional indexing). The backend is merely a dumb byte relay.
2. **Log-derived relational read replicas (PowerSync, ElectricSQL)**: The backend (Postgres) is the single source of truth. Changes flow from Postgres Write-Ahead Logs (WAL) down to an embedded SQLite database running inside the Flutter/KMP process via an active replication stream. Client mutations bypass the downstream replication stream and are pushed upstream as standard HTTP/gRPC transactional RPCs.

```
       AUTOMERGE MODEL                      POWERSYNC / ELECTRIC MODEL
 [Client A]       [Client B]           [Client A]              [Client B]
 (CRDT Graph)    (CRDT Graph)       (Local SQLite)          (Local SQLite)
      \               /                  |   ^                   |   ^
   Sync Ops       Sync Ops           Upstream|   |Downstream Upstream|   |Downstream
        \           /                  Write |   |Sync Tail    Write |   |Sync Tail
      [Dumb Relay Server]                v   |                   v   |
                                       [Custom API]       [Sync Engine / CDC]
                                             \                 /
                                           [Postgres Master + WAL]
```

If your mobile app treats data as independent documents (like a collaborative canvas or a markdown note), CRDTs shine. If your data model relies on `JOIN`s, cascading deletes, and unique foreign keys, forcing that graph into an operation-based CRDT will create an unmaintainable sync topology.

---

## Core mechanics under the hood

### 1. PowerSync: Server-partitioned SQLite replication

PowerSync does not attempt to resolve server-side conflicts automatically using mathematical heuristics. It splits the sync architecture into two distinct pipelines:

- **Downstream sync**: An intermediate service attaches to Postgres's logical decoding output (`pgoutput`). It evaluates server-side sync rules (defined in YAML/SQL) and partitions the replication stream into user-specific or bucket-specific changes. The mobile client runs a native SQLite extension that ingests these compact binary operations directly into an embedded SQLite database.
- **Upstream sync**: You write standard REST or gRPC mutation endpoints. The mobile client writes locally to a mutation queue table inside SQLite, then an upload worker flushes them sequentially to your backend.

Here is what an upstream mutation queue worker looks like in Kotlin Multiplatform:

```kotlin
// CommonMain: Custom transactional queue processor for PowerSync in KMP
class PostgresQueueUploader(
    private val httpClient: HttpClient,
    private val database: PowerSyncDatabase
) : PowerSyncBackendConnector {

    override suspend fun uploadData(database: PowerSyncDatabase) {
        // Read pending mutations in order of insertion
        val batch = database.getNextCrudTransaction() ?: return

        for (op in batch.crud) {
            val endpoint = "/api/v1/sync/${op.table}"
            val payload = buildJsonObject {
                put("id", op.id)
                put("op", op.type.name) // INSERT, UPDATE, PATCH, DELETE
                op.data?.let { put("data", it) }
            }

            try {
                val response = httpClient.post(endpoint) {
                    contentType(ContentType.Application.Json)
                    setBody(payload.toString())
                }

                if (!response.status.isSuccess()) {
                    // 4xx client errors need explicit domain handling; 5xx throws to retry later
                    if (response.status.value in 400..499) {
                        handleConflictRejection(op, response)
                    } else {
                        throw IOException("Server error during sync: ${response.status}")
                    }
                }
            } catch (e: Exception) {
                // Exponential backoff managed by PowerSync runtime
                throw e
            }
        }
        
        // Acknowledge batch completion to remove entries from the local queue
        batch.complete()
    }

    private fun handleConflictRejection(op: CrudEntry, response: HttpResponse) {
        // Domain-specific strategy: server wins. Drop local change and let downstream stream correct it.
        Logger.w { "Mutation rejected by server for ${op.table}/${op.id}. Overriding local state." }
    }
}
```

### 2. Automerge: In-memory causal graph convergence

Automerge (implemented in Rust, exposed via C-FFI to Flutter and KMP) tracks every change as an immutable operation node in an internal directed acyclic graph (DAG). 

When two clients update the same map key simultaneously while offline, Automerge retains both values in its conflict history, deterministic based on actor IDs, while exposing the winning value to the UI layer.

```dart
// Flutter/Dart FFI layer wrapping automerge-rs
import 'dart:typed_data';
import 'package:automerge_flutter/automerge_flutter.dart' as am;

class DocumentSession {
  late am.Doc _doc;

  DocumentSession(Uint8List? savedState) {
    if (savedState != null && savedState.isNotEmpty) {
      // Decompress and rehydrate the DAG from binary storage
      _doc = am.Doc.fromBytes(savedState);
    } else {
      _doc = am.Doc();
    }
  }

  void updateField(String key, String value) {
    // Every change creates an atomic transaction with a unique Lamport timestamp
    final tx = _doc.transaction();
    try {
      tx.set(am.ROOT, key, value);
      tx.commit();
    } catch (e) {
      tx.rollback();
      rethrow;
    }
  }

  Uint8List generateSyncMessage(am.SyncState syncState) {
    // Computes the delta between the local DAG head and remote syncState
    // Wire format is highly packed columnar binary
    return _doc.generateSyncMessage(syncState);
  }

  void receiveSyncMessage(am.SyncState syncState, Uint8List message) {
    // Merges changes without locking the thread; deterministic state convergence
    _doc.receiveSyncMessage(syncState, message);
  }

  Uint8List exportSnapshot() {
    // Persist full state to disk (e.g., SQLite BLOB or raw file)
    return _doc.save();
  }
}
```

### 3. ElectricSQL: Active-active local-first Postgres replication

ElectricSQL brings a hybrid approach: local SQLite runs a shadow schema that intercepts writes using triggers. It operates on a decentralized relational model using conflict-free replicated data types applied across standard relational columns. 

Electric streams transactions using an Elixir-based sync layer that reads the Postgres replication slot, converts relations into structured change events, and updates client-side SQLite instances via WebSockets.

---

## Sync engine architectural comparison

| Feature / Metric | PowerSync | Automerge (Rust core) | ElectricSQL |
| :--- | :--- | :--- | :--- |
| **Primary Data Store** | SQLite | In-memory DAG / Raw bytes | SQLite |
| **Sync Granularity** | Row / Column level | Field / Character level | Row / Column level |
| **Schema Migration** | Handled via SQLite DDL | Dynamic schema / Schemaless | Shadow SQLite DDL migrations |
| **Conflict Resolution** | Server-authoritative (API endpoint) | Automatic (Multi-value / LWW) | Automatic (Column-level LWW / CRDT) |
| **Wire Protocol** | Custom binary over HTTPS/WS | Compact binary CRDT messages | Satellite binary protocol over WS |
| **Flutter Support** | First-party (`powersync` package) | Community FFI bindings | Community via Dart FFI |
| **KMP Support** | First-party Kotlin SDK | Community Rust-JNI / KMP | Experimental |
| **Memory Footprint** | Extremely low (page-cached SQLite) | Scales with DAG history size | Low (SQLite with trigger overhead) |
| **Foreign Key Safety** | Guaranteed by sync rules & SQLite | Not supported out of the box | Managed via dependency tracking |

---

## What happens at runtime: The offline collision lifecycle

To understand where systems fail, trace this scenario:

> **Scenario**: A user opens a field inspection app on an iPad, walks into a subterranean basement with zero connectivity, and reassigns an asset to a new work order while deleting an obsolete inspection record. Meanwhile, a dispatcher on the web dashboard modifies the same work order's metadata and deletes the parent asset.

```
[Timeline of a Relational Collision]

Basement Client (Offline):
  T1: local_tx_start()
  T2: UPDATE work_orders SET asset_id = 'A_123' WHERE id = 'WO_99';
  T3: DELETE FROM inspections WHERE id = 'INS_01';
  T4: local_tx_commit() -> Stored in local mutation log

Dispatcher (Online):
  T2: UPDATE work_orders SET priority = 'URGENT' WHERE id = 'WO_99';
  T3: DELETE FROM assets WHERE id = 'A_123'; -- Cascades or leaves orphan

Client Reconnects (T5):
  ??? How does the system reconcile the broken foreign key ???
```

### The PowerSync resolution path

1. **Local write**: Client updates local SQLite tables immediately. Local UI updates reactively via standard SQLite queries (e.g., `watch` streams via Drift in Flutter or SQLDelight in KMP).
2. **Network restoration**: The `PostgresQueueUploader` reads the mutation from the SQLite CRUD queue and sends `PATCH /api/v1/work_orders/WO_99` to the backend.
3. **Server evaluation**: Your Postgres backend checks the incoming update. The asset `A_123` no longer exists (dispatcher deleted it).
4. **Validation fail**: The server rejects the mutation with an HTTP `422 Unprocessable Entity`.
5. **Reconciliation**: The client-side connector discards the unfulfillable mutation from its local queue. The downstream replication stream immediately pushes down the authoritative state from Postgres (where `A_123` is dead), bringing SQLite back into complete synchronization with the server.

### The Automerge resolution path

1. **Local write**: Client alters its in-memory map structure for `WO_99` and removes `INS_01` from the document list.
2. **Network restoration**: Both instances send binary sync messages containing their latest heads.
3. **Graph merge**: Automerge merges the changes deterministically. `WO_99` now contains both the dispatcher's `priority: 'URGENT'` and the client's `asset_id: 'A_123'`.
4. **Relational failure**: Because Automerge has no built-in concept of cross-document foreign keys, the client state now references an asset that does not exist elsewhere in the document graph. Your mobile UI must write explicit application-level invariant validators to catch broken object links.

---

## Common pitfalls and what breaks in practice

### 1. The unbounded CRDT history leak (Automerge)

Because Automerge stores history to compute differences between arbitrary peers, an application that frequently updates values will see its document state grow indefinitely. 

```rust
// Under the hood, every scalar assignment creates a change record:
// Doc size = Schema Data + (Number of Mutations * Mutation Metadata)
```

**The mitigation**: You must implement snapshot compaction. In long-running mobile environments, save a compacted snapshot (`doc.save()`) and drop the incremental operation history once all active peers have acknowledged receipt up to a known vector clock. Without compaction, your app will eventually crash with Out-Of-Memory (OOM) errors during cold boots.

### 2. Schema migrations across disconnected versions

Consider this situation: Client A (v1.2.0) has been offline for three weeks. Client B (v1.4.0) introduced a non-nullable column `status_enum` with three distinct string values, replacing an old boolean `is_active`.

If you are using **ElectricSQL** or **PowerSync**:
- The mobile client contains native SQLite DDL migrations.
- If an old client syncs data generated by a new backend schema, SQLite will throw a constraint error unless your migrations are strictly additive.
- **Rule of thumb**: Never drop columns, rename fields, or make new fields non-nullable on the backend without maintaining backwards-compatible views in your sync transformation layer for at least N-3 client releases.

```sql
-- DANGEROUS: Breaks older mobile clients currently offline
ALTER TABLE inspections DROP COLUMN is_completed;
ALTER TABLE inspections ADD COLUMN status VARCHAR NOT NULL;

-- SAFE: Additive migrations with server-side translation
ALTER TABLE inspections ADD COLUMN status VARCHAR DEFAULT 'in_progress';
-- Keep 'is_completed' updated via Postgres triggers until all mobile clients update
```

### 3. Queue head-of-line blocking in transactional engines

In PowerSync, client writes are processed in sequential order from the local SQLite queue. If mutation #3 fails with a network timeout, mutations #4 through #10 are blocked to prevent out-of-order execution against the server.

However, if mutation #3 fails due to a **non-retryable business logic error** (e.g., standard database constraint failure) and your sync logic blindly retries on all HTTP errors, the upload queue freezes completely.

**The fix**: Explicitly differentiate transient transport errors (HTTP 502, 503, connection dropped) from deterministic domain errors (HTTP 400, 409, 422). Deterministic errors must be logged, pushed to a client-side dead-letter table, and popped off the queue.

---

## Practical implementation: Drift + PowerSync in Flutter

Here is a clean pattern for wiring PowerSync to a reactive [Drift](https://drift.simonbinder.eu/) SQLite database in Flutter:

```dart
// lib/core/database/native_sync_drift.dart
import 'package:drift/drift.dart';
import 'package:powersync/powersync.dart';
import 'package:drift_sqlite_async/drift_sqlite_async.dart';

part 'native_sync_drift.g.dart';

// 1. Define standard Drift tables matching the PowerSync local schema
class Tasks extends Table {
  TextColumn get id => text()();
  TextColumn get title => text().withLength(min: 1, max: 120)();
  BoolColumn get isCompleted => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

@DriftDatabase(tables: [Tasks])
class AppDatabase extends _$AppDatabase {
  // Pass the PowerSync database handle directly to Drift via SqliteAsync
  AppDatabase(PowerSyncDatabase powersyncDb) 
      : super(SqliteAsyncDriftConnection(powersyncDb.primaryConnection));

  @override
  int get schemaVersion => 1;

  // 2. Expose reactive Streams that update automatically when sync packets land
  Stream<List<Task>> watchActiveTasks() {
    return (select(tasks)
      ..where((t) => t.isCompleted.equals(false))
      ..orderBy([(t) => OrderingTerm.desc(t.createdAt)]))
    .watch();
  }

  // 3. Write mutations directly using standard SQL; PowerSync handles capture
  Future<void> insertTask(String id, String title) {
    return into(tasks).insert(
      TasksCompanion.insert(
        id: id,
        title: title,
        createdAt: DateTime.now(),
      ),
      mode: InsertMode.replace,
    );
  }
}
```

This pattern gives you type-safe Dart queries, compile-time SQL verification, and streaming updates to your UI widgets whenever changes land from the wire, without writing manual event listeners.

---

## Action item for your codebase

Do not build a custom sync protocol using timestamps and a `last_synced_at` column in your REST API. It is vulnerable to clock skew, missing tombstones for deleted records, and race conditions during simultaneous writes.

Audit your sync requirements this week:
1. If your data consists of **deeply connected relational graphs** (users, permissions, invoices, orders), implement **PowerSync** (or **ElectricSQL**). Write your client code against a local embedded SQLite instance, define server-driven replication partitions, and send writes through your existing backend APIs.
2. If your core product feature is an **unstructured, highly concurrent collaborative canvas, text buffer, or workspace**, use **Automerge** over raw binary web sockets. Ensure you enforce snapshot compaction on your storage layer from day one.