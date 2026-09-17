---
archetype: "tutorial"
title: "Compose Multiplatform for iOS: Interop Architecture, UIKit Gesture Bridges, and Skiko Performance"
slug: "compose-multiplatform-for-ios-interop-architecture-uikit-gesture-bridges-and-skiko-performance"
date: "September 17, 2026"
excerpt: >
  A production analysis of Compose Multiplatform on iOS, covering UIKitView bridge overhead, Skiko memory leaks, and touch latency reconciliation.
coverImage: "https://images.unsplash.com/photo-1483058712412-4245e9b90334?auto=format&fit=crop&q=80&w=1200"
category: "Kotlin"
readTime: 8
tags:
  - "Kotlin"
---
# Compose Multiplatform for iOS: Interop Architecture, UIKit Gesture Bridges, and Skiko Performance

If you have ever shipped a Compose Multiplatform iOS app with a mixed UI hierarchy—say, a native `MKMapView` or a `PHPickerViewController` embedded inside a lazy column of Skia-rendered cards—you have likely watched your frame budget dissolve. On an iPhone 15 Pro, a pure Compose layout easily locks at 120Hz via ProMotion. The moment you introduce bidirectional UIKit gesture propagation or high-frequency state updates through `UIKitView`, Instruments reports dropped frames, non-zero rendering latency across the Skiko-Metal pipeline, and stubborn memory leaks caused by circular Swift/Kotlin reference graphs.

We will build an optimized, gesture-aware iOS interop bridge in Compose Multiplatform that embeds a complex UIKit native component inside Compose without dropping frames or breaking the iOS native touch responder chain. We will profile the Skiko render loop, fix coordinate reconciliation issues, and break native reference cycles using structured memory management patterns.

## Prerequisites and environment setup

Before building, ensure your toolchain matches the target versions:

- Kotlin 2.0.20 or later
- Compose Multiplatform 1.6.11 or later
- Xcode 15.4 or 16.0 with the iOS 17.0+ SDK
- CocoaPods or Swift Package Manager integration configured for your Kotlin Multiplatform project

You will need a physical iPhone supporting ProMotion (iPhone 13 Pro or newer) to profile touch latency and frame pacing accurately. The iOS Simulator runs on your Mac's display server, which masks Skiko synchronization stalls and Metal swapchain latency.

## Architecture: How Skiko and UIKit intersect

Compose Multiplatform for iOS does not compile Kotlin code into native SwiftUI or UIKit primitives. Instead, it runs on top of **Skiko** (Skia for Kotlin), which creates a single `CAMetalLayer` hosted inside a root `UIViewController`. Compose runs its own layout, measurement, and draw passes, outputting draw commands directly to Skia, which translates them into Metal command buffers sent to the GPU.

When you embed a native iOS view via `UIKitView` or `UIKitViewController`, Compose overlays a real UIKit view on top of the Metal layer. This requires reconciling two independent systems:

1. **Geometry and clipping**: Compose recalculates the native view's bounds and transforms on every frame of layout changes, updating the underlying `UIView.frame`.
2. **Touch dispatching**: iOS hit-testing routes touches through the UIKit responder chain. Compose sits underneath or overlays these views, requiring explicit hit-test arbitration to prevent gesture starvation.
3. **Synchronization**: Skiko coordinates its frame rendering with `CADisplayLink`. Native views update on the main RunLoop, creating potential phase-offset tearing if state changes trigger updates in both pipelines simultaneously.

```
       +-----------------------------------------------+
       |             Root UIViewController             |
       +-----------------------------------------------+
                              |
         +--------------------+--------------------+
         |                                         |
+------------------+                      +------------------+
|  CAMetalLayer    |                      |  Native UIViews  |
|  (Skiko / Skia)  |                      |  (Overlaid via   |
|  Compose Canvas  |                      |   UIKitView)     |
+------------------+                      +------------------+
         |                                         |
         +--------------------+--------------------+
                              |
               +------------------------------+
               |  UIKit Event & Touch Bridge  |
               +------------------------------+
```

---

## Step 1: Implement an unbuffered, lifecycle-safe native bridge

The standard `UIKitView` factory can easily produce memory leaks if your Swift wrapper captures strong references to Kotlin callbacks or if the native view retains its hosting controller. We will build a high-performance wrapper around an interactive `MKMapView` with proper lifecycle disposal and frame synchronizers.

Create the Kotlin common interface and native bridge implementation in your `iosMain` source set.

```kotlin
// iosMain: NativeMapBridge.kt
// Provides a lifecycle-managed, touch-safe container for an MKMapView instance inside Compose.

package com.example.interop.ui

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.interop.UIKitView
import kotlinx.cinterop.ExperimentalForeignApi
import platform.CoreLocation.CLLocationCoordinate2DMake
import platform.MapKit.MKCoordinateRegionMakeWithDistance
import platform.MapKit.MKMapView
import platform.UIKit.UIView

@OptIn(ExperimentalForeignApi::class)
@Composable
actual fun NativeMapView(
    latitude: Double,
    longitude: Double,
    zoomLevelMeters: Double,
    modifier: Modifier = Modifier,
    onMapInteracted: () -> Unit
) {
    val delegate = remember {
        TouchAwareMapDelegate(onInteraction = onMapInteracted)
    }

    UIKitView(
        factory = {
            MKMapView().apply {
                showsUserLocation = false
                userInteractionEnabled = true
                rotateEnabled = true
                scrollEnabled = true
                pitchEnabled = false
                setDelegate(delegate)
            }
        },
        modifier = modifier.fillMaxSize(),
        update = { mapView ->
            val center = CLLocationCoordinate2DMake(latitude, longitude)
            val region = MKCoordinateRegionMakeWithDistance(center, zoomLevelMeters, zoomLevelMeters)
            mapView.setRegion(region, animated = false)
        },
        onRelease = { mapView ->
            mapView.setDelegate(null)
            mapView.removeFromSuperview()
        }
    )

    DisposableEffect(Unit) {
        onDispose {
            delegate.clearCallback()
        }
    }
}
```

---

## Step 2: Solve the gesture conflict with a custom native recognizer

When users pan on an embedded native view located inside a Compose scrollable container (such as a vertical scroll canvas), Skiko and UIKit compete for touch ownership. If the Skiko touch processor grabs the initial `touchesBegan` event, the native map never drags. If UIKit intercepts the gesture, Compose never gets chance to intercept scroll cancellations.

To fix this, write a custom `UIGestureRecognizerDelegate` on the iOS side (or in Kotlin/Native) that passes events simultaneously or yields based on drag directional vectors.

```kotlin
// iosMain: TouchAwareMapDelegate.kt
// Arbitrates gestures between UIKit responder chain and the Compose parent scroll machinery.

package com.example.interop.ui

import kotlinx.cinterop.ExportObjCClass
import platform.MapKit.MKMapView
import platform.MapKit.MKMapViewDelegateProtocol
import platform.UIKit.UIGestureRecognizer
import platform.UIKit.UIGestureRecognizerDelegateProtocol
import platform.darwin.NSObject

@ExportObjCClass
class TouchAwareMapDelegate(
    private var onInteraction: (() -> Unit)?
) : NSObject(), MKMapViewDelegateProtocol, UIGestureRecognizerDelegateProtocol {

    fun clearCallback() {
        onInteraction = null
    }

    override fun mapViewDidChangeVisibleRegion(mapView: MKMapView) {
        onInteraction?.invoke()
    }

    override fun gestureRecognizer(
        gestureRecognizer: UIGestureRecognizer,
        shouldRecognizeSimultaneouslyWithGestureRecognizer: UIGestureRecognizer
    ): Boolean {
        // Allow simultaneous gestures when Skiko detects edge swipes or compose scrolls
        return true
    }
}
```

---

## Step 3: Prevent memory retention in bidirectional interop

The Kotlin/Native garbage collector runs independently of Apple's Automatic Reference Counting (ARC). When a Kotlin object implements an Objective-C protocol (`TouchAwareMapDelegate`), the runtime creates an Objective-C bridge object. If this object points to a lambda capturing a Compose state variable, and that state variable is held within a class owning the `UIViewController`, you get an ARC-to-Kotlin cyclic dependency that escapes the Kotlin GC root tracer.

To make sure instances get collected immediately when a screen is popped, wrap Kotlin callbacks in weak references or explicit clearing handles as shown below:

```kotlin
// iosMain: WeakReferenceBridge.kt
// Decouples Swift/Objective-C target blocks from retaining strong Kotlin scope closures.

package com.example.interop.ui

import kotlin.experimental.ExperimentalNativeApi
import kotlin.native.ref.WeakReference

class DetachableCallback<T : Any>(target: T, private val action: (T) -> Unit) {
    private val weakRef = WeakReference(target)

    fun invoke() {
        weakRef.get()?.let { targetInstance ->
            action(targetInstance)
        }
    }
}
```

---

## Step 4: Profile and tune Skiko rendering performance

Compose for iOS renders onto a Metal layer driven by an internal render loop. High-frequency state changes (such as tracking geographic coordinates at 60Hz or 120Hz) cause unnecessary recompositions and canvas invalidations if not isolated.

Use a custom draw layer or isolated state projection to keep Skiko from invalidating the whole canvas when UIKit-bound variables change:

```kotlin
// commonMain: MapOverlayControls.kt
// Isolates transient UI state to avoid redrawing Skiko canvas components outside the target node.

package com.example.interop.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

@Composable
fun CoordinatedMapOverlay(
    latitudeProvider: () -> Double,
    longitudeProvider: () -> Double,
    modifier: Modifier = Modifier
) {
    // Read the states inside a derived lambda to prevent parent recomposition
    val coordsText by remember {
        derivedStateOf {
            "Lat: ${"%.4f".format(latitudeProvider())}, Lon: ${"%.4f".format(longitudeProvider())}"
        }
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(16.dp),
        contentAlignment = Alignment.TopCenter
    ) {
        Text(
            text = coordsText,
            color = Color.White,
            modifier = Modifier
                .background(Color.Black.copy(alpha = 0.7f))
                .padding(horizontal = 12.dp, vertical = 6.dp)
        )
    }
}
```

---

## Architectural recap

Here is how the pipeline functions across the native boundary:

1. **Compose runtime** computes coordinates, layout bounds, and structural changes.
2. **`UIKitView` factory** instantiates the native `MKMapView` and binds a detached delegate.
3. The delegate allows simultaneous gesture evaluations so panning does not lock the Compose scrolling loop.
4. Updates travel across `update` lambdas only when mutable parameters mutate; state isolation with `derivedStateOf` keeps Skiko canvas re-renders restricted to overlay elements.
5. On teardown, `onRelease` and `DisposableEffect` sever the delegate link to prevent cross-runtime memory leaks between Swift ARC and the Kotlin/Native GC.

---

## Practical pitfalls to avoid

While profiling this implementation across iOS 17 and 18 devices, several real issues consistently surface:

### 1. The CADisplayLink double-buffer hitch
If you update a state variable in Compose that drives both a Compose layout property and a UIKit property simultaneously within the same frame, you will see micro-stuttering. Compose runs Skia rasterization off the main thread, while UIKit mutates immediately on the main RunLoop. To fix this, always set native property animations (`animated = false`) during high-frequency bridge updates, letting Compose's internal frame clock drive the cadences uniformly.

### 2. Phantom touch intercepts via translucent Skiko canvas layers
By default, Skiko catches touches on transparent regions of the root `UIViewController`. If a native UIKit view is added as a sibling rather than through `UIKitView`, all clicks on that native view will be swallowed by Compose. Always mount through `UIKitView` or configure `accessibilityElementsHidden` and explicit hit-test pass-through masks on your custom native subviews.

### 3. Missing onRelease triggers in nested navigation
When using Jetpack Compose Navigation for Multiplatform, popping a screen off the backstack does not always immediately trigger garbage collection on the underlying composables. Without an explicit `onRelease` block attached to `UIKitView`, native views can remain in memory and keep polling hardware (like GPS or camera sensors) long after the composable disappears from view.

---

Check the official Jetpack Compose Multiplatform repository for updates on the experimental `UIKitViewController` interop flags, and use Xcode's **Instruments (Metal System Trace and Allocations)** to profile frame pacing across high-refresh ProMotion screens before shipping your interop layer to production.