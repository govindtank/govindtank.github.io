#!/usr/bin/env python3
"""
Blog Generation Script with Timeout Handling
Generates a new blog post about trending AI/ML topics
"""
import sys
import json
import time
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError

# Configuration
config = {
    "model": "qwen/qwen3.5-9b",
    "provider": "http://localhost:1234",
    "topic": "Clean Architecture & Design Patterns in Modern AI Systems"
}

api_endpoint = config["provider"] + "/v1/chat/completions"

payload = json.dumps({
    "model": config["model"],
    "messages": [
        {
            "role": "system", 
            "content": "You are a senior software architect writing technical blog posts for developers. Write clean, professional, authoritative content with practical code examples."
        },
        {
            "role": "user",
            "content": """Write a comprehensive technical blog post about Clean Architecture & Design Patterns in Modern AI Systems.

Requirements:
- Start immediately with the title as H1 heading
- Word count: 700-950 words
- Include practical code examples (TypeScript/Python)
- Use 3-4 H2 sections with clear headings
- Professional but accessible tone
- Write about Clean Architecture principles applied to AI/ML systems
- Cover topics: dependency injection, layer separation, unit testing strategies, real-world ML pipeline example
- Include section on why clean architecture matters for AI systems

Format the output as markdown. Start directly with # Title - no introductory text."""
        }
    ],
    "temperature": 0.7,
    "max_tokens": 1500
})

headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer sk-hermes-local-model-auth",
    "User-Agent": "hermes-blog-automation"
}

# Project directories
PROJECT_DIR = "/Users/govind/hermes_projects/govindtank.github.io"
HIST_DIR = f"{PROJECT_DIR}/data/blogs-history"
BLOG_OUTPUT_FILE = f"{PROJECT_DIR}/scripts/blog-automation/blog-output.json"

def load_history():
    """Load existing blog history"""
    history_file = f"{HIST_DIR}/blog_history.json"
    try:
        with open(history_file) as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

def save_output(content, duration):
    """Save generated content to output file"""
    data = {
        "success": True,
        "content": content,
        "timestamp": time.strftime('%Y-%m-%dT%H:%M:%SZ'),
        "duration_seconds": int(duration)
    }
    with open(BLOG_OUTPUT_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def print_summary(content):
    """Print summary for Telegram notification"""
    lines = content.split('\n')
    print("\n=== Blog Summary ===")
    for line in lines[:3]:  # Print first 3 lines (title + start)
        print(line)
    print(f"\nFull content saved to: {BLOG_OUTPUT_FILE}")

def main():
    print("=== Blog Generation Script with Timeout Handling ===")
    print(f"Date: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Topic: {config['topic']}")
    print()
    
    history = load_history()
    current_count = history.get('totalCreated', 4)
    max_count = 12
    
    print(f"Current blog count: {current_count} / {max_count}")
    
    if current_count >= max_count:
        print("ERROR: Maximum blog count already reached!")
        sys.exit(1)
    
    start_time = time.time()
    print(f"\n=== Making API Request ===")
    print(f"Request started at: {time.strftime('%H:%M:%S')}")
    
    try:
        # Create Request object with headers
        req = Request(api_endpoint, data=payload.encode("utf-8"), headers=headers)
        
        with urlopen(req, timeout=300) as response:
            elapsed = time.time() - start_time
            content = response.read().decode("utf-8")
            
            duration = time.time() - start_time
            print(f"\n✅ Success! Generated in {duration:.1f} seconds")
            print(f"Response length: {len(content)} characters")
            
            save_output(content, duration)
            print_summary(content)
            
    except URLError as e:
        print(f"❌ Connection error: {e}")
        sys.exit(1)
    except HTTPError as e:
        print(f"❌ HTTP Error {e.code}: {e.reason}")
        try:
            error_data = json.loads(e.read())
            print(f"Error details: {error_data.get('error', {})}")
        except:
            pass
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
