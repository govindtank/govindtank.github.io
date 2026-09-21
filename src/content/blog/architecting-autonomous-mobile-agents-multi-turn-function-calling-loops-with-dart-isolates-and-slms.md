---
archetype: "opinion"
title: "Architecting Autonomous Mobile Agents: Multi-Turn Function Calling Loops with Dart Isolates and SLMs"
slug: "architecting-autonomous-mobile-agents-multi-turn-function-calling-loops-with-dart-isolates-and-slms"
date: "September 21, 2026"
excerpt: >
  Implement a ReAct agent workflow in Flutter 3.29 with Dart 3.7 isolate groups. Covers background execution queues and fallback token budgeting between edge SLMs and remote models.
coverImage: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200"
category: "AI-Engineering"
readTime: 7
tags:
  - "AI-Engineering"
---
# Architecting Autonomous Mobile Agents: Multi-Turn Function Calling Loops with Dart Isolates and SLMs

Most mobile engineering teams treat on-device AI as a fancy wrapper around an HTTP client. They stream responses from remote endpoints into a UI state holder, invoke a tool or two on their backend, and call it agentic architecture. 

This approach is fundamentally flawed for interactive client applications.

If you want reliable, low-latency agentic loops that interact with local device capabilities—SQLite databases, sensor feeds, file caches, and secure hardware keys—the agent orchestration engine must live directly on the device. Specifically, the ReAct (Reasoning + Acting) loop belongs inside a dedicated background worker thread with memory isolation, using an edge-first Small Language Model (SLM) for local function-calling triage and falling back to a cloud model only when token budgets or reasoning depth demand it.

Attempting to run multi-turn agentic loops on the main UI thread or offloading every decision cycle to an API creates severe frame drops, astronomical cloud token bills, and fragile offline behavior.

## Why mainstream mobile engineering favors cloud-only agents

The prevailing consensus among mobile architects is that on-device agent execution is not worth the operational overhead. The arguments for this view are straightforward:

1. **Resource constraints:** Quantized SLMs (1.5B to 3B parameters) consume 1.2 GB to 2.5 GB of RAM when loaded via runtimes like MediaPipe LLM Inference or llama.cpp bindings. Mainstream reasoning dictates that reserving this much memory on a mid-range Android device risks high-frequency OS process kills (OOM events).
2. **Context window limits:** Edge models generally operate within narrow context windows (2k to 4k tokens) before inference speed drops precipitously on mobile NPUs and GPUs.
3. **Simplicity of stateless clients:** Pushing full agent state to an orchestration layer (like LangGraph or a custom Python/Node service) keeps the mobile client thin and avoids cross-platform native runtime integration challenges.

These points are valid if your app merely summarizes chat logs. But if your application requires your agent to perform multi-step file manipulation, parse localized SQLite datasets, or poll local device sensors across multiple reasoning turns, routing every intermediate tool call across cellular networks adds 800ms to 2000ms of round-trip latency per hop. When an agent requires four turns to resolve a query, the user waits five seconds staring at a loader.

## The architecture: Isolate groups, background queues, and token-aware fallback

To build a responsive mobile agent in Flutter and Dart, we isolate three concerns: UI rendering, agentic state coordination, and model execution.

Dart 3 isolate groups share the same program code and heap structure definitions, allowing lightweight worker spawns. However, each isolate maintains its own distinct garbage-collected heap. By confining the ReAct multi-turn loop and native FFI bindings to a long-lived background isolate, we guarantee that tensor allocations, heavy JSON schema validations, and SQLite scratchpad queries never starve the UI isolate of its 16.6ms (or 8.3ms) frame budget.

### Execution topology

The architecture consists of three layers:

- **UI isolate:** Dispatches high-level user intents and renders immutable streaming updates received from a broadcast `ReceivePort`.
- **Agent isolate:** Owns the ReAct state machine, tool registry, token ledger, and dynamic fallback decision tree.
- **Native inference thread pool:** Runs on-device quantized GGUF weights or delegates to a remote endpoint via HTTP/2 multiplexing.

### ReAct loop with token budgeting and isolate isolation

The following implementation shows a production-grade ReAct agent loop in Dart. It coordinates local function invocation, tracks token consumption per turn, and deterministically falls back to an upstream remote model when context limits are reached.

```dart
import 'dart:async';
import 'dart:convert';
import 'dart:isolate';

sealed class AgentCommand {}
final class RunPrompt extends AgentCommand {
  final String prompt;
  final SendPort replyTo;
  RunPrompt(this.prompt, this.replyTo);
}

sealed class AgentEvent {}
final class AgentStepEvent extends AgentEvent {
  final String thought;
  final String? tool;
  AgentStepEvent(this.thought, this.tool);
}
final class AgentCompleted extends AgentEvent {
  final String finalAnswer;
  AgentCompleted(this.finalAnswer);
}
final class AgentFailed extends AgentEvent {
  final String error;
  AgentFailed(this.error);
}

typedef ToolHandler = Future<String> Function(Map<String, dynamic> arguments);

final class ToolDefinition {
  final String name;
  final String description;
  final Map<String, dynamic> parameters;
  final ToolHandler handler;

  const ToolDefinition({
    required this.name,
    required this.description,
    required this.parameters,
    required this.handler,
  });
}

abstract interface class InferenceEngine {
  Future<String> complete(List<Map<String, String>> messages, {List<ToolDefinition>? tools});
  int estimateTokens(String text);
}

final class LocalEdgeEngine implements InferenceEngine {
  @override
  Future<String> complete(List<Map<String, String>> messages, {List<ToolDefinition>? tools}) async {
    // Calls out via FFI to local C++ runtime (e.g., llama.cpp/MediaPipe)
    // Returns structured ReAct format or JSON tool call
    return '{"thought": "Inspect local cache", "action": "query_local_db", "args": {"key": "session_tokens"}}';
  }

  @override
  int estimateTokens(String text) => text.length ~/ 4;
}

final class RemoteFoundationalEngine implements InferenceEngine {
  final String apiKey;
  RemoteFoundationalEngine(this.apiKey);

  @override
  Future<String> complete(List<Map<String, String>> messages, {List<ToolDefinition>? tools}) async {
    // Network call to high-capacity model
    return '{"thought": "Synthesized results", "action": "final_result", "args": {"result": "Data reconciled."}}';
  }

  @override
  int estimateTokens(String text) => text.length ~/ 3.8;
}

final class AgentCoordinator {
  static const int maxLocalContextTokens = 2048;
  static const int maxTurns = 6;

  final InferenceEngine localEngine;
  final InferenceEngine remoteEngine;
  final Map<String, ToolDefinition> tools = {};

  AgentCoordinator({
    required this.localEngine,
    required this.remoteEngine,
  });

  void registerTool(ToolDefinition tool) {
    tools[tool.name] = tool;
  }

  static void spawnWorker(SendPort initialReplyPort) {
    final commandPort = ReceivePort();
    initialReplyPort.send(commandPort.sendPort);

    final coordinator = AgentCoordinator(
      localEngine: LocalEdgeEngine(),
      remoteEngine: RemoteFoundationalEngine('sk-prod-key'),
    );

    coordinator.registerTool(
      ToolDefinition(
        name: 'query_local_db',
        description: 'Queries local SQLite store',
        parameters: {'type': 'object', 'properties': {'key': {'type': 'string'}}},
        handler: (args) async => jsonEncode({'status': 'ok', 'records': [102, 403]}),
      ),
    );

    commandPort.listen((message) async {
      if (message is RunPrompt) {
        await coordinator._executeLoop(message.prompt, message.replyTo);
      }
    });
  }

  Future<void> _executeLoop(String prompt, SendPort sink) async {
    final List<Map<String, String>> history = [
      {
        'role': 'system',
        'content': 'You are an autonomous agent. Reason in steps. Respond in valid JSON with fields "thought", "action", and "args".',
      },
      {'role': 'user', 'content': prompt}
    ];

    int turns = 0;
    int currentTokens = history.fold(0, (acc, msg) => acc + localEngine.estimateTokens(msg['content']!));

    while (turns < maxTurns) {
      turns++;
      final bool useLocal = currentTokens < maxLocalContextTokens;
      final InferenceEngine selectedEngine = useLocal ? localEngine : remoteEngine;

      try {
        final rawResponse = await selectedEngine.complete(
          history,
          tools: tools.values.toList(),
        );
        currentTokens += selectedEngine.estimateTokens(rawResponse);

        final Map<String, dynamic> parsed = jsonDecode(rawResponse) as Map<String, dynamic>;
        final String thought = parsed['thought'] as String? ?? '';
        final String action = parsed['action'] as String? ?? 'final_result';
        final Map<String, dynamic> args = (parsed['args'] as Map<String, dynamic>?) ?? {};

        sink.send(AgentStepEvent(thought, action == 'final_result' ? null : action));

        if (action == 'final_result') {
          sink.send(AgentCompleted(args['result']?.toString() ?? thought));
          return;
        }

        final tool = tools[action];
        if (tool == null) {
          throw Exception('Model requested non-existent tool: $action');
        }

        final toolOutput = await tool.handler(args);
        currentTokens += selectedEngine.estimateTokens(toolOutput);

        history.add({'role': 'assistant', 'content': rawResponse});
        history.add({'role': 'tool', 'content': toolOutput});
      } catch (e) {
        sink.send(AgentFailed('Turn $turns failed: ${e.toString()}'));
        return;
      }
    }

    sink.send(AgentFailed('Context window or maximum iteration limit exceeded.'));
  }
}
```

### Dynamic token ledger and failover logic

The engine avoids running out of memory on the device by dynamically tracking the context length. 

Before each turn, the `AgentCoordinator` evaluates the total estimated tokens in the message history against `maxLocalContextTokens`. Once context expansion passes this threshold—frequently caused by large structured tool outputs—the coordinator switches downstream queries to the remote engine. The local memory footprint remains bounded, and the user experiences zero frame hitching because serialization, parsing, and execution happen entirely within the background isolate's heap.

## Counterarguments and trade-offs

This architecture introduces specific trade-offs that must be evaluated against your project requirements.

First, deploying local SLMs increases your application bundle size by at least 1.5 GB to 3.0 GB (using 4-bit integer quantization), unless you manage weights through an on-demand asset delivery mechanism. If your app targets markets where binary size directly correlates with install drop-offs, full local inference may be impractical.

Second, heterogeneous mobile hardware creates behavioral divergence. An edge model running on an Apple Neural Engine produces deterministic tokens quickly; that same model executing on a low-end Mali GPU via OpenCL fallback may generate degraded inference outputs or encounter runtime thermal throttling.

Finally, managing state across isolate boundaries requires strict immutability. You cannot pass arbitrary Dart object instances directly across isolate ports unless they are primitives or native types supported by Dart's shared memory mechanics; everything else must be copied or transferred via `TransferableTypedData`.

## Applying this to your stack

If your application handles sensitive user data, requires multi-step local device actions, or demands sub-second execution loops, stop proxying raw prompts to a remote server. 

Move the agentic ReAct coordinator into a dedicated Dart background isolate, register local tools directly against native platform channels and databases, and use a token-budgeted fallback strategy to offload reasoning only when on-device context bounds are exceeded.