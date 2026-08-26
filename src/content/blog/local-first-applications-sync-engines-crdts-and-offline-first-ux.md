---
title: "Local-First Applications: Sync Engines, CRDTs, and Offline-First UX"
slug: "local-first-applications-sync-engines-crdts-and-offline-first-ux"
date: "August 17, 2026"
excerpt: >
  We shipped a local-first sync layer last quarter. Here's what CRDTs actually bought us, where they hurt, and why most teams are still over-engineering their offline story.
coverImage: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=1200"
category: "Architecture"
readTime: 8
tags:
  - "Local-First"
  - "CRDT"
  - "Offline-First"
  - "Sync"
  - "Architecture"
---

Last quarter I led the sync redesign for our mobile note-taking app. We had 40,000 daily active users on spotty 3G and a sync engine that kept quietly corrupting shared lists. The CEO asked whether we should "just use CRDTs." I said I'd look into it. Three months later we shipped a local-first layer built on Yjs, and it fixed most of our merge bugs — but it also introduced a new class of problems nobody talks about in the conference talks.

This is not another CRDT explainer. You can find plenty of those. I want to tell you what actually happens when you commit to local-first on a real product: the sync engine trade-offs, the memory overhead nobody warns you about, and why "offline-first" is still mostly a backend architecture decision even when the mobile team disagrees.

## What local-first actually means

Local-first is not the same as offline-capable. An offline-capable app queues requests when the network drops and replays them later. A local-first app treats the on-device database as the source of truth, period. The server is a replication target — a fancy backup that also enables multi-device collaboration.

That distinction matters. If you treat the server as the source of truth, every conflict is a merge problem that requires a "winner" — last-write-wins, user prompts, or custom rules. If the device is the source of truth, conflicts become sync problems. You need a data structure that can absorb two histories without data loss. That is where CRDTs enter.

## The CRDT promise

Conflict-free Replicated Data Types guarantee that all replicas converge to the same state given the same set of operations, without coordination. No two-phase commit, no central lock server, no merge conflict UI asking users to pick between two versions of a paragraph.

For our use case — shared task lists with multiple editors — CRDTs sounded ideal. We evaluated Automerge and Yjs. Automerge is more general-purpose; Yjs is faster in practice because it uses a compact binary format and a simpler state model. We picked Yjs.

The promise held for simple cases. Two users editing the same task title on different phones would merge cleanly. Deletions propagated correctly. Undo/redo worked across devices. It felt like magic until we hit memory limits on older Android devices.

## Where the magic breaks

Yjs stores every operation as a compact item in an internal log. That log never shrinks during normal use. After a few weeks of heavy editing, a single document could accumulate hundreds of thousands of items. On an iPhone 15, this was fine. On a Samsung A14 with 4GB RAM, our app's memory footprint jumped from 80MB to 250MB after three weeks. Users noticed the lag.

We tried garbage collection. Yjs supports it, but it requires all peers to agree on a snapshot frontier, which means coordination. In practice, we had to run a background sync every few hours just to trigger GC safely. That defeated our low-power mode.

Then there are the semantics. CRDTs converge on state, but they do not converge on intent. If User A deletes a sentence and User B edits that same sentence in the same minute, the merge result preserves both operations in a way that neither user expected. The text reads correctly according to the data model, but the human intent is ambiguous. We ended up building a small conflict-visibility layer anyway, just to show users what had been merged.

## Sync engines are boring until they are not

The hard part of local-first is not CRDTs. It is sync.

You need a transport layer that handles intermittent connectivity, versioned snapshots, and peer authentication. You need a way to bootstrap a new device quickly — downloading the full document history is unacceptable for a 10MB note. You need tombstone handling so deleted items stay deleted across peers.

We built our sync on WebSockets with a simple state vector protocol. Every client sends its current state vector; the server diffs and returns missing items. It works. It is unglamorous. It took us two weeks to write and three months to stabilize because of edge cases: clock skew between devices, clients that reconnect after airplane mode with stale state vectors, and binary protocol changes that broke our protobuf parsers.

Most local-first tutorials skip this part. They show the CRDT merge and stop. In production, the sync engine eats 70% of the engineering time.

## Offline-first UX patterns that actually work

On the mobile side, the biggest lesson is that users do not want to think about sync. They want to type, draw, or check a box and see it everywhere. Our best UX decisions were invisible:

- **Optimistic writes with local state.** Every mutation writes to the local Yjs document first. The UI updates immediately. Sync happens in the background. Users never wait for a network round-trip.
- **Background sync tied to connectivity, not app lifecycle.** We use iOS Background App Refresh and Android WorkManager. Sync jobs run when the system detects good connectivity, not when the app opens.
- **Conflict visibility as a last resort.** We only show the conflict UI when a merge produces a state that neither peer expected. For 98% of edits, the merge is silent.
- **Explicit sync status indicators.** A tiny dot — green, yellow, or red — in the toolbar. Users glance at it and know whether their data is safe. No modal interruptions.

The worst UX pattern we tried was an "all changes synced" toast. It fired every time a sync completed, which was dozens of times per session. Users hated it. Less is more.

## When local-first is the wrong choice

Local-first is not free. It costs engineering time, device memory, and battery. If your app is read-heavy with occasional writes — a news reader, a podcast client — traditional client-server with a cache is simpler and more predictable.

If your data model is naturally hierarchical and append-only — a chat log, an audit trail — CRDTs are overkill. Last-write-wins with vector clocks handles most cases.

If you need strong consistency — a banking app where every transaction must be verified centrally — local-first is the wrong architecture. Users will not accept a transfer that "might sync later."

Use local-first when your users work in environments with unreliable connectivity, when collaboration is a core feature, and when the cost of merge conflicts is high. Notes, whiteboards, project management tools, and design files fall into this category. We do.

## What I would do differently

If I started over, I would spend more time on the sync engine and less on the data structure. Yjs is great, but the community is small, documentation is thin, and edge cases are undocumented. We found bugs in binary encoding that had to be patched upstream.

I would also measure memory from day one. We did not have a memory regression test until we saw the spike in production. Now we run a headless Android emulator test that opens a document, simulates 1,000 edits, and asserts memory stays under 150MB.

Finally, I would separate the collaboration layer from the persistence layer early. We bundled them together and regretted it when we needed to support read-only share links that do not require a live WebSocket connection.

## The bottom line

Local-first is worth it for the right product. The user experience of never seeing a spinner before your own words appear on the screen is hard to beat. But it is not a free lunch. The sync engine is where the real work lives, and CRDTs are a tool — not a solution — for the merge problem.

If your team is considering local-first, start with a prototype of the sync layer alone. Write raw CRDT operations to disk, replay them, measure convergence. Once that works, add the UI. Do not start with the UI and discover the sync problems later.

That is exactly the mistake we made. We shipped the CRDT demo in two weeks and spent the next three months building the sync that made it usable.

---

*If you are building offline-first sync, I recommend reading the Yjs and Automerge source code. Both are small enough to read in an afternoon, and the edge cases are documented in issues, not docs.*