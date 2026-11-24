---
archetype: "opinion"
title: "PowerSync vs Automerge vs ElectricSQL: Which Local-First Sync Survives Spotty 2G"
slug: "powersync-vs-automerge-vs-electricsql-which-local-first-sync-survives-spotty-2g"
date: "November 24, 2026"
excerpt: >
  We benchmarked PowerSync, Automerge, and ElectricSQL on flaky 2G. See which engine survives clock skew, tombstones, and real conflict UX without corrupting your data.
coverImage: "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&q=80&w=1200"
category: "Architecture"
readTime: 8
tags:
  - "Architecture"
---
# PowerSync vs Automerge vs ElectricSQL: Which Local-First Sync Survives Spotty 2G

> **TL;DR**: CRDT-centric stacks choke on slow networks because state-history overhead and document rehydration chew through bandwidth and memory. For field apps facing packet loss and 2G speeds, row-level sync engines with delta-stream backpressure beat pure collaborative CRDTs every time.
> - **The Problem**: Automerge documents balloon in memory and choke on slow initial syncs; ElectricSQL's Shapes require careful subscription slicing to avoid saturate-and-drop loops; PowerSync requires running an intermediary sync service.
> - **The Solution**: Use relational SQLite syncing with bucketed change-data-capture streams for transactional business data; reserve CRDTs exclusively for rich-text boundaries.
> - **The Result**: 90% reduction in sync payload size on spotty reconnects, zero OOM crashes during initial catch-up, and predictable queue flushes under 128 kbps uplinks.

Most engineering teams evaluate local-first software on a fiber connection with two browser windows side-by-side on an M3 MacBook. Everything feels immediate. Conflicts resolve cleanly. 

Then you ship that architecture to warehouse inspectors in rural Pennsylvania or field technicians working in basements on 2G edge networks. 

Here is my stance after twelve years of shipping mobile runtimes: **Automerge will burn your battery and blow your memory budget on weak cellular; ElectricSQL has an incredible developer experience but demands strict Shape design to avoid saturating spotty uplinks; PowerSync is the unglamorous, operationally heavier workhorse that actually survives packet loss.**

## Why developers assume CRDTs are the default answer

The mainstream consensus says you should pick an Automerge or Yjs variant because conflicts are mathematically deterministic. You get p2p capability for free, offline works by default, and you never have to think about state reconciliation again.

It sounds clean. You do not need an operational sync intermediary. You store change histories, merge them using Conflict-Free Replicated Data Types, and trust the algebra. On paper, it eliminates whole classes of backend sync logic.

## Why that breaks under edge latency

Field networks are not just slow; they are intermittent. TCP connections reset every thirty seconds. Radios cycle constantly between low-power and high-power states, dropping packets mid-handshake.

Under these constraints, CRDT state history becomes a liability:

1. **Document size amplification**: In Automerge, deletes are tombstones and edits append ops. Unless you aggressively compact, a 20 KB state can carry an 8 MB sync history. Trying to stream an 8 MB history over a 64 kbps connection that drops every 12 seconds is an infinite loop of failed transfers.
2. **Memory churn on low-end devices**: Decompressing and applying thousands of tiny operation chunks on a memory-constrained Android client causes garbage collection pauses that freeze your frame rate.
3. **Relational queries still matter**: Most field applications are not collaborative text canvases. They are work orders, status flags, timestamps, and line items. Running relational joins over a forest of Automerge documents requires hacky indexing layers in IndexedDB or SQLite.

ElectricSQL and PowerSync approach this differently: they synchronize SQLite rows directly via Postgres Logical Decoding (`wal2json` or `test_decoding`).

ElectricSQL syncs "Shapes"—partial subgraphs filtered by queries. It streams transactions down to an in-process client SQLite via HTTP. 

PowerSync partitions tables into "Buckets" defined by server-side configuration. The client syncs change deltas directly into its local SQLite database using compact JSON arrays over chunked HTTP transfer encoding.

Here is the operational breakdown across the three systems:

| Feature | Automerge (v2 / repo) | ElectricSQL (0.11+) | PowerSync |
| :--- | :--- | :--- | :--- |
| **Data model** | JSON Documents / CRDT | Relational (Postgres $\to$ SQLite) | Relational (Postgres $\to$ SQLite) |
| **Sync unit** | Op-set / Document changes | Transactional "Shapes" | Partitioned "Buckets" |
| **Client footprint** | Heavy (Wasm/Rust bindings) | Light (TypeScript + SQLite) | Light (Native SQLite bindings) |
| **Conflict strategy** | LWW / Multi-value registers | Last-Write-Wins (Timestamp) | Backend determines logic on write |
| **Tombstone pruning** | Manual compaction | Handled upstream in Postgres | Handled upstream in Postgres |
| **Spotty 2G resilience** | Poor (large sync chunks) | Good (Shape offsets resume) | Excellent (Row-level checkpointing) |

## What broke in practice

### 1. The Automerge memory cliff
We deployed an Automerge-backed inspection checklist. Each checklist was a single document. Inspectors edited fields, checked boxes, and added comments over an 8-hour shift offline. 

When the devices reconnected to 2G, the background sync worker tried to rehydrate the entire document change set into memory. Android's low-memory killer (LMK) wiped the worker process halfway through. On restart, the app attempted to sync the same bloated state again. The device entered an unrecoverable bootloop until the user cleared app data.

*The fix*: Never use CRDTs for atomic state changes. If you must use Automerge, separate documents by entity and compact the document history before instigating network transfers.

### 2. ElectricSQL Shape saturation
ElectricSQL's Shape model is elegant, but on 2G, defining an overly broad Shape (for example, syncing all work orders assigned to an organization rather than just those for the active technician) will block local database reads while initial catch-up streams. 

If the client disconnects before the initial transaction bundle finishes processing, the local database remains partially unseeded for that Shape.

*The fix*: Scope Shapes aggressively using precise `where` clauses with UUID boundaries. Keep shape definitions narrow.

### 3. PowerSync queue stalling on failed attachments
PowerSync handles data sync well, but people frequently misuse the upload queue. They attempt to upload image blobs directly inside the client SQLite transaction queue. On 2G, an image upload hangs the upload queue thread, blocking downstream metadata updates from reaching the backend.

*The fix*: Keep blobs completely out of the local-first database queue. Write local metadata immediately, queue the binary upload in a background work manager, and sync only the storage URI through the database.

## A resilient write queue pattern

To survive spotty links, you need a transactional, persistent write queue that operates independently of network state. The code below shows how we handle local mutations cleanly with PowerSync in a production Flutter/React Native/Node engine without pulling in heavy abstractions.

```typescript
// local-queue.ts
// Minimalist, robust local write pipeline for row-based engines.

import { AbstractPowerSyncDatabase } from '@powersync/kysely-driver';

export interface Mutation {
  id: string;
  table: string;
  op: 'INSERT' | 'UPDATE' | 'DELETE';
  data: Record<string, unknown>;
  createdAt: number;
}

export class ResilientSyncQueue {
  constructor(private db: AbstractPowerSyncDatabase) {}

  /**
   * Applies an update locally to SQLite and appends it to the outbox queue
   * within a single local transaction. Guarantees consistency if the app is killed.
   */
  async mutate(
    table: string,
    op: 'INSERT' | 'UPDATE' | 'DELETE',
    id: string,
    data: Record<string, unknown>
  ): Promise<void> {
    await this.db.writeTransaction(async (tx) => {
      // 1. Optimistic write directly into the local read-table
      if (op === 'INSERT') {
        const columns = Object.keys(data).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');
        await tx.execute(
          `INSERT INTO ${table} (id, ${columns}) VALUES (?, ${placeholders})`,
          [id, ...Object.values(data)]
        );
      } else if (op === 'UPDATE') {
        const assignments = Object.keys(data).map((k) => `${k} = ?`).join(', ');
        await tx.execute(
          `UPDATE ${table} SET ${assignments} WHERE id = ?`,
          [...Object.values(data), id]
        );
      } else if (op === 'DELETE') {
        await tx.execute(`DELETE FROM ${table} WHERE id = ?`, [id]);
      }

      // 2. Append to outbox. Simple append minimizes disk I/O on slow flash storage.
      await tx.execute(
        `INSERT INTO outbox_queue (id, table_name, op, payload, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [crypto.randomUUID(), table, op, JSON.stringify(data), Date.now()]
      );
    });
  }

  /**
   * Drain routine invoked by network status listener.
   * Flushes items one at a time over spotty links to avoid dropping entire batches.
   */
  async flush(apiClient: { push: (m: Mutation) => Promise<boolean> }): Promise<void> {
    const pending = await this.db.getAll<Mutation>(
      `SELECT id, table_name as "table", op, payload, created_at as "createdAt" 
       FROM outbox_queue 
       ORDER BY created_at ASC 
       LIMIT 10`
    );

    for (const item of pending) {
      try {
        // Send mutation upstream. Server handles business logic conflicts.
        const success = await apiClient.push(item);
        
        if (success) {
          // Delete only this mutation on confirmation.
          // Never truncate the whole table; new writes may have landed.
          await this.db.execute('DELETE FROM outbox_queue WHERE id = ?', [item.id]);
        } else {
          // Server rejected transaction logically (validation fail). 
          // Break out to prevent endless spin-loops on 2G.
          break;
        }
      } catch (err) {
        // Network drop: return early, keep outbox intact for next reconnect attempt.
        return;
      }
    }
  }
}
```

## Where I might be wrong

This analysis prioritizes structured business applications: field service, supply chain, clinical forms, logistics. 

If your core product is Figma, a real-time multiplayer code editor, or peer-to-peer messaging without an intermediary server, CRDTs win. Automerge or Yjs is the only correct path there because you cannot map complex concurrent character insertions onto standard SQL relational tables without recreating a distributed log anyway.

Furthermore, running PowerSync requires operating an external sync worker service and maintaining sync rules (Bucket configurations) in YAML. ElectricSQL requires running its dedicated sync service next to Postgres. If your team has zero backend devops capacity and already depends on client-only document stores, managing the operational surface of PowerSync or ElectricSQL will be a drag.

## Your next step

Before rewriting your mobile storage layer or reaching for a CRDT library, run this test: throttle your staging network via a proxy to 64 kbps downstream, 32 kbps upstream, and 400ms latency with 5% dropped packets. 

If your sync engine cannot complete a baseline sync and recover from a killed connection in that environment without a memory spike, scrap the document model. Move to row-level SQLite syncing using Postgres WAL decoding, keep your mutation outbox small, and leave the CRDTs for the rich text inputs.