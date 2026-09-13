---
archetype: "explainer"
title: "Hardware-Accelerated Live Wallpapers with Jetpack Compose, AGSL, and Android NDK"
slug: "hardware-accelerated-live-wallpapers-with-jetpack-compose-agsl-and-android-ndk"
date: "September 13, 2026"
excerpt: >
  Implement high-performance Android WallpaperServices using AGSL shaders and native C++ render loops. Covers Compose integration and frame pacing to control battery usage.
coverImage: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&q=80&w=1200"
category: "Mobile-Architecture"
readTime: 8
tags:
  - "Mobile-Architecture"
---
# Hardware-Accelerated Live Wallpapers with Jetpack Compose, AGSL, and Android NDK

Most Android developers assume a `WallpaperService` is just another background component that draws to a canvas whenever the screen updates. The standard expectation is that if your animations render smoothly in a regular `Activity`, they will translate cleanly to a live wallpaper. 

They do not. 

When you run an interactive rendering pipeline inside a live wallpaper, you do not have an `Activity` window managing lifecycle events, you lack a standard view hierarchy unless you artificially host one, and you are directly exposed to the system compositor. If your frame loop slips past 16.6ms or fails to respond immediately to visibility toggles, SurfaceFlinger drops the frames, your service gets throttled by the OS battery watchdog, and the Android framework silently kills your engine process to reclaim RAM.

Building a production-ready, battery-efficient live wallpaper requires balancing three distinct technologies: Jetpack Compose for declarative configuration UI and custom layout nodes, AGSL (Android Graphics Shading Language) for GPU-driven fragment shaders, and the Android NDK to drive a lock-free native rendering loop via `Choreographer`.

Here is how these pieces operate under the hood.

---

## The mental model: two pipelines, one canvas

Think of a live wallpaper not as an application, but as an out-of-process swapchain producer. 

```
+-------------------------------------------------------------+
| System UI / Launcher Process                                |
|   - Window Manager gestures (offsets, zoom, home swipes)    |
+-------------------------------------------------------------+
                               | IPC (Binder calls)
                               v
+-------------------------------------------------------------+
| Your WallpaperService Process                               |
|                                                             |
|   [ Kotlin / Compose Layer ]                                |
|   Handles state, user settings, lifecycle, AGSL RuntimeShader|
|                               | JNI Bridge                  |
|                               v                             |
|   [ Native NDK C++ Layer ]                                  |
|   ANativeWindow + Choreographer frame loop + EGL Context    |
+-------------------------------------------------------------+
                               | Hardware Composer (HWC)
                               v
+-------------------------------------------------------------+
| SurfaceFlinger / Physical Display Plane                    |
+-------------------------------------------------------------+
```

Your wallpaper engine owns an `ANativeWindow` provided directly by the `SurfaceView` or `SurfaceHolder` backing the engine. You have two distinct pipelines executing in your process:

1. **The State and Shading Pipeline (Kotlin / AGSL):** Manages user preferences, computes mathematical uniforms, handles Compose-driven overlay UI, and constructs the AGSL shader pipeline.
2. **The Execution Pipeline (C++ / NDK):** Owns an EGL/Vulkan context, synchronizes directly with the hardware vsync via the native `AChoreographer`, and passes uniform state data into the GPU rasterizer.

Instead of routing draw commands through the Android `ViewRootImpl` hardware renderer—which forces synchronization overhead on the main thread—we detach rendering completely from the Android UI thread. Compose generates the parameters and static layouts; native code flushes the pixels.

---

## Core mechanics and architecture

To build this architecture, we break down the implementation into three layers: the custom Compose hosting engine, the AGSL shader pipeline, and the native EGL render loop.

### 1. The Jetpack Compose Engine Bridge

A `WallpaperService.Engine` does not provide an `Activity` context, which means `setContent {}` cannot be called directly without creating an internal virtual window container. We instantiate a custom `ComposeView` attached to a mock `ViewTreeLifecycleOwner` and `ViewTreeSavedStateRegistryOwner`.

```kotlin
class AgslWallpaperService : WallpaperService() {
    override fun onCreateEngine(): Engine = AgslEngine()

    inner class AgslEngine : Engine(), LifecycleOwner, ViewModelStoreOwner, SavedStateRegistryOwner {
        private val lifecycleRegistry = LifecycleRegistry(this)
        private val savedStateRegistryController = SavedStateRegistryController.create(this)
        override val viewModelStore = ViewModelStore()
        override val lifecycle: Lifecycle get() = lifecycleRegistry
        override val savedStateRegistry: SavedStateRegistry = savedStateRegistryController.savedStateRegistry

        private var nativeRendererHandle: Long = 0

        override fun onCreate(surfaceHolder: SurfaceHolder) {
            super.onCreate(surfaceHolder)
            savedStateRegistryController.performRestore(null)
            lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_CREATE)
            
            // Initialize NDK engine with surface
            nativeRendererHandle = nativeInitRenderer()
        }

        override fun onSurfaceCreated(holder: SurfaceHolder) {
            super.onSurfaceCreated(holder)
            nativeSetSurface(nativeRendererHandle, holder.surface)
        }

        override fun onVisibilityChanged(visible: Boolean) {
            super.onVisibilityChanged(visible)
            if (visible) {
                lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_RESUME)
                nativeResumeLoop(nativeRendererHandle)
            } else {
                lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_PAUSE)
                nativePauseLoop(nativeRendererHandle)
            }
        }

        override fun onSurfaceDestroyed(holder: SurfaceHolder) {
            nativeDestroySurface(nativeRendererHandle)
            super.onSurfaceDestroyed(holder)
        }

        override fun onDestroy() {
            lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_DESTROY)
            nativeReleaseRenderer(nativeRendererHandle)
            super.onDestroy()
        }

        private external fun nativeInitRenderer(): Long
        private external fun nativeSetSurface(handle: Long, surface: Surface)
        private external fun nativePauseLoop(handle: Long)
        private external fun nativeResumeLoop(handle: Long)
        private external fun nativeDestroySurface(handle: Long)
        private external fun nativeReleaseRenderer(handle: Long)
    }
}
```

### 2. The AGSL Shader Pipeline

AGSL allows us to write GLSL-like fragment shaders directly in the Android graphics layer (available from Android 13 / API 33 upwards). Instead of re-compiling heavy shaders on the fly, we compile an AGSL `RuntimeShader` once and pass dynamic resolution and time uniforms directly.

```kotlin
class ShaderPipeline(val agslSource: String) {
    private val runtimeShader = RuntimeShader(agslSource)
    private val shaderPaint = Paint()

    fun updateUniforms(timeSeconds: Float, width: Float, height: Float, touchX: Float, touchY: Float) {
        runtimeShader.setFloatUniform("u_time", timeSeconds)
        runtimeShader.setFloatUniform("u_resolution", width, height)
        runtimeShader.setFloatUniform("u_touch", touchX, touchY)
        shaderPaint.shader = runtimeShader
    }

    fun draw(canvas: Canvas) {
        canvas.drawPaint(shaderPaint)
    }
}
```

```glsl
// AGSL fragment program: evaluates entirely on the GPU
uniform float2 u_resolution;
uniform float u_time;
uniform float2 u_touch;

half4 main(in float2 fragCoord) {
    float2 uv = (fragCoord - 0.5 * u_resolution.xy) / u_resolution.y;
    float d = length(uv - (u_touch / u_resolution.xy - 0.5));
    
    // Wave animation driven entirely by hardware math
    float c = sin(d * 12.0 - u_time * 2.0);
    c = abs(c);
    c = 0.02 / c;

    return half4(half3(c * 0.2, c * 0.5, c * 1.0), 1.0);
}
```

### 3. Native Render Loop with AChoreographer

If you use standard `Canvas` locks (`SurfaceHolder.lockHardwareCanvas()`), you incur an unnecessary synchronized IPC ping-pong with the Android Window Manager. To minimize CPU overhead, we handle the render timing natively. We register a callback directly with `AChoreographer` on a dedicated C++ worker thread.

```cpp
#include <android/native_window_jni.h>
#include <android/choreographer.h>
#include <EGL/egl.h>
#include <GLES3/gl3.h>
#include <thread>
#include <atomic>

class NativeRenderer {
public:
    ANativeWindow* window = nullptr;
    AChoreographer* choreographer = nullptr;
    std::atomic<bool> isRunning{false};
    EGLDisplay display = EGL_NO_DISPLAY;
    EGLSurface surface = EGL_NO_SURFACE;
    EGLContext context = EGL_NO_CONTEXT;

    void startLoop() {
        if (isRunning.exchange(true)) return;
        choreographer = AChoreographer_getInstance();
        scheduleNextFrame();
    }

    void pauseLoop() {
        isRunning.store(false);
    }

    void scheduleNextFrame() {
        if (!isRunning.load()) return;
        
        AChoreographer_postFrameCallback64(choreographer, [](int64_t frameTimeNanos, void* data) {
            auto* renderer = static_cast<NativeRenderer*>(data);
            renderer->renderFrame(frameTimeNanos);
            renderer->scheduleNextFrame();
        }, this);
    }

    void renderFrame(int64_t frameTimeNanos) {
        if (!display || !surface) return;

        // Custom GLES or AGSL-compatible Skia Native backend execution
        glClearColor(0.05f, 0.05f, 0.08f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT);

        // Hardware swapchain presentation
        eglSwapBuffers(display, surface);
    }
};
```

---

## What happens at runtime

Here is the exact step-by-step execution path that occurs when a user touches their home screen while this wallpaper runs:

```
[Touch Event on Launcher]
           │
           ▼
[InputManagerService]  ─── (Dispatches via Binder) ───►  [Engine.onTouchEvent()]
                                                                  │
                                                                  ▼
                                                      [Update Atomic State]
                                                                  │
                                                       (Crosses JNI to Native)
                                                                  │
                                                                  ▼
[AChoreographer Vsync Tick (120Hz/60Hz)] ────────────► [Native Frame Callback]
                                                                  │
                                                                  ▼
                                                      [Set Uniforms: u_touch, u_time]
                                                                  │
                                                                  ▼
                                                      [Execute GPU Render Program]
                                                                  │
                                                                  ▼
                                                      [eglSwapBuffers()]
                                                                  │
                                                                  ▼
                                                      [SurfaceFlinger Composite]
```

1. **Touch Ingestion:** The Launcher passes motion coordinates across IPC to `WallpaperService.Engine.onTouchEvent(MotionEvent)`.
2. **State Serialization:** Instead of allocating memory in Compose, the touch coordinates are written into a non-blocking shared atomic ring-buffer accessed by both Kotlin and C++.
3. **Hardware Sync:** At the next physical display refresh boundary (e.g., 8.3ms for a 120Hz panel), the display subsystem fires a hardware vsync signal.
4. **Frame Processing:** Native `AChoreographer` picks up the interrupt on our dedicated C++ background thread, bypassing the Android Main Looper entirely.
5. **GPU Uniform Binding:** AGSL runtime parameters (`u_touch`, `u_time`) are mapped to the uniform block of the active fragment shader.
6. **Zero-Copy Swap:** The shader draws to the native EGL buffer. `eglSwapBuffers` notifies SurfaceFlinger that the buffer queue is ready. The physical frame is composited with zero buffer copies.

---

## Edge cases and gotchas

### 1. The Multi-Display and Foldable Aspect Ratio Glitch
When a user unfolds a device (e.g., Pixel Fold, Samsung Galaxy Z Fold), the underlying `SurfaceHolder` is destroyed and immediately recreated with new physical dimensions. 

If your NDK layer does not explicitly unbind the old `EGLSurface` before the framework passes the new `ANativeWindow`, `eglMakeCurrent` fails silently with `EGL_BAD_NATIVE_WINDOW`. 

**The fix:** Always call `eglDestroySurface` inside `onSurfaceDestroyed()` synchronously, blocking the main thread for a microsecond until the render thread signals that the context has been detached.

```cpp
void detachSurface() {
    if (display != EGL_NO_DISPLAY && surface != EGL_NO_SURFACE) {
        eglMakeCurrent(display, EGL_NO_SURFACE, EGL_NO_SURFACE, EGL_NO_CONTEXT);
        eglDestroySurface(display, surface);
        surface = EGL_NO_SURFACE;
    }
}
```

### 2. App-Switch and Occlusion Leakage
`onVisibilityChanged(false)` is the only real signal you have that an app is occluding the home screen. However, on multi-window configurations or freeform display modes, `onVisibilityChanged` can report `true` even when your wallpaper is 99% covered by an opaque window.

If you keep rendering at 120 FPS when obscured, the CPU/GPU will consume up to 15% battery per hour doing useless work.

**The trade-off:** Listen to `onOffsetsChanged` and `onVisibilityChanged`. When the screen is obscured, throttle the frame rate from 120/60 FPS down to 0 FPS by unregistering the `AChoreographer` callback. When partially revealed, reduce the render scale to half-resolution (e.g., render to a 0.5x FBO and upscale).

### 3. AGSL Floating-Point Inaccuracies Over Extended Uptime
In AGSL, if you pass raw monotonically increasing time (e.g., `SystemClock.elapsedRealtime() / 1000f`) into `u_time`, precision degrades. Standard 32-bit floating-point numbers have only 24 bits of mantissa. 

After 48 hours of device uptime, calculating trigonometric functions like `sin(uv.x * 10.0 + u_time)` directly in the shader starts to show banding and visible stutter because the fractional precision collapses.

**The fix:** Modulo your time uniform on the CPU side before passing it down:

```kotlin
// Wrap time within a repeating cycle (e.g., 3600 seconds)
val wrappedTime = (SystemClock.elapsedRealtime() % 3_600_000L) / 1000f
shaderPipeline.updateUniforms(timeSeconds = wrappedTime, ...)
```

---

Understanding how `SurfaceFlinger`, `AChoreographer`, and AGSL interact under the hood transforms live wallpaper development from an exercise in random frame drops and battery drain into a predictable, zero-copy native graphics system. When you respect the hardware boundary and uncouple frame generation from the main UI thread, you can deliver complex visual experiences while keeping system resource consumption to a minimum.