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
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1558655106-d2d983ff61f7?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1504227701822-3dd23c3ef6b9?auto=format&fit=crop&q=80&w=1200"
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
    {"title": "Flutter Performance Optimization", "slug": "flutter-performance-optimization-60-fps-mid-range-devices"},
    # Expanded topics — these must NOT be similar to existing dist/ src/content/blog/ slugs
    {"title": "Rust for Systems Programming in 2026", "slug": "rust-for-systems-programming-memory-safety-concurrency-ecosystem-2026"},
    {"title": "WebAssembly Beyond the Browser", "slug": "webassembly-2026-edge-computing-server-side-wasm"},
    {"title": "OpenTelemetry Distributed Tracing in Production", "slug": "opentelemetry-distributed-tracing-production-debugging-2026"},
    {"title": "Edge AI and On-Device Machine Learning", "slug": "edge-ai-on-device-ml-phone-silicon-npu-2026"},
    {"title": "PostgreSQL 18 and HTAP Workloads", "slug": "postgresql-18-htap-hybrid-transactional-analytical-processing-2026"},
    {"title": "TypeScript 5 Advanced Patterns", "slug": "typescript-5x-advanced-patterns-conditional-types-mapped-types-2026"},
    {"title": "AI-Native App Architecture", "slug": "ai-native-app-architecture-designing-applications-around-llm-calls-2026"},
    {"title": "FastAPI and Event-Driven Microservices", "slug": "fastapi-event-driven-microservices-patterns-2026"},
    {"title": "CSS Container Queries and Style Queries", "slug": "css-container-queries-style-queries-responsive-design-2026"},
    {"title": "Flutter 4 and Impeller Rendering Engine", "slug": "flutter-4-impeller-cross-platform-ui-performance-2026"},
    {"title": "Kotlin Multiplatform at Scale", "slug": "kotlin-multiplatform-production-shared-business-logic-2026"},
    {"title": "Prompt Engineering for Production LLM APIs", "slug": "prompt-engineering-production-llm-apis-reliability-2026"},
    {"title": "Building Developer Tools with CLI Design", "slug": "developer-tools-cli-design-ai-assisted-extensions-2026"},
    {"title": "AI Observability and LLM Debugging", "slug": "ai-observability-monitoring-tracing-debugging-llm-2026"},
    {"title": "MCP Model Context Protocol in Practice", "slug": "mcp-model-context-protocol-developer-tools-practice-2026"},
    {"title": "Android 17 Modern Android Stack", "slug": "android-17-modern-android-stack-changes-2026"},
    {"title": "Antigravity vs Claude Code vs Codex", "slug": "antigravity-vs-claude-code-vs-codex-ai-coding-agent-2026"},
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
        "max_tokens": 4096,
        "top_p": 1.0,
        "reasoning_format": "hidden"
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
                    # This model outputs to reasoning_content, not content
                    content = message.get("content", "")
                    reasoning = message.get("reasoning_content", "")
                    # Use reasoning_content if content is empty (this model does this)
                    if not content.strip() and reasoning:
                        content = reasoning
                    
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

def select_contextual_cover_image(slug, title, content):
    """Select a contextually relevant Unsplash image from verified pool based on blog content.
    Ensures uniqueness by checking against images already used in existing posts."""
    import json, re, hashlib, os
    POOL_FILE = f"{PROJECT_ROOT}/scripts/blog-automation/verified_images.json"
    
    # Load verified image pool
    try:
        with open(POOL_FILE) as f:
            pool = json.load(f)
    except Exception:
        return f"/images/covers/{slug}.png"  # fallback
    
    # Extract photo IDs from pool
    def extract_photo_id(url):
        m = re.search(r"photo-(\d+)-", url)
        return m.group(1) if m else url
    
    # Collect already-used photo IDs from existing blog posts
    used_ids = set()
    content_dir = os.path.join(PROJECT_ROOT, "src/content/blog")
    if os.path.isdir(content_dir):
        for fn in os.listdir(content_dir):
            if fn.endswith(".md"):
                path = os.path.join(content_dir, fn)
                text = open(path).read()
                m = re.search(r'^coverImage:\s*"([^"]+)"', text, re.M)
                if m:
                    used_ids.add(extract_photo_id(m.group(1)))
    
    # Topic-to-theme mapping based on content analysis
    slug_lower = slug.lower()
    content_lower = content.lower()
    title_lower = title.lower()
    all_text = f"{slug_lower} {title_lower} {content_lower[:2000]}"
    
    # Determine theme from content keywords
    theme = "workspace"  # default
    if any(k in all_text for k in ["ai", "agent", "llm", "gpt", "chatgpt", "claude", "openai", "machine learning", "neural", "model context protocol", "mcp"]):
        theme = "ai"
    elif any(k in all_text for k in ["flutter", "dart", "riverpod", "bloc", "provider"]):
        theme = "mobile"
    elif any(k in all_text for k in ["kotlin", "k2-compiler", "multiplatform", "compose multiplatform"]):
        theme = "mobile"
    elif any(k in all_text for k in ["android", "jetpack", "compose", "material you", "wear os"]):
        theme = "mobile"
    elif any(k in all_text for k in ["web", "react", "vue", "css", "html", "frontend", "next.js", "remix", "astro", "webassembly", "wasm"]):
        theme = "code"
    elif any(k in all_text for k in ["cloud", "kubernetes", "k8s", "devops", "docker", "aws", "gcp", "azure", "terraform", "ci/cd"]):
        theme = "cloud"
    elif any(k in all_text for k in ["data", "database", "postgres", "mysql", "mongodb", "sql", "stream", "flink", "kafka", "analytics", "htap"]):
        theme = "data"
    elif any(k in all_text for k in ["arch", "microservice", "cqrs", "event-sourcing", "system-design", "domain-driven", "clean architecture"]):
        theme = "workspace"
    elif any(k in all_text for k in ["security", "auth", "oauth", "zero-trust", "encryption", "vulnerability"]):
        theme = "cloud"
    elif any(k in all_text for k in ["rust", "systems", "memory safety", "concurrency", "cargo"]):
        theme = "code"
    elif any(k in all_text for k in ["typescript", "types", "generics", "conditional types", "mapped types"]):
        theme = "code"
    elif any(k in all_text for k in ["finops", "cost optimization", "kubernetes cost"]):
        theme = "cloud"
    elif any(k in all_text for k in ["opentelemetry", "tracing", "observability", "monitoring", "debugging"]):
        theme = "data"
    elif any(k in all_text for k in ["fastapi", "microservices", "event-driven", "api"]):
        theme = "code"
    elif any(k in all_text for k in ["prompt engineering", "prompt", "llm api"]):
        theme = "ai"
    
    # Map theme to photo IDs from verified pool
    THEME_PHOTO_IDS = {
        "ai": ["1620712943543", "1551288049", "1677442136019", "1550751827", "1563986768609", "1573164713988", "1515879218367", "1531297484001", "1504639725590", "1544197150", "1550439062", "1611974789855", "1485827404703", "1559526324", "1593642632823"],
        "code": ["1461749280684", "1517180102446", "1522071820081", "1504384308090", "1519389950473", "1526628953301", "1516321318423", "1547658719", "1550547660", "1571171637578", "1498050108023", "1587620962725", "1534972195531", "1555949963", "1518770660439", "1550745165", "1522199755839", "1555066931", "1556761175", "1557804506", "1552664730", "1542744173", "1510915228340", "1522542550221"],
        "mobile": ["1526374965328", "1511707171634", "1510557880182", "1580910051074", "1606220945770", "1512941937669", "1522252234503", "1526401485004"],
        "data": ["1551288049", "1550439062", "1504868584819", "1504639725590", "1553877522", "1551650975", "1564865878688"],
        "cloud": ["1451187580459", "1558494949", "1454165804606", "1508830524289", "1484417894907", "1499951360447", "1541462608143", "1564865878688", "1614064641938", "1620121692029", "1517694712202"],
        "workspace": ["1486406146926", "1497366216548", "1497366811353", "1524758631624", "1499750310107", "1553877522", "1552664730", "1542744173", "1556761175", "1557804506", "1551650975", "1522199755839", "1559526324", "1593642632823", "1510915228340", "1522542550221"],
    }
    
    # Get available photo IDs for this theme
    theme_ids = THEME_PHOTO_IDS.get(theme, THEME_PHOTO_IDS["workspace"])
    
    # Filter to only IDs that exist in the verified pool
    pool_ids = {extract_photo_id(u): u for u in pool}
    available_ids = [pid for pid in theme_ids if pid in pool_ids]
    
    if not available_ids:
        available_ids = list(pool_ids.keys())
    
    # Remove already-used IDs to ensure uniqueness
    available_ids = [pid for pid in available_ids if pid not in used_ids]
    
    if not available_ids:
        # Fallback to any unused pool image
        available_ids = [pid for pid in pool_ids.keys() if pid not in used_ids]
    
    if not available_ids:
        # Pool exhausted - return fallback
        return f"/images/covers/{slug}.png"
    
    # Deterministic selection based on slug
    h = int(hashlib.md5(slug.encode()).hexdigest(), 16)
    selected_id = available_ids[h % len(available_ids)]
    
    return pool_ids[selected_id]


def save_output(content, duration, title, slug, topic):
    history = load_history()
    # Key by slug (not title) so duplicate detection is consistent
    history['blogs'][slug] = {
        "title": title,
        "slug": slug,
        "timestamp": datetime.now().isoformat(),
        "version": "2.0",
        "source": "hermes-enhanced"
    }
    
    # Extract excerpt (first paragraph after H1)
    excerpt = ""
    lines = content.split('\n')
    in_excerpt = False
    for line in lines:
        if line.startswith('# '):
            in_excerpt = True
            continue
        if in_excerpt and line.startswith('## '):
            break
        if in_excerpt and line.strip():
            excerpt += line.strip() + " "
    excerpt = excerpt.strip()[:300] + "..." if len(excerpt) > 300 else excerpt.strip()
    
    # Generate frontmatter with CONTEXTUAL cover image
    import time
    date_str = time.strftime("%B %d, %Y")
    cover_image = select_contextual_cover_image(slug, title, content)
    
    # Determine category from topic/slug
    category = "AI-Engineering"
    if "flutter" in slug.lower(): category = "Flutter"
    elif "android" in slug.lower(): category = "Android"
    elif "kotlin" in slug.lower(): category = "Kotlin-Multiplatform"
    elif "web" in slug.lower() or "react" in slug.lower() or "css" in slug.lower(): category = "Web-Dev"
    elif "cloud" in slug.lower() or "kubernetes" in slug.lower() or "devops" in slug.lower(): category = "Cloud-Native"
    elif "data" in slug.lower() or "sql" in slug.lower() or "stream" in slug.lower(): category = "Data-Engineering"
    elif "arch" in slug.lower(): category = "Architecture"
    elif "security" in slug.lower(): category = "Security"
    elif "rust" in slug.lower() or "systems" in slug.lower(): category = "Systems"
    elif "typescript" in slug.lower(): category = "Web-Dev"
    elif "finops" in slug.lower(): category = "Cloud-Native"
    elif "opentelemetry" in slug.lower() or "tracing" in slug.lower(): category = "Observability"
    elif "fastapi" in slug.lower() or "microservices" in slug.lower(): category = "Backend-Architecture"
    elif "prompt" in slug.lower(): category = "AI-Engineering"
    elif "mcp" in slug.lower(): category = "AI-Agents"
    elif "edge-ai" in slug.lower() or "on-device" in slug.lower(): category = "Edge-AI"
    elif "webassembly" in slug.lower() or "wasm" in slug.lower(): category = "WebAssembly"
    elif "flutter-4" in slug.lower() or "impeller" in slug.lower(): category = "Flutter"
    elif "android-17" in slug.lower(): category = "Android"
    elif "antigravity" in slug.lower() or "claude-code" in slug.lower(): category = "DevTools"
    
    frontmatter = f"""---
title: "{title}"
slug: "{slug}"
date: "{date_str}"
excerpt: >
{excerpt}
coverImage: "{cover_image}"
category: "{category}"
readTime: 15
tags:
  - "{category.replace('-', ' ')}"
  - "2026"
archetype: "explainer"
---

"""
    
    # Write blog markdown file
    blog_file = os.path.join(PROJECT_ROOT, "src/content/blog", f"{slug}.md")
    os.makedirs(os.path.dirname(blog_file), exist_ok=True)
    with open(blog_file, 'w') as f:
        f.write(frontmatter + content)
    log_info(f"Blog saved to {blog_file}")
    log_info(f"Cover image: {cover_image}")
    
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

def get_already_used_slugs():
    """Collect all slugs already in history + existing source files to avoid duplicates."""
    used = set()
    history = load_history()
    # From history (keyed by title, but slug stored inside)
    for entry in history.get("blogs", {}).values():
        if "slug" in entry:
            used.add(entry["slug"])
    # From existing src content files
    src_dir = os.path.join(PROJECT_ROOT, "src/content/blog")
    dist_dir = os.path.join(PROJECT_ROOT, "dist/blog")
    for d in [src_dir, dist_dir]:
        if os.path.isdir(d):
            for fn in os.listdir(d):
                slug = fn.replace(".md", "").replace("/index.html", "")
                if slug:
                    used.add(slug)
    return used

def slug_keywords(slug):
    """Extract core topic keywords from a slug for semantic dedup."""
    import re
    # Remove common boilerplate words
    stop = {"in","for","the","and","of","to","a","with","from","2026"," Guide","-deep-dive"}
    words = re.findall(r'[a-z0-9]+', slug.lower())
    return {w for w in words if w not in stop and len(w) > 3}

def is_semantic_duplicate(slug_a, slug_b, threshold=0.65):
    """Return True if two slugs share too many keywords (likely duplicates).
    
    Threshold 0.65 catches near-identical slugs like:
    - kotlin-2-x-... vs kotlin-2x-... (100% overlap)
    But allows related but distinct topics like:
    - flutter-state-management vs flutter-performance (low overlap)
    """
    kw_a = slug_keywords(slug_a)
    kw_b = slug_keywords(slug_b)
    if not kw_a or not kw_b:
        return False
    overlap = len(kw_a & kw_b)
    union = len(kw_a | kw_b)
    return overlap / union >= threshold if union else False

def get_next_topic(used_slugs):
    """Pick a random topic not yet used, checking slug dedup + semantic similarity."""
    available = [t for t in TOPICS if t["slug"] not in used_slugs]
    if not available:
        log_warn("All topics exhausted!")
        return None
    # Filter out topics too similar to already-used slugs
    filtered = [
        t for t in available
        if not any(is_semantic_duplicate(t["slug"], used) for used in used_slugs)
    ]
    # Fall back to all available if nothing passes semantic filter
    candidates = filtered if filtered else available
    return random.choice(candidates)

def main():
    print("=" * 75)
    print("Blog Automation System - ENHANCED v2.0")
    print("=" * 75)
    
    history = load_history()
    current_count = len(history.get('blogs', {}))
    max_count = 100  # Allow more blogs

    # Collect already-used slugs to prevent duplicates
    used_slugs = get_already_used_slugs()
    log_info(f"Already used slugs ({len(used_slugs)}): {sorted(used_slugs)[:5]}...")

    if current_count >= max_count:
        log_warn("Maximum blogs already created!")
        return
    
    topic_info = get_next_topic(used_slugs)
    if not topic_info:
        log_warn("No available topics remaining. Deduplication working correctly.")
        return
        
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
