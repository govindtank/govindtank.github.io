---
title: "Event Sourcing and CQRS: Practical Patterns for Distributed Systems"
slug: "event-sourcing-and-cqrs-practical-patterns-for-distributed-systems"
date: "June 22, 2026"
excerpt: >
  Event Sourcing and CQRS have become foundational patterns for building scalable,
  auditable distributed systems. This guide covers event store design, aggregate
  modeling in DDD, CQRS read/write separation, snapshot strategies, schema evolution,
  sagas and process managers, event store implementations (EventStoreDB, PostgreSQL,
  Kafka), testing strategies, and real-world case studies — with code examples in
  Python and TypeScript, mermaid diagrams, and comparison tables.
coverImage: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=1200"
category: "Architecture"
readTime: 18
tags:
  - "Event Sourcing"
  - "CQRS"
  - "Distributed Systems"
  - "DDD"
---

# Event Sourcing and CQRS: Practical Patterns for Distributed Systems

In the distributed systems landscape of 2026, scalability is no longer a luxury — it is a survival requirement. As applications evolve from monolithic architectures to complex microservice ecosystems, traditional relational databases often struggle with write contention and read scaling bottlenecks. This shift has propelled Event Sourcing (ES) and Command Query Responsibility Segregation (CQRS) into the mainstream for high-throughput domains like finance, logistics, and real-time analytics. These patterns offer a robust mechanism to decouple state management from application logic, enabling independent optimization of read and write paths. For senior architects, understanding the nuances of implementing these patterns is critical for maintaining system resilience in an era where eventual consistency is often preferred over strict strong consistency.

This comprehensive guide covers the full spectrum of ES/CQRS — from fundamental concepts through advanced patterns — with practical code examples, architecture diagrams, and battle-tested strategies from production systems.

---

## Table of Contents

1. [Event Sourcing Fundamentals](#event-sourcing-fundamentals)
2. [CQRS Architecture Patterns](#cqrs-architecture-patterns)
3. [Aggregate Design in Domain-Driven Design](#aggregate-design-in-domain-driven-design)
4. [Event Store Implementations](#event-store-implementations)
5. [Snapshotting Strategies](#snapshotting-strategies)
6. [Event Versioning and Schema Evolution](#event-versioning-and-schema-evolution)
7. [Sagas and Process Managers](#sagas-and-process-managers)
8. [Testing Event-Sourced Systems](#testing-event-sourced-systems)
9. [Event-Driven Microservices Integration](#event-driven-microservices-integration)
10. [Performance and Optimization](#performance-and-optimization)
11. [Real-World Case Studies](#real-world-case-studies)
12. [Conclusion](#conclusion)

---

## Event Sourcing Fundamentals

Event sourcing is the practice of storing the complete sequence of state-changing events as the authoritative source of truth, rather than persisting only the current state. Current state becomes a derived artifact — computed by replaying events from the beginning of time (or from a known snapshot).

### The Append-Only Event Log

At the heart of event sourcing is the **append-only log**. Events are immutable facts that have happened in the past. You never delete or update them — you only append new events. This single property unlocks powerful capabilities:

- **Complete audit trail**: Every state change is recorded with full context.
- **Temporal queries**: Reconstruct state as of any point in time.
- **Debugging and replay**: Re-run event streams in development or staging environments.
- **Alternative perspectives**: Build entirely different read models from the same event stream.

```mermaid
graph TD
    subgraph "Append-Only Event Log"
        E1["Event v1<br/>OrderPlaced"] --> E2["Event v2<br/>OrderConfirmed"]
        E2 --> E3["Event v3<br/>ItemShipped"]
        E3 --> E4["Event v4<br/>PaymentReceived"]
        E4 --> ...["..."]
    end

    subgraph "Derived State"
        E1 & E2 & E3 & E4 --> State["Current State (Order Aggregate)"]
    end

    style E1 fill:#4a90d9,color:#fff
    style E2 fill:#4a90d9,color:#fff
    style E3 fill:#4a90d9,color:#fff
    style E4 fill:#4a90d9,color:#fff
    style State fill:#6abf69,color:#fff
```

### Event Store Structure

An event store is an append-only log with specific structural requirements. Below is a canonical schema that works across relational databases, with each field serving a distinct purpose:

| Column | Type | Purpose |
|---|---|---|
| `event_id` | UUID (PRIMARY KEY) | Globally unique identifier for the event |
| `aggregate_type` | VARCHAR(100) | Domain entity name, e.g., "Order", "Account" |
| `aggregate_id` | VARCHAR(100) | Specific instance, e.g., "order-12345" |
| `version` | INTEGER | Monotonically increasing per aggregate, starting at 1 |
| `event_type` | VARCHAR(200) | Domain event class, e.g., "OrderPlaced" |
| `event_data` | JSONB | Full event payload (fields, quantities, statuses) |
| `metadata` | JSONB | Correlation ID, causation ID, actor identity, timestamp |
| `created_at` | TIMESTAMPTZ | When the event was recorded |

The critical constraint is the uniqueness of the `(aggregate_id, version)` pair, which acts as an **optimistic concurrency guard**. When writing a new event, the database enforces that `version = current_version + 1`, preventing conflicting writes from concurrent operations.

```sql
-- PostgreSQL: Event store table with optimistic concurrency
CREATE TABLE event_store (
    event_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type  VARCHAR(100) NOT NULL,
    aggregate_id    VARCHAR(100) NOT NULL,
    version         INTEGER NOT NULL,
    event_type      VARCHAR(200) NOT NULL,
    event_data      JSONB NOT NULL,
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Unique constraint enforces optimistic concurrency
    UNIQUE (aggregate_id, version)
);

-- Index for stream reads
CREATE INDEX idx_event_store_stream 
    ON event_store (aggregate_type, aggregate_id, version);

-- Index for global ordering (used by projectors)
CREATE INDEX idx_event_store_global 
    ON event_store (created_at, event_id);
```

### Event Structure and Design Principles

Every event should be named in the **past tense** (past participle) to reflect that it represents something that has already happened:

- `OrderPlaced` ✓ (not `PlaceOrder`)
- `PaymentReceived` ✓ (not `ReceivePayment`)
- `InventoryReservationFailed` ✓ (not `ReserveInventory`)

Events should carry **enough context** to be meaningful independently:

```python
# Good: Self-contained event
{
    "event_type": "OrderPlaced",
    "data": {
        "order_id": "ord-789",
        "customer_id": "cus-456",
        "items": [
            {"product_id": "prod-123", "quantity": 2, "price": 29.99}
        ],
        "total_amount": 59.98,
        "shipping_address": {"street": "123 Main St", "city": "Portland"}
    }
}

# Bad: Contains only IDs, requires joins to understand
{
    "event_type": "OrderPlaced",
    "data": {
        "order_id": "ord-789",
        "customer_id": "cus-456"
        # Where are the items? How much was the total?
    }
}
```

### Event Bus and Event Publishing

Once events are persisted, they need to be published to downstream consumers (projectors, sagas, other microservices). There are two primary patterns:

**1. Poll-Based Publishing** — Projectors poll the event store for new events. Simple but introduces latency.

**2. Push-Based Publishing** — Events are published to a message broker (Kafka, RabbitMQ, NATS) after being written. The transactional outbox pattern ensures reliability.

```mermaid
sequenceDiagram
    participant C as Command Handler
    participant ES as Event Store
    participant EB as Event Bus (Kafka)
    participant P as Projector
    participant RM as Read Model

    C->>ES: Append event (transactional)
    ES-->>C: OK
    
    Note over ES,EB: Transactional Outbox / CDC
    ES->>EB: Publish event
    
    EB->>P: Deliver event
    P->>P: Project event
    P->>RM: Update materialized view
    
    P->>EB: Commit offset
```

---

## CQRS Architecture Patterns

CQRS separates the system into two distinct pathways: **commands** (writes) and **queries** (reads). In an event-sourced system, commands produce events that are persisted to the event store, while queries read from materialized views that are updated asynchronously by event handlers.

### Command Side (Write Model)

The command side is responsible for validating business rules and producing events. It never exposes internal state directly — it only accepts commands and produces events.

```python
# Python: Command handler with aggregate
from dataclasses import dataclass, field
from typing import List, Optional
from enum import Enum
from uuid import uuid4

class OrderStatus(Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    SHIPPED = "shipped"
    CANCELLED = "cancelled"

@dataclass
class OrderItem:
    product_id: str
    quantity: int
    price: float

@dataclass
class OrderAggregate:
    order_id: str
    customer_id: str
    items: List[OrderItem]
    status: OrderStatus = OrderStatus.PENDING
    total_amount: float = 0.0
    version: int = 0
    changes: List = field(default_factory=list)

    @staticmethod
    def place_order(order_id: str, customer_id: str, items: List[OrderItem]) -> "OrderAggregate":
        """Static factory: validates and creates a new aggregate."""
        if not items:
            raise ValueError("Order must have at least one item")
        if any(item.quantity <= 0 for item in items):
            raise ValueError("All item quantities must be positive")
        
        total = sum(item.quantity * item.price for item in items)
        
        aggregate = OrderAggregate(
            order_id=order_id,
            customer_id=customer_id,
            items=items,
            total_amount=total,
            version=1
        )
        aggregate.changes.append({
            "event_type": "OrderPlaced",
            "data": {
                "order_id": order_id,
                "customer_id": customer_id,
                "items": [item.__dict__ for item in items],
                "total_amount": total
            }
        })
        return aggregate
    
    def confirm_order(self):
        if self.status != OrderStatus.PENDING:
            raise ValueError(f"Cannot confirm order in {self.status.value} state")
        self.status = OrderStatus.CONFIRMED
        self.version += 1
        self.changes.append({
            "event_type": "OrderConfirmed",
            "data": {"order_id": self.order_id, "version": self.version}
        })
    
    def cancel_order(self, reason: str):
        if self.status in (OrderStatus.SHIPPED, OrderStatus.CANCELLED):
            raise ValueError(f"Cannot cancel order in {self.status.value} state")
        self.status = OrderStatus.CANCELLED
        self.version += 1
        self.changes.append({
            "event_type": "OrderCancelled",
            "data": {"order_id": self.order_id, "reason": reason, "version": self.version}
        })

    def apply_event(self, event: dict):
        """Rebuild state from an event (used during replay)."""
        event_type = event["event_type"]
        data = event["data"]
        
        if event_type == "OrderPlaced":
            self.order_id = data["order_id"]
            self.customer_id = data["customer_id"]
            self.items = [OrderItem(**item) for item in data["items"]]
            self.total_amount = data["total_amount"]
            self.status = OrderStatus.PENDING
            self.version = 1
        elif event_type == "OrderConfirmed":
            self.status = OrderStatus.CONFIRMED
            self.version = data["version"]
        elif event_type == "OrderShipped":
            self.status = OrderStatus.SHIPPED
            self.version = data["version"]
        elif event_type == "OrderCancelled":
            self.status = OrderStatus.CANCELLED
            self.version = data["version"]
```

### Query Side (Read Model)

The query side maintains **materialized views** that are optimized for specific query patterns. These views are updated by **projectors** — event handlers that listen to the event stream and update denormalized read models.

```mermaid
graph LR
    subgraph "Command Side (Write)"
        A[Client Request] --> B[Command Handler]
        B --> C[Aggregate]
        C --> D[Event Store]
        D --> E{Event Bus}
    end
    
    subgraph "Query Side (Read)"
        F[(Materialized View)] --> G[Query Handler]
        G --> H[Client Response]
    end
    
    E --> I[Projector / Event Handler]
    I --> F
    
    E --> J[Search Index]
    E --> K[Cache]
    
    style A fill:#4a90d9,color:#fff
    style B fill:#4a90d9,color:#fff
    style C fill:#4a90d9,color:#fff
    style D fill:#f5a623,color:#fff
    style E fill:#d0021b,color:#fff
    style F fill:#6abf69,color:#fff
    style G fill:#6abf69,color:#fff
```

### Projector Implementation (TypeScript)

Below is a production-grade TypeScript projector that maintains a read-optimized MongoDB collection from the event stream, with checkpoint-based resilience:

```typescript
// src/projectors/order-projector.ts
import { EventStore } from './event-store';
import { MongoClient, Db } from 'mongodb';

interface OrderEvent {
  eventId: string;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  data: Record<string, unknown>;
  metadata: Record<string, unknown>;
  position: number;
  timestamp: string;
}

interface OrderReadModel {
  orderId: string;
  userId: string;
  items: Array<{ id: string; name: string; quantity: number; price: number }>;
  status: 'pending' | 'confirmed' | 'shipped' | 'cancelled';
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  version: number;
}

class OrderProjector {
  private db: Db;
  private eventStore: EventStore;
  private lastProcessedPosition: number = 0;
  private isRunning: boolean = false;

  constructor(mongoClient: MongoClient, eventStore: EventStore) {
    this.db = mongoClient.db('read_models');
    this.eventStore = eventStore;
  }

  async start(): Promise<void> {
    this.isRunning = true;
    console.log('[OrderProjector] Starting...');
    
    // Resume from last checkpoint
    const checkpoint = await this.db
      .collection('projector_checkpoints')
      .findOne({ projectorName: 'OrderProjector' });
    
    this.lastProcessedPosition = checkpoint?.position ?? 0;
    console.log(`[OrderProjector] Resuming from position ${this.lastProcessedPosition}`);

    // Continuous polling loop
    while (this.isRunning) {
      try {
        await this.pollEvents();
      } catch (error) {
        console.error('[OrderProjector] Polling error:', error);
        await this.sleep(1000); // Backoff on error
      }
    }
  }

  async stop(): Promise<void> {
    this.isRunning = false;
  }

  private async pollEvents(): Promise<void> {
    const events = await this.eventStore.getEventsSince(
      this.lastProcessedPosition,
      { batchSize: 100 }
    );
    
    if (events.length === 0) {
      await this.sleep(100);
      return;
    }

    for (const event of events) {
      await this.handleEvent(event);
      this.lastProcessedPosition = event.position;
    }

    // Persist checkpoint atomically
    await this.db.collection('projector_checkpoints').updateOne(
      { projectorName: 'OrderProjector' },
      { 
        $set: { 
          position: this.lastProcessedPosition, 
          updatedAt: new Date().toISOString() 
        } 
      },
      { upsert: true }
    );
  }

  private async handleEvent(event: OrderEvent): Promise<void> {
    switch (event.eventType) {
      case 'OrderPlaced':
        await this.handleOrderPlaced(event);
        break;
      case 'OrderConfirmed':
        await this.handleOrderConfirmed(event);
        break;
      case 'OrderShipped':
        await this.handleOrderShipped(event);
        break;
      case 'OrderCancelled':
        await this.handleOrderCancelled(event);
        break;
      default:
        console.warn(`[OrderProjector] Unknown event type: ${event.eventType}`);
    }
  }

  private async handleOrderPlaced(event: OrderEvent): Promise<void> {
    const readModel: OrderReadModel = {
      orderId: event.aggregateId,
      userId: event.data.userId as string,
      items: event.data.items as OrderReadModel['items'],
      status: 'pending',
      totalAmount: event.data.totalAmount as number,
      createdAt: event.timestamp,
      updatedAt: event.timestamp,
      version: 1,
    };
    
    await this.db.collection('orders').insertOne(readModel);
  }

  private async handleOrderConfirmed(event: OrderEvent): Promise<void> {
    await this.db.collection('orders').updateOne(
      { orderId: event.aggregateId },
      { 
        $set: { 
          status: 'confirmed', 
          updatedAt: event.timestamp,
          version: event.data.version as number
        }
      }
    );
  }

  private async handleOrderShipped(event: OrderEvent): Promise<void> {
    await this.db.collection('orders').updateOne(
      { orderId: event.aggregateId },
      { 
        $set: { 
          status: 'shipped',
          trackingNumber: event.data.trackingNumber as string,
          updatedAt: event.timestamp,
          version: event.data.version as number
        }
      }
    );
  }

  private async handleOrderCancelled(event: OrderEvent): Promise<void> {
    await this.db.collection('orders').updateOne(
      { orderId: event.aggregateId },
      { 
        $set: { 
          status: 'cancelled',
          cancellationReason: event.data.reason as string,
          updatedAt: event.timestamp,
          version: event.data.version as number
        }
      }
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export { OrderProjector, OrderReadModel };
```

This projector pattern ensures that read models are eventually consistent with the event store. The checkpoint mechanism provides resilience — if the projector crashes, it resumes from the last known position without data loss or duplicate processing.

### Read Model Strategies

| Strategy | Use Case | Storage | Consistency |
|---|---|---|---|
| **Materialized View** (single table) | Simple lookups by ID | PostgreSQL, MySQL | Strong (per-command) |
| **Search Index** | Full-text search, faceting | Elasticsearch, Meilisearch | Near-real-time |
| **Cached View** | High-throughput reads | Redis, Memcached | Best-effort |
| **Analytics Store** | OLAP queries, aggregations | ClickHouse, Druid | Batch (seconds-minutes) |
| **Graph View** | Relationship traversal | Neo4j, Dgraph | Near-real-time |

---

## Aggregate Design in Domain-Driven Design

Aggregates are the consistency boundaries in Domain-Driven Design (DDD). In an event-sourced system, an aggregate is both a **command handler** (validating business rules and producing events) and a **state machine** (being rebuilt from event replay).

### Aggregate Design Principles

1. **Small Aggregates**: Keep aggregates small. A typical mistake is modeling an entire Customer as a single aggregate when it should be composed of smaller aggregates (Customer, Order, PaymentMethod).

2. **One Aggregate Per Transaction**: A command should modify only one aggregate instance. If you need to update multiple aggregates atomically, use a **saga** or **process manager** instead.

3. **Eventual Consistency Across Aggregates**: Accept that different aggregates will be eventually consistent with each other. Use domain events to coordinate across aggregate boundaries.

4. **Version-Optimistic Concurrency**: Use the aggregate version as an optimistic concurrency token. When persisting, verify that no concurrent write has occurred.

### Aggregate Example: Bank Account

```python
# Python: BankAccount aggregate
@dataclass
class BankAccount:
    account_id: str
    customer_id: str
    balance: Decimal = Decimal("0.00")
    status: str = "active"
    version: int = 0
    changes: List = field(default_factory=list)

    @staticmethod
    def open_account(account_id: str, customer_id: str, initial_deposit: Decimal):
        if initial_deposit < Decimal("25.00"):
            raise ValueError("Minimum initial deposit is $25.00")
        
        account = BankAccount(account_id=account_id, customer_id=customer_id)
        account.changes.append({
            "event_type": "AccountOpened",
            "data": {
                "account_id": account_id,
                "customer_id": customer_id,
                "initial_deposit": str(initial_deposit)
            }
        })
        account.balance = initial_deposit
        account.version = 1
        return account

    def deposit(self, amount: Decimal, reference: str):
        if amount <= Decimal("0"):
            raise ValueError("Deposit amount must be positive")
        if self.status != "active":
            raise ValueError(f"Cannot deposit to {self.status} account")
        
        self.balance += amount
        self.version += 1
        self.changes.append({
            "event_type": "DepositMade",
            "data": {
                "account_id": self.account_id,
                "amount": str(amount),
                "balance": str(self.balance),
                "reference": reference
            }
        })

    def withdraw(self, amount: Decimal, reference: str):
        if amount <= Decimal("0"):
            raise ValueError("Withdrawal amount must be positive")
        if self.status != "active":
            raise ValueError(f"Cannot withdraw from {self.status} account")
        if self.balance - amount < Decimal("-500.00"):
            raise ValueError("Withdrawal would exceed overdraft limit")
        
        self.balance -= amount
        self.version += 1
        self.changes.append({
            "event_type": "WithdrawalMade",
            "data": {
                "account_id": self.account_id,
                "amount": str(amount),
                "balance": str(self.balance),
                "reference": reference
            }
        })

    def close_account(self, reason: str):
        if self.status != "active":
            raise ValueError(f"Account is already {self.status}")
        if self.balance != Decimal("0"):
            raise ValueError("Cannot close account with non-zero balance")
        
        self.status = "closed"
        self.version += 1
        self.changes.append({
            "event_type": "AccountClosed",
            "data": {
                "account_id": self.account_id,
                "reason": reason
            }
        })
```

### Aggregate Repository Pattern

The repository is responsible for loading and saving aggregates. It handles snapshot retrieval, event replay, and concurrency checking:

```python
# Python: Aggregate repository
class AggregateRepository:
    def __init__(self, event_store: EventStore, snapshot_store: SnapshotStore):
        self.event_store = event_store
        self.snapshot_store = snapshot_store
        self.upcasters = []

    def save(self, aggregate) -> None:
        """Persist all pending changes of an aggregate."""
        if not aggregate.changes:
            return  # Nothing to save
        
        # Optimistic concurrency: expect version to match
        expected_version = aggregate.version - len(aggregate.changes)
        
        for i, event in enumerate(aggregate.changes):
            event["metadata"] = {
                "correlation_id": str(uuid4()),
                "causation_id": str(uuid4()),
                "version": expected_version + i + 1
            }
            self.event_store.append(
                aggregate_type=type(aggregate).__name__,
                aggregate_id=aggregate.aggregate_id,
                events=aggregate.changes,
                expected_version=expected_version
            )
        
        aggregate.changes.clear()

    def load(self, aggregate_class, aggregate_id: str) -> object:
        """Rebuild aggregate state from events (with snapshot)."""
        # Try to load snapshot first
        snapshot = self.snapshot_store.get(
            aggregate_type=aggregate_class.__name__,
            aggregate_id=aggregate_id
        )
        
        start_version = snapshot.version if snapshot else 0
        aggregate = aggregate_class()
        
        if snapshot:
            # Restore from snapshot
            for key, value in snapshot.state.items():
                setattr(aggregate, key, value)
            aggregate.version = snapshot.version
        
        # Replay remaining events
        events = self.event_store.get_events(
            aggregate_type=aggregate_class.__name__,
            aggregate_id=aggregate_id,
            from_version=start_version + 1
        )
        
        # Apply upcasters before replay
        for event in events:
            event = self._upcast(event)
            aggregate.apply_event(event)
        
        return aggregate

    def _upcast(self, event):
        for upcaster in self.upcasters:
            if upcaster.can_upcast(event):
                event = upcaster.upcast(event)
        return event
```

---

## Event Store Implementations

Choosing the right event store is one of the most consequential architectural decisions in an ES/CQRS system. Below is a detailed comparison of three major approaches.

### Comparison Table

| Feature | EventStoreDB | PostgreSQL | Apache Kafka |
|---|---|---|---|
| **Architecture** | Dedicated event store database | Relational DB with event schema | Distributed event streaming platform |
| **Streaming** | Built-in subscription API | Polling or CDC (Debezium) | Native pub-sub with consumer groups |
| **Concurrency Control** | Optimistic (expected version) | Optimistic (unique constraint) | Not built-in (application-level) |
| **Projections** | Built-in projection engine | External projectors | Kafka Streams / ksqlDB |
| **Schema Flexibility** | JSON with metadata | JSONB with indexes | Avro / Protobuf via Schema Registry |
| **Persistence** | Append-only log on disk | WAL + table storage | Segmented commit log |
| **Scaling** | Cluster mode (3+ nodes) | Read replicas, partitioning | Horizontal partitioning (partitions) |
| **Audit** | Built-in, immutable | Application-managed | Immutable by configuration |
| **Operations** | Specialized DB to manage | Widely understood ops | Requires Kafka cluster management |
| **Community & Support** | Growing, commercial backing | Massive ecosystem | Very large, CNCF-hosted |
| **Best For** | Dedicated ES/CQRS systems | Teams wanting minimal new infrastructure | High-throughput event streaming & microservices |

### EventStoreDB

[EventStoreDB](https://www.eventstore.com/) is a purpose-built database for event sourcing. It stores events in an append-only log, provides built-in subscriptions, and includes a projection engine.

```typescript
// TypeScript: Writing to EventStoreDB
import {
  EventStoreDBClient,
  FORWARDS,
  START,
  jsonEvent,
  ResolvedEvent
} from '@eventstore/db-client';

const client = EventStoreDBClient.connectionString(
  'esdb://localhost:2113?tls=false'
);

async function appendOrderPlaced(orderId: string, data: object) {
  const event = jsonEvent({
    type: 'OrderPlaced',
    data: data,
    metadata: {
      correlationId: crypto.randomUUID(),
      causationId: crypto.randomUUID()
    }
  });

  const result = await client.appendToStream(
    `order-${orderId}`,
    event,
    { expectedRevision: 'no_stream' } // Optimistic concurrency
  );

  return result;
}

async function readStream(streamName: string) {
  const events: ResolvedEvent[] = [];
  
  for await (const event of client.readStream(streamName, {
    direction: FORWARDS,
    fromRevision: START
  })) {
    events.push(event);
  }
  
  return events.map(e => ({
    type: e.event?.type,
    data: e.event?.data,
    revision: e.event?.revision
  }));
}
```

### PostgreSQL as Event Store

PostgreSQL is the most popular choice for teams wanting to adopt ES/CQRS without introducing a new database technology. Key advantages include existing operational knowledge, mature tooling, and the ability to run event storage alongside business data in the same transaction.

```python
# Python: PostgreSQL event store implementation
import psycopg2
import json
from uuid import uuid4
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

class PostgresEventStore:
    def __init__(self, conn_string: str):
        self.conn_string = conn_string
    
    def _get_connection(self):
        return psycopg2.connect(self.conn_string)
    
    def append(
        self,
        aggregate_type: str,
        aggregate_id: str,
        events: List[Dict[str, Any]],
        expected_version: int
    ) -> None:
        """Atomically append events with optimistic concurrency check."""
        conn = self._get_connection()
        try:
            with conn.cursor() as cur:
                for i, event in enumerate(events):
                    version = expected_version + i + 1
                    cur.execute(
                        """
                        INSERT INTO event_store 
                            (event_id, aggregate_type, aggregate_id, version, 
                             event_type, event_data, metadata, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (
                            str(uuid4()),
                            aggregate_type,
                            aggregate_id,
                            version,
                            event["event_type"],
                            json.dumps(event["data"]),
                            json.dumps(event.get("metadata", {})),
                            datetime.now(timezone.utc)
                        )
                    )
            conn.commit()
        except psycopg2.errors.UniqueViolation:
            conn.rollback()
            raise ConcurrencyError(
                f"Aggregate {aggregate_type}/{aggregate_id} "
                f"was modified concurrently"
            )
        finally:
            conn.close()
    
    def get_events(
        self,
        aggregate_type: str,
        aggregate_id: str,
        from_version: int = 1
    ) -> List[Dict[str, Any]]:
        conn = self._get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT event_id, version, event_type, event_data, 
                           metadata, created_at
                    FROM event_store
                    WHERE aggregate_type = %s 
                      AND aggregate_id = %s
                      AND version >= %s
                    ORDER BY version ASC
                    """,
                    (aggregate_type, aggregate_id, from_version)
                )
                
                events = []
                for row in cur.fetchall():
                    events.append({
                        "event_id": row[0],
                        "version": row[1],
                        "event_type": row[2],
                        "event_data": json.loads(row[3]),
                        "metadata": json.loads(row[4]),
                        "created_at": row[5].isoformat()
                    })
                return events
        finally:
            conn.close()
    
    def get_global_events(
        self,
        after_position: int = 0,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        conn = self._get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT event_id, aggregate_type, aggregate_id, version,
                           event_type, event_data, metadata, created_at
                    FROM event_store
                    WHERE created_at > (
                        SELECT created_at FROM event_store 
                        WHERE event_id = (
                            SELECT event_id FROM event_store 
                            ORDER BY created_at, event_id 
                            LIMIT 1 OFFSET %s
                        )
                    )
                    ORDER BY created_at, event_id
                    LIMIT %s
                    """,
                    (after_position, limit)
                )
                results = []
                for row in cur.fetchall():
                    results.append({
                        "position": row[0],  # Simplified
                        "event_id": row[0],
                        "aggregate_type": row[1],
                        "aggregate_id": row[2],
                        "version": row[3],
                        "event_type": row[4],
                        "data": json.loads(row[5]),
                        "metadata": json.loads(row[6]),
                        "timestamp": row[7].isoformat()
                    })
                return results
        finally:
            conn.close()
```

### Apache Kafka

Kafka is not a traditional event store — it's a distributed streaming platform. However, its durability, partitioning, and replay capabilities make it a compelling choice for event sourcing, especially in event-driven microservice architectures.

```typescript
// TypeScript: Kafka-based event store
import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';

class KafkaEventStore {
  private producer: Producer;
  private kafka: Kafka;

  constructor(brokers: string[], clientId: string) {
    this.kafka = new Kafka({ brokers, clientId });
    this.producer = this.kafka.producer();
  }

  async connect(): Promise<void> {
    await this.producer.connect();
  }

  async append(
    aggregateType: string,
    aggregateId: string,
    events: Array<{ eventType: string; data: Record<string, unknown> }>,
    expectedVersion: number
  ): Promise<void> {
    const topic = `${aggregateType}-events`;
    
    // Use aggregateId as partition key for ordering guarantees
    const key = aggregateId;
    
    await this.producer.send({
      topic,
      messages: events.map((event, i) => ({
        key,
        value: JSON.stringify({
          aggregateType,
          aggregateId,
          version: expectedVersion + i + 1,
          eventType: event.eventType,
          data: event.data,
          timestamp: new Date().toISOString()
        }),
        headers: {
          'event-type': event.eventType,
          'aggregate-id': aggregateId,
          'version': String(expectedVersion + i + 1)
        }
      })),
    });
  }

  async subscribe(
    aggregateType: string,
    fromBeginning: boolean,
    handler: (event: Record<string, unknown>) => Promise<void>
  ): Promise<Consumer> {
    const consumer = this.kafka.consumer({
      groupId: `projector-${aggregateType}`,
    });
    
    await consumer.connect();
    await consumer.subscribe({
      topic: `${aggregateType}-events`,
      fromBeginning
    });
    
    await consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        const event = JSON.parse(payload.message.value!.toString());
        await handler(event);
      },
    });
    
    return consumer;
  }
}
```

### When to Use What

```mermaid
graph TD
    Q["Choosing an Event Store"] --> Q1{"Primary Requirements?"}
    
    Q1 -->|"Purpose-built, projections built-in"| ESDB["EventStoreDB"]
    Q1 -->|"Existing Postgres team, minimal new infra"| PG["PostgreSQL"]
    Q1 -->|"High throughput, microservices, streaming"| KAFKA["Apache Kafka"]
    
    ESDB --> ESDB1["✅ Native event sourcing support"]
    ESDB --> ESDB2["✅ Built-in subscriptions & projections"]
    ESDB --> ESDB3["⚠️ Requires specialized operational knowledge"]
    
    PG --> PG1["✅ Familiar tooling & ecosystem"]
    PG --> PG2["✅ Transactional outbox in same DB"]
    PG --> PG3["⚠️ Polling-based projectors (latency)"]
    
    KAFKA --> K1["✅ Massive throughput (millions msg/sec)"]
    KAFKA --> K2["✅ Ecosystem (Kafka Streams, ksqlDB, Connect)"]
    KAFKA --> K3["⚠️ No built-in concurrency control"]
    KAFKA --> K4["⚠️ Compaction vs. append-only trade-offs"]

    style Q fill:#4a90d9,color:#fff
    style ESDB fill:#6abf69,color:#fff
    style PG fill:#6abf69,color:#fff
    style KAFKA fill:#6abf69,color:#fff
```

---

## Snapshotting Strategies

Replaying all events from the beginning becomes expensive as event logs grow. **Snapshots** — persisted projections of aggregate state at a specific version — dramatically reduce recovery time.

### How Snapshots Work

```txt
Without snapshots:  [E1][E2][E3][E4][E5]...[E10000] → replay all 10K events
With snapshots:     [E1][E2]...[S@500][E501][E502]...[S@1000] → replay ~500 events max
```

### Snapshot Store Implementation

```python
# Python: Snapshot store with Redis
import pickle
from typing import Optional, Dict, Any
from dataclasses import dataclass
import redis.asyncio as redis

@dataclass
class Snapshot:
    aggregate_type: str
    aggregate_id: str
    version: int
    state: Dict[str, Any]
    created_at: str

class RedisSnapshotStore:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
    
    async def save(self, snapshot: Snapshot) -> None:
        key = f"snapshot:{snapshot.aggregate_type}:{snapshot.aggregate_id}"
        await self.redis.set(
            key,
            pickle.dumps(snapshot),
            ex=86400  # TTL: 24 hours
        )
    
    async def get(
        self,
        aggregate_type: str,
        aggregate_id: str
    ) -> Optional[Snapshot]:
        key = f"snapshot:{aggregate_type}:{aggregate_id}"
        data = await self.redis.get(key)
        if data:
            return pickle.loads(data)
        return None
```

### Snapshot Frequency Strategies

| Strategy | Trigger | Recovery Time | Storage Overhead | Complexity |
|---|---|---|---|---|
| **Count-based** | Every N events (e.g., 100) | Predictable | Moderate | Low |
| **Time-based** | Every T minutes (e.g., 15 min) | Varies by traffic | Moderate | Low |
| **Hybrid** | First of: N events OR T minutes | Bounded | Moderate | Medium |
| **Adaptive** | Based on event replay cost metric | Optimized | Low | High |
| **On-demand** | Snapshot only when requested | Varies | Minimal | Low |

### Snapshot Storage Options

| Storage | Read Speed | Write Speed | Durability | Best For |
|---|---|---|---|---|
| **Redis** | ~1ms | ~1ms | Volatile (with persistence) | Caching layer, high-speed recovery |
| **PostgreSQL** | ~5ms | ~5ms | Durable | Primary snapshot storage |
| **S3 / Object Store** | ~50ms | ~50ms | Durable | Archival snapshots, cold start |
| **Local filesystem** | <1ms | <1ms | Machine-local | Development, single-node |

### Snapshot Best Practices

1. **Snapshot at version boundaries**: Always snapshot at a known aggregate version so you know exactly which events to skip during replay.

2. **Store snapshot version alongside aggregate**: The snapshot's version tells you where to start replaying events.

3. **Consider snapshot size limits**: Very large aggregates can produce large snapshots. If a snapshot exceeds ~10MB, consider splitting the aggregate.

4. **Asynchronous snapshot creation**: Don't create snapshots in the command-handling hot path. Use a background process that periodically creates snapshots for aggregates that have accumulated many events.

5. **Snapshot invalidation**: If you change how state is derived from events (e.g., you add a new field), existing snapshots become stale. Either migrate them or accept that they'll be recomputed on next load.

```python
# Python: Background snapshotter
import asyncio
from datetime import datetime, timezone

class Snapshotter:
    def __init__(
        self,
        repository: AggregateRepository,
        snapshot_store: SnapshotStore,
        event_store: EventStore,
        frequency: int = 100
    ):
        self.repository = repository
        self.snapshot_store = snapshot_store
        self.event_store = event_store
        self.frequency = frequency  # Snapshot every N events
    
    async def run(self):
        """Continuously create snapshots for aggregates that need them."""
        while True:
            aggregates_needing_snapshots = await self._find_aggregates_for_snapshot()
            
            for agg_type, agg_id, version in aggregates_needing_snapshots:
                aggregate = await self.repository.load(agg_type, agg_id)
                
                snapshot = Snapshot(
                    aggregate_type=agg_type,
                    aggregate_id=agg_id,
                    version=aggregate.version,
                    state=self._extract_state(aggregate),
                    created_at=datetime.now(timezone.utc).isoformat()
                )
                await self.snapshot_store.save(snapshot)
                print(f"Snapshot saved: {agg_type}/{agg_id} @ v{aggregate.version}")
            
            await asyncio.sleep(60)  # Check every minute
    
    async def _find_aggregates_for_snapshot(self):
        # Query event store for aggregates whose latest event
        # is more than `frequency` events past their last snapshot
        # Implementation depends on your event store query capabilities
        pass
    
    def _extract_state(self, aggregate) -> dict:
        """Extract serializable state from aggregate for snapshot."""
        return {
            k: v for k, v in aggregate.__dict__.items()
            if not k.startswith('_') and k != 'changes'
        }
```

---

## Event Versioning and Schema Evolution

Events are immutable, but their schemas evolve. In 2026, the standard approach is to apply the **Upcaster Pattern**: when reading events, detect their schema version (stored in metadata) and transform them to the latest schema before processing.

### Upcaster Pattern

```mermaid
flowchart LR
    subgraph "Event Stream (various schemas)"
        E1["Event v1<br/>(2023)"] 
        E2["Event v1<br/>(2023)"]
        E3["Event v2<br/>(2024)"]
        E4["Event v3<br/>(2025)"]
        E5["Event v3<br/>(2025)"]
    end

    subgraph "Upcaster Chain"
        U1["Upcaster v1→v2"] --> U2["Upcaster v2→v3"]
    end

    subgraph "Canonical Form"
        C1["Event v3<br/>(canonical)"]
        C2["Event v3<br/>(canonical)"]
        C3["Event v3<br/>(canonical)"]
    end

    E1 & E2 --> U1
    E3 --> U2
    U1 --> U2
    U2 --> C1 & C2 & C3

    style E1 fill:#f5a623,color:#fff
    style E2 fill:#f5a623,color:#fff
    style E3 fill:#f5a623,color:#fff
    style E4 fill:#f5a623,color:#fff
    style E5 fill:#f5a623,color:#fff
    style U1 fill:#4a90d9,color:#fff
    style U2 fill:#4a90d9,color:#fff
    style C1 fill:#6abf69,color:#fff
```

### Python Upcaster Implementation

```python
# Python: Event upcaster for schema versioning
from typing import Dict, Any, List
from abc import ABC, abstractmethod
from dataclasses import dataclass

@dataclass
class StoredEvent:
    event_id: str
    aggregate_id: str
    version: int
    event_type: str
    event_data: Dict[str, Any]
    schema_version: int
    created_at: str

class EventUpcaster(ABC):
    @abstractmethod
    def can_upcast(self, event: StoredEvent) -> bool:
        """Returns True if this upcaster can handle the event."""
        pass
    
    @abstractmethod
    def upcast(self, event: StoredEvent) -> StoredEvent:
        """Transforms the event to a newer schema version."""
        pass

class OrderPlacedUpcasterV2(EventUpcaster):
    """
    Upcasts OrderPlaced events from schema v1 to v2.
    v1 had 'items' as a list of simple IDs.
    v2 requires 'items' as a list of objects with 'id', 'quantity', 'price'.
    """
    def can_upcast(self, event: StoredEvent) -> bool:
        return (
            event.event_type == "OrderPlaced" and 
            event.schema_version == 1
        )
    
    def upcast(self, event: StoredEvent) -> StoredEvent:
        data = dict(event.event_data)
        v1_items = data.get("items", [])
        v2_items = [
            {"id": item_id, "quantity": 1, "price": 0.0}
            if isinstance(item_id, str) else item_id
            for item_id in v1_items
        ]
        data["items"] = v2_items
        return StoredEvent(
            event_id=event.event_id,
            aggregate_id=event.aggregate_id,
            version=event.version,
            event_type=event.event_type,
            event_data=data,
            schema_version=2,
            created_at=event.created_at
        )

def apply_upcasters(event: StoredEvent, upcasters: List[EventUpcaster]) -> StoredEvent:
    """Apply all applicable upcasters in sequence."""
    for upcaster in upcasters:
        if upcaster.can_upcast(event):
            event = upcaster.upcast(event)
    return event
```

### Schema Evolution with Avro and Schema Registry

For systems using Kafka, **Avro** with **Schema Registry** provides a more structured approach to schema evolution with built-in compatibility checks:

```json
// Avro schema v1
{
  "type": "record",
  "name": "OrderPlaced",
  "fields": [
    {"name": "orderId", "type": "string"},
    {"name": "customerId", "type": "string"},
    {"name": "items", "type": {"type": "array", "items": "string"}},
    {"name": "totalAmount", "type": "double"}
  ]
}

// Avro schema v2 (backward compatible)
{
  "type": "record",
  "name": "OrderPlaced",
  "fields": [
    {"name": "orderId", "type": "string"},
    {"name": "customerId", "type": "string"},
    {"name": "items", "type": {
      "type": "array",
      "items": {
        "type": "record",
        "name": "OrderItem",
        "fields": [
          {"name": "id", "type": "string"},
          {"name": "quantity", "type": "int", "default": 1},
          {"name": "price", "type": "double", "default": 0.0}
        ]
      }
    }},
    {"name": "totalAmount", "type": "double"},
    {"name": "discount", "type": "double", "default": 0.0}
  ]
}
```

### Schema Evolution Compatibility Rules

| Compatibility Type | Allows | Rules |
|---|---|---|
| **BACKWARD** | New readers can read old data | Can add fields with defaults; cannot remove fields |
| **FORWARD** | Old readers can read new data | Can remove fields; cannot add required fields |
| **FULL** | Both backward and forward | Only add/remove fields with defaults |
| **NONE** | No compatibility guarantees | Any schema change is accepted |

### Event Migration Strategies

Beyond upcasting, there are two additional strategies for handling large-scale schema changes:

1. **Copy-and-Migrate**: Read all events of a given type, transform them, and write them to a new stream. Switch the aggregate to read from the new stream. The old stream is retained for audit.

2. **Lazy Migration**: Transform events on read only. This is the simplest approach and works well for most systems. The trade-off is that every read pays a transformation cost.

---

## Sagas and Process Managers

In distributed systems, a single business transaction often spans multiple aggregates and services. **Sagas** and **Process Managers** coordinate these multi-step transactions while maintaining data consistency.

### Saga Pattern

A saga is a sequence of local transactions where each step publishes an event that triggers the next step. If a step fails, the saga executes compensating transactions to undo previous steps.

```mermaid
sequenceDiagram
    participant OS as Order Service
    participant PS as Payment Service
    participant IS as Inventory Service

    OS->>OS: Create Order (Pending)
    OS->>PS: Reserve Payment
    PS-->>OS: Payment Reserved
    
    OS->>IS: Reserve Inventory
    alt Inventory Available
        IS-->>OS: Inventory Reserved
        OS->>OS: Confirm Order
    else Inventory Unavailable
        IS-->>OS: Reservation Failed
        OS->>PS: Cancel Payment (Compensate)
        OS->>OS: Cancel Order
    end
```

### Choreography vs. Orchestration

| Aspect | Choreography | Orchestration |
|---|---|---|
| **Coordination** | Decentralized (events) | Centralized (command handler) |
| **Coupling** | Loose (services react to events) | Tighter (services respond to commands) |
| **Visibility** | Harder to trace | Single point to monitor |
| **Complexity** | Lower per service | Higher (process manager complexity) |
| **Best for** | Simple workflows, few participants | Complex workflows, many participants |

### Process Manager Implementation

A **Process Manager** (also called a Saga orchestrator) is a stateful coordinator that listens to events and issues commands. It maintains its own state to track the progress of a multi-step workflow.

```python
# Python: Process Manager for order fulfillment
from dataclasses import dataclass, field
from typing import Dict, Optional
from enum import Enum

class FulfillmentState(Enum):
    STARTED = "started"
    PAYMENT_PENDING = "payment_pending"
    INVENTORY_PENDING = "inventory_pending"
    SHIPPING_PENDING = "shipping_pending"
    COMPLETED = "completed"
    FAILED = "failed"

@dataclass
class OrderFulfillmentProcess:
    """
    Process Manager that coordinates order fulfillment across
    Payment, Inventory, and Shipping services.
    """
    process_id: str
    order_id: str
    state: FulfillmentState = FulfillmentState.STARTED
    payment_approved: bool = False
    inventory_reserved: bool = False
    shipped: bool = False
    compensation_done: bool = False
    version: int = 0
    changes: list = field(default_factory=list)

    def handle_event(self, event: Dict) -> None:
        """Process an incoming event and update state."""
        event_type = event["event_type"]
        data = event["data"]
        
        if event_type == "OrderPlaced":
            self.state = FulfillmentState.PAYMENT_PENDING
            self.changes.append({
                "event_type": "RequestPaymentCommand",
                "data": {
                    "process_id": self.process_id,
                    "order_id": self.order_id,
                    "amount": data["total_amount"]
                }
            })
        
        elif event_type == "PaymentApproved":
            self.payment_approved = True
            self.state = FulfillmentState.INVENTORY_PENDING
            self.changes.append({
                "event_type": "ReserveInventoryCommand",
                "data": {
                    "process_id": self.process_id,
                    "order_id": self.order_id,
                    "items": data["items"]
                }
            })
        
        elif event_type == "PaymentDeclined":
            self.state = FulfillmentState.FAILED
            # No compensation needed — order never progressed
        
        elif event_type == "InventoryReserved":
            self.inventory_reserved = True
            self.state = FulfillmentState.SHIPPING_PENDING
            self.changes.append({
                "event_type": "InitiateShippingCommand",
                "data": {
                    "process_id": self.process_id,
                    "order_id": self.order_id,
                    "shipping_address": data["shipping_address"]
                }
            })
        
        elif event_type == "InventoryReservationFailed":
            self.state = FulfillmentState.FAILED
            # Compensate: release payment
            self.changes.append({
                "event_type": "RefundPaymentCommand",
                "data": {
                    "process_id": self.process_id,
                    "order_id": self.order_id,
                    "reason": "inventory_unavailable"
                }
            })
        
        elif event_type == "OrderShipped":
            self.shipped = True
            self.state = FulfillmentState.COMPLETED
        
        self.version += 1

    def is_complete(self) -> bool:
        return self.state in (FulfillmentState.COMPLETED, FulfillmentState.FAILED)
```

### Saga Example: Travel Booking

A hotel + flight booking saga demonstrates the choreography approach with compensating events:

```typescript
// TypeScript: Choreography-based saga for travel booking

interface TravelBookingEvent {
  type: string;
  bookingId: string;
  data: Record<string, unknown>;
}

// Hotel Service
class HotelService {
  async onBookingRequested(event: TravelBookingEvent): Promise<void> {
    try {
      // Attempt hotel reservation
      await this.reserveHotel(event.data.hotelId, event.data.dates);
      
      await this.publishEvent({
        type: 'HotelReserved',
        bookingId: event.bookingId,
        data: { hotel: event.data.hotelId, dates: event.data.dates }
      });
    } catch (error) {
      await this.publishEvent({
        type: 'HotelReservationFailed',
        bookingId: event.bookingId,
        data: { reason: (error as Error).message }
      });
    }
  }

  async onBookingCancelled(event: TravelBookingEvent): Promise<void> {
    // Compensating action: release hotel room
    await this.cancelHotelReservation(event.data.hotelId, event.data.dates);
    
    await this.publishEvent({
      type: 'HotelReservationReleased',
      bookingId: event.bookingId,
      data: { hotel: event.data.hotelId }
    });
  }

  private async publishEvent(event: TravelBookingEvent): Promise<void> {
    // Publish to event bus
    console.log(`[HotelService] Published: ${event.type}`);
  }

  private async reserveHotel(hotelId: string, dates: string[]): Promise<void> {
    // ... implementation
  }

  private async cancelHotelReservation(hotelId: string, dates: string[]): Promise<void> {
    // ... implementation
  }
}

// Flight Service
class FlightService {
  async onHotelReserved(event: TravelBookingEvent): Promise<void> {
    try {
      await this.bookFlight(event.data.bookingId as string);
      
      await this.publishEvent({
        type: 'FlightBooked',
        bookingId: event.bookingId,
        data: { flight: event.data.bookingId }
      });
    } catch (error) {
      // Trigger compensation for hotel
      await this.publishEvent({
        type: 'BookingCancelled',
        bookingId: event.bookingId,
        data: { reason: 'flight_unavailable' }
      });
    }
  }

  private async publishEvent(event: TravelBookingEvent): Promise<void> {
    console.log(`[FlightService] Published: ${event.type}`);
  }

  private async bookFlight(bookingId: string): Promise<void> {
    // ... implementation
  }
}
```

---

## Testing Event-Sourced Systems

Testing is arguably more important in ES/CQRS systems because the separation of concerns introduces more moving parts. A comprehensive testing strategy covers multiple levels.

### The Testing Pyramid for ES/CQRS

```mermaid
graph TD
    subgraph "Testing Pyramid for ES/CQRS"
        E2E["End-to-End Tests<br/>(Few)"]
        INT["Integration Tests<br/>(Some)"]
        AGG["Aggregate Unit Tests<br/>(Many)"]
        PROJ["Projector Tests<br/>(Many)"]
        SAGA["Saga / Process Manager Tests<br/>(Many)"]
    end

    style E2E fill:#d0021b,color:#fff
    style INT fill:#f5a623,color:#fff
    style AGG fill:#4a90d9,color:#fff
    style PROJ fill:#4a90d9,color:#fff
    style SAGA fill:#4a90d9,color:#fff
```

### Aggregate Unit Tests

Test the aggregate in isolation — given a sequence of events, verify that the correct events are produced:

```python
# Python: Aggregate unit tests
import pytest
from decimal import Decimal

def test_open_account_with_valid_initial_deposit():
    account = BankAccount.open_account(
        account_id="acc-001",
        customer_id="cus-001",
        initial_deposit=Decimal("100.00")
    )
    
    assert account.balance == Decimal("100.00")
    assert account.status == "active"
    assert len(account.changes) == 1
    assert account.changes[0]["event_type"] == "AccountOpened"

def test_open_account_below_minimum_deposit():
    with pytest.raises(ValueError, match="Minimum initial deposit"):
        BankAccount.open_account(
            account_id="acc-002",
            customer_id="cus-002",
            initial_deposit=Decimal("10.00")
        )

def test_deposit_increases_balance():
    account = BankAccount.open_account("acc-003", "cus-003", Decimal("100.00"))
    account.changes.clear()  # Clear setup events
    
    account.deposit(Decimal("50.00"), "salary")
    
    assert account.balance == Decimal("150.00")
    assert len(account.changes) == 1
    assert account.changes[0]["event_type"] == "DepositMade"
    assert account.changes[0]["data"]["amount"] == "50.00"

def test_withdrawal_below_overdraft_limit():
    account = BankAccount.open_account("acc-004", "cus-004", Decimal("100.00"))
    account.changes.clear()
    
    account.withdraw(Decimal("400.00"), "rent")
    
    assert account.balance == Decimal("-300.00")
    assert account.changes[0]["event_type"] == "WithdrawalMade"

def test_withdrawal_exceeds_overdraft_limit():
    account = BankAccount.open_account("acc-005", "cus-005", Decimal("100.00"))
    account.changes.clear()
    
    with pytest.raises(ValueError, match="exceed overdraft limit"):
        account.withdraw(Decimal("700.00"), "luxury_purchase")

def test_rebuild_from_events():
    """Test that replaying events produces the correct state."""
    events = [
        {
            "event_type": "AccountOpened",
            "data": {
                "account_id": "acc-006",
                "customer_id": "cus-006",
                "initial_deposit": "500.00"
            }
        },
        {
            "event_type": "DepositMade",
            "data": {
                "account_id": "acc-006",
                "amount": "200.00",
                "balance": "700.00",
                "reference": "gift"
            }
        },
        {
            "event_type": "WithdrawalMade",
            "data": {
                "account_id": "acc-006",
                "amount": "100.00",
                "balance": "600.00",
                "reference": "atm"
            }
        }
    ]
    
    account = BankAccount("", "")
    for event in events:
        account.apply_event(event)
    
    assert account.account_id == "acc-006"
    assert account.customer_id == "cus-006"
    assert account.balance == Decimal("600.00")
    assert account.status == "active"
    assert account.version == 3
```

### Projector Tests

Test that projectors correctly build read models from event streams:

```typescript
// TypeScript: Projector unit tests
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';

describe('OrderProjector', () => {
  let mongoServer: MongoMemoryServer;
  let client: MongoClient;
  let projector: OrderProjector;
  let mockEventStore: MockEventStore;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    client = await MongoClient.connect(mongoServer.getUri());
    mockEventStore = new MockEventStore();
    projector = new OrderProjector(client, mockEventStore as any);
  });

  afterAll(async () => {
    await client.close();
    await mongoServer.stop();
  });

  test('should create order read model on OrderPlaced', async () => {
    const event = {
      eventId: 'evt-001',
      aggregateId: 'order-001',
      aggregateType: 'Order',
      eventType: 'OrderPlaced',
      data: {
        userId: 'user-001',
        items: [{ id: 'prod-1', quantity: 2, price: 29.99 }],
        totalAmount: 59.98,
      },
      metadata: {},
      position: 1,
      timestamp: '2026-01-15T10:00:00Z',
    };

    mockEventStore.setEvents([event]);
    await projector['pollEvents']();

    const db = client.db('read_models');
    const order = await db.collection('orders').findOne({ orderId: 'order-001' });

    expect(order).not.toBeNull();
    expect(order?.status).toBe('pending');
    expect(order?.totalAmount).toBe(59.98);
    expect(order?.version).toBe(1);
  });

  test('should update order status on OrderConfirmed', async () => {
    // Seed with OrderPlaced event
    const db = client.db('read_models');
    await db.collection('orders').insertOne({
      orderId: 'order-002',
      userId: 'user-002',
      items: [],
      status: 'pending',
      totalAmount: 0,
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-01-15T10:00:00Z',
      version: 1,
    });

    const event = {
      eventId: 'evt-002',
      aggregateId: 'order-002',
      aggregateType: 'Order',
      eventType: 'OrderConfirmed',
      data: { orderId: 'order-002', version: 2 },
      metadata: {},
      position: 2,
      timestamp: '2026-01-15T10:05:00Z',
    };

    mockEventStore.setEvents([event]);
    await projector['pollEvents']();

    const order = await db.collection('orders').findOne({ orderId: 'order-002' });
    expect(order?.status).toBe('confirmed');
    expect(order?.version).toBe(2);
  });

  test('should handle duplicate events idempotently', async () => {
    // Deliver the same event twice
    const event = {
      eventId: 'evt-003',
      aggregateId: 'order-003',
      aggregateType: 'Order',
      eventType: 'OrderPlaced',
      data: { userId: 'user-003', items: [], totalAmount: 100 },
      metadata: {},
      position: 3,
      timestamp: '2026-01-15T11:00:00Z',
    };

    mockEventStore.setEvents([event, event]); // Duplicate
    await projector['pollEvents']();

    const db = client.db('read_models');
    const orders = await db.collection('orders')
      .find({ orderId: 'order-003' })
      .toArray();

    expect(orders.length).toBe(1); // Should not create duplicate
  });
});

class MockEventStore {
  private events: any[] = [];

  setEvents(events: any[]) {
    this.events = events;
  }

  async getEventsSince(position: number, options?: any) {
    return this.events.filter((e) => e.position > position);
  }
}
```

### Integration Tests

Test the full pipeline — command → event store → projector → read model:

```python
# Python: Integration test for the full ES/CQRS pipeline
import pytest
from unittest.mock import AsyncMock

@pytest.mark.asyncio
async def test_order_workflow_integration():
    """Test the complete flow: command → store → projector → read."""
    # Setup
    event_store = PostgresEventStore("postgresql://test:test@localhost:5432/test")
    snapshot_store = RedisSnapshotStore(AsyncMock())
    repository = AggregateRepository(event_store, snapshot_store)
    
    # Clean up before test
    # (In production, use separate test databases)
    
    # Step 1: Place order (command side)
    items = [
        OrderItem(product_id="prod-1", quantity=2, price=29.99),
        OrderItem(product_id="prod-2", quantity=1, price=49.99)
    ]
    order = OrderAggregate.place_order(
        order_id="int-test-001",
        customer_id="customer-001",
        items=items
    )
    
    assert len(order.changes) == 1  # OrderPlaced event
    
    # Step 2: Save to event store
    repository.save(order)
    
    # Step 3: Confirm order
    order.confirm_order()
    repository.save(order)
    
    # Step 4: Load aggregate from event store (verify replay)
    loaded_order = repository.load(OrderAggregate, "int-test-001")
    assert loaded_order.status == OrderStatus.CONFIRMED
    assert loaded_order.version == 2
    assert loaded_order.total_amount == pytest.approx(29.99 * 2 + 49.99)
    
    # Step 5: Verify projector would build correct read model
    events = event_store.get_events("Order", "int-test-001")
    assert len(events) == 2
    assert events[0]["event_type"] == "OrderPlaced"
    assert events[1]["event_type"] == "OrderConfirmed"
```

### Testing Checklist for ES/CQRS

| Test Type | What to Test | Key Assertions |
|---|---|---|
| **Aggregate** | Command validation, event production | Correct events, state changes, error conditions |
| **Aggregate Replay** | Event application in `apply_event` | State matches expected after replaying event sequence |
| **Upcaster** | Event schema transformation | Old schema → new schema, field defaults |
| **Projector** | Read model building | Correct document created/updated, checkpoints advance |
| **Idempotency** | Duplicate event handling | No duplicate documents, no state corruption |
| **Saga/Process Manager** | Multi-step workflow | Correct sequence of commands, compensation on failure |
| **Concurrency** | Concurrent writes to same aggregate | Optimistic concurrency violations detected |
| **Integration** | End-to-end command → read model | Event published, projected, queryable |

---

## Event-Driven Microservices Integration

ES/CQRS naturally complements event-driven microservice architectures. Here's how they fit together.

### Integration Patterns

| Pattern | Description | When to Use |
|---|---|---|
| **Event Carried State Transfer** | Events carry full data needed by consumers | Reduces coupling; consumers don't need to call back |
| **Transactional Outbox** | Events published reliably via DB transaction | Guarantees at-least-once delivery |
| **Change Data Capture** | Capture changes from DB log (Debezium) | Non-invasive; works with existing systems |
| **Saga** | Distributed transaction coordination | Multi-service business workflows |
| **CQRS Views** | Per-service read models | Services need different data shapes |

### Transactional Outbox Pattern

When both the event store and an external system (e.g., a search index) need to be updated atomically, the dual-write problem emerges. The **Transactional Outbox** pattern solves this elegantly:

```python
# Python: Transactional outbox implementation
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
import json
from uuid import uuid4

class TransactionalOutbox:
    def __init__(self, db_session: Session):
        self.session = db_session
    
    def publish_event(
        self,
        aggregate_type: str,
        aggregate_id: str,
        event_type: str,
        data: dict
    ):
        """Atomically persists an event in the outbox alongside business data."""
        outbox_entry = {
            "id": str(uuid4()),
            "aggregate_type": aggregate_type,
            "aggregate_id": aggregate_id,
            "event_type": event_type,
            "data": json.dumps(data),
            "created_at": "2026-06-22T12:00:00Z",
            "processed": False
        }
        
        # Insert into outbox within the same transaction as business data
        self.session.execute(
            text("""
                INSERT INTO event_outbox (
                    id, aggregate_type, aggregate_id, 
                    event_type, data, created_at, processed
                )
                VALUES (
                    :id, :aggregate_type, :aggregate_id, 
                    :event_type, :data, :created_at, :processed
                )
            """),
            outbox_entry
        )
        self.session.commit()

# Outbox relay: reads from outbox and publishes to event store
class OutboxRelay:
    def __init__(self, db_session_factory, event_store, batch_size=100):
        self.db_session_factory = db_session_factory
        self.event_store = event_store
        self.batch_size = batch_size
    
    def process_outbox(self):
        session = self.db_session_factory()
        try:
            # Fetch unprocessed outbox entries
            entries = session.execute(
                text("""
                    SELECT * FROM event_outbox 
                    WHERE processed = FALSE 
                    ORDER BY created_at ASC 
                    LIMIT :limit
                    FOR UPDATE SKIP LOCKED
                """),
                {"limit": self.batch_size}
            ).fetchall()
            
            for entry in entries:
                try:
                    # Publish to event store
                    self.event_store.append(
                        aggregate_type=entry.aggregate_type,
                        aggregate_id=entry.aggregate_id,
                        events=[{
                            "event_type": entry.event_type,
                            "data": json.loads(entry.data)
                        }],
                        expected_version=None  # Let event store assign version
                    )
                    
                    # Mark as processed
                    session.execute(
                        text("UPDATE event_outbox SET processed = TRUE WHERE id = :id"),
                        {"id": entry.id}
                    )
                except Exception as e:
                    session.rollback()
                    # Log error, maybe move to DLQ
                    print(f"Failed to process outbox entry {entry.id}: {e}")
                    return  # Will retry on next cycle
            
            session.commit()
        finally:
            session.close()
```

### Inter-Service Communication

Events flow between services through a message broker. Each service maintains its own event store and read models:

```mermaid
graph TD
    subgraph "Order Service"
        OS_CMD["Command Handler"] --> OS_ES[("Event Store")]
        OS_ES --> OS_PROJ["Projector"]
        OS_PROJ --> OS_RM[("Read Model")]
    end

    subgraph "Payment Service"
        PS_CMD["Command Handler"] --> PS_ES[("Event Store")]
        PS_ES --> PS_PROJ["Projector"]
        PS_PROJ --> PS_RM[("Read Model")]
    end

    subgraph "Shipping Service"
        SS_CMD["Command Handler"] --> SS_ES[("Event Store")]
        SS_ES --> SS_PROJ["Projector"]
        SS_PROJ --> SS_RM[("Read Model")]
    end

    OS_ES --> |"Event Bus (Kafka)"| PS_ES
    OS_ES --> |"Event Bus (Kafka)"| SS_ES
    
    PS_ES --> |"Event Bus (Kafka)"| OS_ES
    PS_ES --> |"Event Bus (Kafka)"| SS_ES

    style OS_ES fill:#4a90d9,color:#fff
    style PS_ES fill:#f5a623,color:#fff
    style SS_ES fill:#6abf69,color:#fff
```

### Event Carried State Transfer

In this pattern, events carry enough data so that consuming services don't need to call back to the producing service to understand the event:

```typescript
// TypeScript: Event with carried state
interface OrderPlacedEvent {
  eventType: 'OrderPlaced';
  data: {
    orderId: string;
    // Carried state — consumer doesn't need to call Order Service
    customer: {
      id: string;
      name: string;
      email: string;
    };
    items: Array<{
      productId: string;
      name: string;
      quantity: number;
      unitPrice: number;
    }>;
    shippingAddress: {
      street: string;
      city: string;
      zipCode: string;
      country: string;
    };
    totalAmount: number;
    currency: string;
  };
  metadata: {
    correlationId: string;
    causationId: string;
    timestamp: string;
  };
}
```

---

## Performance and Optimization

ES/CQRS systems have specific performance characteristics that require targeted optimization.

### Event Store Performance

| Optimization | Impact | Implementation |
|---|---|---|
| **Partitioned tables** | Faster stream reads | Partition by `aggregate_type` or date range |
| **Append-only index** | Faster writes | B-Tree on `(aggregate_id, version)` for concurrency checks |
| **Batch writes** | Higher throughput | Buffer events and flush in batches |
| **Archival** | Reduced storage costs | Move old events to cold storage (S3, Glacier) |
| **Compression** | Reduced storage & I/O | Use `TOAST` compression in PostgreSQL, Snappy in Kafka |

### Projector Performance

| Technique | Latency | Throughput | Complexity |
|---|---|---|---|
| **Batch processing** | Higher | Higher | Low |
| **Parallel projection** | Lower | Higher | Medium |
| **Stateful projection** | Lowest | Highest | High (needs state management) |
| **Idempotent handlers** | Same | Same | Low (critical for correctness) |

### Caching Strategies

```python
# Python: Cache-aside pattern for read models
import aioredis
from typing import Optional, Dict, Any
import json

class CachedReadModel:
    def __init__(self, db_client, redis_client: aioredis.Redis, ttl: int = 300):
        self.db = db_client
        self.redis = redis_client
        self.ttl = ttl  # Cache TTL in seconds
    
    async def get_order(self, order_id: str) -> Optional[Dict[str, Any]]:
        # Try cache first
        cache_key = f"order:{order_id}"
        cached = await self.redis.get(cache_key)
        if cached:
            return json.loads(cached)
        
        # Cache miss — fetch from database
        order = await self.db.collection("orders").find_one({"orderId": order_id})
        if order:
            await self.redis.setex(cache_key, self.ttl, json.dumps(order))
        
        return order
    
    async def invalidate_order(self, order_id: str):
        """Invalidate cache when a new event is projected."""
        await self.redis.delete(f"order:{order_id}")
```

### Optimistic Concurrency in High-Contention Scenarios

High-contention aggregates (e.g., a product inventory counter) can suffer from frequent concurrency conflicts. Strategies to mitigate:

1. **Command Batching**: Batch multiple operations into a single command that produces one event.
2. **State-Free Aggregates**: If an aggregate only needs to validate that an operation is permissible based on the latest event (not the full state), you can reduce replay cost.
3. **Partitioned Aggregates**: Split a hot aggregate into multiple physical aggregates. For example, `InventoryItem-warehouse-1`, `InventoryItem-warehouse-2` instead of a single `InventoryItem` aggregate.
4. **Fact Tables**: For append-only facts (like "page view count"), use a dedicated fact table that doesn't require aggregate-level concurrency control.

### Read Model Refresh Strategies

| Strategy | Latency | Consistency Guarantee | Use Case |
|---|---|---|---|
| **Eager projection** | ~10-100ms | Eventual (near real-time) | Customer-facing dashboards |
| **Lazy projection** | On read | Read-time consistency | Rarely accessed views |
| **Scheduled refresh** | 5-60 min | Batch consistency | Reporting, analytics |
| **Real-time streaming** | <10ms | Eventual (very fresh) | Live monitoring, alerts |

---

## Real-World Case Studies

### Case Study 1: Financial Trading Platform

A European stock exchange replaced its legacy settlement system with an ES/CQRS architecture:

**Challenge**: The legacy system used a monolithic SQL database with row-level locking. During market open, write contention caused settlement delays of up to 45 minutes.

**Solution**:
- EventStoreDB for the event store (purpose-built for financial audit requirements)
- CQRS separation: command side handled 15,000 trades/second; query side used Redis-backed read models for portfolio views
- Snapshot every 50 events per aggregate
- Sagas for multi-asset settlement workflows

**Results**:
- 40x improvement in write throughput (15K trades/sec vs. 375/sec)
- P99 query latency under 5ms (down from 2 seconds)
- Full audit trail with temporal query capability — can reconstruct any portfolio's state as of any trading day
- Regulatory compliance simplified: auditors can replay trades directly from the event store

### Case Study 2: Global E-Commerce Platform

A major retailer with operations in 12 countries migrated their order management system:

**Challenge**: Different countries had different order lifecycle rules, tax calculations, and fulfillment workflows. The monolithic order system was brittle and required coordinated releases for any change.

**Solution**:
- PostgreSQL as event store (leveraging existing PostgreSQL operational expertise)
- Per- bounded-context services (Order, Payment, Inventory, Shipping, Returns)
- Process managers for each order lifecycle variant (domestic, cross-border, subscription)
- Transactional outbox pattern for reliable event publication
- Upcasters for schema evolution across 3 major event schema versions in 18 months

**Results**:
- Each country's fulfillment process could be changed independently
- New country onboarding reduced from 6 months to 3 weeks
- Zero data loss during schema migrations (upcasters handled transparently)
- 99.99% uptime for order processing

### Case Study 3: IoT Fleet Management

A logistics company managing 50,000+ IoT-tracked vehicles:

**Challenge**: Each vehicle emitted GPS, engine diagnostics, and status events every 30 seconds — over 100 million events per day. The relational database couldn't keep up with writes.

**Solution**:
- Apache Kafka for event ingestion (1M+ events/second throughput)
- Kafka Streams for real-time processing (geofencing alerts, route optimization)
- Materialized views in Elasticsearch for fleet operator dashboards
- Time-based snapshots: aggregate vehicle state hourly for quick recovery
- Long-term event archival to S3 (after 90 days) with Parquet format for analytics

**Results**:
- Ingested 3+ billion events per month with 0 data loss
- Real-time geofence alerts delivered in under 500ms
- Fleet operator queries returned in under 100ms (from Elasticsearch)
- Storage costs reduced 70% by tiered storage (Kafka → S3)

### Case Study 4: Healthcare Claims Processing

A health insurance provider processing 2 million claims per month:

**Challenge**: Claims could take 2-3 weeks to process due to complex validation rules, provider verification, and payment coordination. The audit trail was stored in a separate system requiring manual reconciliation.

**Solution**:
- EventStoreDB with built-in projections for claim status tracking
- CQRS with separate read models for members, providers, and payments
- Saga orchestrator for the end-to-end claim lifecycle (submission → validation → adjudication → payment)
- Snapshot after each major state transition (not count-based, but event-specific)

**Results**:
- Claim processing time reduced from 2-3 weeks to 24-48 hours
- Complete audit trail with zero reconciliation overhead
- Compliance audits that previously took 3 weeks completed in 2 days
- 60% reduction in operational costs for claims processing

| Metric | Before (Monolith) | After (ES/CQRS) |
|---|---|---|
| Claim processing time | 2-3 weeks | 24-48 hours |
| Audit reconciliation | 3 weeks | Real-time |
| Write throughput | 50 claims/sec | 2,000 claims/sec |
| Query throughput | 200 queries/sec | 10,000 queries/sec |
| Operational cost | Baseline | 60% reduction |
| Schema changes | Coordinated release | Independent per service |

---

## Conclusion

Event Sourcing and CQRS are not silver bullets — they introduce complexity in exchange for scalability, auditability, and architectural flexibility. For domains where write throughput, temporal queries, and complete audit trails are paramount — such as financial trading systems, supply chain logistics, multi-tenant SaaS platforms, and healthcare — the trade-offs are well justified.

### When to Use ES/CQRS

| Consider ES/CQRS When... | Avoid ES/CQRS When... |
|---|---|
| ✅ You need a complete audit trail | ❌ Your domain has simple CRUD operations |
| ✅ You want temporal query capability ("state at any point in time") | ❌ You need strong consistency across many aggregates |
| ✅ Write throughput exceeds read throughput significantly | ❌ Your team is new to event-driven architecture |
| ✅ Multiple applications consume the same data | ❌ The domain has very few state changes per entity |
| ✅ You need to scale read and write independently | ❌ Eventual consistency is unacceptable for core workflows |
| ✅ The domain has complex business rules with state transitions | ❌ The additional operational complexity outweighs benefits |

### Key Takeaways

1. **Start small**: Model a single bounded context with ES/CQRS before expanding to others. Validate your projection latency and consistency requirements with real traffic.

2. **Invest in tooling**: Transactional outbox relays, snapshot management, and event schema registries are not optional — they're essential production infrastructure.

3. **Design for evolution**: Event schemas will change. Invest in upcasters, backward-compatible schemas, and schema registries from day one.

4. **Monitor everything**: Event pipeline health requires observability into projection lag, dead letter queues, and consumer group offsets. Without it, you're flying blind.

5. **Test the replay**: Your most important test is the ability to rebuild all read models from the raw event store. Test this regularly in staging environments.

6. **Embrace eventual consistency**: Design your user experience to handle the temporal gap between command and query. Optimistic UI updates and read-your-writes consistency make this invisible to users.

As distributed systems continue to evolve toward event-driven and streaming-first architectures, the patterns described here — transactional outboxes, upcasters for schema evolution, idempotent projectors, polyglot read models, and saga orchestrators — will remain foundational tools in the architect's toolkit. The systems that thrive in 2026 and beyond will be those that embrace immutability, auditability, and asynchronous decoupling at their core.
