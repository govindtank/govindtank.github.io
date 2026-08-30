---
title: "LLM-Centric App Design: Token-Aware UI, Context Window Management, Cost Modeling"
slug: "llm-centric-app-design-token-aware-ui-context-window-management-cost-modeling"
date: "August 31, 2026"
excerpt: >
  Applications designed around LLMs treat every token as a priced resource, with streaming interfaces that react to model output in real-time and cost models baked into the request lifecycle. This shifts UI architecture...
coverImage: "https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?auto=format&fit=crop&q=80&w=1200"
category: "AI-Native-Apps"
readTime: 3
tags:
  - "AI-Native-Apps"
---
# LLM-Centric App Design: Token-Aware UI, Context Window Management, Cost Modeling

## The bill that made engineering pause

I was halfway through a Tuesday morning standup when our CFO's voice cut through the Zoom call: "Can someone explain why our AWS bill jumped $80,000 last week?" The room went quiet. Our AI assistant product had been stable for months. Then I saw the Datadog dashboard—a single endpoint was making 500,000 LLM calls per day, each averaging 12,000 output tokens.

We'd built a chatbot that could write entire business plans in one go. Users loved it. Our credit card didn't.

## What we thought we had built

Our app was a straightforward RAG pipeline. User submits a query, we retrieve relevant documents from our vector store, concatenate everything into a prompt, and stream the response back. The frontend showed a simple typing indicator while waiting. We monitored latency and error rates. We did not monitor token consumption per request, per user, or per feature.

The assumption was simple: LLM calls are cheap, and streaming responses feel fast. We optimized for user experience, not economic sustainability.

## The symptom that wasn't a bug

The first panic hypothesis was a DDoS attack. I pulled up our CDN logs—no unusual traffic patterns. Next guess: prompt injection causing runaway generation. I sampled requests—legitimate queries, normal retrieval results, but outputs consistently maxed out our 16K token limit.

Then I noticed the pattern in our logging: users were asking follow-up questions that referenced content from previous responses. Our context management was naive—we appended every message to the conversation history indefinitely. A 20-turn conversation with 12K-token responses meant 240K tokens of context before we even added new input.

## The debugging path that mattered

Three tools saved us:

1. **Custom token counters** in our request pipeline (using tiktoken) that logged input/output tokens per request
2. **Per-user cost attribution** by tagging requests with user IDs in our monitoring
3. **Conversation length histograms** that revealed 5% of conversations were consuming 80% of our tokens

The aha moment came when I realized we were paying for tokens we never sent. Our frontend was requesting 16K output tokens every time, but most responses were complete at 2K. We were literally burning money on empty bandwidth.

## The fix in code

We implemented three changes:

First, token-aware streaming on the frontend:

```typescript
const maxTokens = Math.min(
  Math.max(estimatedOutputTokens(prompt), 500),
  4000
);

const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({ 
    messages, 
    max_tokens: maxTokens,
    stream: true 
  })
});
```

Second, sliding window context management:

```python
def trim_conversation(messages: list[dict], max_tokens: int = 8000) -> list[dict]:
    """Keep recent messages, summarize older ones."""
    if count_tokens(messages) <= max_tokens:
        return messages
    
    # Keep last 4 messages, summarize the rest
    recent = messages[-4:]
    history = messages[:-4]
    
    summary = summarize_conversation(history)
    return [{"role": "system", "content": f"Context summary: {summary}"}] + recent
```

Third, hard limits per user per day with circuit breakers:

```python
@app.before_request
def check_token_quota():
    user_tokens_today = redis.get(f"tokens:{current_user.id}:{today}")
    if user_tokens_today and int(user_tokens_today) > USER_DAILY_LIMIT:
        return jsonify({"error": "Daily token quota exceeded"}), 429
```

## What I'd do differently

- **Instrument token usage from day one.** Every LLM call should log input tokens, output tokens, model used, and cost. Make it as automatic as logging request duration.
- **Set per-user quotas before launch.** Not as a product decision, but as a financial safety net. You can always raise limits later.
- **Design for interruption.** Users should be able to stop generation mid-stream. Most LLM providers support this, but you have to build the frontend plumbing.
- **Monitor conversation length distribution.** If you see a few conversations consuming disproportionate tokens, your context management is broken.
- **Prefer smaller models when accuracy allows.** We moved 60% of our traffic to gpt-3.5-turbo for simple queries, cutting costs by 70%.

## The real lesson

LLM calls aren't