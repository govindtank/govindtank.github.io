#!/usr/bin/env python3
"""
Blog Automation System - Enhanced Version (v2.0) 
Generates detailed, professional blog posts with proper views.
"""
import sys, json, time, random, os
from datetime import datetime

PROJECT_ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../.."))
HISTORY_DIR = f"{PROJECT_ROOT}/data/blogs-history"
OUTPUT_FILE = f"{PROJECT_ROOT}/scripts/blog-automation/blog-output.json"

PRIMARY_MODEL = "qwen/qwen3.5-9b"
PRIMARY_URL = "http://localhost:1234"
MODEL_LIST = [PRIMARY_MODEL]  # Use only local model to avoid API rate limits

# Unique image pool with diverse options per category to avoid repetition
IMAGES_BY_TOPIC = {
    "ai": [
        "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1555949963-ff9fe0c17b1f?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1678629679652-0fe7d4cfc731?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1535378437323-b21b7d6263f4?auto=format&fit=crop&q=80&w=1200"
    ],
    "architecture": [
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1551033406-611cf9a28f67?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1504227701822-3dd23c3ef6b9?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1558655106-d2d983ff61f7?auto=format&fit=crop&q=80&w=1200"
    ],
    "flutter": [
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1561219173-9a9f1fc0c076?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1555774698-087ffdc5diff?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1605810231976-443452b9bbbe?auto=format&fit=crop&q=80&w=1200"
    ],
    "android": [
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1621330388327-8b45f726eec6?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1498050108023-c5249f4d013d?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1616353071854-bcaea2bccfc?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1596728327036-172d0e2a471?auto=format&fit=crop&q=80&w=1200"
    ],
    "cloud": [
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1558494949-efc524e74a46?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200"
    ],
    "web": [
        "https://images.unsplash.com/photo-1507238691740-187a6b1d2f0?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1547658319-a1cec879e64c?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1509799079886-84b0193085b?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1532696697256-2c9da78a6e7?auto=format&fit=crop&q=80&w=1200"
    ]
}

# Helper to get unique images per topic, rotating through pool
def get_topic_images(topic_slug):
    """Get 3 unique images for a topic from the appropriate image pool"""
    topic_key = None
    for key in IMAGES_BY_TOPIC:
        if key.lower() in topic_slug.lower():
            topic_key = key
            break
    
    if not topic_key or topic_key not in IMAGES_BY_TOPIC:
        topic_key = "ai"  # default to AI images
    
    return IMAGES_BY_TOPIC[topic_key][:3]

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
            "Authorization": "Bearer blog-automation"
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
    
    prompt = """Write a comprehensive, deep-dive technical blog post about the topic for senior developers.

REQUIREMENTS - STRICT MANDATES:

1. CONTENT LENGTH & COMPLETENESS:
   - WRITE FULLY COMPLETE ARTICLES with 2000-2800 WORDS minimum
   - DO NOT truncate, summarize, or provide abbreviated content
   - Include multiple detailed sections each with 300-450 words
   - Provide thorough technical explanations with real-world context
   - Cover edge cases, best practices, common pitfalls, and future considerations
   
2. STRUCTURE (must include all sections):
   - # H1 Title [compelling subtitle explaining what readers will learn]
   - ## Introduction (250-300 words): Problem statement, real-world impact in 2026, why this matters now, prerequisites knowledge
   - ## Background & Context (300-350 words): Evolution of the technology, key concepts, industry adoption trends
   
   - ## Core Technical Deep Dive Part 1 (450-550 words): First major technical section with:
     * Detailed explanation of core concepts
     * Practical code example with inline comments showing implementation details
     * Discussion of performance implications and tradeoffs
   
   - ## Core Technical Deep Dive Part 2 (450-550 words): Second major section with:
     * Architecture/implementation patterns
     * Additional code example demonstrating advanced usage
     * Comparison table or mermaid diagram showing decision frameworks
   
   - ## Advanced Patterns & Best Practices (350-400 words): 
     * Production considerations, security implications
     * Common anti-patterns and how to avoid them
     * Performance optimization tips with specific examples
   
   - ## Migration Guide / Implementation Strategy (300-350 words):
     * Step-by-step migration approach
     * Rollback strategies and risk mitigation
     * Testing recommendations
     
   - ## Real-World Case Studies or Examples (250-300 words):
     * Concrete examples of successful implementations
     * Lessons learned from production deployments
     * Metrics that matter (before/after comparisons)
   
   - ## Conclusion & Next Steps (200-250 words):
     * Summarize all key takeaways in bullet points
     * Actionable next steps for readers to implement immediately
     * Resources for further learning
     * Encouraging closing statement
   
3. VISUAL ELEMENTS:
   - Include 1 mermaid diagram showing architecture flow OR system design
   - Include 1 detailed markdown table with comparisons, benchmarks, or feature matrices
   - Place visual elements at natural break points in content

4. CODE EXAMPLES:
   - Minimum 3 well-commented code examples throughout the article
   - Each example should demonstrate a different aspect of the topic
   - Include import statements, type hints, and docstrings where applicable
   - Add brief explanations before/after each code block

5. FORMATTING STANDARDS:
   - Use specific technical terminology appropriate for senior developers
   - Include code snippets with proper language syntax highlighting
   - Use tables for feature comparisons or benchmark data
   - Include mermaid diagrams for architecture/system design visualizations

TONE & STYLE: Professional yet accessible for senior engineers. Practical, implementation-focused without being overly academic. Assume readers know fundamentals but want deep insights and practical guidance.

EXAMPLE STRUCTURE FOR REFERENCE:

# {title}: Complete Technical Guide

## Introduction
[250-300 words introducing the problem, why it matters in 2026]

## Background Context
[300-350 words on technology evolution and industry adoption]

### Core Technical Deep Dive Part 1
[450-550 words with first code example]

```python
// Example showing core implementation details
def main():
    # Implementation logic
    pass
```

### Core Technical Deep Dive Part 2  
[450-550 words with second code example and comparison table]

| Feature | Approach A | Approach B | Recommendation |
|---------|-----------|-----------|---------------|
| Performance | High | Medium | A for latency-sensitive apps |

## Advanced Patterns & Best Practices
[350-400 words on production considerations]

## Migration Strategy
[300-350 words with actionable steps]

## Real-World Examples
[250-300 words with concrete case studies]

## Conclusion
[200-250 words with takeaways and next steps]

Start IMMEDIATELY with the H1 title. No preamble, no "Here's a blog post about..." Just write the content.
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
    # Map slug keywords to topic categories in IMAGES_BY_TOPIC
    topic_lower = topic_slug.lower()
    category_map = {
        "ai": "ai",
        "android": "android", 
        "flutter": "flutter",
        "cloud": "cloud",
        "machine-learning": "ai",
        "neural": "ai",
        "deep-learning": "ai",
        "llm": "ai",
        "agent": "ai",
        "architecture": "architecture",
        "web-applications": "architecture",
        "devops": "cloud",
        "security": "ai",
    }
    
    # Find matching category or default to 'ai'
    for keyword, category in category_map.items():
        if keyword in topic_lower:
            return get_image_from_pool(category)
    
    # If no match found, select from general AI pool
    return get_image_from_pool("ai")

def get_image_from_pool(category):
    """Get a random image from the specified topic pool."""
    if category not in IMAGES_BY_TOPIC:
        return None
    
    images = IMAGES_BY_TOPIC[category]
    return random.choice(images)

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
    max_count = 30  # Increased from 12 to allow more comprehensive blogs

# Generate next blog topic
    
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
