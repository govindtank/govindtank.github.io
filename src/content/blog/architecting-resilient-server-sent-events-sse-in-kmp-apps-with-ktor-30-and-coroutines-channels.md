---
archetype: "war-story"
title: "Architecting Resilient Server-Sent Events (SSE) in KMP Apps with Ktor 3.0 and Coroutines Channels"
slug: "architecting-resilient-server-sent-events-sse-in-kmp-apps-with-ktor-30-and-coroutines-channels"
date: "October 11, 2026"
excerpt: >
  We silently dropped 3 weeks of live events on iOS because we assumed a mobile network behaves like a server. Here's the exact architecture that fixed it—bounded channels, explicit backoff, and a repository that doesn't lie to the UI.
coverImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200"
category: "Kotlin"
readTime: 7
tags:
  - "Kotlin"
  - "Ktor"
  - "Kotlin Multiplatform"
  - "Server-Sent Events"
---
# Architecting Resilient Server-Sent Events (SSE) in KMP Apps with Ktor 3.0 and Coroutines Channels

Three weeks after we shipped live notifications in our KMP app, a user filed a support ticket saying their feed hadn't updated since Tuesday. We checked the server — events were firing. We checked the Android build — working fine. Then we opened the iOS build on a real device, walked through a subway station, and watched the stream silently die and never come back.

Three weeks. We had been dropping events on every network handoff and nobody noticed because the UI never showed an error. It just... stopped.

That's the SSE trap. It works perfectly in your apartment on Wi-Fi. It breaks invisibly on a phone.

## What We Actually Had

Our first implementation looked like every SSE tutorial on the internet:

```kotlin
// The version that lied to us
class NotificationService(private val client: HttpClient) {
    fun stream(): Flow<Notification> = flow {
        client.sse("https://api.example.com/events") {
            incoming.collect { event ->
                emit(Notification.parse(event.data))
            }
        }
    }
}
```

Clean. Simple. Completely wrong for mobile.

The problem isn't the code — it's the assumption baked into it. This treats SSE like a persistent pipe that stays open. On a server, that's true. On a phone, the OS suspends your process, the radio switches towers, a captive portal intercepts the connection, and the `collect` just... stops collecting. No exception. No error event. Silence.

The `Flow` completes. The UI collects nothing. The user sees a stale feed.

## The Real Architecture

The fix required rethinking ownership. The stream isn't a `Flow` you collect once — it's a **transport** that you restart, and the restart logic belongs in a repository, not scattered across ViewModels.

Here's what we actually run in production:

```kotlin
class EventRepository(
    private val client: HttpClient,
    private val endpoint: String,
) {
    // Bounded. If the consumer is gone, we don't buffer forever.
    private val _events = Channel<ServerEvent>(
        capacity = 64,
        onBufferOverflow = BufferOverflow.DROP_OLDEST
    )

    val events: Flow<ServerEvent> = _events.receiveAsFlow()

    suspend fun run(lastEventId: String? = null) {
        var retryDelay = 1_000L

        while (currentCoroutineContext().isActive) {
            try {
                client.sse(endpoint) {
                    lastEventId?.let { header("Last-Event-ID", it) }
                    incoming.collect { frame ->
                        _events.send(ServerEvent(id = frame.id, data = frame.data))
                        retryDelay = 1_000L // reset on successful event, not connection
                    }
                }
            } catch (e: CancellationException) {
                throw e // never swallow this
            } catch (e: Exception) {
                delay(retryDelay)
                retryDelay = (retryDelay * 2).coerceAtMost(30_000L)
            }
        }
    }
}
```

Three things changed from the tutorial version:

**Bounded channel instead of Flow emission.** If the ViewModel is gone (screen rotated, app backgrounded), the channel drops the oldest event instead of buffering indefinitely. For notification feeds this is fine. For financial data you'd persist the `last-event-id` and request a replay from the server.

**The retry loop lives here, not in the UI.** The repository owns reconnection. The ViewModel just collects. This is the separation that saved us — when iOS suspends and resumes, the repository restarts the stream transparently. The UI never knows it broke.

**`retryDelay` resets only on a successful event, not on a successful connection.** A connection that opens and immediately closes will reset the delay on every open, creating a thundering herd against a flaky server. Reset it only when you actually receive data.

## The Lifecycle Trap on iOS vs Android

On **Android**, tie the repository's coroutine to a `LifecycleService` or foreground service. Not a ViewModel — if the user navigates away and back, you'll have two active streams fighting over the same channel.

On **iOS** (via KMP), the OS suspends your coroutine when the app backgrounds. When it foregrounds again, the connection is dead. Observe `UIApplicationWillEnterForegroundNotification` and restart `run()`.

The biggest leak we found: calling `launch { run() }` inside `init {}` with no cancellation. Every screen recreation launched a new coroutine on top of the old one. 64 active SSE connections. The server was happy. Our RAM was not.

```kotlin
class EventViewModel(private val repo: EventRepository) : ViewModel() {
    private var streamJob: Job? = null

    fun startStream() {
        streamJob?.cancel() // cancel before replacing
        streamJob = viewModelScope.launch {
            repo.run(lastEventId = prefs.lastEventId)
        }
    }

    override fun onCleared() {
        streamJob?.cancel()
        super.onCleared()
    }
}
```

## Not All Errors Are Retryable

We were retrying 401s with exponential backoff in staging. An expired token caused 30 minutes of silent retry loops before anyone noticed.

| Error | Response |
|---|---|
| `IOException`, timeout | Retry with backoff + jitter |
| HTTP 401 | Refresh token, retry once. If it fails again, surface auth error to UI |
| HTTP 429 | Read `Retry-After` header, respect it exactly |
| HTTP 5xx | Retry with backoff |
| Malformed event frame | Log and skip — keep the stream alive |
| `CancellationException` | Re-throw immediately. Never ever retry this. |

## The One Metric That Would Have Caught This in Day One

Add `sse_last_event_age_seconds` to your analytics — how long since the last event arrived for each user, segmented by platform. If it climbs for iOS while staying flat for Android, you know exactly where to look.

We didn't have that. A user filed a ticket three weeks later. Don't be us.
