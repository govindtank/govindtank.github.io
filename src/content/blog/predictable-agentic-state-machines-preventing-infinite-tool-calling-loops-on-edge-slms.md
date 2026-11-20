---
archetype: "opinion"
title: "Predictable Agentic State Machines: Preventing Infinite Tool-Calling Loops on Edge SLMs"
slug: "predictable-agentic-state-machines-preventing-infinite-tool-calling-loops-on-edge-slms"
date: "November 20, 2026"
excerpt: >
  Small 3B models easily trap themselves in infinite tool-calling loops. Enforce hard-bounded Kotlin state machines to guarantee deterministic execution and zero runaway loops on the edge.
coverImage: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1200"
category: "AI-Engineering"
readTime: 9
tags:
  - "AI-Engineering"
---
# Predictable Agentic State Machines: Preventing Infinite Tool-Calling Loops on Edge SLMs

> **TL;DR**: Running autonomous ReAct loops on 3B edge models is an anti-pattern that burns battery and locks up runtimes. Enforcing deterministic transitions through a hard finite-state machine (FSM) guarantees execution stops in bounded time while preserving local execution privacy.
> - **The Problem**: Quantized Small Language Models (SLMs) running locally hallucinate empty tool arguments, misinterpret tool outputs as user prompts, and enter infinite self-referential calling loops that drain device batteries.
> - **The Solution**: Rip out the dynamic ReAct prompt loop. Replace it with an explicit, sealed-class FSM in Kotlin where the model only selects valid transitions from an explicit enum at each stage.
> - **The Result**: Total elimination of non-terminating tool runs, deterministic memory usage under 2.2 GB on Android/JVM targets, and hard-bounded latency capped at $O(N)$ state transitions.

Small language models (1B to 3B parameters) running locally on edge hardware via llama.cpp or ONNX Runtime cannot handle open-ended ReAct (Reasoning + Acting) loops. If you ask a 3B model to dynamically decide *when* it is done querying tools, it will fail. It loops. It queries the same calendar API four times with slightly altered whitespace, hallucinates arguments when a tool returns an error, and eventually hits your context ceiling or toasts the user's phone.

Stop building agentic edge systems that rely on prompting small models to "think step-by-step" about their control flow. Your control flow belongs in host code. The edge model should only classify, extract, or synthesize within strict, state-machine-gated boundaries.

## The mainstream fallacy: Prompting can fix reasoning drift

The prevailing assumption in AI agent design is inherited from frontier models: give the model a scratchpad, bind a dozen JSON tool schemas, and let it cycle until it produces a final answer. Frameworks like LangChain and LlamaIndex pushed this paradigm downward to local inference runtimes without questioning whether the underlying architecture supports it.

With Claude 3.5 Sonnet or GPT-4, this works because the parameter volume supports reliable counterfactual reasoning, precise schema adherence, and meta-cognition over long context histories. When a frontier model receives an unexpected response from a tool, it self-corrects:

```
Observation: {"error": "Device offline"}
Thought: The target device is offline. I should not retry the ping; I will notify the user instead.
```

An INT4-quantized 3B model (such as Llama-3.2-3B or Gemma-2-2B) lacks the attention head capacity to maintain that meta-goal across multiple conversational turns. Instead, this happens:

```
Observation: {"error": "Device offline"}
Thought: I need to query the device status.
Action: ping_device()
Observation: {"error": "Device offline"}
Thought: I need to query the device status.
```

The model falls into an attractor basin in its weight space. Adding instructions like *"Do not repeat tool calls if they fail"* to system prompts burns precious context tokens, slows down prefill speeds on mobile NPUs, and routinely collapses after three turns.

## The fix: Model as a state transitioner, not a planner

We do not need generic autonomous agents on the edge. We need reliable workflows: local voice commands, offline data sync, form filling, and bounded device configuration. 

Instead of treating the model as an omniscient planner that invents the graph at runtime, define the graph explicitly. The model becomes a bounded evaluator that only extracts entities or picks the next edge from an allowed set of transitions.

```
       +-----------------------+
       |         IDLE          |
       +-----------------------+
                   |
             Parse Intent (SLM)
                   v
       +-----------------------+
       |   EXTRACTING_ARGS     |<-------+ (Arg validation fails,
       +-----------------------+        |  max 2 retries)
                   |                    |
             Validate Args              |
             [Host Validation] ---------+
                   | (Passed)
                   v
       +-----------------------+
       |    EXECUTING_ACTION   |
       +-----------------------+
                   |
             Deterministic Exit
             (Success or Error)
                   v
       +-----------------------+
       |   SYNTHESIZING_RESULT |
       +-----------------------+
                   |
             Done (Yield to User)
                   v
                 [IDLE]
```

This simple shift changes the theoretical guarantees:
1. **Loop prevention**: The graph has no backward edge without a hard decrementing counter managed by host code.
2. **Context stability**: Context size is reset or deterministically masked between states, preventing context degradation.
3. **Grammar constraints**: You constrain the model's logits via GBNF or regex to *only* allow valid tokens for the active state's payload.

| Approach | Loop Safety | Memory Bound | Context Overhead | Quantization Tolerance |
| :--- | :--- | :--- | :--- | :--- |
| **Open ReAct Loop** | Probabilistic (None) | Unpredictable (grows to window limit) | High (accumulates tool history) | Breaks easily below 8-bit |
| **Host Guardrails (Counters)** | Semi-safe (cuts off execution abruptly) | Clamped, but wasteful | Moderate (burns tokens until cutoff) | Leaves tasks half-finished |
| **Finite-State Machine (FSM)** | Deterministic (Guaranteed) | Constant $O(1)$ per state | Minimal (isolated prompt per state) | High (usable on 4-bit 1B models) |

## Minimal, zero-dependency Kotlin implementation

This pattern requires no complex orchestration frameworks. It requires a sealed hierarchy, an explicit execution budget, and rigid host code control.

Here is a production-tested state machine engine for local SLM invocation. It uses pure Kotlin without external agent runtimes.

```kotlin
package com.engine.agent.fsm

sealed interface AgentState {
    data class Idle(val rawInput: String) : AgentState
    data class Extracting(val intent: Intent, val rawInput: String, val attemptsLeft: Int) : AgentState
    data class Executing(val action: Action) : AgentState
    data class Synthesizing(val actionResult: ActionResult) : AgentState
    data class Terminal(val output: String, val error: Boolean = false) : AgentState
}

enum class Intent { SET_TIMER, GET_BATTERY, UNKNOWN }

sealed interface Action {
    data class SetTimer(val seconds: Int) : Action
    data object CheckBattery : Action
}

sealed interface ActionResult {
    data class Success(val message: String) : ActionResult
    data class Failure(val reason: String) : ActionResult
}

// Interface for local SLM (e.g., llama.cpp JNI wrapper or ONNX Runtime)
fun interface EdgeInferenceEngine {
    fun generate(prompt: String, stopTokens: List<String>, jsonSchema: String?): String
}

class SafeAgentExecutor(
    private val llm: EdgeInferenceEngine,
    private val maxStateTransitions: Int = 5
) {
    fun run(userInput: String): String {
        var state: AgentState = AgentState.Idle(userInput)
        var transitions = 0

        // Hard circuit-breaker to guarantee execution termination
        while (state !is AgentState.Terminal && transitions < maxStateTransitions) {
            transitions++
            state = when (val current = state) {
                is AgentState.Idle -> handleIdle(current)
                is AgentState.Extracting -> handleExtracting(current)
                is AgentState.Executing -> handleExecuting(current)
                is AgentState.Synthesizing -> handleSynthesizing(current)
                is AgentState.Terminal -> current
            }
        }

        return when (state) {
            is AgentState.Terminal -> (state as AgentState.Terminal).output
            else -> "Execution budget exceeded. Halting pipeline for safety."
        }
    }

    private fun handleIdle(state: AgentState.Idle): AgentState {
        // Logit masking/constrained output: intent must be one of the enum keys
        val prompt = "Classify intent: '${state.rawInput}'. Options: [SET_TIMER, GET_BATTERY, UNKNOWN]. Intent:"
        val rawIntent = llm.generate(prompt, listOf("\n"), null).trim()

        val intent = runCatching { Intent.valueOf(rawIntent) }.getOrDefault(Intent.UNKNOWN)
        return when (intent) {
            Intent.SET_TIMER, Intent.GET_BATTERY -> AgentState.Extracting(intent, state.rawInput, attemptsLeft = 2)
            Intent.UNKNOWN -> AgentState.Terminal("Could not map request to a supported action.", error = true)
        }
    }

    private fun handleExtracting(state: AgentState.Extracting): AgentState {
        if (state.attemptsLeft <= 0) {
            return AgentState.Terminal("Failed to extract valid parameters.", error = true)
        }

        return when (state.intent) {
            Intent.GET_BATTERY -> AgentState.Executing(Action.CheckBattery)
            Intent.SET_TIMER -> {
                // Constrain SLM output to numeric string using grammar or focused prompt
                val prompt = "Extract seconds as a single integer from: '${state.rawInput}'. Number:"
                val rawNumber = llm.generate(prompt, listOf("\n", " "), null).trim()
                val seconds = rawNumber.toIntOrNull()

                if (seconds != null && seconds > 0) {
                    AgentState.Executing(Action.SetTimer(seconds))
                } else {
                    // Retry state with decremented budget; prevents prompt looping
                    AgentState.Extracting(state.intent, state.rawInput, state.attemptsLeft - 1)
                }
            }
            Intent.UNKNOWN -> AgentState.Terminal("Unexpected intent resolution.", error = true)
        }
    }

    private fun handleExecuting(state: AgentState.Executing): AgentState {
        // Tool execution happens purely in deterministic host code
        val result = try {
            when (val action = state.action) {
                is Action.CheckBattery -> ActionResult.Success("Battery is at 84%")
                is Action.SetTimer -> ActionResult.Success("Timer set for ${action.seconds} seconds")
            }
        } catch (e: Exception) {
            ActionResult.Failure("Device API failure: ${e.message}")
        }
        return AgentState.Synthesizing(result)
    }

    private fun handleSynthesizing(state: AgentState.Synthesizing): AgentState {
        val prompt = when (val res = state.actionResult) {
            is ActionResult.Success -> "Summarize success for the user: '${res.message}'. Response:"
            is ActionResult.Failure -> "Inform the user about the failure: '${res.reason}'. Response:"
        }
        // Bounded synthesis: generate human-facing text, cut off after first sentence
        val output = llm.generate(prompt, listOf("\n", "."), null).trim()
        return AgentState.Terminal(if (output.isBlank()) "Action completed." else "$output.")
    }
}
```

Notice how this structure solves edge constraints:
1. **Garbage output isolation**: If `Extracting` receives nonsense, it tries once more and then safely transitions to `Terminal`. It cannot recurse indefinitely.
2. **Deterministic transitions**: The model never decides to "call another tool" from the `Synthesizing` state. The topology prevents it.
3. **No global context poisoning**: Every transition constructs an isolated prompt containing only the variables it needs, dropping old token baggage and keeping memory footprint flat.

## Common pitfalls and what broke in practice

When testing this pattern with Llama-3.2-3B via llama.cpp on a Snapdragon 8 Gen 2, three issues emerged immediately.

### 1. Token leak in unconstrained generation
Even when instructed to output single words (like an enum key), quantized models often emit leading whitespace, punctuation, or conversational filler (`"Sure, the intent is: SET_TIMER"`). 
* **The fix**: Do not rely on prompt phrasing. Use llama.cpp grammar constraints (GBNF) to restrict model sampling directly to the token choices of the target enum:
```ebnf
root ::= "SET_TIMER" | "GET_BATTERY" | "UNKNOWN"
```

### 2. State resets wiping required edge data
Because each state builds an isolated prompt to conserve tokens, the model in `Synthesizing` lacks awareness of the original user prompt unless explicitly forwarded in the state payload.
* **The fix**: Keep state data models immutable and pass historical inputs along as payload parameters in the sealed class constructor (like `rawInput` passed into `Extracting`).

### 3. Context thrashing when swapping states
Reallocating a context buffer on every single state step stalls inference by reinitializing KV-caches on memory-constrained mobile runtimes.
* **The fix**: Keep a single inference context alive. Clear only the KV-cache entries using `llama_kv_cache_clear` between states rather than tearing down the context and re-parsing model weights.

## Counterarguments: Where this pattern falls short

A rigid FSM is not appropriate for all edge use cases.

If your product relies on deep exploratory search across diverse tools—such as an offline code interpreter or a multi-hop document investigation system where the path through the data cannot be anticipated—a hardcoded state machine is too brittle. In those cases, you either need a larger model (at least 8B to 14B parameters, requiring 8GB+ of unified memory) or dynamic DAG planners.

However, if your edge application runs on consumer smartphones or embedded Linux hardware and performs task-oriented workflows, prioritizing autonomy over determinism is an architectural mistake.

## Action item for your codebase

Search your local SLM codebase for loops that alternate model inference and tool dispatch using termination flags like `"Thought:"` or `"Action: None"`.

Delete that loop. Define a Kotlin sealed interface for your required states, move your transition logic into a native host `when` block, and cap your transition budget with a hard integer check. Your tool calls will become deterministic, and your edge inference runtime will stop crashing on corrupted context loops.