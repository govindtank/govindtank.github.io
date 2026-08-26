---
title: "Building Real-Time Collaborative Apps with CRDTs and Operational Transformation"
slug: "building-real-time-collaborative-apps-with-crdts-and-operational-transformation"
date: "July 03, 2026"
excerpt: >
coverImage: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=1200"
category: "Architecture"
readTime: 4
tags:
  - "Architecture"
archetype: "opinion"
---


# Building Real-Time Collaborative Apps with CRDTs and Operational Transformation

## My position

If you're starting a collaborative application today, build it on CRDTs. Reach for operational transformation only when you can name a concrete requirement that needs the server to be the arbiter of every change.

I say that as someone who used to argue the other side. Fifteen years of backend work taught me to trust servers: they order, they validate, they keep a record. When I built my first collaborative editor a decade ago, OT was the obvious choice, and I defended it in meetings the way people defend frameworks they've already bet on. Then I built a second editor with CRDTs, watched the hard problems mostly disappear, and spent a while being annoyed about it. This post is the honest version of that journey.

I should also say where this advice comes from temperamentally: I reach for the boring solution on purpose. Distributed systems theory is fascinating right up until it's your pager going off at 3 a.m. So everything below is filtered through one question — what is the least clever thing that still works?

## What OT actually is

Operational transformation comes from the research lineage that produced Google Docs. The model: clients send operations to a server, the server assigns each one a total order, and transform functions rewrite operations so they can be applied in sequence without corrupting each other's intent. I type "a" at position 5 while you delete the character at position 3; somebody has to decide what "position 5" means after that delete, and OT's answer is a function that transforms my insert into a new position before it is applied.

The strengths are real, and I want to be fair about them. The server sees every operation, so it can enforce order, validate, authorize, and audit. That's why OT dominates in products where control and compliance matter more than offline freedom. If a regulator asks "who changed this, when, and in what order," a server that ordered everything has a clean answer.

## Why OT is brutal in practice

The transform functions are the problem, and they're not a small problem. For every pair of operation types you need a transform: insert/insert, insert/delete, delete/delete, and every combination your op model can produce. Each one is a small bug farm with its own edge cases.

I still remember the week we spent chasing an invisible character that appeared only when three users edited the same paragraph in a specific interleaving. We reproduced it, fixed it, deployed it, and then spent the next month wondering what else we hadn't found. That's the tax OT charges: correctness lives in a table of cases, and the table is never finished.

OT also assumes a central ordering authority. No server, no order, no collaboration. Offline editing becomes a hard problem you build around, and "sync when you reconnect" is where OT implementations go to die — you end up replaying operations against a document that moved on, which is exactly the transform hell you were trying to avoid.

## What CRDTs are, in one paragraph

Conflict-free replicated data types. Instead of ordering operations centrally, you design the data structure so concurrent updates merge by construction. Every replica applies operations in whatever order they arrive; as long as the operations are commutative, associative, and idempotent, every replica converges to the same state. Merge isn't a phase that happens after a fight. Merge is a property of the operations themselves.

The libraries have done the hard work for you. Yjs for text, Automerge for JSON documents. You get collaboration without writing a distributed systems paper:

The tradeoff is that you give up the idea of a single "true" order. The library decides how concurrent edits interleave, and your job is to pick a library whose decisions match your product's expectations. For text, that means trusting Yjs's character ordering under concurrent inserts. For structured data, it means living with Automerge's conflict resolution on maps and sequences. Neither is magic, and both are remarkably boring to operate, which is the highest compliment I can pay a system.

```js
import * as Y from 'yjs'

const doc = new Y.Doc()
const text = doc.getText('prose')

// any replica can edit right now, online or not:
text.insert(0, 'Hello ')

// broadcast updates; peers apply them and converge:
doc.on('update', (update) => {
  ws.send(update)
})
```

The same idea, for structured data, with Automerge:

```js
import { init, change, merge } from '@automerge/automerge'

let a = init()
a = change(a, (d) => { d.items = ['milk'] })

let b = init()
b = change(b, (d) => { d.items = ['bread'] })

const merged = merge(a, b) // both edits survive, in a deterministic order
```

## Offline support is the part people underestimate

This is where CRDTs win, and I don't think it's close. A phone with no signal can keep editing a Yjs document for hours; when it reconnects, the deltas sync and every replica converges. With OT, "offline" means you either queue operations and hope the transforms hold up, or you lock the document — which is a fancy way of saying you don't actually support offline editing.

Offline isn't a niche feature anymore. Anyone who has stared at a spinner in a train tunnel knows the expectation: the app works, and it sorts itself out when the connection comes back. CRDTs give you that behavior as a property of the data structure, not as a project with a deadline.

## The honest tradeoffs

CRDTs have warts, and pretending otherwise is how you get burned. Tombstones and metadata accumulate as documents change; Yjs handles this well in practice, but naive CRDT implementations can bloat without bound. Merge semantics can surprise you — two people editing a list concurrently can end up with both edits in an order that pleases neither. And the libraries, good as they are, still leak: you will eventually care about data model versioning, garbage collection, and presence metadata.

OT's warts are structural: transform complexity and the offline gap. You can't patch around them with better engineering taste; they're in the model.

There's also an operational angle. A CRDT sync server relays bytes and stores snapshots — it's close to stateless, so it scales horizontally without much ceremony, and losing one replica costs you nothing. An OT server holds the authoritative document state and the transform logic, which makes it the kind of component you think hard about before you run two of. If your roadmap includes sharding documents across many servers, that difference stops being academic.

## Where OT still wins

I'm not saying OT is dead. I'm saying it's a specific tool for a specific job, and the job is server control. Choose OT when:

- The server must be the source of truth for order — compliance, legal hold, audit trails, regulated workflows where the system's record matters more than convergence.
- Your operations are domain commands, not text edits, and every change needs server-side validation before it counts.
- You already run a server-authoritative stack and offline support is a stated non-requirement.
- You need operation-level control of history: replay, fine-grained undo, per-operation billing or quotas.
- Your op model is so application-specific that generic libraries fight you. OT over a small, well-defined set of command types — a handful of operations, not free-text editing — can be less total work than adapting a CRDT library to fit.

If the product is "docs, but for our domain," that's CRDT territory. If the product is "an approval workflow where the backend must sign off on every change," OT might genuinely be simpler — the server is doing the ordering anyway, and the transform surface is small. Know which one you're building.

## What I'd actually build

Yjs for anything text-shaped. Automerge for structured documents. A sync server that authenticates, relays updates, and stores snapshots — deliberately boring, no business logic in it. Presence data through Yjs awareness or a lightweight channel of your own, so you get cursors and "who's online" without touching the document model.

And the moment a requirement shows up that smells like "the server must approve and order everything," stop and model that on purpose. Name the requirement, not the technology. Nine times out of ten the answer turns out to be "we want to see who changed what," which is awareness, not transformation — and a CRDT with a boring sync server gives you that with a fraction of the math.

## Wrapping up

My rule: default to CRDTs, and make anyone arguing for OT name the concrete requirement that needs server control. If they can, take the OT seriously; it's the right tool for a real subset of problems. If they can't, you've just saved yourself a transform table. I learned this the expensive way, and I'd rather you learn it the cheap way.
