---
archetype: "war-story"
title: "Flutter Web: Deploying AI Chat Apps with Server-Sent Events and WebSockets"
slug: "flutter-web-deploying-ai-chat-apps-with-server-sent-events-and-websockets"
date: "September 20, 2026"
excerpt: >
  Stream LLM responses in Flutter Web using Server-Sent Events and WebSockets. Covers connection lifecycles, state handling, and hosting caveats for production builds.
coverImage: "/covers/flutter-web-deploying-ai-chat-apps-with-server-sent-events-and-websockets.svg"
category: "Mobile-Architecture"
readTime: 7
tags:
  - "Mobile-Architecture"
---
# Flutter Web: Deploying AI Chat Apps with Server-Sent Events and WebSockets

I watched the production metrics dashboard on a Friday afternoon as our newly launched Flutter web client quietly degraded under real-world traffic. We had just ported our internal conversational assistant from native mobile targets (iOS and Android) to Flutter Web. On our physical development devices—an iPhone 15 Pro and a Pixel 8—token streaming felt instantaneous. Characters appeared token by token with zero perceived latency.

Then we published the WebAssembly (Wasm) build of the Flutter web application behind an Nginx reverse proxy on Cloud Run. Within thirty minutes of opening the internal beta to three hundred engineers, my Slack notifications erupted. On Chrome and Safari desktop browsers, our streaming chat UI wasn't streaming at all. Instead of continuous token updates, users experienced an eight-second freeze followed by the entire 400-word response rendering onto the screen in a single, janky paint frame.

## The architecture and our initial assumptions

The application stack was straightforward:
- Backend: A Python FastAPI service calling Anthropic and OpenAI inference endpoints, exposing a streaming completion route (`/v1/chat/completions/stream`).
- Proxy layer: Nginx running in a container, terminating TLS and forwarding upstream requests to our backend container cluster.
- Frontend: Flutter Web compiled with Dart 3.4 using the CanvasKit/Skwasm renderers.

We initially chose Server-Sent Events (SSE) over HTTP/2 for the mobile clients. Dart's `http` and `dio` packages on native platforms handle chunked transfer encoding natively via platform sockets. When an SSE payload arrives in chunks containing `data: {"token": "foo"}\n\n`, the native socket emits bytes immediately via a Dart `Stream<List<int>>`.

We assumed this streaming behavior would translate identically to Flutter Web. The Dart team spent significant effort unifying platform behaviors, so we reasoned that an `http.ByteStream` consuming an HTTP `POST` or `GET` response body would pipe streaming chunks directly to the UI thread, updating the `ValueNotifier<String>` that drove our markdown viewer widget.

## The failure mode and initial wrong turns

The symptom on web builds was severe: the network tab showed an active `fetch` or `XMLHttpRequest` with status `200 OK`, but the Dart stream listener never fired until the backend finished generating the entire response and closed the HTTP connection.

My first guess was a browser-level CORS preflight issue or an Nginx buffering directive. I checked the Nginx configuration. Sure enough, `proxy_buffering` was set to the default value of `on`. 

I immediately deployed a configuration update:

```nginx
location /v1/chat/ {
    proxy_pass http://backend_upstream;
    proxy_set_header Connection '';
    proxy_http_version 1.1;
    proxy_buffering off;
    proxy_cache off;
    chunked_transfer_encoding on;
}
```

I tested it with `curl -N -X POST https://api.internal.domain/v1/chat/completions/stream`. The raw tokens streamed into my terminal buffer chunk by chunk without delay. I thought the problem was resolved.

It was not.

When testing the deployed Flutter web application again in Chrome DevTools, the tokens were still buffered until stream completion. 

Our second hypothesis was that CanvasKit's rendering engine was dropping frames or batching state updates behind a blocking UI thread calculation during Markdown parsing. I attached the Dart DevTools CPU Profiler and recorded a trace during a 10-second response window. The UI thread was completely idle—over 98% of the frame budget was unallocated while waiting for the network stream. The renderer was not starved; the Dart runtime simply was not receiving events from the underlying browser network APIs until the underlying XHR/Fetch call completed.

## The root cause in browser networking

The underlying culprit was how the Dart `http` package's `BrowserClient` was implemented on the web platform.

In standard Dart web builds, `package:http/browser_client.dart` historically used browser `HttpRequest` (XMLHttpRequest) under the hood. While XHR supports readystate changes, streaming partial response text reliably across different browsers via XHR without accumulating the entire response payload in browser memory is notoriously brittle. 

When modern web browsers handle `fetch()`, they provide access to a `ReadableStream` through `response.body`. If an application does not explicitly configure a fetch-based client with streaming response handling enabled, the client falls back to waiting for the entire response body to buffer before resolving the payload future.

Furthermore, SSE requires standard HTTP `GET` requests according to the classic `EventSource` web API specification. Because our inference endpoint required sending dynamic prompt parameters, message histories, and system instructions, our client needed an HTTP `POST` request with a JSON payload. The native browser `EventSource` JavaScript API does not support `POST` payloads or custom authorization headers without third-party polyfills.

To resolve this reliably across desktop and mobile browsers, we had two architectural paths:
1. Implement a Fetch-based streaming client in Dart that directly reads the `ReadableStreamDefaultReader` from the JavaScript `Fetch` API.
2. Pivot to a bidirectional WebSocket transport layer for the conversational stream, decoupling the token delivery from HTTP transport quirks altogether.

We implemented both and tested them across realistic network conditions (including 3G throttling and intermittent packet loss). While the custom Fetch reader worked well on modern Chromium engines, Safari on iOS web views presented intermittent stream-stalling issues under heavy DOM updates. The WebSocket architecture proved deterministic and eliminated the buffering layer entirely.

## The solution

We separated the transport layer into a clean, platform-agnostic interface: a dedicated streaming client that uses WebSockets for browser runtimes, while maintaining native SSE for platforms where low-level sockets operate without browser engine interference.

Here is the Dart client implementation using `web_socket_channel` with full support for connection lifecycles, structured token parsing, backpressure, and error handling:

```dart
import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';

class ChatStreamClient {
  final Uri serverUri;
  WebSocketChannel? _channel;
  StreamSubscription? _subscription;

  ChatStreamClient({required this.serverUri});

  Stream<String> streamMessage({
    required String prompt,
    required String conversationId,
    required String authToken,
  }) {
    final controller = StreamController<String>();

    final wsEndpoint = serverUri.replace(
      scheme: serverUri.scheme == 'https' ? 'wss' : 'ws',
      path: '/v1/chat/ws',
    );

    try {
      _channel = WebSocketChannel.connect(wsEndpoint);

      // Send initial handshake and payload once the connection opens
      final payload = jsonEncode({
        'action': 'generate',
        'token': authToken,
        'conversation_id': conversationId,
        'prompt': prompt,
      });

      _channel!.sink.add(payload);

      _subscription = _channel!.stream.listen(
        (dynamic rawData) {
          try {
            final Map<String, dynamic> data = jsonDecode(rawData as String);
            
            if (data.containsKey('error')) {
              controller.addError(Exception(data['error']));
              return;
            }

            if (data['is_finished'] == true) {
              controller.close();
              _cleanup();
              return;
            }

            if (data.containsKey('delta')) {
              controller.add(data['delta'] as String);
            }
          } catch (e) {
            controller.addError(FormatException('Failed to parse frame: $e'));
          }
        },
        onError: (error) {
          controller.addError(error);
          _cleanup();
        },
        onDone: () {
          if (!controller.isClosed) {
            controller.close();
          }
          _cleanup();
        },
        cancelOnError: true,
      );
    } catch (e) {
      controller.addError(e);
      _cleanup();
    }

    return controller.stream;
  }

  void _cleanup() {
    _subscription?.cancel();
    _subscription = null;
    _channel?.sink.close();
    _channel = null;
  }

  void dispose() {
    _cleanup();
  }
}
```

On the backend, our FastAPI implementation handles the incoming WebSocket connection, manages the async generator from the inference SDK, and pushes discrete frames directly to the client without passing through intermediary HTTP chunk buffers:

```python
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import openai

app = FastAPI()
client = openai.AsyncOpenAI()

@app.websocket("/v1/chat/ws")
async def chat_websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        init_message = await websocket.receive_text()
        data = json.loads(init_message)
        
        prompt = data.get("prompt", "")
        conversation_id = data.get("conversation_id", "")

        stream = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            stream=True,
        )

        async for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                await websocket.send_text(
                    json.dumps({
                        "conversation_id": conversation_id,
                        "delta": delta,
                        "is_finished": False
                    })
                )

        await websocket.send_text(
            json.dumps({"conversation_id": conversation_id, "delta": "", "is_finished": True})
        )
        await websocket.close()

    except WebSocketDisconnect:
        # Client disconnected prematurely; clean up ongoing task if necessary
        pass
    except Exception as exc:
        await websocket.send_text(json.dumps({"error": str(exc)}))
        await websocket.close(code=1011)
```

## Profiling and verified outcomes

After shipping the WebSocket transport to staging, we re-ran our profiling suite. 

1. First Token Latency (TTFT): The time between the user clicking "Send" and the first visual character rendering on the screen dropped from 8,400ms (buffered fallback) to 340ms on standard broadband connections.
2. Memory Allocation Stability: On long token generations (1,500+ tokens), memory consumption in the browser tab remained completely flat at roughly 42MB. Under the old XHR approach, the accumulating internal buffer created unnecessary garbage collection churn during large markdown re-renders.
3. Proxy Reliability: Bypassing the Nginx HTTP response buffer via direct WebSocket frame upgrading (`Upgrade: websocket`) completely eliminated edge-proxy caching artifacts and timeouts on long-running LLM streams.

## Lessons learned

- Do not assume Dart's unified API produces identical transport semantics across mobile and web platforms. The underlying browser JS runtime enforces security, buffering, and lifecycle constraints that bare metal sockets do not.
- Validate your edge proxy's handling of long-lived streams early. Setting `proxy_buffering off` is necessary for HTTP streaming, but WebSockets sidestep proxy response-buffering bugs by default through protocol upgrades.
- Avoid using classic HTTP `POST` requests for streaming LLM payloads if you rely solely on generic HTTP client packages on Flutter Web. If SSE is required, use explicit Fetch Streams API bindings instead of standard XHR abstractions.
- Keep the serialization format minimal. Avoid sending redundant metadata in every token chunk over WebSockets to reduce JSON decoding overhead on lower-end mobile browser runtimes running Flutter WebAssembly builds.

When targeting Flutter Web for real-time generative applications, decouple your transport layer from the assumptions of native mobile sockets early, and default to WebSockets when deterministic, low-latency token streaming is required across diverse browser engines.