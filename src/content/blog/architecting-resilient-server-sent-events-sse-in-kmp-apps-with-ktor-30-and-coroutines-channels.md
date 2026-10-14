---
archetype: "comparison"
title: "Architecting Resilient Server-Sent Events (SSE) in KMP Apps with Ktor 3.0 and Coroutines Channels"
slug: "architecting-resilient-server-sent-events-sse-in-kmp-apps-with-ktor-30-and-coroutines-channels"
date: "October 11, 2026"
excerpt: >
  A practical design for reconnectable SSE in Kotlin Multiplatform: keep transport state in Ktor, expose events through a bounded Flow, and make replay and backpressure explicit.
coverImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200"
category: "Kotlin"
readTime: 6
tags:
  - "Kotlin"
  - "Ktor"
  - "Kotlin Multiplatform"
  - "Server-Sent Events"
---
# Architecting Resilient Server-Sent Events (SSE) in KMP Apps with Ktor 3.0 and Coroutines Channels

> **TL;DR**: SSE is easy to demo and surprisingly easy to lose in production. Treat the connection as a restartable transport, keep a bounded event buffer, and resume from a server-issued event id instead of pretending a mobile network is continuous.
> - **The problem**: connections disappear during sleep, handoffs, and captive-portal changes; an unbounded channel can keep retaining events after the screen is gone.
> - **The solution**: isolate Ktor's SSE client behind a shared repository, use a bounded `Channel`, and reconnect with an explicit backoff policy.
> - **The result**: one platform-independent event stream with predictable cancellation, replay, and error handling.

SSE fits feeds, job progress, and server notifications because the server only needs to send text over one HTTP response. It is not a durable queue, though. A phone can suspend the process, change networks, or kill the socket while the UI is not visible. The client has to assume that the connection will end.

## Keep transport away from UI state

The shared code should own connection lifecycle. A screen should collect a `Flow`; it should not know how to build an `HttpClient`, parse `Last-Event-ID`, or decide whether an error is retryable.

```kotlin
class EventRepository(
    private val client: HttpClient,
    private val endpoint: String,
) {
    private val events = Channel<ServerEvent>(capacity = 64, onBufferOverflow = BufferOverflow.DROP_OLDEST)

    fun events(): Flow<ServerEvent> = events.receiveAsFlow()

    suspend fun run(lastEventId: String?) {
        var retry = 1_000L
        while (currentCoroutineContext().isActive) {
            try {
                client.sse(endpoint) {
                    lastEventId?.let { header("Last-Event-ID", it) }
                    incoming.collect { event ->
                        events.send(ServerEvent(event.id, event.data))
                    }
                }
                retry = 1_000L
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (error: IOException) {
                delay(retry)
                retry = (retry * 2).coerceAtMost(30_000L)
            }
        }
    }
}
```

The bounded channel matters. If a consumer disappears, the producer must not retain an unlimited backlog. For a notification feed, dropping the oldest item may be acceptable. For job state or financial events, it is safer to persist the last id and ask the server for a replay window.

## Reconnect without a thundering herd

Every client reconnecting immediately after a service restart creates a second outage. Use exponential backoff with jitter, and reset the delay only after a connection has stayed healthy for a meaningful period. Do not retry authentication failures as if they were packet loss; surface a sign-in state instead.

A useful policy is:

| Failure | Client action |
| --- | --- |
| Timeout or network change | Retry with backoff and jitter |
| HTTP 401 or 403 | Refresh credentials or stop |
| HTTP 429 | Respect `Retry-After` |
| Malformed event | Log and skip the event |
| Explicit cancellation | Close the socket immediately |

## KMP lifecycle and cancellation

Android and iOS do not give a background stream the same lifetime. Tie collection to a scope owned by the feature, not a global singleton. On Android, stop the stream when the service or foreground feature is stopped. On iOS, expect suspension and reconnect when the app becomes active again.

The most common leak is a repository that launches a new coroutine after every reconnect without cancelling the old one. Keep one supervisor job per stream and replace it deliberately. Test rotation, background/foreground transitions, network changes, and a server restart. The happy-path demo is the least interesting test.

## What to verify before shipping

Instrument connection-open, connection-close, retry-delay, last-event-id, and dropped-event counters. Then run the client with a bounded buffer and deliberately kill the network. If the UI receives duplicate events or memory keeps climbing after navigation, the lifecycle boundary is wrong.

SSE becomes dependable when the design admits that the connection is temporary. Ktor handles the HTTP details; your repository still owns recovery, buffering, and cancellation.