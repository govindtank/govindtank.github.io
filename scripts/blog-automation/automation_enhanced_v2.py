#!/usr/bin/env python3
"""
Blog Automation System - Enhanced Version (v2.0) 
Generates detailed, professional blog posts with proper views.
"""
import sys, json, time, random
from datetime import datetime

PROJECT_ROOT = "/Users/govind/hermes_projects/govindtank.github.io"
HISTORY_DIR = f"{PROJECT_ROOT}/data/blogs-history"
OUTPUT_FILE = f"{PROJECT_ROOT}/scripts/blog-automation/blog-output.json"

PRIMARY_MODEL = "qwen/qwen3.5-9b"
PRIMARY_URL = "http://localhost:1234"
MODEL_LIST = [PRIMARY_MODEL, "llava-hf/llava-1.5-7b-hf", "microsoft/phi-3-mini-128k-instruct", "google/gemma-2b-it"]

IMAGES_DB = {
    "ai-neural-networks": "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=1200",
    "ai-agents-systems": "https://images.unsplash.com/photo-1551033406-611cf9a28f67?auto=format&fit=crop&q=80&w=1200", 
    "architecture-diagrams": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=1200",
    "flutter-development": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200",
    "android-dev": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200"
}

TOPICS = [
    {"title": "Flutter State Management Deep Dive", "slug": "flutter-state-management-deep-dive-bloc-vs-riverpod-vs-provider-2026"},
    {"title": "Android 16 Security APIs", "slug": "android-16-security-apis-senior-developers-migration-guide"},
    {"title": "AI Agents Architecture", "slug": "multi-agent-ai-systems-architecture-communication-orchestration"},
    {"title": "Clean Architecture ML Pipelines", "slug": "clean-architecture-patterns-modern-ml-pipelines-production"},
    {"title": "Flutter Performance Optimization", "slug": "flutter-performance-optimization-60-fps-mid-range-devices"}
]

def log_info(msg): print(f"[INFO] {datetime.now().strftime('%H:%M:%S')} - {msg}")
def log_success(msg): print(f"\n[SUCCESS] {msg}\n")
def log_warn(msg): print(f"[WARN] {msg}")

def load_history():
    try:
        with open(f"{HISTORY_DIR}/blog_history.json") as f: return json.load(f)
    except FileNotFoundError:
        log_warn("No history file")
        return {}

def slugify(title):
    import re
    return re.sub(r'-+', '-', title.lower().replace(' ', '-').replace('_', '-').strip('-'))

def call_llm_api(model_name, url, topic, prompt, timeout=300):
    import urllib.request, urllib.error
    
    # Disable reasoning mode for standard completions
    payload = json.dumps({
        "model": model_name,
        "messages": [
            {"role": "system", "content": f"You are a senior software architect. Write a detailed technical blog post about: '{topic}' for senior developers."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.5, 
        "max_tokens": 2500,
        "top_p": 1.0
    })
    
    try:
        req = urllib.request.Request(url, data=payload.encode(), headers={
            "Content-Type": "application/json", 
            "Authorization": "Bearer hermes-blog"
        }, method="POST")
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            content_str = resp.read().decode("utf-8")
            
            # Try parsing as JSON (OpenRouter format or O1 reasoning)
            try:
                data = json.loads(content_str)
                
                # Check for different response formats
                if "choices" in data and len(data["choices"]) > 0:
                    message = data["choices"][0]["message"]
                    content = message.get("content", "") or message.get("reasoning_content", "")
                    
                    # If empty, check reasoning_content field directly
                    if not content:
                        content = message.get("reasoning_content", "")
                
                return content
            except (json.JSONDecodeError, KeyError):
                # Return raw text as fallback
                return content_str.strip()
    except Exception as e:
        log_warn(f"API error: {str(e)[:60]}")
        return None

def generate_blog_post(topic_info):
    title = topic_info["title"]
    slug = slugify(title)
    topic = f"{title}: Deep Dive Guide"
    
    prompt = """Write a comprehensive technical blog post about the topic.

REQUIREMENTS - STRICT:

1. START IMMEDIATELY WITH H1 heading (# Title) - NO preamble/intro text before it

2. STRUCTURE:
   - # H1 Title [subtitle]
   - ## Introduction (150-200 words): problem, why it matters in 2026, real-world impact
   - ## Core Section 1 (400-500 words): technical deep dive with explanation and ONE code example  
   - ## Core Section 2 (400-500 words): more technical content with architecture diagram OR comparison table
   - ## Advanced Considerations (300 words): best practices, gotchas, migration tips
   - ## Conclusion (150 words): summarize key takeaways, actionable next steps, encouraging close

3. CODE EXAMPLES: Include 2 code examples total in proper markdown blocks with language hints and comments

4. VISUAL ELEMENTS: 
   - 1 mermaid diagram OR ASCII tree for architecture/structure showing flow or comparison
   - 1 markdown table for comparisons, benchmarks, or feature matrix

5. WORD COUNT: 1200-1600 words minimum

FORMAT EXAMPLES:

Mermaid diagram syntax (use similar structure):
graph TD
  Start[Start Analysis] --> Choose{Choose Approach}
  Choose -->|Provider| ProviderSetup
  BlocSetup --> BlocCode[Write Bloc Code]
  Compare{Compare Features}
  End[Conclusion]

Markdown table syntax:
| Feature | Option A | Option B | Winner |
|---------|----------|----------|--------|
| Simplicity | Easy | Medium | Easy |

Code block format:
```language
// comment explaining this part
const value = 42;
function doSomething() { }
```

TONE: Professional, practical for senior developers. Clear explanations without excessive jargon.
"""
    
    log_info(f"Generating post for: {title}")
    
    content = None
    
    for i, model in enumerate(MODEL_LIST):
        log_info(f"Trying model {i+1}: {model}")
        
        url = f"{PRIMARY_URL}/v1/chat/completions" if i == 0 else "https://openrouter.ai/api/v1/chat/completions"
        
        response = call_llm_api(model, url, topic, prompt)
        
        if response and len(response) > 1000 and "```" in response:
            log_success(f"Success with {model}: {len(response)} chars")
            content = response
            break
    
    if not content:
        raise Exception("Failed to generate content with all models")
    
    return title, slug, topic, content

def get_image_for_topic(topic_slug):
    image_keys = [k for k in IMAGES_DB.keys() if any(x in k.lower() for x in topic_slug.split())]
    return IMAGES_DB.get(image_keys[0] if image_keys else "ai-agents-systems", 
                         IMAGES_DB["ai-neural-networks"])

def save_output(content, duration, title, slug, topic):
    history = load_history()
    history['blogs'][title] = {
        "slug": slug,
        "timestamp": datetime.now().isoformat(),
        "version": "2.0",
        "source": "hermes-enhanced"
    }
    
    data = {
        "success": True,
        "title": title,
        "slug": slug, 
        "topic": topic,
        "timestamp": datetime.now().isoformat(),
        "duration_seconds": int(duration),
        "content": content,
        "version": "2.0"
    }
    
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(data, f, indent=2)
    log_info(f"Content saved to {OUTPUT_FILE}")

def main():
    print("=" * 75)
    print("Blog Automation System - ENHANCED v2.0")
    print("=" * 75)
    
    history = load_history()
    current_count = len(history.get('blogs', {}))
    max_count = 12
    
    print(f"\nCurrent blog count: {current_count} / {max_count}\n")
    
    if current_count >= max_count:
        log_warn("Maximum blogs already created!")
        return
    
    topic_info = random.choice(TOPICS)
    print(f"=== Generating Blog ===")
    print(f"Title: {topic_info['title']}")
    print(f"Slug: {topic_info['slug']}\n")
    
    try:
        start_time = time.time()
        
        title, slug, topic, content = generate_blog_post(topic_info)
        
        duration = time.time() - start_time
        log_info(f"Generated in {duration:.1f}s\n")
        
        print(f"Response size: {len(content)} characters\n")
        
        save_output(content, duration, title, slug, topic)
        
        lines = content.split('\n')
        code_blocks = sum(1 for line in lines if '```' in line)
        words = sum(len(line.split()) for line in lines if line.strip())
        
        print(f"Content Analysis:")
        print(f"  ~{words} words")
        print(f"  {code_blocks} code blocks detected\n")
        
        suggested_image = get_image_for_topic(topic_info['slug'])
        log_info(f"Suggested image URL: {suggested_image}")
        
        log_success("Enhanced blog post generated successfully!")
        
    except Exception as e:
        log_warn(f"Generation failed: {e}\n")
        sys.exit(1)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Enhanced Blog Automation v2.0")
    parser.add_argument("--run-id", type=str, default="manual", help="Run identifier")
    args = parser.parse_args()
    
    log_info(f"Running with ID: {args.run_id}")
    main()
