---
archetype: "war-story"
title: "Flutter Web WASM in 2026: Achieving Sub-Second TTI and Debugging Garbage Collection Stalls"
slug: "flutter-web-wasm-in-2026-achieving-sub-second-tti-and-debugging-garbage-collection-stalls"
date: "October 12, 2026"
excerpt: >
  We migrated a production Flutter web app to WasmGC and cut TTI from 4.2s to 0.8s. Then the GC stalls started—frames freezing for 80-120ms with no explanation in the profiler. Here's what was actually causing them.
coverImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200"
category: "Flutter"
readTime: 8
tags:
  - "Flutter"
  - "WASM"
  - "Dart"
  - "Performance"
---
# Flutter Web WASM in 2026: Achieving Sub-Second TTI and Debugging Garbage Collection Stalls

The migration to `--wasm` took us one afternoon. Time to Interactive dropped from 4.2 seconds to 0.8. We deployed it, marked the ticket done, and started watching the performance dashboard.

Three days later, users started reporting that the app would "freeze" for a moment after heavy use. Not crash — freeze. For about 100ms, then resume. Reproducible on Chrome, not on Safari. Worse after 10+ minutes of use.

WasmGC giveth and WasmGC taketh away. Here's what caused it and how we fixed it.

## The TTI Win Is Real — Here's Exactly Where It Comes From

Before we get to the problems, the improvement is worth understanding properly because it informs what can go wrong.

Flutter Web historically had two bottlenecks:
1. Downloading and parsing `canvaskit.wasm` (~2MB) and its JS glue
2. The Dart2JS bundle initialization

With WasmGC (`flutter build web --wasm`), the Dart code compiles to a `.wasm` module that the browser loads into its native GC-managed heap. The browser already understands WasmGC objects — it can allocate, trace, and collect them without JavaScript trampolining. The result:

```
Before (JS):  Download 1.8MB JS → Parse → Init runtime → First frame
              [============================] 4.2s

After (WASM): Download 0.9MB Wasm → Instantiate → First frame  
              [==========] 0.8s
```

Half the bytes, no parse step, native heap management. The TTI win is structural, not a trick. It will hold in production.

To get it:

```bash
flutter build web --wasm --release
# Serve with brotli compression — the .wasm compresses from 900KB to ~280KB
```

Check your server is sending `Content-Type: application/wasm` for `.wasm` files, or Chrome will refuse to compile it natively.

## Then the GC Stalls Started

The Chrome Performance profiler showed 80-120ms pauses appearing every few minutes of heavy use. The flame chart showed time in "Minor GC" and "Major GC" tasks, not in any of our code. The WasmGC heap was stalling the main thread to collect garbage.

First instinct: we're allocating too much. So we looked at our animation loops.

### The Culprit: Closures in Animation Callbacks

We had a data visualization component that updated 60 times per second. The `AnimationController` callback looked like this:

```dart
// Allocating a new closure every frame — we were creating 60 short-lived
// objects per second, each capturing a snapshot of the current data.
_controller.addListener(() {
  final progress = _controller.value;
  final interpolated = data.map((point) => 
    Point(point.x, lerpDouble(point.yStart, point.yEnd, progress)!)
  ).toList(); // new List, new Point objects, every frame
  
  setState(() => _displayData = interpolated);
});
```

At 60fps, `data.map().toList()` was creating a new `List<Point>` with N new `Point` objects every 16ms. The GC would collect them eventually, but with enough accumulated short-lived garbage, V8's WasmGC collector would stop the world to do a major collection.

The fix: pre-allocate and mutate in place.

```dart
// Allocate once, reuse every frame
late List<Point> _displayData;

@override
void initState() {
  super.initState();
  _displayData = List.generate(data.length, (i) => Point(data[i].x, 0.0));
  
  _controller.addListener(_onAnimationTick);
}

void _onAnimationTick() {
  final progress = _controller.value;
  for (int i = 0; i < data.length; i++) {
    // Mutate the existing object, don't create a new one
    _displayData[i] = _displayData[i].copyWith(
      y: lerpDouble(data[i].yStart, data[i].yEnd, progress)!
    );
  }
  setState(() {}); // trigger repaint with the mutated list
}
```

This stopped 95% of the GC pressure. The remaining 5% came from `copyWith` still allocating a new `Point` per frame. For cases where you need zero allocations, use a mutable data class:

```dart
class MutablePoint {
  double x, y;
  MutablePoint(this.x, this.y);
}
// Now _onAnimationTick mutates .x and .y directly — zero allocations per frame
```

## The JS Interop Boundary Problem

WasmGC objects live in the Wasm heap. DOM objects live in the JS heap. Every time you cross the boundary — calling a JS API from Dart, passing a Dart object into a JS callback — the browser has to create bridge wrappers.

Those wrappers are garbage too. And unlike Dart objects, the browser doesn't always know when to collect them.

We found this in our custom canvas drawing code:

```dart
// Crossing the JS boundary on every draw call
void drawFrame(List<Segment> segments) {
  for (final seg in segments) {
    // Each call creates a JS wrapper for 'seg', used once, then abandoned
    _jsCanvas.callMethod('drawSegment', [seg.toJSObject()]);
  }
}
```

`seg.toJSObject()` was creating a fresh JS object representation of each `Segment` on every draw. With 200 segments at 60fps, that's 12,000 JS objects created and immediately orphaned per second.

Fix: batch the data into a typed array and cross the boundary once:

```dart
void drawFrame(List<Segment> segments) {
  // Pack into a Float32Array — one boundary crossing, no wrappers
  final buffer = Float32List(segments.length * 4);
  for (int i = 0; i < segments.length; i++) {
    buffer[i * 4 + 0] = segments[i].x1;
    buffer[i * 4 + 1] = segments[i].y1;
    buffer[i * 4 + 2] = segments[i].x2;
    buffer[i * 4 + 3] = segments[i].y2;
  }
  _jsCanvas.callMethod('drawSegments', [buffer.toJS]);
}
```

After this change: GC stalls dropped from every ~3 minutes to effectively zero.

## How to Profile WasmGC Heap Pressure in Chrome

1. Open Chrome DevTools → Performance tab
2. Enable "Memory" in the capture settings
3. Record 2 minutes of normal use
4. Look for `Minor GC` and `Major GC` tasks in the flame chart
5. If GC tasks are >16ms, you have a stall problem
6. Check the Memory tab for a "sawtooth" pattern — rapid allocation followed by collection

For identifying *what* is being allocated:

1. DevTools → Memory → Allocation instrumentation on timeline
2. Start recording, trigger the heavy use pattern, stop
3. Sort the allocation list by "Size" — large frequent allocations at the top are your targets

## What Didn't Work (Save Yourself the Time)

**Increasing the GC threshold via flags:** Chrome doesn't expose WasmGC heap size controls in stable. We wasted a day on this.

**Setting `--optimization-level=O4`:** Marginally smaller binary, no effect on GC behavior. The GC problem is allocation rate, not code size.

**Moving work to isolates:** Flutter Web doesn't support real isolates in WASM mode yet. `Isolate.spawn` throws. Use `compute()` carefully — it has different behavior in web builds.

## The Honest State of Flutter WASM in 2026

The TTI improvement is production-ready and significant. If your Flutter web app has a slow startup, migrate to `--wasm` today.

The GC tuning is more work than the JS build ever was, because you're directly inside the browser's garbage collector now instead of behind a JavaScript abstraction layer. That proximity is what gives you the performance — and it's what makes the stalls your problem to debug, not Flutter's.

The rule that holds: **minimize allocation rate in hot paths, minimize JS boundary crossings, batch everything you can batch.** If you do that, WasmGC will be the best thing that happened to your web build. If you don't, the GC will find you.
