---
archetype: "war-story"
title: "Android 16 Predictive Back + AGSL Shaders: Stop Breaking System Animations"
slug: "android-16-predictive-back-agsl-shaders-stop-breaking-system-animations"
date: "November 10, 2026"
excerpt: >
  Custom AGSL shaders break Predictive Back with clipped transitions and GPU spikes. Hook BackEvent and apply safe fallbacks to keep 120 FPS intact.
coverImage: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&q=80&w=1200"
category: "Mobile-Architecture"
readTime: 9
tags:
  - "Mobile-Architecture"
---
# Android 16 Predictive Back + AGSL Shaders: Stop Breaking System Animations

> **TL;DR**: Binding runtime AGSL `RuntimeShader` effects directly to views participating in Android 16's predictive back gestures stalls the RenderThread, clips off-screen render layers, and tanks frame rates. Decoupling the shader during gesture progress and falling back to hardware-layer snapshotting eliminates jank with zero custom math.
> - **The Problem**: AGSL fragment shaders recalculating resolution uniforms inside active back-gesture interpolations triggered full render pass invalidations, spiking GPU frame execution past 24ms and clipping cross-activity bounds.
> - **The Solution**: Intercept `BackEventCompat` progress via `OnBackPressedCallback`, freeze or disable dynamic shader passes when `progress > 0f`, and let WindowManager handle the transform matrix.
> - **The Result**: Consistent 120 FPS frame pacing on Pixel 8/9 devices during back navigations, zero RenderThread overruns, and a 42MB reduction in peak transient graphic memory allocations.

---

## The incident at 4:30 PM on a Friday

Last month, QA flagged a release blocker on our Android 16 canary builds. It read: *"Swiping back from the checkout confirmation screen causes the previous screen to flash black, then stutters violently."*

Our checkout confirmation screen used an AGSL chromatic aberration and blur shader behind an order summary card. It looked sharp in static testing. It ran at a flat 120 FPS on Snapdragon 8 Gen 3 devices under normal touch interactions. But the moment an engineer turned on predictive back gestures in developer options and began a slow edge swipe, the UI thread decoupled from the RenderThread. The swipe preview window clipped cleanly in half, dropped to single-digit frames, and occasionally leaked underlying surface buffers.

My initial suspicion was a composition leak in Jetpack Compose or an incorrect gesture consumer consuming touch events twice. We assumed Compose's `PredictiveBackHandler` was passing garbage floats into the uniform array. 

It was neither. We were breaking the rendering pipeline by trying to be too clever with runtime shaders during system-driven window transformations.

---

## The setup: What we assumed about AGSL and WindowManager

AGSL (`Android Graphics Shading Language`) executes on the GPU via Skia/Impeller under the RenderThread. When you apply a `RuntimeShader` via `RenderEffect.createRuntimeShaderEffect()`, you attach a custom fragment shader to a `View` or Compose `graphicsLayer`.

Predictive back changes how Android draws your task hierarchy. In Android 14 and 15, system animations started treating your window as a transformable layer. In Android 16, predictive back handles cross-activity and cross-task transitions by handing gesture control directly to `WindowManagerService`. 

Here is what we assumed:
1. Skia handles layer clipping automatically when the system scales our window target down.
2. Updating uniforms like `resolution` and `progress` 120 times per second across an arbitrary `View` hierarchy is cheap because AGSL runs on the GPU.

Here is what actually happens:
When the predictive back gesture starts, the window is reparented into a transient leashed surface controlled by the system compositor. If your screen contains an active `RenderEffect` that evaluates input based on window resolution:
- The system scale transform invalidates the underlying hardware layer cache on every single gesture tick.
- The RenderThread is forced to allocate and recreate off-screen render targets on every frame matching the changing window bounds.
- If your AGSL shader references dynamic resolution uniforms, Skia flushes the batch queue, causing a GPU stall while waiting for the previous frame's raster pass to complete.

The result is clipped bounds, skipped v-sync pulses, and memory thrashing.

---

## The failure: Why standard debugging lied to us

We fired up Android Studio's Profiler and Perfetto. CPU usage was under 14%. The UI thread was idle, waiting on `Choreographer#doFrame`. 

The red flags showed up exclusively in the **RenderThread** and **SurfaceFlinger** tracks inside Perfetto:
1. `DrawFrame` routinely took >26ms (budget is 8.3ms for 120Hz).
2. `SkiaPipeline::renderFrame` showed massive spikes in `GrResourceCache::findAndRefScratchResource`.
3. The GPU was constantly allocating and destroying 1080x2400 scratch render targets.

Our code updated the AGSL `resolution` uniform on every size change callback. During a predictive back gesture, the window scale animates from `1.0` down to `0.9` or lower. Every sub-pixel shift altered the view's internal surface geometry, causing the hardware layer to recreate its backing texture. We were forcing a re-allocation of an off-screen graphic buffer roughly 90 times per second.

```
[Normal Rendering]
UI Thread -> RenderThread -> Skia Draw Batch -> GPU Execution (2.1ms)

[Predictive Back + Active AGSL]
Gesture Tick -> Layout Scale -> Uniform Update 
  -> Invalidate Hardware Layer 
  -> Destroy Texture 
  -> Allocate Scratch Surface 
  -> Recompile/Rebind AGSL Pipeline 
  -> GPU Execution (28.4ms) -> Frame Dropped
```

The system was trying to run an exit-scale animation while we were forcing a hardware pipeline pipeline re-bind every 8ms.

---

## The actual fix: Stop rendering live effects during gestures

The fix came down to a core principle: **Never run active, resolution-dependent AGSL uniform updates while the system compositor owns the viewport scale.**

You do not need to calculate dynamic chromatic aberration or glass blur while the user is actively backing out of a screen. The user's eye is tracking the navigation gesture, not the quality of your fragment shader.

The solution required two steps:
1. Hook into `OnBackPressedCallback` (or Compose `PredictiveBackHandler`) and monitor the transition state.
2. The instant `BackEventCompat.progress` moves past `0.0`, disable the expensive dynamic shader or freeze it into a static snapshot.

Here is the decision matrix we used to decide how to handle shader views during system gestures:

| Approach | Latency Impact | Complexity | Visual Fidelity | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **Full Live AGSL Rendering** | Severe (>24ms GPU spikes) | Low | High (when not dropping frames) | Anti-pattern in production |
| **Linear Uniform Downsampling** | Moderate (8-14ms) | High | Medium (aliasing artifacts) | Avoid |
| **Shader Bypass on Gesture** | None (<2ms) | Lowest | Clean fallback | Best for simple backgrounds |
| **Static Cache / RenderNode Freeze** | Low (<4ms) | Medium | Perfect freeze | Best for complex hero views |

---

## The fix in code

The following implementation shows how to handle predictive back safely without dropping frames, using standard Android platform APIs.

### 1. View-based implementation using AndroidX Core

```kotlin
package com.example.navigation.ui

import android.graphics.RenderEffect
import android.graphics.RuntimeShader
import android.os.Build
import android.view.View
import androidx.activity.BackEventCompat
import androidx.activity.OnBackPressedCallback
import androidx.annotation.RequiresApi
import org.intellij.lang.annotations.Language

class SafeShaderBackHandler(
    private val targetView: View,
    private val agslSource: String
) : OnBackPressedCallback(true) {

    private var runtimeShader: RuntimeShader? = null
    private var isShaderActive = false

    init {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            runtimeShader = RuntimeShader(agslSource)
            attachShader()
        }
    }

    override fun handleOnBackStarted(backEvent: BackEventCompat) {
        // Drop the dynamic shader before the system starts animating the window leash.
        // This prevents the RenderThread from recalculating scratch buffers at scale.
        removeShader()
    }

    override fun handleOnBackProgressed(backEvent: BackEventCompat) {
        // Intentionally no-op. Do NOT update shader uniforms here.
        // The system handles window scaling via hardware composition.
    }

    override fun handleOnBackPressed() {
        // Final gesture completion; screen is closing.
        removeShader()
        isEnabled = false
    }

    override fun handleOnBackCancelled() {
        // User cancelled the swipe; restore the effect immediately.
        attachShader()
    }

    private fun attachShader() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && !isShaderActive) {
            runtimeShader?.let { shader ->
                // Feed dimensions once. Do not update during transforms.
                val width = targetView.width.toFloat()
                val height = targetView.height.toFloat()
                if (width > 0f && height > 0f) {
                    shader.setFloatUniform("uResolution", width, height)
                    targetView.setRenderEffect(RenderEffect.createRuntimeShaderEffect(shader, "uContent"))
                    isShaderActive = true
                }
            }
        }
    }

    private fun removeShader() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && isShaderActive) {
            targetView.setRenderEffect(null)
            isShaderActive = false
        }
    }
}
```

### 2. Jetpack Compose approach with hardware layer caching

If you are using Compose, do not inject custom shader modifiers inside screens using `PredictiveBackHandler` without conditional logic.

```kotlin
package com.example.navigation.compose

import android.graphics.RuntimeShader
import android.os.Build
import androidx.activity.compose.PredictiveBackHandler
import androidx.compose.animation.core.Animatable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asComposeRenderEffect
import androidx.compose.ui.graphics.graphicsLayer
import kotlinx.coroutines.CancellationException

private const val SIMPLE_SHADER_SRC = """
    uniform shader uContent;
    uniform float2 uResolution;
    
    half4 main(float2 fragCoord) {
        half4 color = uContent.eval(fragCoord);
        // Fast gray fade without branching
        float gray = dot(color.rgb, half3(0.299, 0.587, 0.114));
        return half4(half3(gray), color.a);
    }
"""

@Composable
fun SafeShaderBackContainer(
    content: @Composable () -> Unit
) {
    var isGestureInProgress by remember { mutableStateOf(false) }
    
    val shader = remember {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            RuntimeShader(SIMPLE_SHADER_SRC)
        } else null
    }

    PredictiveBackHandler { progressFlow ->
        try {
            isGestureInProgress = true
            progressFlow.collect { backEvent ->
                // Keep UI thread work to absolute zero. 
                // We deliberately do not push backEvent.progress into the shader uniforms.
            }
            // Gesture finished: user popped the screen
        } catch (e: CancellationException) {
            // Gesture cancelled: restore shader
            isGestureInProgress = false
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .graphicsLayer {
                // If back gesture is active, strip the RenderEffect entirely.
                // The compositor can now transform the backing layer natively.
                if (!isGestureInProgress && shader != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    shader.setFloatUniform("uResolution", size.width, size.height)
                    renderEffect = android.graphics.RenderEffect
                        .createRuntimeShaderEffect(shader, "uContent")
                        .asComposeRenderEffect()
                } else {
                    renderEffect = null
                }
            }
    ) {
        content()
    }
}
```

---

## Common pitfalls and how to avoid them

1. **Feeding dynamic gesture progress directly into AGSL uniforms:**
   Passing `backEvent.progress` directly into `shader.setFloatUniform("uProgress", progress)` invalidates the hardware draw list on every move event. This forces CPU-GPU synchronization points across the RenderThread barrier. If you must animate, let Compose `Modifier.graphicsLayer` animate standard properties (`alpha`, `translationX`, `scaleX`) which run on the RenderThread without triggering re-draw passes.

2. **Neglecting to handle `CancellationException`:**
   Predictive back is speculative. A user can drag from the edge, see the underlying window, and push their finger back to cancel the gesture. If you strip your shader in `handleOnBackStarted` or at the start of `PredictiveBackHandler` and fail to restore it in `CancellationException` / `handleOnBackCancelled`, your screen remains permanently broken without effects.

3. **Updating resolution uniforms inside `onSizeChanged` during transitions:**
   During window-level back animations, `View` bounds can report non-integer scaled sizes. If your AGSL relies on standard `uResolution`, floating-point rounding mismatches will generate visible sampling seams on edge boundaries. Hard-code your uniform bounds once on layout stabilization, or disable the shader during transit.

---

## Lessons learned from production

- **System window managers win over app-level rendering.** Android's system compositor does not care how performant your fragment shader is in a vacuum. When WindowManager asserts control over the root surface leash, anything forcing GPU buffer reallocations will cause dropped frames.
- **Hardware layers are brittle during spatial animations.** Attaching custom fragment shaders marks view surfaces as dirty whenever input bounds shift. A static fallback avoids invalidating the cached display list.
- **Boring defaults preserve battery life.** A basic alpha fade or zero-effect bypass during a 300ms gesture is imperceptible to users. An artifacting, 15 FPS screen freeze is not.
- **Test with GPU Profiling turned on explicitly.** Testing solely on an emulator or without `Profile GPU Rendering` (or Perfetto traces) enabled masks these spikes because desktop GPUs swallow the scratch-allocation latency. Real mobile chipsets throttle immediately.

---

## What to check in your codebase tomorrow morning

Run a global text search across your repository for `createRuntimeShaderEffect` or `RuntimeShader`. Check every usage against its parent container's back-navigation handling. If any AGSL-backed view exists on a screen that participates in Predictive Back, verify that the shader effect is stripped or frozen the instant `OnBackPressedCallback.handleOnBackStarted()` fires. If it is running unrestricted across gesture ticks, delete the dynamic uniform updates and verify frame times in Perfetto.