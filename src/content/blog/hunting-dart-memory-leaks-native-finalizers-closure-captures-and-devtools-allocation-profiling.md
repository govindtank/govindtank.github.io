---
archetype: "war-story"
title: "Hunting Dart Memory Leaks: Native Finalizers, Closure Captures, and DevTools Allocation Profiling"
slug: "hunting-dart-memory-leaks-native-finalizers-closure-captures-and-devtools-allocation-profiling"
date: "October 14, 2026"
excerpt: >
  Our Flutter app was climbing 40MB per hour on low-end devices. No crashes, no warnings—just a slow death. Here's the exact sequence we used in DevTools to find three leak sources that the analyzer never flagged.
coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200"
category: "Flutter"
readTime: 7
tags:
  - "Flutter"
  - "Dart"
  - "Memory Leaks"
  - "Profiling"
---
# Hunting Dart Memory Leaks: Native Finalizers, Closure Captures, and DevTools Allocation Profiling

Our app was consuming 40MB more RAM per hour on a Redmi 9. No OOM crash, no ANR, no error in Crashlytics. Just a slow creep that ended in the OS silently killing us after about 90 minutes of use.

The worst kind of bug. Completely invisible until a 1-star review that says "app keeps closing."

We spent two days looking at the wrong things — checking image cache sizes, auditing our Dio interceptors, adding `const` constructors everywhere. None of it moved the number. The leak was in three places we weren't looking at all.

Here's exactly how we found them.

## Step 1: Confirm It's Actually a Leak (Not Just Cache)

Before DevTools, establish a baseline. Navigate to a screen, navigate away, come back. Do it 10 times. If memory climbs and never drops after a GC, you have a leak. If it plateaus, you have a cache that's too aggressive. They're different problems.

```bash
# Force a GC from the DevTools VM Service
# Or trigger it in code during debugging:
import 'dart:developer';
debugger(); // then call gc() in the DevTools console
```

Our memory climbed 4MB every round trip to the chat screen. After 10 trips: +40MB, no recovery after GC. Definitely a leak, not cache.

## Step 2: Take a Heap Snapshot Before and After

In DevTools → Memory tab → Heap Snapshots:

1. Navigate the app to a clean state
2. Take **Snapshot A**
3. Perform the leaking action 5 times (navigate to ChatScreen, back, repeat)
4. Force GC
5. Take **Snapshot B**
6. Switch to **Diff view**: Snapshot B minus Snapshot A

You're looking for classes whose instance count grew and didn't shrink. Sort by **Total size delta**, largest first.

In our case, the top three were:

- `_StreamController` — 47 instances leaked
- `NativeImage` — 12 instances leaked  
- `AnimationController` — 31 instances leaked

None of these showed up in the static analyzer. All three were legitimate.

## Leak #1: The Stream That Nobody Cancelled

Every `StreamSubscription` is a pair of references: the stream holds a reference to your callback, and your callback captured `this` (the State object). Call `.cancel()` in `dispose()` or neither side can be GC'd.

Our chat screen subscribed to a global message bus in `initState`:

```dart
// What we had
class ChatScreenState extends State<ChatScreen> {
  @override
  void initState() {
    super.initState();
    // This captures 'this' — the entire State object
    MessageBus.instance.stream.listen((msg) {
      setState(() => _messages.add(msg));
    });
  }
  // No dispose() override. No cancel(). 47 leaked controllers.
}
```

```dart
// What we shipped
class ChatScreenState extends State<ChatScreen> {
  StreamSubscription<Message>? _sub;

  @override
  void initState() {
    super.initState();
    _sub = MessageBus.instance.stream.listen((msg) {
      if (mounted) setState(() => _messages.add(msg));
    });
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }
}
```

Rule: every `listen()` needs a `cancel()`. Treat them like `malloc`/`free`.

## Leak #2: The FFI Allocation With No Finalizer

We use a native image processing library via FFI. The Dart wrapper allocated native memory, but we were relying on the Dart GC to clean it up. The Dart GC doesn't know about native memory — it only tracks Dart heap objects. The native allocation is invisible to it.

```dart
// Broken — Dart GC has no idea this native memory exists
class NativeImage {
  final Pointer<Uint8> _buffer;
  NativeImage(int width, int height)
      : _buffer = calloc<Uint8>(width * height * 4);
  
  // No finalizer. When NativeImage is GC'd, _buffer is orphaned.
}
```

The fix is `NativeFinalizer` — a Dart mechanism that runs a native callback when the Dart object is collected:

```dart
class NativeImage implements Finalizable {
  static final _finalizer = NativeFinalizer(
    calloc.nativeFree, // native function to call on GC
  );
  
  final Pointer<Uint8> _buffer;

  NativeImage(int width, int height)
      : _buffer = calloc<Uint8>(width * height * 4) {
    // Register: when this object is GC'd, free _buffer
    _finalizer.attach(this, _buffer.cast(), detach: this);
  }

  void dispose() {
    _finalizer.detach(this);
    calloc.free(_buffer);
  }
}
```

Call `dispose()` eagerly when you're done. The finalizer is a safety net for cases where you forget, not a substitute for explicit cleanup.

## Leak #3: AnimationController Without a TickerProvider Scope

This one is subtle. `AnimationController` requires a `TickerProvider` (usually `this` via `SingleTickerProviderStateMixin`). If you create an `AnimationController` in a class that isn't a `State` — like a ViewModel, a service, or even an inherited widget — the ticker keeps running in the background after the widget is gone.

We had an `AnimationController` inside a custom `InheritedWidget` that was supposed to pulse an icon. Nobody ever disposed it.

```dart
// Leaks AnimationController on every rebuild that replaces the InheritedWidget
class PulseProvider extends InheritedWidget {
  final AnimationController controller;
  
  PulseProvider({required Widget child, required TickerProvider vsync})
      : controller = AnimationController(
          vsync: vsync, duration: const Duration(seconds: 1))
          ..repeat(),
        super(child: child);
  // updateShouldNotify returns true → widget rebuilt → old controller leaked
}
```

The fix: own the controller in a `StatefulWidget` and dispose it there. `InheritedWidget` is for propagating data, not for owning resources with lifecycles.

## How to Catch This Before It Ships

Add this to your CI integration test suite:

```dart
testWidgets('ChatScreen does not leak on navigation', (tester) async {
  final initialMemory = await getMemoryUsage(); // via vm_service
  
  for (int i = 0; i < 10; i++) {
    await tester.pumpWidget(ChatScreen());
    await tester.pumpAndSettle();
    await tester.pumpWidget(const SizedBox()); // navigate away
    await tester.pumpAndSettle();
  }
  
  // Force GC
  await forceGarbageCollection();
  
  final finalMemory = await getMemoryUsage();
  expect(finalMemory - initialMemory, lessThan(2 * 1024 * 1024)); // <2MB growth
});
```

We didn't have this test. We found the leak because a user on a Redmi 9 left a 1-star review. Now we have the test.

## The Uncomfortable Summary

The Dart analyzer won't catch any of the three leaks above. They're not syntax errors or type mismatches. They're semantic misunderstandings about ownership — who is responsible for cleaning up what, and when.

DevTools heap snapshots are the only reliable way to find them. Run one after every screen you ship. Sort by instance count delta. If something is growing that shouldn't be, find the retaining path and follow it to where `dispose()` was never called.

It takes 10 minutes. It would have saved us two days of chasing the wrong thing and one very bad week of 1-star reviews.
