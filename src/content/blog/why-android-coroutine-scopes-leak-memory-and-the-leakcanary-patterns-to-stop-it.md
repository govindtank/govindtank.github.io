---
archetype: "war-story"
title: "Why Android Coroutine Scopes Leak Memory (And the LeakCanary Patterns to Stop It)"
slug: "why-android-coroutine-scopes-leak-memory-and-the-leakcanary-patterns-to-stop-it"
date: "October 19, 2026"
excerpt: >
  Uncollected Flows and callback bridges quietly pin dead Activities in RAM. Learn the LeakCanary patterns to trace the root cause and kill the leak.
coverImage: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&q=80&w=1200"
category: "Mobile-Architecture"
readTime: 5
tags:
  - "Mobile-Architecture"
---
# Why Android Coroutine Scopes Leak Memory (And the LeakCanary Patterns to Stop It)

> **TL;DR**: A custom repository tied to an application-level scope kept bound-to-Activity ViewModels alive, causing persistent 45MB memory leaks across screen rotations.
> - **The Problem**: A seemingly benign `callbackFlow` bridge captured an Activity context inside an un-cancelled listener registration, bypassing standard lifecycle destruction.
> - **The Solution**: Dropped the custom scope factory, leveraged `viewModelScope`, and terminated flows cleanly via proper `awaitClose` blocks.
> - **The Result**: 0 retained Activity instances on LeakCanary heap dumps during rapid orientation changes.

Last Tuesday, our staging channel lit up with OOM (Out Of Memory) crash reports from QA running our new telemetry dashboard module. The symptom was textbook: tap back out of the dashboard, rotate the screen twice, and the heap climbed by 45MB and stayed there. 

I pulled the heap dump via LeakCanary expecting the usual suspect—some stray static reference or an unclosed RxJava stream left behind by a junior dev. Instead, LeakCanary pointed an unblinking finger right at our core data layer: an instance of `DashboardActivity` retained by an active `Job` running inside a singleton repository.

We thought we were being safe. We used Kotlin coroutines everywhere, avoided `GlobalScope` like the plague, and relied on structured concurrency. Or so we assumed.

## The setup: structured concurrency gone rogue

Our codebase followed standard architecture guidelines. ViewModels launched coroutines using `viewModelScope`, repositories exposed `Flow` objects, and UI layers collected them using `repeatOnLifecycle`. 

Here is what the repository layer looked like before the incident. We wanted a way to stream location updates across multiple screens without re-initializing the underlying GPS listener:

```kotlin
// /app/src/main/java/com/example/data/LocationRepository.kt
package com.example.data

import android.content.Context
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow

class LocationRepository(private val context: Context) {
    // We created a repository-level scope to survive configuration changes
    private val repositoryScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    fun streamLocations(): Flow<Location> = callbackFlow {
        val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
        
        val listener = LocationListener { location ->
            trySend(location)
        }

        // LEAK VECTOR: context passed into the repository is the Activity Context
        // when this repository is instantiated inside an Activity-scoped provider.
        locationManager.requestLocationUpdates(
            LocationManager.GPS_PROVIDER,
            0L,
            0f,
            listener
        )

        awaitClose {
            locationManager.removeUpdates(listener)
        }
    }
}
```

The assumption was simple: `callbackFlow` handles cleanup when the collector cancels. But because `LocationRepository` was mistakenly bound to an Activity-scoped Hilt module instead of a singleton, and because `callbackFlow` shared a long-lived upstream execution context, the reference chain held tight.

## The failure moment

When `DashboardActivity` finished, Android's `ActivityThread` expected the instance to be garbage collected. But LeakCanary traced a path straight through the Android framework:

```
GC Root: System class
-> LocationManagerService
-> LocationListener
-> LocationRepository
-> DashboardActivity (Leaked)
```

The `LocationManager` held a strong reference to our `LocationListener`. The `LocationListener` captured the `callbackFlow` lambda. The lambda captured `LocationRepository`. And `LocationRepository` had been instantiated with the Activity's `Context` instead of `appContext`. 

Our first guesses were wrong. We initially blamed `repeatOnLifecycle` in the UI, thinking the coroutine was surviving view destruction. We added extra cancellation flags and manually cleared bindings in `onDestroy()`. None of it worked because the root cause wasn't the UI coroutine scope—it was the system-level callback retaining an object graph rooted in the Activity context.

## The debugging path

I fired up Android Studio's Profiler and took a heap dump right after navigating away from the dashboard. Filtering by `DashboardActivity` showed instances marked with the dreaded red-and-white icon. 

The fix wasn't adding more cancellation boilerplate. The fix was applying the lazy senior rule: **delete unnecessary abstractions and use the platform/stdlib correctly.** 

Did we need a custom `CoroutineScope` inside the repository? No. Repositories should be stateless functions or passive data holders. They shouldn't manage their own long-lived scopes unless they are true singletons holding application-lifetime caches.

Did we need to pass an Activity context to a background location stream? Absolutely not. System services that outlive activities must always use `applicationContext`.

## The fix in code

Here is the corrected, simplified implementation. We removed the custom scope entirely, forced application-level context injection, and let structured concurrency do its job natively.

```kotlin
// /app/src/main/java/com/example/data/LocationRepository.kt
package com.example.data

import android.content.Context
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class LocationRepository @Inject constructor(
    // Enforce application context to prevent Activity retention
    @ApplicationContext private val context: Context
) {
    fun streamLocations(): Flow<Location> = callbackFlow {
        val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
        
        val listener = LocationListener { location ->
            trySend(location)
        }

        locationManager.requestLocationUpdates(
            LocationManager.GPS_PROVIDER,
            0L,
            0f,
            listener
        )

        // Guaranteed cleanup when the downstream collector cancels
        awaitClose {
            locationManager.removeUpdates(listener)
        }
    }
}
```

By marking the repository as `@Singleton` and injecting `@ApplicationContext`, we severed the link to the ephemeral `DashboardActivity`. Even if a flow collection lingers during teardown, it holds a reference only to the application process, which can be garbage-collected safely without leaking UI components.

## What broke in practice

- **Passing Activity contexts to long-lived objects**: If a repository, manager, or helper class outlives an Activity, injecting an Activity context is an instant memory leak. Always use `applicationContext`.
- **Manual scope creation in repositories**: Creating `CoroutineScope(SupervisorJob())` inside a class without a clear lifecycle owner creates orphaned background work that ignores structured concurrency.
- **Forgetting `awaitClose` cleanup**: If your `callbackFlow` registers a system listener, broadcast receiver, or callback, omitting `awaitClose` means the listener stays registered indefinitely, keeping the entire lambda capture-group alive.

## Lessons learned

- Let the caller control the scope. Repositories should return cold `Flow` streams, leaving `viewModelScope` or `lifecycleScope` to trigger collection and cancellation.
- Run LeakCanary in your debug builds continuously. Waiting for QA to find OOM crashes is an expensive way to catch architecture violations.
- When a memory leak points to a coroutine, check your captures. Every lambda captures its outer `this` reference implicitly.

Verify your dependency injection graph today. Ensure every singleton repository uses application-level scoping and check your `callbackFlow` implementations for unclosed system listeners.