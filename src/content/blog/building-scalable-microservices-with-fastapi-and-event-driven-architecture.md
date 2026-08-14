---
title: "Building Scalable Microservices with FastAPI and Event-Driven Architecture"
slug: "building-scalable-microservices-with-fastapi-and-event-driven-architecture"
date: "June 23, 2026"
excerpt: >
coverImage: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&q=80&w=1200"
category: "Backend-Architecture"
readTime: 5
tags:
  - "Backend-Architecture"
archetype: "opinion"
---


# Building Scalable Microservices with FastAPI and Event-Driven Architecture

Every architecture review I sit in starts the same way. Someone draws a rectangle for each service, arrows between them, and a bus in the middle labeled "events." Then they ask what I think, and I ask what problem the diagram solves. If the answer is "we want to be scalable," we're in for a long meeting.

Here's my position, stated plainly: FastAPI makes it so cheap to spin up a microservice that the cost of microservices has become invisible, and an event bus does not fix a monolith's problems — it relocates them to a place that's harder to debug. Most teams should start with a modular monolith and split on evidence, not on a diagram. Event-driven architecture is a tool for specific jobs, not a default posture.

## The mainstream view, stated fairly

I should steelman the other side, because the advice to go microservices-plus-events isn't stupid. Independent services do scale independently: the payment service can run twenty replicas while the catalog runs two. Teams can own code end to end without merge conflicts. And events, the argument goes, decouple producers from consumers — the order service publishes `OrderPlaced` and doesn't care who listens, so you can add a fraud checker, a warehouse system, and a marketing emailer without touching the producer.

All of that is true. I've seen it work. I spent a year on a payments platform where the split was justified: PCI scope, a separate failure domain, a team that owned the whole surface. The events flowing between the order system and the payment system carried real weight, and that architecture earned its operational tax. I'm not arguing that story never happens. I've also seen the same architecture eat a company's velocity for two years while a team of ten ran the infrastructure that the boxes-and-arrows diagram never showed.

## The cost nobody puts on the slide

Microservices move the complexity out of the code and into the seams, and the seams are where the pain lives: distributed transactions that don't exist, debugging across service logs, versioned contracts between services, retry storms when a consumer is down, and the small army of tooling — service discovery, tracing, secret management, a CI pipeline per service — that each new rectangle demands.

The tell is when the team size stays flat. If you go from one service to eight and your headcount doesn't change, someone is eating the difference with their evenings.

There's also the deployment tax. Every new service means a new image build, a new rollout, a new rollback story, and a new on-call page. The monolith deploys once and rolls back as one unit; a fleet of services deploys in sequence, and a bad release can be half-finished before anyone notices. I've watched a team spend a quarter building deployment tooling for services that, taken together, handled less traffic than the one service they replaced.

## Start with a modular monolith

FastAPI is actually the best argument I know for starting boring. A single FastAPI app with clear internal boundaries gives you most of the discipline of microservices — separated modules, explicit dependencies, testable seams — without paying for the network yet. The app factory pattern keeps the boundaries honest:

```python
from fastapi import FastAPI
from orders.api import router as orders_router
from inventory.api import router as inventory_router
from payments.api import router as payments_router

def create_app() -> FastAPI:
    app = FastAPI(title="Store backend")
    app.include_router(orders_router, prefix="/orders")
    app.include_router(inventory_router, prefix="/inventory")
    app.include_router(payments_router, prefix="/payments")
    return app
```

That's not a toy. One process, one deployable, one Postgres, and three modules that could each become a service later without a rewrite — the routers become the service boundaries. I have shipped exactly this shape for a mid-size store backend and watched it handle traffic fine. The FastAPI ecosystem made the boundaries cheap to keep honest: each module owned its schemas, its tests, and its router, and the only shared things were the database and the app object. When the day came to extract a service, the module was already service-shaped.

The reasons to split later are concrete and measurable: two teams fighting over the same deploy; one module with scaling needs an order of magnitude different from the rest; a failure domain that shouldn't take down the whole app. When those appear, the modular boundaries are already drawn, and the split is surgery instead of archaeology.

## Events are a tool, not a strategy

The same skepticism applies to the event bus. Event-driven architecture is the right answer to a specific question: which of my dependencies can tolerate asynchronous, at-least-once delivery? An email after an order doesn't need to be synchronous — a queue or a background task is the natural fit. Updating the inventory count that the order page shows does need to be synchronous, and putting it behind an event means a consumer failure silently leaves stock wrong.

FastAPI's `BackgroundTasks` covers a surprising amount of async work with no broker in sight:

```python
from fastapi import FastAPI, BackgroundTasks

app = FastAPI()

def send_order_confirmation(order_id: int):
    email_client.send(order_id)  # slow, retryable, not user-visible

@app.post("/orders")
def create_order(order: OrderIn, background: BackgroundTasks):
    order_id = save_order(order)          # boring, transactional, fast
    background.add_task(send_order_confirmation, order_id)
    return {"order_id": order_id}
```

Note what I did not do: I didn't publish an event for the confirmation, because nothing else consumes it. The moment a second consumer appears — say, the loyalty program wants order events — that's when you introduce a real queue, and you do it with the outbox pattern so the event is written in the same transaction as the order.

## Where event-driven earns its keep

I don't want to be read as anti-events. There are jobs where events are clearly right. Fan-out: one event, many consumers, each scaled independently. Reliable integration with third parties: the outbox pattern turns "publish once, exactly when the data changes" into a database guarantee instead of a hope. Spiky asynchronous work: image resizing, invoice generation, notification floods. And read-model building: events feeding a search index or a reporting store beats synchronous dual writes. A concrete example: when product data changed, we used to update the search index in the request path, and every slow index write became a slow product update. Moving that behind events meant the catalog service published changes and the indexer consumed them at its own pace. Product updates got faster, and index lag became a monitored number instead of a mystery.

The test I apply in reviews is simple. If I made this consumer synchronous, would anything break, or would it just be slower? If it would just be slower, it's a candidate for events. If it would break — the response depends on the consumer's result — events are the wrong tool, and I don't care how many boxes the diagram has.

## The counterarguments, answered

"You can't scale a monolith." You can scale a read-heavy monolith very far with replicas and a cache before you ever need per-service scaling. I've seen a single boring service serve traffic that would embarrass a twelve-service fleet, because the database was the constraint either way, and the monolith had no network round trips to waste.

"Teams can't share code without microservices." That's a process problem wearing an architecture costume. A modular monolith with owned packages solves it too, and it doesn't force you to version APIs between teams.

"Events make us future-proof." Nothing in software is future-proof. What events buy you — decoupling, replay, audit trails — is real, but you pay for it in eventual consistency and operational surface. Buying it before a consumer exists is paying interest on a loan you haven't taken.

"But we'll need events someday." Fine. Build the outbox when you need it, not before. The pattern is a weekend of work, and it gives you the same publishing guarantee as a broker you've already paid for. Deferring it doesn't foreclose the option; it just means you don't operate the machinery while the need is still theoretical.

## The boring takeaway

Here's what I actually recommend, and it fits on one line: one FastAPI service, one Postgres, background tasks for async work, and a queue added only when a second consumer or a real scale requirement shows up with evidence. Split modules into services when the org chart or the metrics demand it. Add events when there's a consumer who benefits from them.

It's not a sexy architecture. Nobody draws a conference slide of a modular monolith. But it's the architecture that lets you ship features, sleep through the night, and keep the diagram honest — and in my twelve years, that's the rarest property of all. The recommendation is not a lack of ambition; it's the same calculus I apply to my own code. The system that's boring to operate gets operated well, and the system that's exciting to build gets rebuilt in a year.
