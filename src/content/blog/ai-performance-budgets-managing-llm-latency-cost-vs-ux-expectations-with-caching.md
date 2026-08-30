---
title: "AI Performance Budgets: Managing LLM Latency + Cost vs UX Expectations with Caching"
slug: "ai-performance-budgets-managing-llm-latency-cost-vs-ux-expectations-with-caching"
date: "August 30, 2026"
excerpt: >
  Caching LLM responses and using async patterns can cut latency and costs, but only if you budget for cache hit rates and user tolerance for delayed responses.
coverImage: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&q=80&w=1200"
category: "Performance"
readTime: 4
tags:
  - "Performance"
---
# AI Performance Budgets: Managing LLM Latency + Cost vs UX Expectations with Caching

You're shipping an AI feature and the numbers don't add up. The LLM call costs $0.03 per request, but your product manager just told you the average user expects sub-200ms response time. At scale, that budget evaporates in a week. You need caching, but which approach actually fits your constraints?

Three years ago, most teams either ignored caching entirely or bolted on a simple Redis layer. Now you can use in-app memory caches, distributed caches, or semantic caching that understands what users are actually asking. The trade-offs aren't obvious anymore.

## In-memory caching (per-instance)

This is the dumb solution that often works best. You keep a hash map in your application process. When a request comes in, check the map first. If there's a hit, return immediately. No network hop, no serialization, no Redis cluster to manage.

The strength here is simplicity. You're not adding infrastructure. Cold starts don't matter because you're not calling an external service. For read-heavy workloads where users ask similar questions repeatedly, this can slash costs by 70-90% with almost no engineering effort.

But it doesn't scale across instances. If you're running five replicas, each has its own cache. Cache hit rates drop. And if your app restarts (which it will), you lose everything. Memory also grows unbounded unless you implement eviction, which you'll forget to do until your container OOMs.

This fits when you have a single instance, low cardinality of unique queries, or a prototype that needs to prove value before investing in real infrastructure.

## Distributed caching (Redis/Memcached)

Redis is the grown-up answer. You get persistence, TTLs, eviction policies, and shared state across all your instances. Cache hit rates stay high even as you scale horizontally. You can inspect what's cached, flush bad entries, and monitor performance.

The cost is real, though. Now every cache miss is a network round trip. You're managing another service. Connection pooling, failover, memory tuning — there's a pile of operational complexity. And Redis isn't free, especially when you need to size it for your working set.

This is the right call when you're beyond prototype stage, running multiple instances, and the cache hit rate justifies the operational overhead. If you're doing more than a few thousand requests per minute, you probably need this.

## Semantic caching

This is the newest approach. Instead of matching exact prompts, semantic caches use embeddings to find similar queries. "How do I reset my password?" and "I forgot my login credentials" might return the same cached response.

The potential savings are huge. You're not just deduplicating identical requests — you're deduplicating intent. For customer support bots or FAQ systems, this can eliminate 80% of LLM calls without any user-facing degradation.

But it's not magic. You need an embedding model (another API call, another cost). Similarity thresholds are fiddly — too loose and you return wrong answers, too tight and you get no hits. And you're trading precision for recall in ways that can surprise you.

This works when your queries have high semantic overlap, you can tolerate approximate matching, and the cost of the embedding model is less than the cost of the LLM calls you're replacing.

## Comparison

| Approach | Latency impact | Cost reduction | Operational complexity | Query coverage |
|---|---|---|---|---|
| In-memory | Lowest (local hit) | Low to medium | None | Exact match only |
| Redis | Medium (network hop) | Medium to high | High | Exact match only |
| Semantic | Medium to high | High | Medium | Approximate match |

## Decision framework

Choose in-memory caching when you're prototyping, running a single instance, or the query set is small and predictable.

Choose Redis when you're in production, scaling horizontally, and can justify the operational cost through cache hit rates.

Choose semantic caching when your queries vary in wording but share intent, and you're willing to trade some precision for significant cost savings.

## My take

I've shipped all three. For most teams, start with Redis. It's boring, it's well-understood, and it solves the immediate problem without introducing the unpredictability of semantic matching. Semantic caching is powerful, but I've seen teams spend weeks tuning thresholds only to discover their users' queries are more varied than they expected. In-memory caching is great for getting started, but plan to outgrow it quickly.

The real lesson: measure your hit rates. If you're not getting 60%+ cache hits, you're solving the wrong problem.