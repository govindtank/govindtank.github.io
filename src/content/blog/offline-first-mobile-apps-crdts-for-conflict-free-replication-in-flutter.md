---
archetype: "roundup"
title: "Offline-First Mobile Apps: CRDTs for Conflict-Free Replication in Flutter"
slug: "offline-first-mobile-apps-crdts-for-conflict-free-replication-in-flutter"
date: "September 09, 2026"
excerpt: >
  How to use Conflict-Free Replicated Data Types (CRDTs) in Flutter to synchronize offline-first data across devices without server-side merge conflicts.
coverImage: "https://images.unsplash.com/photo-1526406915894-7bcd65f60845?auto=format&fit=crop&q=80&w=1200"
category: "Mobile-Architecture"
readTime: 8
tags:
  - "Mobile-Architecture"
---
# Offline-First Mobile Apps: CRDTs for Conflict-Free Replication in Flutter

You are building a mobile application that needs to write data reliably in an elevator, on a subway line, or across spotty cellular connections. Eventually, you hit the wall that every mobile engineer hits: two clients modify the same record while disconnected, and both push their state when back online. 

At this point, teams usually choose between two bad defaults. The first is "last-write-wins" (LWW) based on local device timestamps, which inevitably clobbers user data because mobile clocks drift wildly. The second is an ad-hoc, state-machine-based merge handler on the backend that grows into an unmaintainable tangle of edge-case checks.

Conflict-free Replicated Data Types (CRDTs) solve this at a mathematical level by guaranteeing eventual consistency without an authoritative central lock coordinator. But the Flutter and Dart ecosystem does not have a single, undisputed winner for offline CRDT persistence. You are forced to choose between raw Dart libraries, embedded databases with sync layers, and foreign-function bindings to mature Rust or C ecosystems.

Here is an unvarnished review of the current CRDT approaches available for Flutter, what works in production, and what will wake you up at 3:00 AM.

---

## Selection criteria

To make this review, an approach had to satisfy four practical constraints:

1. **Deterministic convergence:** Two devices that receive the same set of updates in any order must converge to the exact same state without throwing merge errors.
2. **Local persistence cost:** Mobile devices have finite storage and memory. Solutions that require storing infinite update tombstones without compaction or garbage collection fail.
3. **Dart/Flutter integration friction:** We evaluate how cleanly the data layer binds to Flutter reactive primitives like `ChangeNotifier`, `ValueListenable`, `Stream`, or Bloc/Riverpod pipelines.
4. **Maintenance overhead:** Does this add a brittle C/Rust toolchain to your CI/CD pipeline, or does it run clean in pure Dart?

---

## The contenders

### 1. `crdt` + `sqlite_crdt` (Pure Dart / SQLite extension by Simon Leier)

#### What it is
A pure Dart foundation (`crdt`) paired with an extension layer (`sqlite_crdt`) that turns standard SQLite tables into state-based and delta-based CRDT stores using Hybrid Logical Clocks (HLCs). It adds tracking columns (`hlc`, `modified`, `is_deleted`) to your existing SQL schema and handles delta generation via standard SQL queries.

#### How it works in code
```dart
import 'package:sqlite_crdt/sqlite_crdt.dart';
import 'package:crdt/crdt.dart';

Future<void> setupDatabase(SqliteCrdt crdtTable) async {
  // Define tables normally; crdt metadata columns are injected automatically
  await crdtTable.execute('''
    CREATE TABLE projects (
      id TEXT NOT NULL PRIMARY KEY,
      title TEXT NOT NULL,
      budget REAL NOT NULL
    );
  ''');

  // Insert uses local HLC
  final hlc = crdtTable.canonicalTime;
  await crdtTable.execute(
    'INSERT INTO projects (id, title, budget) VALUES (?1, ?2, ?3)',
    ['proj-01', 'Warehouse Renovation', 45000.0],
  );

  // Fetching changesets for sync since a known node checkpoint
  final changeset = await crdtTable.getChangeset(
    onlyTables: ['projects'],
    fromHlc: Hlc.parse('2024-01-01T00:00:00.000Z-0000-nodeA'),
  );

  // Merge external changes directly into SQLite
  await crdtTable.merge(changeset);
}
```

#### Who it's for
Teams that already use standard SQLite or Drift, understand SQL relational schemas, and want transparent, queryable data on-device without running a separate database server process.

#### Verdict: Worth it
This is the most pragmatic choice for 90% of business applications. It does not require compiled C-bindings beyond the standard `sqflite` or `sqlite3` packages. Your data remains inspectable via standard SQLite debuggers, and HLCs prevent physical clock skew disasters.

---

### 2. Automerge (via `automerge-dart` / Rust FFI)

#### What it is
Automerge is an industrial-grade, JSON-like document CRDT engine written in Rust. It tracks changes as an immutable causal graph of operations, giving you full version history, branching, and automatic merging down to the character level in text strings.

#### How it works in code
```dart
// Conceptual bindings over Rust FFI
import 'package:automerge_flutter/automerge_flutter.dart';

void mutateDocument(AutomergeDoc doc) {
  final tx = doc.startTransaction();
  
  // Update nested properties directly
  tx.set(['settings', 'theme'], 'dark');
  tx.listPush(['tasks'], 'Review production logs');
  
  final patch = tx.commit();
  
  // Binary serialized change to send over WebSocket/gRPC
  final syncMessage = doc.generateSyncMessage();
  sendOverWire(syncMessage);
}
```

#### Who it's for
Apps requiring rich-text collaboration, canvas whiteboards, complex hierarchical document editing, or exact historical auditing where you need to see who made which change and when.

#### Verdict: Depends
The algorithmic core is bulletproof, but the operational ergonomics in Flutter are heavy. You take on a Rust compilation toolchain for iOS, Android, macOS, and Windows. Document size grows continuously unless you actively run compaction scripts, and serializing large documents across the Dart FFI boundary introduces garbage collector pressure under high frame rates.

---

### 3. Yrs / Ydart (Yjs Rust port via FFI)

#### What it is
Yrs is the high-performance Rust port of Yjs, the document-based CRDT known for fast vector-clock implementations and optimized memory layout. It uses a custom run-length encoded binary representation that outperforms raw operation-based engines on text editing benchmarks.

#### How it works in code
```dart
import 'package:ydart/ydart.dart';

void runCollabSession(YDoc doc) {
  final text = doc.getText('document_body');
  
  // Insert at index with client identifier tracking
  text.insert(0, 'Initial sync state.');
  
  // Encode delta update state vector
  final update = doc.encodeStateAsUpdate();
  
  // Apply incoming remote vector
  doc.applyUpdate(remoteUpdateBytes);
}
```

#### Who it's for
Teams building collaborative text editors, IDE-style tools, or real-time sketchboards in Flutter where millisecond-level input latency and small payload sizes are top priorities.

#### Verdict: Skip (for standard CRUD apps)
Unless you are building Figma or Google Docs in Flutter, Yrs/Ydart is over-engineering. Integrating it into regular relational or standard key-value application state requires unnatural modeling. The Dart bindings in the open-source ecosystem are also fragmented and lightly maintained compared to the JS original.

---

### 4. PowerSync (Service + Client SQLite Extension)

#### What it is
PowerSync is an offline-first sync engine that combines SQLite on the client with a server-side replication worker that tails your primary database write-ahead log (Postgres, MySQL, or Mongo). Instead of pure client-to-client CRDT resolution, it resolves operations using a central coordinator backed by client-side local tracking tables.

#### How it works in code
```dart
import 'package:powersync/powersync.dart';

final db = PowerSyncDatabase(schema: schema, path: 'app_data.db');

Future<void> syncFlow() async {
  await db.initialize();
  
  // Normal SQLite access locally
  final rows = await db.getAll('SELECT * FROM tickets WHERE status = ?', ['open']);
  
  // Watch stream directly attached to Flutter UI widgets
  Stream<List<Row>> ticketStream = db.watch('SELECT * FROM tickets');
}
```

#### Who it's for
Teams with an existing, heavily normalized backend relational database (like PostgreSQL) who want offline client caching and synchronization without rewriting their entire persistence layer into custom CRDT data types.

#### Verdict: Worth it
While not an academic peer-to-peer CRDT, this is the most enterprise-ready offline solution for client-server architectures. It offloads conflict orchestration to the replication stream and leaves you with standard SQLite tables inside Flutter.

---

### 5. Custom LWW-Element-Set over Drift / Hive

#### What it is
Building your own Last-Write-Wins element set directly on top of standard Dart key-value stores (Hive/Isar) or relational mapping layers (Drift), using a combined timestamp structure (such as an NTP-synchronized monotonic timestamp + client UUID).

#### How it works in code
```dart
class LwwRecord<T> {
  final T data;
  final int physicalTimestamp;
  final int logicalCounter;
  final String nodeId;

  LwwRecord({
    required this.data,
    required this.physicalTimestamp,
    required this.logicalCounter,
    required this.nodeId,
  });

  bool shouldOverwrite(LwwRecord<T> incoming) {
    if (incoming.physicalTimestamp != physicalTimestamp) {
      return incoming.physicalTimestamp > physicalTimestamp;
    }
    if (incoming.logicalCounter != logicalCounter) {
      return incoming.logicalCounter > logicalCounter;
    }
    return incoming.nodeId.compareTo(nodeId) > 0;
  }
}
```

#### Who it's for
Very small applications tracking simple toggle flags, user preferences, or flat records where fields do not have nested relations and lost updates on concurrent writes are acceptable.

#### Verdict: Skip
Rolling your own sync logic looks trivial in unit tests and breaks completely under real-world conditions. You will run into subtle bugs with tombstone cleanup, clock drift when users change their timezone manually, and out-of-order delta delivery over flaky networks. Use an established library instead.

---

## Comparison matrix

| Solution | Model Type | Persistence Engine | Storage Overhead | Native FFI Required? | Production Suitability |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`sqlite_crdt`** | State/Delta CRDT + HLC | SQLite | Low to Moderate | No (Standard SQLite) | High (Standard apps) |
| **Automerge** | Operation-based Graph | Custom binary | High (Without GC) | Yes (Rust) | High (Documents/Text) |
| **Yrs / Ydart** | State-based Vector | Custom binary | Low | Yes (Rust) | Medium (Ecosystem maturity) |
| **PowerSync** | Managed Client Replication | SQLite | Low | No (Standard SQLite) | High (Postgres backends) |
| **Custom LWW** | Register / Map Sets | Hive / Drift / Any | Depends on cleanup | No | Low (High maintenance risk) |

---

## Architecture patterns for Flutter CRDT integration

If you choose a decentralized approach like `sqlite_crdt`, you must avoid coupling the sync mechanism directly to your UI controllers. 

Run your CRDT operations behind a strict repository boundary that exposes regular Dart `Streams`. Here is the architecture that avoids state leakage:

```
[ Local UI / Flutter Widgets ]
              │
         (Streams/Data)
              ▼
   [ Repository Interface ]
              │
         (SQL Queries)
              ▼
    [ sqlite_crdt / SQLite ] ◄─── (Changeset Sync) ───► [ Sync Manager ]
                                                              │
                                                        (HTTP/WebSockets)
                                                              ▼
                                                        [ Backend Node ]
```

The database acts as the single source of truth. The `Sync Manager` runs out of band, pushing local changesets from the SQLite layer and merging remote changesets back in. The UI only listens to database table changes through reactive queries, completely unaware of whether an insert was triggered by local user interaction or a background websocket sync packet.

---

To evaluate these options for your own stack, build a prototype that intentionally introduces split-brain edits: spin up two simulators, disconnect both from the network, modify the exact same relational entity on both, and reconnect them out of order. If your selected tool cannot automatically resolve the state without throwing foreign key violations, locking the UI thread, or bloating your local storage footprint beyond recovery, replace it before writing your core application logic.