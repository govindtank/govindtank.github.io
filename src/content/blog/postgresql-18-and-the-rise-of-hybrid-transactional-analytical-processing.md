---
title: "PostgreSQL 18 and the Rise of Hybrid Transactional-Analytical Processing"
slug: "postgresql-18-and-the-rise-of-hybrid-transactional-analytical-processing"
date: "July 30, 2026"
excerpt: >
coverImage: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&q=80&w=1200"
category: "Databases"
readTime: 5
tags:
  - "Databases"
archetype: "opinion"
---
  PostgreSQL 18 ships an experimental columnar access method, and the HTAP question is suddenly real. It replaces a warehouse for some workloads. Here's my line.
---

# PostgreSQL 18 and the Rise of Hybrid Transactional-Analytical Processing

## The pitch that sounds great

Every database vendor has the slide. One database. Transactional and analytical. No ETL, no pipeline, no second system to operate, no stale copy of the data. Just write once and query however you like. For fifteen years I've watched this pitch land, and for fifteen years the honest version was: sure, but you'll pay for it in one of three places — latency, isolation, or your sanity.

PostgreSQL 18 makes the pitch harder to wave away. It ships an experimental columnar access method, and combined with everything Postgres already does — logical replication, materialized views, parallel query — the database that runs your OLTP workload can now answer analytical queries against column-oriented storage in the same cluster. That's the hybrid transactional-analytical processing (HTAP) story, and it's no longer a slide.

I run production Postgres for a living, and I'm skeptical by job description. So let me argue the position I actually hold: Postgres 18's columnar engine replaces a warehouse for a specific band of workloads — the small, the fresh, the boring. For the workloads outside that band, it's a trap dressed as consolidation.

## What Postgres 18 actually shipped

The columnar access method is an alternative storage format. Create a table with the right clause and rows are stored column-by-column instead of row-by-row:

```sql
CREATE TABLE events_analytics (...) USING columnar;
```

Columnar storage pays off for analytical scans because a query that touches three columns reads three column segments instead of full rows. Combined with the other 18-era improvements — faster ALTER TABLE for adding a column with a default, parallel vacuum, UUIDv7 — Postgres is quietly becoming a much better analytical citizen. And the access-method design means it's still a Postgres table: you query it with the same SQL, the same planner, the same security model.

Let me be precise about the "experimental" label, because it matters. Columnar tables come with real restrictions. Support for updates and deletes on columnar tables is limited — this is storage for append-mostly data, not a second home for your hot rows. Indexes on columnar tables don't behave the way they do on heap tables. This is not the polished HTAP you get from a vendor whose whole product is the demo. It's a foundation.

A scan on a columnar table shows up in EXPLAIN as its own plan node, and the planner treats the two storage formats as different flavors of table rather than special cases. That matters operationally: you can mix row and columnar tables in the same schema, the same query, even the same join, and the optimizer decides how to read each side. The design is genuinely thoughtful. It's also where I get cautious — a thoughtful foundation is not the same as a finished feature.

## Where HTAP on Postgres genuinely wins

Here's the band where I'd use it, and I have: the analytical load is modest, and the freshness requirement is the point.

Dashboards and operational reporting are the perfect case. A metrics table that grows by millions of rows a day, queried by hour over the last seven days, by a handful of dashboards. That's a columnar table if I've ever seen one:

```sql
SELECT date_trunc('hour', created_at) AS hour,
       count(*) AS events,
       sum(amount) AS total_amount
FROM events_analytics
WHERE created_at >= now() - interval '7 days'
GROUP BY hour
ORDER BY hour;
```

The wins are structural. There's no pipeline, so there's no pipeline to break; the data is the data, so there's no ETL drift to reconcile; and the query sees rows the moment they're committed, so "fresh" isn't a batch schedule, it's now. For a small team, the operational cost of a warehouse — connectors, transformations, a second credentials story, a second set of failure modes — is real money, and HTAP on Postgres cancels that bill.

When your data fits in a few hundred gigabytes, your analytical concurrency is a handful of queries, and your schema is simple, a dedicated warehouse is overhead you're paying for capacity you don't use. Postgres 18 gives you a reason to stop paying it.

## Where the warehouse still wins

Now the part the slide leaves out. The columnar engine is not a ClickHouse, not a DuckDB, not a BigQuery, and pretending otherwise is how you get a 3am page.

Scale is the first boundary. When the analytics dataset crosses terabytes, when wide tables multiply, when the star schema has a fact table with a hundred columns, the economics flip. Columnar warehouses compress and scan at a cost per byte that a general-purpose database chasing transactional correctness cannot match. The access method helps; it does not close that gap.

Compression is the quiet difference. A columnar warehouse can hit order-of-magnitude reductions on repetitive columns — timestamps, status codes, country codes — because dictionary encoding works on columns, not rows. The Postgres columnar engine compresses too, but it ships early in its life, and the aggressive encodings that make warehouses cheap at the terabyte scale are exactly the parts that mature last.

Concurrency is the second. A warehouse isolates analytical load from production traffic by construction. A Postgres cluster runs both, and the same shared_buffers that serve your order transactions now serve a query that wants to read a quarter of a columnar table. Resource contention is a feature of the architecture, not a bug you can tune away. The standard answer — run analytics against a replica — is honest, but notice what you've built: a second node, replication lag, a copy of the data. You've rebuilt the warehouse topology and kept the name "one database."

The third boundary is query complexity. Warehouse optimizers eat star schemas for breakfast — join order, bloom filters, statistics on columns — and BI tools assume warehouse behavior. The Postgres planner is excellent at OLTP shapes and decent at analytical ones; it is not built for hundred-way joins against compressed columns, and columnar statistics are early. Your forty-tab BI dashboard will find the difference.

## The tradeoffs nobody puts on the slide

Let me name the costs plainly. The columnar path is experimental, which in production means: don't build your core reporting on it until the release notes say otherwise. The write path is a real constraint — append-mostly only, so you design ingestion around it from day one. Memory pressure is real, because columnar scans still route through shared buffers, and a big scan can push out pages your OLTP workload needs. And the team cost is sneaky: you now maintain one database doing two jobs, and when the analytical query slows down the transactional one, the conversation about "just add a replica" is where it goes to die.

There's also the vendor-comparison trap. The polished HTAP products you've seen benchmarked spend engineering years on exactly the parts Postgres 18 is shipping first: vectorized execution, compression dictionaries, update paths. Postgres will get there — it's a remarkably productive community — but "will get there" is not an SLA.

## How I'd decide

My rule of thumb, stated plainly. Use Postgres HTAP when the analytics are small (a few hundred GB), fresh (the dashboard must show this minute), simple (a handful of tables, a handful of queries), and the team is small enough that a second system is a second job. That's a big, real, underserved band of workloads, and Postgres 18 serves it well.

Keep the warehouse when the data is measured in terabytes, the analytical concurrency is high, the schemas are wide star shapes, or the BI stack assumes warehouse behavior. The cost of the pipeline is the price of the isolation, and for those workloads the isolation is the product.

And for the middle? The hybrid middle — OLTP in Postgres, analytical copies in a columnar warehouse fed by logical replication — is ugly but honest. It's the boring answer, which is exactly why it's my default until the in-core story matures.

If you want to try Postgres HTAP without betting the business: pick your biggest read-mostly table, load a month of history into a columnar copy, and run your three slowest dashboards against both formats. Measure scan time, memory pressure on the primary, and how long the load takes. You'll know in an afternoon whether the band fits you.

## The boring middle

I want Postgres to win this. I genuinely do. One system, one team, no pipeline — it's a better life. And Postgres 18 is the first release where that life is plausible for a real band of workloads. The discipline is knowing the band: ship the small, fresh, boring analytics to columnar tables today, keep the warehouse for the workloads that still need it, and let the feature mature in the gap. Consolidation is only a win when it doesn't cost you the isolation you were quietly relying on.
