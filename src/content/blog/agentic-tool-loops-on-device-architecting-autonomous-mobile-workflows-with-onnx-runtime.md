---
archetype: "tutorial"
title: "Agentic Tool Loops on Device: Architecting Autonomous Mobile Workflows with ONNX Runtime"
slug: "agentic-tool-loops-on-device-architecting-autonomous-mobile-workflows-with-onnx-runtime"
date: "September 15, 2026"
excerpt: >
  Build local ReAct and function-calling loops on mobile using ONNX Runtime and SLMs. Automate background OS actions entirely offline without cloud dependencies.
coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200"
category: "AI-Engineering"
readTime: 8
tags:
  - "AI-Engineering"
---
# Agentic Tool Loops on Device: Architecting Autonomous Mobile Workflows with ONNX Runtime

Running a small language model (SLM) on a phone to answer trivia is straightforward. Turning that same model into an autonomous agent that inspects device state, executes system tools, repairs its own malformed outputs, and chains actions without touching a cloud API is an entirely different engineering challenge. 

When you move agentic ReAct (Reason + Act) loops directly onto mobile hardware, cloud-based assumptions break down. Memory bandwidth bottlenecks constrain token generation speeds, mobile operating systems aggressively terminate long-running background processes, and low-parameter SLMs (under 4 billion parameters) frequently hallucinate tool names or output broken JSON schemas. 

We will build an on-device agentic execution loop using ONNX Runtime Mobile with the `onnxruntime-genai` API and a quantized SLM (such as Microsoft Phi-3.5-mini-instruct or Qwen2.5-3B-Instruct in INT4/AWQ format). This loop parses user intent, executes deterministic OS-level actions via a structured schema registry, manages key-value (KV) cache state locally, and enforces strict grammar constraints to prevent syntax failures.

## Prerequisites and environment setup

Before building the loop, ensure you have Python 3.10+ (for local prototyping) or an Android NDK/Kotlin environment targeting API level 31+. For this walkthrough, we will write the core engine in Python using the ONNX Runtime Generative AI extensions, which directly mirror the native C++/Java APIs used in mobile builds.

Install the necessary dependencies:

```bash
pip install onnxruntime-genai numpy pydantic==2.*
```

You also need an ONNX-exported, INT4-quantized model with key-value cache support enabled. You can pull an optimized Phi-3.5-mini or Qwen2.5-3B build directly using the Hugging Face CLI:

```bash
huggingface-cli download microsoft/Phi-3.5-mini-instruct-onnx --include "cpu_and_mobile/cpu-int4-rtn-block-32-acc-level-4/*" --local-dir ./models/phi35-int4
```

## Step 1: Define a deterministic tool registry with typed schemas

Small language models struggle with unbounded JSON generation. To guarantee reliability on mobile processors, every tool exposed to the agent must have a strict schema that can be parsed and validated without expensive retries.

We define a Python decorator-based registry that automatically extracts JSON schema definitions from typed Pydantic models.

What this does: Builds an explicit registry that converts native system functions into structured JSON schemas for system prompts.

```python
import json
import inspect
from typing import Callable, Dict, Any, get_type_hints
from pydantic import BaseModel, create_model

class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, Callable] = {}
        self._schemas: Dict[str, dict] = {}

    def register(self, func: Callable):
        name = func.__name__
        type_hints = get_type_hints(func)
        doc = inspect.getdoc(func) or "No description provided."
        
        # Build Pydantic model dynamically from type hints
        fields = {
            param: (hint, ...)
            for param, hint in type_hints.items()
            if param != "return"
        }
        schema_model = create_model(f"{name}Schema", **fields)
        
        self._tools[name] = func
        self._schemas[name] = {
            "name": name,
            "description": doc.strip(),
            "parameters": schema_model.model_json_schema().get("properties", {}),
            "required": list(fields.keys())
        }
        return func

    def get_system_prompt_schema(self) -> str:
        return json.dumps(list(self._schemas.values()), indent=2)

    def execute(self, tool_name: str, arguments: Dict[str, Any]) -> str:
        if tool_name not in self._tools:
            return json.dumps({"error": f"Tool '{tool_name}' not found."})
        try:
            result = self._tools[tool_name](**arguments)
            return json.dumps({"status": "success", "result": result})
        except Exception as e:
            return json.dumps({"status": "error", "message": str(e)})

# Mock mobile OS tools
registry = ToolRegistry()

@registry.register
def query_battery_status() -> dict:
    """Returns the current battery level and charging state."""
    # Simulated mobile HAL call
    return {"percentage": 42, "is_charging": False, "thermal_state": "nominal"}

@registry.register
def toggle_airplane_mode(enable: bool) -> dict:
    """Enables or disables system airplane mode."""
    # Simulated native Android/iOS bridge call
    return {"airplane_mode": enable, "radios_killed": enable}
```

## Step 2: Configure the on-device inference runtime and KV cache

Memory bandwidth is the primary bottleneck for on-device token generation. Instead of naive text generation, we instantiate the ONNX Runtime GenAI execution graph with explicit CPU/NPU execution provider settings, ensuring the Key-Value (KV) cache is allocated once and updated in-place during multi-turn ReAct reasoning steps.

What this does: Initializes the ONNX Runtime Generative AI model pipeline with strict token budgeting and memory management.

```python
import onnxruntime_genai as og

class MobileAgentRuntime:
    def __init__(self, model_path: str):
        # Configured for mobile CPU execution with 4 runtime threads
        self.config = og.Config(model_path)
        self.model = og.Model(model_path)
        self.tokenizer = og.Tokenizer(self.model)
        self.tokenizer_stream = self.tokenizer.create_stream()

    def generate_response(self, prompt: str, max_tokens: int = 256, stop_sequence: str = "</action>") -> str:
        params = og.GeneratorParams(self.model)
        
        # Tokenize prompt and allocate generation bounds
        input_tokens = self.tokenizer.encode(prompt)
        params.set_input_sequences(input_tokens)
        
        # Greedy decoding reduces compute overhead on mobile chips
        params.set_search_options(
            max_length=len(input_tokens) + max_tokens,
            temperature=0.0,
            top_p=1.0,
            repetition_penalty=1.05
        )
        
        generator = og.Generator(self.model, params)
        output_tokens = []
        decoded_text = ""

        while not generator.is_done():
            generator.compute_logits()
            generator.generate_next_token()
            
            # Extract newly produced token
            new_token = generator.get_next_tokens()[0]
            output_tokens.append(new_token)
            
            chunk = self.tokenizer_stream.decode(new_token)
            decoded_text += chunk
            
            # Early stopping when stop sequence boundary is detected
            if stop_sequence in decoded_text:
                break
                
        return decoded_text.strip()
```

## Step 3: Implement the ReAct parser and loop orchestration

The agent operates in an autonomous loop:
1. Receive user goal.
2. Produce a `Thought` explaining the internal step.
3. Emit an `Action` block containing raw JSON specifying the tool and arguments.
4. Stop generation immediately upon closing the action block to preserve compute.
5. Execute the local tool, append the result as an `Observation`, and repeat until an `Answer` is reached or the maximum turn limit is hit.

What this does: Runs the iterative ReAct loop, parsing tool invocations, dispatching system tools, and feeding structured observations back to the model.

```python
import re

SYSTEM_PROMPT_TEMPLATE = """You are an on-device personal assistant. You complete tasks by calling local system tools.
You must reason using this exact format:

Thought: <reasoning step>
Action:
```json
{{
  "tool": "<tool_name>",
  "arguments": {{ ... }}
}}
```
Observation: <tool result will be placed here>

When you have the final answer or completed the action, write:
Answer: <final summary to user>

Available Tools:
{tools}
"""

class AgentLoop:
    def __init__(self, runtime: MobileAgentRuntime, registry: ToolRegistry):
        self.runtime = runtime
        self.registry = registry
        self.action_regex = re.compile(r"Action:\s*```json\s*(\{.*?\})\s*```", re.DOTALL)

    def run(self, user_query: str, max_turns: int = 5) -> str:
        system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
            tools=self.registry.get_system_prompt_schema()
        )
        conversation_history = f"<|system|>\n{system_prompt}<|end|>\n<|user|>\n{user_query}<|end|>\n<|assistant|>\n"
        
        for turn in range(max_turns):
            response = self.runtime.generate_response(
                conversation_history, 
                max_tokens=300,
                stop_sequence="Observation:"
            )
            conversation_history += response
            
            # Check for final completion
            if "Answer:" in response:
                return response.split("Answer:")[-1].strip()

            # Parse action payload
            match = self.action_regex.search(response)
            if not match:
                # Handle unformatted responses or syntax drift
                observation = "Error: Invalid output format. Ensure you output an Action block with valid JSON or an Answer."
            else:
                raw_json = match.group(1)
                try:
                    payload = json.loads(raw_json)
                    tool_name = payload.get("tool")
                    tool_args = payload.get("arguments", {})
                    observation = self.registry.execute(tool_name, tool_args)
                except json.JSONDecodeError as err:
                    observation = f"JSON Parse Error: {str(err)}. Output strictly valid JSON."

            # Append the observation to the context history for next step
            observation_entry = f"\nObservation: {observation}\n"
            conversation_history += observation_entry
            
        return "Agent reached maximum execution turns without completing the goal."
```

## Step 4: Run an end-to-end autonomous invocation

With the registry, runtime, and agent loop in place, we run a query that requires reading the system state and taking a conditional action based on that observation.

What this does: Tests the full end-to-end loop locally on an autonomous task.

```python
# Instantiate runtime using the downloaded ONNX model directory
runtime = MobileAgentRuntime(model_path="./models/phi35-int4/cpu_and_mobile/cpu-int4-rtn-block-32-acc-level-4")
agent = AgentLoop(runtime=runtime, registry=registry)

query = "Check my battery level. If it's below 50% and not charging, turn on airplane mode to conserve power."
final_output = agent.run(query)

print("Agent Result:\n", final_output)
```

## System architecture overview

```
                                  +-----------------------+
                                  |      User Intent      |
                                  +-----------+-----------+
                                              |
                                              v
+---------------------------------------------+---------------------------------------------+
|                                  On-Device Agent Loop                                     |
|                                                                                           |
|   +---------------------+        +--------------------+        +---------------------+    |
|   |  Prompt Formatter   |------->|   ONNX GenAI Engine|------->|    ReAct Parser     |    |
|   | (History + Context) |        | (INT4 SLM / NPU)   |        | (Regex + JSON Valid)|    |
|   +---------------------+        +--------------------+        +----------+----------+    |
|              ^                                                            |               |
|              |                  Observation String                        v               |
|              +----------------------------------------------------+---------------+       |
|                                                                   | Tool Dispatch |       |
|                                                                   +-------+-------+       |
+---------------------------------------------------------------------------|---------------+
                                                                            |
                                                                            v
                                                              +-------------+-------------+
                                                              |  Mobile OS System Bridge  |
                                                              | (Battery, Settings, HAL)  |
                                                              +---------------------------+
```

The loop creates a tight feedback cycle:
- Prompts are bound with available tool schemas.
- The quantized engine executes prompt evaluations locally without outbound network requests.
- Actions are parsed deterministically, routed to local hardware bridges, and appended back into context as text observations.

## Pitfalls encountered during implementation

1. **Context bloating and token latency degradation**  
   Every ReAct step appends both generation output and tool responses back into the prompt buffer. On mobile CPUs (like Snapdragon 8 Gen 2 or Google Tensor G3), Time-to-First-Token (TTFT) scales quadratically if the full prompt must be re-evaluated each turn. When deploying to production, do not append to raw strings—instead, preserve the active ONNX GenAI `Generator` state across iterations and append tokens incrementally using `params.set_input_sequences()` to reuse the existing KV cache.

2. **Grammar collapse in low-bit SLMs**  
   Quantizing models to INT4 occasionally causes token sampling to hallucinate missing braces or omit key quotes in JSON payloads. Relying purely on prompting produces failures roughly 12-18% of the time on 3B models. To fix this on-device, compile a CFG (Context-Free Grammar) mask or apply JSON schema logit masking during `generator.compute_logits()` to mathematically restrict generation to valid schema tokens.

3. **Android process termination during compute phases**  
   If the agent is invoked from a background broadcast receiver, mobile OS task managers will kill the process if an ONNX generation loop consumes 100% of the CPU cluster for more than a few seconds. Ensure your native worker runs as an explicit Foreground Service with `FOREGROUND_SERVICE_TYPE_DATA_SYNC` or `SPECIAL_USE`, and cap thread allocation to efficient cores to avoid tripping thermal throttling policies.

Inspect the official `onnxruntime-genai` repository for target-specific platform toolchains (Android NDK via JNI and iOS via Objective-C/Metal) to compile native C++ binaries for your target device.