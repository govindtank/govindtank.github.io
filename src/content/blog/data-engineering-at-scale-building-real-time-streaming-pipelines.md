---
title: "Data Engineering at Scale: Building Real-Time Streaming Pipelines"
slug: "data-engineering-at-scale-building-real-time-streaming-pipelines"
date: "June 19, 2026"
excerpt: >
coverImage: "https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&q=80&w=1200"
category: "Data-Engineering"
readTime: 22
tags:
  - "Data-Engineering"
  - "Streaming"
  - "Apache Kafka"
  - "Apache Flink"
  - "Real-Time Analytics"
archetype: "war-story"
---


# Data Engineering at Scale: Building Real-Time Streaming Pipelines

A few years back I was the senior engineer on a platform team for a retail company. We owned the real-time analytics pipeline: orders, cart events, and click events streamed into Kafka, a Flink job turned them into per-minute revenue numbers, and a dashboard showed the business how the day was going.

The pipeline was beautiful on the diagram. That's the first thing I tell people when they ask how it went. Boxes for ingestion, a clean event schema, a nicely partitioned topic, a stateful aggregation job, a sink to ClickHouse. We even drew the arrows at right angles, like an architect's rendering. I've since learned that the quality of a data pipeline diagram is inversely correlated with the quality of the nights you'll spend debugging it.

It fell over in production on a Tuesday during a clearance sale, and it took us most of a week to admit that we were the ones who broke it, not the infrastructure.

## The setup, and the assumptions we made

The data path looked simple on paper. A checkout service produced one `order_placed` event per order, with line items, totals, and a timestamp. Click events were noisier — hundreds of millions a day in normal times, and the sale pushed that to several times normal. The Flink job keyed everything by store and product, kept a rolling aggregation in keyed state, and emitted a summary record every minute. The sink wrote those summaries to ClickHouse, and the dashboard queried ClickHouse.

We had made three assumptions, and all three were wrong in interesting ways. First, that event time was the right clock: the job used event-time windows with watermarks so that late-arriving orders would land in the correct minute. Second, that Kafka was the bottleneck, so we over-partitioned the click topic "for headroom." Third, that checkpointing would save us: Flink checkpoints state to a backend, and on failure the job restores and replays from the last good checkpoint. In staging, everything held together. Staging data is polite. Production data is not polite.

## The failure, and our wrong guesses

The sale started at midnight. By 12:40 a.m. the dashboard numbers were frozen. Not wrong — frozen. The revenue line stopped moving, which for a finance team on a sale day is roughly equivalent to a fire alarm.

My first guess was Kafka. Consumers lagging, partitions hot, the usual suspects. We added partitions to the click topic. That made things worse, because the job's parallelism followed the partitions, and more parallel subtasks meant a bigger checkpoint state and more network shuffle for the aggregation. We then blamed the sink: ClickHouse must be slow. It wasn't. We blamed the cluster, the network, the Kubernetes autoscaler. Each wrong guess ate hours, and each one felt plausible at the time. At 3 a.m. I was in the Flink UI staring at a watermark line that hadn't moved in hours, and the only honest thought in my head was that the dashboard had been frozen since midnight and we still didn't know why. The on-call rotation that week was me, which is how I know the timeline so well.

The actual cause was boring, which is its own lesson. The click topic had an idle partition — a producer keyed by `user_id` hash had a handful of dead clients, and a slice of the hash space went quiet. With event-time processing and no idle handling, the watermark is the minimum across all partitions. One silent partition pinned the watermark in the past, so the per-minute windows never fired. The dashboard wasn't showing stale numbers; it was showing no numbers at all, because the windows were waiting on a partition that had nothing to say.

Meanwhile, the consumer lag behind the hot partitions climbed, checkpoints started timing out, the job restarted, replayed from the last checkpoint, and fell further behind. A death spiral, and every restart made it worse, because the recovery read competed with live traffic for the same resources.

## Fix one: backpressure is a contract, not a knob

The first change was the least glamorous: we stopped pretending the system could absorb any rate and made the consumer respect the slowest stage. The ingestion service had a tight polling loop that looked fast and behaved badly under load. The rewritten version pauses the assignment when the sink is slow, so Kafka holds the data instead of our process buffering it into a memory balloon:

```python
from confluent_kafka import Consumer

consumer = Consumer({
    "bootstrap.servers": "kafka:9092",
    "group.id": "orders-aggregator",
    "max.poll.interval.ms": 300000,
})
consumer.subscribe(["orders"])

while True:
    msgs = consumer.consume(num_messages=500, timeout=1.0)
    if not msgs:
        continue
    rows = [transform(m) for m in msgs if not m.error()]
    if not write_batch(rows):                # the sink is the constraint
        consumer.pause(consumer.assignment())  # push back, don't buffer
        continue
    consumer.commit(asynchronous=False)
    consumer.resume(consumer.assignment())
```

That's the whole trick. When the sink is slow, pause. When it catches up, resume. Kafka's retention is your buffer; your process heap is not. Once we stopped buffering inside the consumer, memory stayed flat, and the lag became a visible, alertable number instead of a hidden crash risk.

## Fix two: watermarks need an idle timeout

The second fix targeted the actual freeze. Every event-time job I touch now gets idle detection, because I learned the hard way that a silent partition freezes the whole watermark:

```java
stream.assignTimestampsAndWatermarks(
    WatermarkStrategy.<ClickEvent>forBoundedOutOfOrderness(Duration.ofSeconds(10))
        .withIdleness(Duration.ofMinutes(2))
        .withTimestampAssigner((event, ts) -> event.timestamp));
```

`withIdleness` tells the job: if a partition has been silent for two minutes, stop waiting on it, and let the windows fire based on the partitions that are actually producing. That single call un-froze the dashboard. It cost us a week of nights to learn that it belongs in every pipeline by default, not as an afterthought for "edge cases."

## Fix three: cap your state

The third fix was about the checkpoint death spiral. The aggregation kept one rolling window per store-product pair, and we had millions of pairs. Every checkpoint serialized all of it. When the job fell behind, the state grew, checkpoints got slower, and the job fell further behind. We were paying for state at a granularity we didn't need. The fix wasn't a tuning exercise. We drew the aggregation tree on a whiteboard, counted where the cardinality actually lived, and cut the streaming job down to what only it could do: absorb the raw event rate and reduce it once. Everything after that was a database problem.

The honest solution was less state, not faster checkpoints. We stopped aggregating at the finest grain in the streaming job and pushed the final grouping down into ClickHouse, which is actually good at that kind of query. The streaming job now emits per-store summaries and lets the database do the rest. Where we did keep keyed state, we put a time-to-live on it so stale keys couldn't accumulate forever:

```java
StateTtlConfig ttl = StateTtlConfig
    .newBuilder(Time.hours(24))
    .setUpdateType(StateTtlConfig.UpdateType.OnCreateAndWrite)
    .build();
```

Checkpoint size dropped by an order of magnitude. Restarts went from minutes to seconds. The death spiral lost its fuel.

## What I'd do differently

If I got to rebuild that pipeline with what I know now, I would start boring. Processing-time windows for the dashboard, because the business wanted "the last minute," not a formally correct event-time answer. One aggregation layer instead of three. A dead-letter topic from day one, so malformed events stop the consumer without stopping the pipeline. We also would have tested with replayed production traffic instead of synthetic data. The generator never produced an idle partition, because it never produced a quiet hour. Replay would have shown us the freeze in an afternoon. Alerting on consumer lag and checkpoint duration before the sale, not after.

I would also question the "at scale" framing sooner. The volume was large, but the job's complexity came from us, not from the data. We had built a wedding cake — custom serialization, a hand-rolled schema wrapper, two abstraction layers for "flexibility" — and it collapsed under load the way wedding cakes do, because the decorations were load-bearing.

## The boring takeaway

Real-time pipelines fail in predictable ways: idle partitions freeze watermarks, unbounded state bloats checkpoints, and consumers that buffer instead of pushing back hide their problems until they run out of memory. All three have boring, well-documented fixes. The expensive part is admitting that the diagram was the problem — that the fancy parts were the failure, not the success.

When someone asks me how to build streaming at scale, I tell them to start with the plainest pipeline that answers the question, put alerting on lag and checkpoint time, and add event time only when they can show that processing time is wrong. The sale taught me that the pipeline that survives is the one nobody had to draw twice. And when the next vendor walks in with a fancier framework, I ask what failure mode it removes. If the answer is a diagram improvement, the meeting is over.
