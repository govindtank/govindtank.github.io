---
title: "Flutter 4 and Impeller: The Next Generation of Cross-Platform UI Performance"
slug: "flutter-4-and-impeller-the-next-generation-of-cross-platform-ui-performance"
date: "August 03, 2026"
excerpt: >
coverImage: "/images/covers/flutter-4-and-impeller-the-next-generation-of-cross-platform-ui-performance.png"
category: "Flutter"
readTime: 6
tags:
  - "Flutter"
archetype: "tutorial"
---


# Flutter 4 and Impeller: The Next Generation of Cross-Platform UI Performance

I've shipped Flutter apps since the 1.0 days. For most of that time I kept a rehearsed answer for the same complaint: "the app stutters on the first scroll." I deserved it. Launch, swipe, and the raster thread froze for a beat while the engine compiled shaders on the fly. A few hundred milliseconds later everything ran smooth, but the first impression was already ruined.

Flutter 4 removes that excuse. On iOS and Android, the Skia path is gone. Every frame renders through Impeller, Flutter's own GPU renderer, and nothing gets compiled at runtime. No warm-up pass. No hitch.

This post is a tutorial with a real artifact: a custom fragment shader effect that runs at full frame rate, built the way Flutter 4 expects. You'll confirm the renderer, bundle a shader, paint with it, and measure the result in the performance overlay.

## The jank problem nobody fixed for years

The old renderer worked like this. Skia received draw commands, turned them into GPU work, and hit a wall the moment it met an unfamiliar effect. Shadows, rounded corners, gradients — each one needed a shader, and Skia compiled shaders lazily, at first use, on the raster thread.

That first-use compile is what you felt as jank. Scroll to a screen with a new effect and the frame budget blew up while the driver compiled GLSL. Teams worked around it for years: pre-warm caches, keep effects few, pray the user scrolled slowly.

The official answer was SkSL warm-up. Capture the shaders, bundle them, load them before the first frame. It helped. It also meant shipping a snapshot of shaders tied to your GPU driver, which is a fragile thing to carry around. One driver update and your warm-up cache was stale.

Impeller was the real answer, and it took the long way there.

## What Impeller actually changed

Impeller doesn't compile shaders on the device. It ships a small set of pre-compiled shaders written in its own shading language, baked for each backend at build time — Metal on iOS, Vulkan or OpenGL ES on Android. The engine's shader compiler runs offline, in your build, not on a user's phone at 8pm.

That removes the whole class of first-frame stalls. The raster thread no longer waits on a driver. It also steadies frame times across devices, because every phone runs the same pre-baked pipeline instead of whatever the local driver decides to do with GLSL.

Flutter 4 makes this the only path on mobile. The old escape hatches are gone. I'll admit I checked twice — muscle memory from three years of `--no-enable-impeller` experiments. It's really gone.

Everything you already knew about layout and painting stays the same. The `Canvas` API, the widget tree, hot reload — untouched. Only the renderer under them changed. The good news: the shader API you may have avoided also survived. `FragmentProgram` and `FragmentShader` still work, and they're now the fast path instead of the exotic one.

## Step 1: create the project and confirm the renderer

Start clean. I'll assume Flutter 4 is installed and `flutter doctor` is quiet.

```bash
flutter create impeller_probe
cd impeller_probe
flutter run --profile
```

Run with `--profile`, because release-mode performance is the only performance that counts. Watch the console during startup — the engine logs which GPU backend it picked. On iOS you'll see Metal. On Android you'll see Vulkan where the device supports it, OpenGL ES otherwise.

If you see a Skia mention anywhere, your Flutter is older than 4. Upgrade before continuing; everything below assumes the new pipeline.

## Step 2: bundle a shader in pubspec.yaml

Impeller compiles shaders at build time, so the engine needs to know which files to compile. That's what the `shaders` key in pubspec.yaml is for.

```yaml
flutter:
  uses-material-design: true
  shaders:
    - shaders/ripple.frag
```

Create the `shaders/` directory and drop `ripple.frag` in it. Any fragment shader listed here gets bundled into the asset bundle and compiled for each backend during the build.

## Step 3: write the fragment shader

Here's the whole effect: a ripple radiating from the center of the widget, driven by a time uniform. Note the version line — Impeller requires GLSL 4.60 core, and older syntax fails at build time.

```glsl
#version 460 core

precision highp float;

uniform float uTime;
uniform vec2 uSize;

out vec4 fragColor;

void main() {
  vec2 uv = flutter_FragCoord().xy / uSize;
  float dist = distance(uv, vec2(0.5));
  float wave = 0.5 + 0.5 * sin(dist * 40.0 - uTime * 3.0);
  vec3 color = mix(vec3(0.05, 0.08, 0.18), vec3(0.15, 0.45, 0.95), wave);
  fragColor = vec4(color, 1.0);
}
```

`flutter_FragCoord()` is provided by the engine — it's the fragment position in logical pixels, which saves you from fighting device pixel ratios. The math is deliberately small: a distance, a sine, a mix. That's the point. The GPU eats this in a single pass.

## Step 4: load it and draw it

Back in Dart, load the program as an asset and paint with a custom painter. The loading is async, which matters — more on that in the pitfalls.

```dart
import 'dart:ui' as ui;
import 'package:flutter/material.dart';

class RippleBackground extends StatefulWidget {
  const RippleBackground({super.key});

  @override
  State<RippleBackground> createState() => _RippleBackgroundState();
}

class _RippleBackgroundState extends State<RippleBackground>
    with SingleTickerProviderStateMixin {
  ui.FragmentProgram? _program;
  late final AnimationController _clock;

  @override
  void initState() {
    super.initState();
    _clock = AnimationController.unbounded(vsync: this)
      ..repeat(period: const Duration(seconds: 8));
    ui.FragmentProgram.fromAsset('shaders/ripple.frag').then((p) {
      setState(() => _program = p);
    });
  }

  @override
  void dispose() {
    _clock.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _clock,
      builder: (context, _) {
        return RepaintBoundary(
          child: CustomPaint(
            size: Size.infinite,
            painter: _RipplePainter(_program, _clock.value * 2 * 3.14159),
          ),
        );
      },
    );
  }
}

class _RipplePainter extends CustomPainter {
  _RipplePainter(this._program, this._phase);

  final ui.FragmentProgram? _program;
  final double _phase;

  @override
  void paint(Canvas canvas, Size size) {
    final program = _program;
    if (program == null) return;

    final shader = program.fragmentShader()
      ..setFloat(0, _phase)
      ..setFloat(1, size.width)
      ..setFloat(2, size.height);

    canvas.drawRect(
      Offset.zero & size,
      Paint()..shader = shader,
    );
  }

  @override
  bool shouldRepaint(_RipplePainter old) => old._phase != _phase;
}
```

Two details worth pointing out. The clock drives the phase directly — no per-frame Dart math beyond one multiplication. And `RepaintBoundary` isolates the effect so the rest of the tree doesn't repaint when the ripple animates.

Uniforms are set by index, in declaration order: `uTime`, then `uSize`. Get the order wrong and you get garbage colors, not an error.

## Step 5: measure it

With the painter wired into your home screen, run again:

```bash
flutter run --profile
```

Open DevTools and pull up the performance overlay, or enable it in code with `debugShowPerformanceOverlay: true`. Watch the raster bar while the ripple runs. The budget at 60fps is 16.7ms per frame; the raster thread should sit well under it, flat, with no spikes.

That flatness is the whole story. The old renderer would spike the first time the effect appeared on screen. Here, the shader was compiled when the app was built. There's nothing left to stall on.

If you want a harsher test, put a `ListView` of rounded cards on top of the ripple and scroll it. Rounded corners were a classic Skia shader trigger. Watch the raster bar through a full scroll — that's the scenario that used to stutter on every first pass.

## What we just built

A GPU-driven animated background: one tiny shader, one custom painter, one repaint boundary. No image sequences, no animation packages, no work on the UI thread beyond a clock tick. The same pattern extends to blurs, glows, noise, particle fields — anything expressible per-pixel runs this way. This is the cheapest way to make a Flutter screen feel alive, and it was exactly the kind of effect you couldn't ship without jank before.

## Pitfalls I hit so you don't have to

**The program is null on the first frames.** `FragmentProgram.fromAsset` resolves after the first frame or two. My painter returns early on null, which shows a blank background briefly. That's fine for a background. For something critical, hold the widget until the program loads, or paint a fallback.

**Shader edits need a full restart.** Hot reload won't pick up `.frag` changes. The build-time compilation means you restart the app — or rebuild — to see edits. Annoying, but it's the same trade that buys the runtime speed.

**Uniform order is unforgiving.** Set them by index in declaration order. A mismatch renders silently wrong — no exception, just wrong pixels. I burned an hour on this once because I declared `uSize` before `uTime` in my head.

**Dispose what you load.** Fragment programs are engine resources. Cache one instance and reuse it across frames instead of loading per widget.

**Test on a mid-range Android device.** Vulkan drivers vary wildly. The pipeline is pre-compiled, but driver bugs are not extinct. What runs at 60fps on a flagship may still crawl on a 2020 budget phone. Your minimum supported device is the benchmark that matters.

**Web is a different story.** Impeller on the web is still maturing, and the shader path differs there. If you ship this effect to the browser, gate it behind a platform check and keep a fallback.

## The bottom line

Flutter 4's Impeller move kills a decade-old annoyance: shader compilation jank on mobile. The renderer is pre-compiled, deterministic, and the shader API you already knew is now the fast path. If you've been avoiding custom shaders because of the first-frame cost, that reason is gone. Write the shader, measure the raster bar, and ship it.
