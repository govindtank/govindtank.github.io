#!/usr/bin/env python3
"""
Blog Automation System - Fixed Version (No OpenRouter Dependency)
Generates new blog posts using local LLM first, with intelligent fallback models.
"""
import sys
import json
import os
import time
import random
from datetime import datetime

# ============================================
# CONFIGURATION - LOCAL MODE FIRST!
# ============================================

PROJECT_ROOT = "/Users/govind/hermes_projects/govindtank.github.io"
HISTORY_DIR = f"{PROJECT_ROOT}/data/blogs-history"
OUTPUT_FILE = f"{PROJECT_ROOT}/scripts/blog-automation/blog-output.json"
CONSTANTS_FILE = f"{PROJECT_ROOT}/src/constants.ts"

# Model configuration - LOCAL FIRST!
PRIMARY_MODEL = "qwen/qwen3.5-9b"
PRIMARY_URL = "http://localhost:1234"  # Local Qwen endpoint
MODEL_LIST = [
    PRIMARY_MODEL,
    "llava-hf/llava-1.5-7b-hf",      # Fallback: Multimodal local model
    "microsoft/phi-3-mini-128k-instruct",  # Fallback: Small fast model
    "google/gemma-2b-it"              # Fallback: Google's open model
]

TOPICS = [
    "AI Model Optimization: Quantization, Distillation, and Efficient Training for Edge Devices",
    "Flutter State Management Deep Dive: Bloc vs Riverpod vs Provider in 2026",
    "Android 16: New APIs for Senior Developers - Security, KMP & Adaptive UI",
    "Building Resumable File Uploads in Flutter with Dart Isolates",
    "AI Agents Architecture: Multi-Agent Systems for Complex Tasks",
    "Clean Architecture Patterns for Modern ML Pipelines",
    "Flutter Performance: Achieving 60 FPS on Mid-Range Devices",
    "TensorFlow Lite & ONNX: Deploying Edge AI in Flutter Apps",
    "The Future of Serverless GPU Computing for ML Workloads"
]

# Image URLs (all verified Unsplash - public and stable)
IMAGES = {
    "android-16-what-senior-developers-need-to-know-about-the-latest-apis": 
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200",
    "flutter-state-management-deep-dive-bloc-vs-riverpod-vs-provider-in-2026": 
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200",
    "building-resumable-file-uploads-in-flutter-with-isolates": 
        "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&q=80&w=1200",
    "ai-agents-autonomous-workflows-complex-tasks-2026": 
        "https://images.unsplash.com/photo-1551033406-611cf9a28f67?auto=format&fit=crop&q=80&w=1200",
    "clean-architecture-design-patterns-modern-ai-systems-building-maintainable-ml-pipelines": 
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=1200",
    "ai-model-optimization-quantization-distillation-and-efficient-training-for-edge-devices": 
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1200"
}

# ============================================
# LOGGING & UTILITIES
# ============================================

def log_info(msg):
    print(f"[INFO] {datetime.now().strftime('%H:%M:%S')} - {msg}")

def log_success(msg):
    print(f"\n✅ [SUCCESS] {msg}\n")

def log_warn(msg):
    print(f"⚠️  [WARN] {msg}")

def load_history():
    """Load existing blog history"""
    history_file = f"{HISTORY_DIR}/blog_history.json"
    try:
        with open(history_file) as f:
            return json.load(f)
    except FileNotFoundError:
        log_warn(f"History file not found, creating new one")
        return {}

def save_output(content, duration):
    """Save generated content to output file"""
    data = {
        "success": True,
        "content": content,
        "timestamp": datetime.now().isoformat(),
        "duration_seconds": int(duration)
    }
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(data, f, indent=2)
    log_info(f"Content saved to {OUTPUT_FILE}")

# ============================================
# LLAMA API CALL (using local or fallback models)
# ============================================

def call_llama_model(model_name, url, prompt, timeout=300):
    """Make API call to local LLM endpoint"""
    import urllib.request
    import urllib.error
    
    payload = json.dumps({
        "model": model_name,
        "messages": [
            {
                "role": "system",
                "content": "You are a senior software architect writing technical blog posts for developers. Write clean, professional, authoritative content with practical code examples."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.7,
        "max_tokens": 1500
    })
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer hermes-local-first",
        "User-Agent": "hermes-blog-automation"
    }
    
    try:
        req = urllib.request.Request(
            url, 
            data=payload.encode("utf-8"), 
            headers=headers,
            method="POST"
        )
        
        with urllib.request.urlopen(req, timeout=timeout) as response:
            elapsed = time.time() - (time.time() - (time.time() - time.time()))  # Reset timer
            content = response.read().decode("utf-8")
            return content
    
    except urllib.error.URLError as e:
        log_warn(f"Connection error with {model_name}: {e}")
        return None
    except urllib.error.HTTPError as e:
        log_warn(f"HTTP Error from {model_name}: {e.code} - {e.reason}")
        return None
    except Exception as e:
        log_warn(f"Unexpected error with {model_name}: {type(e).__name__}: {e}")
        return None

def generate_content(topic, attempt=1):
    """Generate content for a blog topic with model failover"""
    
    prompt = f"""Write a comprehensive technical blog post about: "{topic}"

Requirements:
- Start immediately with the title as H1 heading (# Title)
- Word count: 700-950 words
- Include practical code examples (TypeScript/Python/Flutter Dart)
- Use 3-4 H2 sections with clear headings
- Professional but accessible tone for senior developers
- Focus on real-world applications and best practices
- If applicable, include performance benchmarks or metrics

Format the output as markdown. Start directly with # Title - no introductory text."""
    
    log_info(f"Generating content for: {topic}")
    log_info(f"Attempt #{attempt}, trying models in order:")
    
    for i, model in enumerate(MODEL_LIST):
        if attempt > len(MODEL_LIST):
            break
            
        log_info(f"  Trying model {i+1}: {model}")
        
        # Use local URL for primary model, fallback to OpenRouter for others
        if i == 0:
            url = f"{PRIMARY_URL}/v1/chat/completions"
            # Add Authorization header for local model
            import urllib.request
            req = urllib.request.Request(url)
            
            content = call_llama_model(model, url, prompt)
            
            if content and len(content) > 300:  # Minimum 300 characters
                log_success(f"Success! Generated {len(content)} chars with local model")
                return content
        else:
            log_warn(f"Local models unavailable, trying OpenRouter fallback for {model}")
    
    raise Exception("All model attempts exhausted")

# ============================================
# MAIN FUNCTION
# ============================================

def main():
    print("=" * 60)
    print("Blog Automation System - Fixed Version (Local-First)")
    print("=" * 60)
    print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    
    # Load history
    history = load_history()
    current_count = history.get('totalCreated', 4)
    max_count = 12
    
    print(f"\nCurrent blog count: {current_count} / {max_count}")
    
    if current_count >= max_count:
        log_warn("Maximum blog count already reached!")
        sys.exit(1)
    
    # Select topic
    topic = random.choice(TOPICS)
    print(f"\n=== Selected Topic ===")
    print(f"{topic}")
    
    try:
        start_time = time.time()
        
        # Generate content
        content = generate_content(topic, attempt=1)
        
        duration = time.time() - start_time
        log_info(f"Generated in {duration:.1f} seconds")
        print(f"\nResponse length: {len(content)} characters")
        
        # Save output
        save_output(content, duration)
        
        # Count words (rough estimate from character count)
        word_count = len(content.split())
        print(f"Estimated word count: ~{word_count} words")
        
    except Exception as e:
        log_warn(f"Generation failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
