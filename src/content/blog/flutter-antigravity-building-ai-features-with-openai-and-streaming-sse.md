---
archetype: "comparison"
title: "Flutter Antigravity: Building AI Features with OpenAI and Streaming SSE"
slug: "flutter-antigravity-building-ai-features-with-openai-and-streaming-sse"
date: "September 12, 2026"
excerpt: >
  Implements OpenAI SSE streaming in Flutter with real-time markdown token rendering, resilient retry channels, and client-side chat state management.
coverImage: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1200"
category: "Flutter"
readTime: 7
tags:
  - "Flutter"
---
# Flutter Antigravity: Building AI Features with OpenAI and Streaming SSE

You are building an AI chat interface in Flutter, and your first prototype feels sluggish. The user sends a prompt, waits five seconds staring at a spinner, and then receives a wall of text all at once. The UX fix is obvious: Server-Sent Events (SSE) streaming. 

The real problem starts when you implement it on mobile. You must decide whether to wrap the raw HTTP stream yourself, rely on a high-level SDK, or route through an intermediary backend gateway. Each choice directly impacts frame rates during token rendering, how your app recovers from dropped Wi-Fi packets on a commuter train, and how much app memory is eaten by rapid stream-to-widget rebuilds.

I spent the last two weeks benchmarking and profiling three distinct streaming architectures on an iPhone 13 and a Pixel 7:
1. **Raw `dart:io` / `http` stream consumption** with manual SSE line decoding.
2. **Community OpenAI SDKs** (such as `dart_openai` or `langchain_dart`).
3. **Backend-for-Frontend (BFF) edge proxy** streaming through WebSockets/gRPC.

Here is what I learned from profiling frame rates, memory spikes, and socket drops across these patterns.

---

## The shift in streaming architecture

Streaming text from an LLM sounds simple: open an HTTP POST request, keep the connection open, parse incoming lines prefixed with `data: `, and append chunks to a string. 

Two factors complicate this on client devices:
- **Markdown AST recalculation:** If you naive-render Markdown every time a 3-character token arrives, the Flutter layout engine reparses and relayouts the entire text widget tree 30 to 80 times per second. This immediately causes UI frame drops (jank).
- **Mobile network instability:** Mobile devices switch towers, drop into low-power states, and throttle background sockets. When an SSE stream breaks mid-sentence, standard HTTP client libraries terminate the connection with an unhandled socket exception, leaving your chat state stranded halfway through a completion.

Let us evaluate the three architectural patterns.

---

## Pattern 1: Direct SSE parsing via raw HTTP streams

This pattern bypasses third-party wrappers. You open an `HttpClientRequest` or an `http.ByteStream`, split chunks on newline boundaries, parse the raw `data: ` JSON payloads, and emit pure domain events into a Dart `StreamController`.

```dart
import 'dart:async';
import 'dart:convert';
import 'dart:io';

class DirectSseClient {
  final HttpClient _client = HttpClient();
  final String _apiKey;

  DirectSseClient(this._apiKey);

  Stream<String> streamChatCompletion(String prompt) async* {
    final request = await _client.postUrl(
      Uri.parse('https://api.openai.com/v1/chat/completions'),
    );
    
    request.headers.set(HttpHeaders.contentTypeHeader, 'application/json');
    request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $_apiKey');
    request.headers.set(HttpHeaders.acceptHeader, 'text/event-stream');

    final payload = jsonEncode({
      'model': 'gpt-4o-mini',
      'messages': [{'role': 'user', 'content': prompt}],
      'stream': true,
    });
    
    request.write(payload);
    final response = await request.close();

    if (response.statusCode != 200) {
      throw HttpException('Failed with status: ${response.statusCode}');
    }

    // Transform raw bytes to lines, then strip SSE metadata
    yield* response
        .transform(utf8.decoder)
        .transform(const LineSplitter())
        .where((line) => line.startsWith('data: '))
        .map((line) => line.substring(6).trim())
        .where((line) => line != '[DONE]')
        .map((data) {
          final json = jsonDecode(data) as Map<String, dynamic>;
          final choices = json['choices'] as List<dynamic>;
          if (choices.isEmpty) return '';
          final delta = choices[0]['delta'] as Map<String, dynamic>;
          return delta['content'] as String? ?? '';
        })
        .where((content) => content.isNotEmpty);
  }
}
```

### Strengths
- **Zero bloat:** No external dependencies, version locking, or SDK baggage.
- **Micro-optimizations:** You control chunk buffering directly. You can insert a throttling layer (e.g., using `package:rxdart` or custom debounce logic) right into the transformer chain to control UI render frequency.

### Weaknesses
- **Security vulnerabilities:** Bundling API keys on client devices exposes credentials to reverse engineering.
- **Manual error handling:** You must handle rate limits (HTTP 429), partial JSON chunks, and stream reconnections by hand.

---

## Pattern 2: Ready-made client SDKs

Pre-built Dart packages wrap the OpenAI API into strongly typed models and provide built-in stream handling.

```dart
import 'package:dart_openai/dart_openai.dart';

class SdkChatService {
  SdkChatService(String apiKey) {
    OpenAI.apiKey = apiKey;
  }

  Stream<String> streamResponse(String prompt) {
    final userMessage = OpenAIChatCompletionChoiceMessageModel(
      content: [
        OpenAIChatCompletionChoiceMessageContentItemModel.text(prompt),
      ],
      role: OpenAIChatMessageRole.user,
    );

    final stream = OpenAI.instance.chat.createStream(
      model: 'gpt-4o-mini',
      messages: [userMessage],
    );

    return stream.map((event) {
      return event.choices.first.delta.content?.first?.text ?? '';
    }).where((text) => text.isNotEmpty);
  }
}
```

### Strengths
- **Speed to prototype:** Strong types for function calling, tool calls, and vision inputs out of the box.
- **Maintained contracts:** Upstream API changes are updated by package maintainers without requiring custom parser rewrites.

### Weaknesses
- **Heavy abstractions:** You lose granular control over HTTP connection pools, socket timeouts, and chunk-level transform pipelines.
- **Direct key dependency:** Similar to Pattern 1, this approach requires calling provider endpoints directly from client runtimes, which is unsuitable for production apps with public distributions.

---

## Pattern 3: Backend proxy with managed streaming state

In this architecture, the Flutter client talks exclusively to an intermediary server (FastAPI, Go, or Cloudflare Workers) over SSE or a WebSocket channel. The server orchestrates OpenAI tokens, manages prompt templates, handles user rate limits, and pushes pre-sanitized chunks to the app.

```
Flutter Client <--- [App SSE Protocol] ---> Backend Gateway <--- [OpenAI SSE] ---> OpenAI API
```

```dart
// Client-side consumption of a custom backend proxy endpoint
Stream<ChatMessageChunk> streamFromGateway(String conversationId, String prompt) async* {
  final client = HttpClient();
  final request = await client.postUrl(Uri.parse('https://api.example.com/v1/chat/stream'));
  
  request.headers.set('Authorization', 'Bearer $userAuthToken');
  request.headers.set('Content-Type', 'application/json');
  request.write(jsonEncode({
    'conversation_id': conversationId,
    'prompt': prompt,
  }));

  final response = await request.close();
  
  yield* response
      .transform(utf8.decoder)
      .transform(const LineSplitter())
      .where((line) => line.startsWith('event: message'))
      .map((_) => /* custom deserialization */ ChatMessageChunk.empty());
}
```

### Strengths
- **Strict security boundary:** API keys never touch the mobile device. Authentication uses your own session tokens.
- **Resilient reconnection:** The proxy can cache the completion stream in Redis. If a client drops connection, it can reconnect with a `Last-Event-ID` header and resume without re-triggering upstream token costs.
- **Server-side moderation and telemetry:** Inspect, sanitize, and log chat completions before they reach the user.

### Weaknesses
- **Infrastructure overhead:** Requires designing, deploying, and scaling an intermediary streaming service.
- **Slight latency overhead:** Adds a routing hop between the client and OpenAI's edge infrastructure.

---

## Managing Flutter frame rates during active streaming

When testing on physical devices, standard `ListView.builder` setups rendering `flutter_markdown` or `gpt_markdown` often drop frames when processing tokens arriving at 50Hz.

To solve this, implement a buffered token accumulator instead of updating the state on every single SSE chunk:

```dart
import 'dart:async';
import 'package:flutter/foundation.dart';

class ThrottledStreamAccumulator {
  final Stream<String> _inputStream;
  final Duration throttleDuration;
  final ValueNotifier<String> textNotifier = ValueNotifier('');
  
  Timer? _throttleTimer;
  final StringBuffer _buffer = StringBuffer();

  ThrottledStreamAccumulator(
    this._inputStream, {
    this.throttleDuration = const Duration(milliseconds: 32), // ~30fps batching
  });

  void listen() {
    _inputStream.listen(
      (chunk) {
        _buffer.write(chunk);
        _scheduleUpdate();
      },
      onDone: () {
        _flush();
      },
      onError: (error) {
        _flush();
      },
    );
  }

  void _scheduleUpdate() {
    if (_throttleTimer?.isActive ?? false) return;
    
    _throttleTimer = Timer(throttleDuration, () {
      _flush();
    });
  }

  void _flush() {
    textNotifier.value = _buffer.toString();
  }

  void dispose() {
    _throttleTimer?.cancel();
    textNotifier.dispose();
  }
}
```

Batching updates into 32ms intervals keeps the UI rendering at a predictable 30 to 60 frames per second without losing the visual sensation of real-time generation.

---

## Head-to-head comparison

| Criterion | Direct Raw SSE (`dart:io`) | Client SDK (`dart_openai`) | Backend Gateway Proxy |
| :--- | :--- | :--- | :--- |
| **API Key Security** | Vulnerable (keys compiled/stored on device) | Vulnerable (keys compiled/stored on device) | High (keys secured on server) |
| **Development Velocity** | Moderate (requires custom decoding) | High (ready-made classes and streams) | Low to Moderate (two codebases to coordinate) |
| **Reconnection Support** | Manual implementation required | Limited / SDK-dependent | Robust (supported via `Last-Event-ID`) |
| **Rendering Control** | High (full control over transform pipeline) | Moderate (fixed output stream types) | High (custom chunking protocols possible) |
| **Dependency Overhead** | Zero external dependencies | Dependent on third-party maintainers | Zero mobile SDK dependencies |
| **Architectural Complexity** | Low (client-only) | Low (client-only) | High (requires distributed infrastructure) |

---

## Decision framework

### Choose Direct Raw SSE when:
- You are building an internal tooling app or an offline-first/local-model app (e.g., streaming from an Ollama instance on `localhost` or a LAN node).
- You want total control over the Dart transformer pipeline without adding third-party package dependencies.

### Choose a Client SDK when:
- You are building quick proof-of-concept prototypes or hackathon projects where velocity matters more than credential isolation.
- You need structured access to complex features like multi-modal attachments, structured outputs, or tool calling without hand-writing schema models.

### Choose a Backend Gateway Proxy when:
- You are shipping a production product to real users via public app stores.
- You must prevent key scraping, implement per-user rate limiting, or enforce server-side content safety rules.
- Your app requires resilient stream recovery across unstable mobile network switches.

---

If you are prototyping an idea over a weekend, using a community SDK will get your chat UI working within an hour. However, for any Flutter application shipping to the App Store or Google Play, route your SSE streams through an authenticated backend gateway proxy and throttle the token updates before they hit the widget tree. This protects your API credentials and keeps your UI thread completely free of rendering jank.