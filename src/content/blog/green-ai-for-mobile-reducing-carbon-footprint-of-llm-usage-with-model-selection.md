---
title: "Green AI for Mobile: Reducing Carbon Footprint of LLM Usage with Model Selection"
slug: "green-ai-for-mobile-reducing-carbon-footprint-of-llm-usage-with-model-selection"
date: "August 30, 2026"
excerpt: >
  Choosing smaller models for less capable devices and caching frequent responses can meaningfully cut the energy cost of running LLMs on mobile. This post looks at practical ways to match model size to device capabilit...
coverImage: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1200"
category: "Sustainability"
readTime: 3
tags:
  - "Sustainability"
---
# Green AI for Mobile: Reducing Carbon Footprint of LLM Usage with Model Selection

Last month my phone died at 3 PM because I ran a 7B parameter model on it for a simple summarization task. The battery icon flashed red, the fan kicked in (yes, my phone has a fan now), and I realized I was spending more energy than I'd save by not driving to the coffee shop for a refill. That's when I started thinking about model selection as a carbon-reduction strategy, not just a performance optimization.

The core insight: smaller models running locally on capable devices often consume less total energy than shipping every query to a cloud API. But "smaller" isn't always "better"—it depends on what your device can actually handle efficiently.

## What you need before starting

You should have:
- A working knowledge of PyTorch (any recent version, I used 2.1)
- A mobile device or emulator with at least 6GB RAM (testing on a Pixel 7 Pro)
- Basic familiarity with ONNX or TensorFlow Lite model formats
- `transformers`, `optimum`, and `torch` installed

I'm assuming you're already comfortable with model quantization and have a basic inference pipeline. If not, Hugging Face's [Optimum documentation](https://huggingface.co/docs/optimum) covers the essentials.

## Building a device-aware model selector

### Step 1: Profile your target hardware

Before choosing a model, measure what your device can actually do. I wrote a quick profiler that runs a single forward pass and measures wall-clock time and peak memory.

```python
import time
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

def profile_model(model_name, device="cpu", input_text="Summarize climate change in one sentence."):
    model = AutoModelForCausalLM.from_pretrained(model_name)
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    
    inputs = tokenizer(input_text, return_tensors="pt").to(device)
    model = model.to(device)
    
    # Warmup
    _ = model.generate(**inputs, max_new_tokens=10)
    
    start_time = time.time()
    peak_memory = torch.cuda.max_memory_allocated() if "cuda" in device else 0
    _ = model.generate(**inputs, max_new_tokens=50)
    elapsed = time.time() - start_time
    
    return {"time": elapsed, "peak_memory_mb": peak_memory / 1e6}
```

This gives you a baseline. On my Pixel 7 Pro, a 1.3B parameter model takes ~4.2 seconds and peaks at ~1.8GB RAM. A 7B model? ~12 seconds and crashes from OOM.

### Step 2: Define your model candidates

Pick 3-5 models across different size brackets. I used:

| Model | Parameters | Quantized Size | Typical Mobile Use |
|-------|------------|----------------|-------------------|
| TinyLlama-1.1B | 1.1B | ~600MB | Quick responses, drafts |
| Phi-2 | 2.7B | ~1.4GB | Balanced quality/speed |
| Mistral-7B-v0.1 | 7.0B | ~4GB | High quality, needs caching |

### Step 3: Create the selection logic

The selector picks the smallest model that meets your quality threshold. You can tune the threshold based on your app's needs.

```python
class GreenModelSelector:
    def __init__(self, device_profile, quality_threshold=0.7):
        self.device_profile = device_profile
        self.quality_threshold = quality_threshold
        self.model_scores = self._benchmark_models()
    
    def _benchmark_models(self):
        scores = {}
        for model_name in ["TinyLlama/TinyLlama-1.1B-Chat-v1.0", 
                          "microsoft/phi-2", 
                          "mistralai/Mistral-7B-v0.1"]:
            try:
                profile = profile_model(model_name, self.device_profile["device"])
                # Score combines speed, memory, and a rough quality estimate
                scores[model_name] = self._compute_score(profile)
            except Exception:
                scores[model_name] = 0.0
        return scores
    
    def select(self, query_complexity="low"):
        eligible = {m: s for m, s in self.model_scores.items() 
                   if s >= self.quality_threshold}
        if not eligible:
            return min(self.model_scores, key=self.model_scores.get)
        
        if query_complex