#!/usr/bin/env python3
"""
Generate Multiple Blog Posts - Complete Fix Script
Uses local LLM first, falls back to other models if needed
"""
import json
import os
import sys

# Configuration
PROJECT_ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
HISTORY_DIR = f"{PROJECT_ROOT}/data/blogs-history"
OUTPUT_FILE = f"{PROJECT_ROOT}/scripts/blog-automation/blog-output.json"

MODEL_LIST = [
    "qwen/qwen3.5-9b",
    "llava-hf/llava-1.5-7b-hf",
    "microsoft/phi-3-mini-128k-instruct",
    "google/gemma-2b-it"
]

PRIMARY_URL = "http://localhost:1234"

TOPICS = [
    "Flutter State Management Deep Dive: Bloc vs Riverpod vs Provider in 2026",
    "Building Resumable File Uploads in Flutter with Dart Isolates",
    "Android 16: New APIs for Senior Developers - Security, KMP & Adaptive UI",
    "Clean Architecture Patterns for Modern ML Pipelines",
    "TensorFlow Lite & ONNX: Deploying Edge AI in Flutter Apps",
    "The Future of Serverless GPU Computing for ML Workloads"
]

IMAGES = {
    "flutter-state-management-deep-dive-bloc-vs-riverpod-vs-provider-in-2026": 
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200",
    "building-resumable-file-uploads-in-flutter-with-isolates": 
        "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&q=80&w=1200",
    "android-16-what-senior-developers-need-to-know-about-the-latest-apis": 
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200",
    "clean-architecture-design-patterns-modern-ai-systems-building-maintainable-ml-pipelines": 
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=1200"
}

def call_llama_local(model_name, prompt):
    """Call local LLM endpoint"""
    import urllib.request
    import urllib.error
    
    payload = json.dumps({
        "model": model_name,
        "messages": [
            {
                "role": "system",
                "content": "You are a senior software architect. Write clean, professional technical blog posts with code examples."
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
        "Authorization": "Bearer blog-automation",
        "User-Agent": "blog-automation-gen"
    }
    
    try:
        req = urllib.request.Request(
            f"{PRIMARY_URL}/v1/chat/completions", 
            data=payload.encode("utf-8"), 
            headers=headers,
            method="POST"
        )
        
        with urllib.request.urlopen(req, timeout=300) as response:
            return response.read().decode("utf-8")
    except Exception as e:
        return None

def generate_blog(topic):
    """Generate blog post for given topic"""
    prompt = f"""Write a comprehensive technical blog post about: "{topic}"

Requirements:
- Start immediately with the title as H1 heading (# Title)
- Word count: 800-1200 words
- Include practical code examples (TypeScript, Python, or Dart/Flutter)
- Use 3-4 H2 sections with clear headings
- Professional tone for senior developers
- Focus on real-world best practices and modern patterns

Output as markdown only. Start directly with # Title - no introductory text."""
    
    print(f"\nGenerating: {topic}")
    
    for model in MODEL_LIST:
        print(f"  Trying: {model}")
        content = call_llama_local(model, prompt)
        
        if content and len(content) > 300:
            return content.strip()
    
    raise Exception(f"All models failed for {topic}")

def main():
    print("=" * 60)
    print("Multi-Blog Generation Script")
    print("=" * 60)
    
    # Load history to check current count
    try:
        with open(f"{HISTORY_DIR}/blog_history.json") as f:
            history = json.load(f)
        current_count = history.get('totalCreated', 4)
        max_count = history.get('version', '2.0') == '2.0' and current_count < 12
    except:
        print("No history file found, creating new one")
        return
    
    print(f"Current blog count: {current_count} / 12")
    
    if not max_count:
        print("Maximum blog count reached!")
        return
    
    # Select first topic
    topic = TOPICS[0]
    
    try:
        content = generate_blog(topic)
        
        # Save output
        with open(OUTPUT_FILE, 'w') as f:
            json.dump({
                "success": True,
                "content": content,
                "timestamp": __import__('datetime').datetime.now().isoformat(),
                "duration_seconds": 0,
                "topic": topic
            }, f, indent=2)
        
        print(f"\n✅ Success! Generated {len(content)} characters")
        print(f"Topic: {topic}")
        print(f"Saved to: {OUTPUT_FILE}")
        
        # Save plain markdown too
        with open(f"{PROJECT_ROOT}/scripts/blog-automation/last-blog.md", 'w') as f:
            f.write(content)
        print(f"Plain markdown saved to: last-blog.md")
        
    except Exception as e:
        print(f"\n❌ Generation failed: {e}")
        return

if __name__ == "__main__":
    main()
