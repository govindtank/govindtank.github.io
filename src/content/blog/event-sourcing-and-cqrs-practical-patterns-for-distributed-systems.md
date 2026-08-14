---
title: "Event Sourcing and CQRS: Practical Patterns for Distributed Systems"
slug: "event-sourcing-and-cqrs-practical-patterns-for-distributed-systems"
date: "June 22, 2026"
excerpt: >
coverImage: "https://images.unsplash.com/photo-1522199755839-a2bacb67c546?auto=format&fit=crop&q=80&w=1200"
category: "Architecture"
readTime: 18
tags:
  - "Event Sourcing"
  - "CQRS"
  - "Distributed Systems"
  - "DDD"
archetype: "roundup"
---


# Event Sourcing and CQRS: Practical Patterns for Distributed Systems

I keep a folder of throwaway projects for ideas I can't stop thinking about. Event sourcing and CQRS lived in that folder for a year before I used them at work, and they're a rare pair where the toy version and the production version behave completely differently. The toys are delightful. The production version has a monthly bill, and I want to be precise about which parts earn it.

This is a roundup of the patterns I've actually built — five arrangements of events, write models, and read models — with the honest conditions where each one pays off and the ones where it quietly costs you.

## How I compare these patterns

When I evaluate an event-based architecture I ask four questions. First, what does a write cost: an append-only event store is cheap to write to and expensive to read from, and every other choice is a trade between those two. Second, how stale can reads be: projections are eventually consistent, and "eventually" is a product decision, not a technical one. Third, who consumes the events: one consumer or ten changes the math completely. Fourth, what happens when the schema changes: events are forever, and versioning is the tax you pay up front.

## Pattern one: plain event sourcing

The core idea is small enough to fit in your head. Instead of storing the current state of an aggregate, you store every change as an event, and the state is whatever you get by replaying those events. A bank account isn't a balance; it's a sequence of `AccountOpened`, `MoneyDeposited`, and `MoneyWithdrawn` records, and the balance is a fold over them.

The write path is the pattern's best feature. An append with a version check gives you optimistic concurrency, because the event store is the source of truth and the aggregate's version is the guard:

```python
def append_event(conn, stream_id, expected_version, event):
    cur = conn.execute(
        """
        INSERT INTO events (stream_id, version, payload)
        SELECT ?, ?, ?
        WHERE NOT EXISTS (
            SELECT 1 FROM events
            WHERE stream_id = ? AND version = ?
        )
        """,
        (stream_id, expected_version + 1, json.dumps(event),
         stream_id, expected_version),
    )
    if cur.rowcount == 0:
        raise Conflict(f"stream {stream_id} moved past version {expected_version}")
```

That `WHERE NOT EXISTS` is the whole trick: one statement, atomic, and two writers can't both win. I've used this against Postgres, SQLite, and CockroachDB, and it holds up every time.

Where it shines: anything with a legal or audit flavor — ledgers, wallets, inventory adjustments, moderation history. You get a complete history for free, you can replay state after a bug, and debugging becomes "read the events" instead of "query the mystery table."

Where it stings: every read is a replay or a cache. A plain event-sourced system without projections is like a database with no indexes, which is exactly the problem pattern two solves.

Verdict: worth it for ledgers and audit trails; skip it for ordinary CRUD.

## Pattern two: event sourcing with projections

A projection is a listener that folds events into a read model. Orders become a row in `order_summaries`; the projection rebuilds that row whenever an order event lands. The classic trick is that the projection is disposable: drop the read table and rebuild it from the event log any time you want to change its shape.

```python
def project_orders(event):
    if event.type == "OrderPlaced":
        upsert_summary(event.order_id, status="placed",
                       total=event.total, at=event.at)
    elif event.type == "OrderShipped":
        update_summary(event.order_id, status="shipped")
```

This is where the tinkerer in me gets excited. Want a different read model for the admin dashboard? Write another projection. The event log stays a single source of truth, and the read side becomes whatever you need it to be.

The catch: projections are eventually consistent, and they drift. Your projection code is production code with its own failure modes, and "just rebuild from the log" gets expensive when the log is ten billion events — which is why snapshots exist. I'd still rather have projections than a pile of denormalized columns maintained by hand, but I stopped pretending they're free.

Verdict: worth it when one log feeds several read shapes; depends on your tolerance for eventual consistency.

## Pattern three: full CQRS with separate read models

CQRS is the discipline of splitting the command side from the query side. Commands change state, queries read it, and the two don't share a model. The minimal version is two handlers for the same domain object:

```python
class OrderCommandHandler:
    def place(self, cmd):
        # validate, append events, return the aggregate version
        ...

class OrderQueryHandler:
    def get_summary(self, order_id):
        # read from the projection, never from the event store
        ...
```

The honest benefit is that the two sides optimize separately. The write side stays a clean append-only log; the read side is a denormalized shape tuned for the actual queries, with indexes the write model never needs.

The honest cost is operational. You now run two stores, two schemas, and a replication path between them, and every read is eventually consistent by construction. If a user places an order and the confirmation page reads from the projection, there's a window where the order doesn't exist yet. Most teams I talk to aren't ready for that conversation with their product manager.

Verdict: worth it when reads and writes scale in opposite directions; skip it for a small team with one table per screen.

## Pattern four: CQRS without event sourcing

Here's the underrated option. You can split commands from queries and keep a plain relational database as the single source of truth, using materialized views or a small replication job as the read side. No event log, no replay, no event schema versioning. The write model is boring and correct; the read model is shaped for screens.

I reached for this more than I expected when prototyping. It gives you the main usability win of CQRS — query shapes that don't fight the write model — without committing to events as the source of truth. The tradeoff is that you lose the audit history and the replay story, so it's the right call when you want read-model freedom but have no compliance reason to keep every event.

Verdict: the default I'd pick for most business apps; upgrade to event sourcing only when history becomes a requirement.

## Pattern five: the outbox, for service integration

The fifth pattern isn't about read models at all. It's about publishing events reliably. The outbox pattern writes the event in the same transaction as the business change, then a relay publishes it to the queue. The event either exists in the outbox next to the order, or it doesn't; you never get the "order saved but the event was lost" gap.

```python
with tx:
    insert_order(order)
    insert_outbox("OrderPlaced", order)   # same transaction
# relay process: read the outbox, publish, mark sent
```

This one is my favorite, because it solves a real distributed-systems problem with one table and one background loop, and it works with any broker. I've shipped it behind Kafka, SQS, and plain Postgres LISTEN/NOTIFY.

Verdict: worth it for any service that publishes events; the cheapest reliability win in this list.

## The comparison table

| Pattern | Fits when | Avoid when | Complexity |
|---|---|---|---|
| Plain event sourcing | audits, ledgers, replay debugging | simple CRUD, write-heavy forms | medium |
| Event sourcing + projections | many read shapes from one log | one read model, tiny domain | medium-high |
| Full CQRS, separate stores | reads and writes scale differently | small team, one table per screen | high |
| CQRS without event sourcing | read-model freedom, no event tax | full audit history required | low-medium |
| Outbox + events | reliable integration, fan-out | single service, no consumers | low |

## Where the complexity actually lives

None of these patterns are hard to prototype. The complexity arrives at the edges, and it arrives on schedule. Event schema versioning: events are immutable, so a changed field means `OrderPlacedV2` or a compatibility layer, and the migration discipline is permanent. Snapshots: replays slow down, and you build snapshotting, which is a second system with its own bugs. Eventual consistency: every "why is this page stale?" ticket becomes an architecture conversation. And deletes: erasure requests are awkward when your source of truth is an append-only log.

I'd also warn against event-sourcing everything "for the flexibility." A content site's post table is not a ledger. The flexibility you buy is a liability until a requirement forces it.

## How to try it yourself

Build a shopping cart. Not a todo app — a cart, with a quantity history and a price that changed after items were added. Event-source the cart, project the cart page, then add a second projection for the admin view. That exercise will teach you more than any article: you'll feel the append-only freedom, the projection drift, and the exact moment you start wanting snapshots, all in a weekend.

Start with pattern four if you're on a deadline, pattern one if you're curious. Both are honest about their costs, which is more than most architecture diagrams are.
