<!--EXCERPT-->
I moved a 50,000-node network visualization from WebGL 2 to WebGPU over three months. It paid off, and it cost more than the docs suggest.
<!--BODY-->
# WebGPU: Next-Generation Graphics and Compute for the Browser

## The project that pushed us there

I work on a network monitoring dashboard. Big canvas, thousands of nodes — servers, switches, services — connected by edges that show live traffic. Our biggest customer runs 50,000 nodes and something like 200,000 edges, and the whole thing has to stay interactive while new data lands every second.

The old renderer was Canvas 2D for the overview and WebGL 2 for the detailed view. Canvas died first: 50,000 nodes means tens of thousands of draw calls per frame, and no 2D canvas API is built for that. WebGL 2 kept us alive, barely. The force-directed layout that kept the graph readable ran on the main thread — every tick, JavaScript recomputing pair distances across 50k nodes — and it burned most of our 16-millisecond frame budget before rendering even started. We sat at 20fps on a good machine, and the sales demo was getting embarrassing.

The first plan wasn't WebGPU. The first plan was to keep WebGL 2 and push the layout into a transform feedback pass. I built a prototype, and it worked, technically. It also needed a vertex array object for every layout, manual buffer gymnastics, and about 400 lines of boilerplate before the first triangle. My team looked at it and asked who was going to maintain that. Fair question. I had no good answer.

## Why WebGPU instead

WebGPU is the browser's modern GPU API, designed by the W3C WebGPU Working Group and shipped by Chrome, Safari, and Firefox over the last couple of years — Chrome first in 2023, the others through 2025. Where WebGL 2 exposes a thinly veiled OpenGL ES 2.0 state machine, WebGPU models the GPU the way modern native APIs do: explicit pipelines, explicit resources, and a compute path that doesn't require rendering anything at all.

For us the compute path was the whole point. The force simulation is embarrassingly parallel — each node's forces depend on positions, and positions live in GPU buffers. If the sim runs on the GPU, the main thread is free for input and UI, and the layout updates at full refresh rate instead of stealing frames from the renderer.

## Setting up the device

The entry point is small. Ask for an adapter, ask the adapter for a device, configure the canvas context:

```js
const adapter = await navigator.gpu.requestAdapter({
  powerPreference: "high-performance"
});
const device = await adapter.requestDevice();

const context = canvas.getContext("webgpu");
const format = navigator.gpu.getPreferredCanvasFormat();
context.configure({ device, format, alphaMode: "premultiplied" });
```

That's the happy path. The unhappy path is that requestAdapter returns null — on old GPUs, old drivers, or browser/OS combinations the browser doesn't trust. You have to feature-detect and keep a fallback, so plan for it in week one. We didn't. A fleet of customer laptops quietly fell back, and we shipped a black canvas to one of them before the detection landed. The fallback is not a corner case; it's the entry fee.

## The compute pass

With a device in hand, the interesting work is the simulation. We upload positions and velocities into storage buffers, build a compute pipeline from a WGSL shader, and dispatch one workgroup per batch of nodes:

```js
const bindGroup = device.createBindGroup({
  layout: pipeline.getBindGroupLayout(0),
  entries: [
    { binding: 0, resource: { buffer: positionBuffer } },
    { binding: 1, resource: { buffer: velocityBuffer } }
  ]
});

const encoder = device.createCommandEncoder();
const pass = encoder.beginComputePass();
pass.setPipeline(pipeline);
pass.setBindGroup(0, bindGroup);
pass.dispatchWorkgroups(Math.ceil(NODE_COUNT / 64));
pass.end();
device.queue.submit([encoder.finish()]);
```

And the shader, in WGSL:

```wgsl
@group(0) @binding(0) var<storage, read_write> positions : array<vec2f>;
@group(0) @binding(1) var<storage, read_write> velocities : array<vec2f>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) gid : vec3u) {
  let i = gid.x;
  if (i >= arrayLength(&positions)) { return; }

  var force = vec2f(0.0, 0.0);
  for (var j = 0u; j < arrayLength(&positions); j++) {
    let delta = positions[i] - positions[j];
    let distSq = max(dot(delta, delta), 0.01);
    force += delta / distSq;
  }

  velocities[i] += force * 0.001;
  positions[i] += velocities[i];
}
```

That's the classic all-pairs simulation, and it's not the version we shipped — we replaced it with a spatial hash grid, about sixty lines of WGSL that does the same job in roughly O(n log n) time. But the all-pairs version is the one that teaches you the model: storage buffers hold mutable data, workgroups process it in parallel, and the only shared state is the buffers themselves. That mental model took my team about two days to absorb. Once it clicked, people started finding compute jobs everywhere — color quantization for thumbnails, picking queries, even a naive edge-routing pass.

One thing we learned the hard way: double-buffer the simulation. The layout pass reads positions while the previous frame's render pass is still drawing from them, and on some GPUs that's a race you can't see until textures start flickering. Two position buffers, ping-pong between them, swap after the compute pass finishes. It's three lines of bookkeeping and it saves a week of heisenbugs.

## The render side

The render pipeline is more ceremony than WebGL 2 but flatter. You describe the whole pipeline up front — vertex layout, shader modules, target format, primitive topology — in one object, and there's no state switching mid-frame. The API pushes you toward pre-building what you need and recording command buffers that just replay. It felt like a lot of setup for the first pipeline and almost nothing for the tenth. WGSL is a fresh language, and for the first week everyone kept reaching for GLSL habits, but it's a small language — after a weekend of examples the team was comfortable.

## Where it still hurts

I'd ship this migration again tomorrow. I'd also want these four things to be better, because they cost us real time.

First, error messages. When a bind group doesn't match its layout, WebGPU validation quietly drops the draw and you get a black screen. The uncaptured error handler gives you a terse string — "Binding 0 in group 0 is incompatible with the pipeline layout" — which is helpful once you know what it means and cryptic the first ten times. Device.lost is worse: if the GPU process crashes or the OS reclaims the device, you get a lost-device event and you're expected to recreate everything, buffers and pipelines included. Our first lost-device handler just logged it. The canvas went black at a customer site and stayed black until a refresh.

Debugging has improved since the early days — the browser teams built WGSL shader debuggers, and error scopes let you isolate which pass failed. We still kept a debug flag that ran staging builds through full validation, because finding a bad draw in a production build is archaeology.

Second, buffer management is manual and it shows. You own staging buffers for uploads, you map and unmap, you copy buffer to buffer. There's no helper layer; you either write one or pull in a framework. We wrote one, about 200 lines, and it was the best investment of the whole project.

Third, the ecosystem is young. Three.js has a WebGPU renderer now, but the library tier that WebGL enjoys — where someone has already solved instancing, picking, and shadow maps — isn't settled. Roll your own and you carry more surface area than you're used to, including a second shader language in your build.

Fourth, hardware coverage isn't universal. Mobile Safari in particular has texture size limits and memory pressure that desktop never sees. We spent a week on a WKWebView crash that turned out to be a texture size cap. Feature detection and a WebGL 2 fallback aren't optional; they're the entry fee.

## What I'd do differently

Two things. I'd build the fallback path in week one instead of month two, because shipping a black canvas to a customer is a bad look and it was entirely avoidable. And I'd wrap the device in a small class from the start — a thin layer that owns the adapter, handles the lost event, and recreates state — instead of letting requestDevice calls scatter through the codebase.

## The payoff

The numbers that matter: the simulation went from a 40-millisecond main-thread job to a GPU pass that finishes in a couple of milliseconds, and the dashboard runs at a locked 60fps on the same laptops that gave us 20. The main thread is free, so hover, zoom, and tooltips don't stutter. And the compute pipeline turned out to be reusable — layout, color assignment, and edge culling all run on the GPU now.

WebGPU is the first browser graphics API that treats compute as a first-class citizen, and for anyone doing data-heavy visualization it changes what's possible on the client. Just budget for the rough edges. They're real, they're documented badly, and they're worth it.
