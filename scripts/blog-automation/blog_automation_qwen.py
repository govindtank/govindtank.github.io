#!/usr/bin/env python3
"""
Qwen-Powered Blog Automation v3.0
===================================
Uses local qwen/qwen3.5-9b LLM to generate technical blog posts with:
- Public image URLs (Unsplash)
- Tables, mermaid diagrams, code blocks
 - Proper TypeScript escaping
 - Auto-updates blog history
 - Git commit and push via SSH
 - Pure Markdown source — metadata and content in .md frontmatter

Author: Govind Tank
License: MIT
"""

import json, os, sys, re, time, subprocess, random, urllib.request, urllib.error
from datetime import datetime, timezone

# ======= CONFIGURATION =======
PROJECT_ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../.."))
HISTORY_FILE = f"{PROJECT_ROOT}/data/blogs-history/blog_history.json"
CONTENT_DIR = f"{PROJECT_ROOT}/src/content/blog"
# INDEX_FILE = f"{PROJECT_ROOT}/src/data/blogs/index.json"  # REMOVED v3 — .md frontmatter is now the single source of truth
LLM_URL = "http://localhost:1234/v1/chat/completions"
LLM_MODEL = "qwen/qwen3.5-9b"
GIT_USER_NAME = "Govind Tank"
GIT_USER_EMAIL = "govindtank600@gmail.com"
MAX_BLOG_COUNT = 999  # No limit — scan and update all blogs

# Public Unsplash images for blog header images
IMAGES = {
    "ai-ml": "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=1200",
    "mobile": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1200",
    "code": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200",
    "architecture": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=1200",
    "data": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200",
    "cloud": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200",
    "security": "https://images.unsplash.com/photo-1555949963-ff9fe2c54ed7?auto=format&fit=crop&q=80&w=1200",
    "flutter": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200",
    "network": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=1200",
    "robot": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=1200",
}

# Topic pool - diverse trending tech topics NOT already covered
TOPICS = [
    {
        "title": "Building Scalable Microservices with FastAPI and Event-Driven Architecture",
        "tag": "Backend-Architecture",
        "image_key": "architecture",
        "desc": "FastAPI microservices with event-driven patterns, message queues, and async processing"
    },
    {
        "title": "WebAssembly in 2026: From Browser to Edge Computing and Beyond",
        "tag": "WebAssembly",
        "image_key": "code",
        "desc": "Wasm runtime evolution, use cases in edge computing, plugin systems, and container alternatives"
    },
    {
        "title": "Zero-Trust Architecture: Implementing Security in Distributed Cloud Systems",
        "tag": "Security",
        "image_key": "security",
        "desc": "Zero-trust principles, identity-aware proxies, mTLS, and continuous verification"
    },
    {
        "title": "Edge AI: Running Large Language Models on Consumer Devices in 2026",
        "tag": "Edge-AI",
        "image_key": "robot",
        "desc": "On-device ML inference, quantization techniques, NPU acceleration, and privacy-preserving AI"
    },
    {
        "title": "React Server Components: Production Patterns for High-Performance Web Apps",
        "tag": "Web-Dev",
        "image_key": "code",
        "desc": "RSC architecture, streaming SSR, server/client boundaries, and data fetching patterns"
    },
    {
        "title": "Data Engineering at Scale: Building Real-Time Streaming Pipelines",
        "tag": "Data-Engineering",
        "image_key": "data",
        "desc": "Kafka, Flink, streaming SQL, exactly-once semantics, and schema evolution"
    },
    {
        "title": "Building Developer Tools in 2026: From CLI Design to AI-Assisted Extensions",
        "tag": "DevTools",
        "image_key": "code",
        "desc": "CLI design patterns, LSP protocol, VS Code extensions, and AI-powered code assistance"
    },
    {
        "title": "PostgreSQL 18 and the Rise of Hybrid Transactional-Analytical Processing",
        "tag": "Databases",
        "image_key": "data",
        "desc": "HTAP databases, columnar storage, parallel query execution, and real-time analytics"
    },
    {
        "title": "Event Sourcing and CQRS: Practical Patterns for Distributed Systems",
        "tag": "Architecture",
        "image_key": "architecture",
        "desc": "Event sourcing fundamentals, CQRS separation, projection rebuilds, and idempotency"
    },
    {
        "title": "Platform Engineering: Building Internal Developer Portals That Teams Love",
        "tag": "DevEx",
        "image_key": "data",
        "desc": "Backstage-like platforms, golden paths, developer scorecards, and API catalogs"
    },
]


def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")

def load_history():
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE) as f:
            return json.load(f)
    return {"version": "2.1", "totalCreated": 0, "lastTopic": "",
            "todayCount": 0, "lastGenerated": "", "blogs": {}, "images": {}}

def save_history(h):
    os.makedirs(os.path.dirname(HISTORY_FILE), exist_ok=True)
    with open(HISTORY_FILE, 'w') as f:
        json.dump(h, f, indent=2)

def slugify(title):
    s = title.lower().replace(' ', '-')
    s = re.sub(r'[^a-z0-9-]', '', s)
    s = re.sub(r'-+', '-', s)
    return s.strip('-')

def write_content_md(slug, content, title, tags, date, excerpt, cover_image=""):
    """Write blog content as Markdown with YAML frontmatter"""
    filepath = f"{CONTENT_DIR}/{slug}.md"
    os.makedirs(CONTENT_DIR, exist_ok=True)
    
    # Build YAML frontmatter
    tag_entry = "uncategorized"
    if isinstance(tags, list) and tags:
        tag_entry = tags[0]
    elif isinstance(tags, str):
        tag_entry = tags
    
    frontmatter = f"""---
title: "{title}"
slug: "{slug}"
date: "{date}"
excerpt: >
  {excerpt[:197] + "..." if len(excerpt) > 200 else excerpt}
coverImage: "{cover_image}"
category: "{tag_entry}"
readTime: {max(3, len(content.split()) // 200)}
tags:
  - "{tag_entry}"
---

"""
    with open(filepath, 'w') as f:
        f.write(frontmatter + content)
    log(f"Content written to {filepath}")
    return True

def update_index_json(title, excerpt, date, tag, slug):
    """DEPRECATED v3 — No longer needed. Metadata is derived from .md frontmatter at build time."""
    return True

def select_topic(history):
    existing = set(history.get('blogs', {}).keys())
    random.shuffle(TOPICS)
    for t in TOPICS:
        slug = slugify(t["title"])
        if slug not in existing:
            return t
    return TOPICS[0]

def call_llm(prompt, system_prompt, timeout=180):
    payload = {
        "model": LLM_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.6,
        \"max_tokens\": 4096,
        "top_p": 0.9
    }
    try:
        req = urllib.request.Request(
            LLM_URL,
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode())
            if "choices" in data and len(data["choices"]) > 0:
                msg = data["choices"][0]["message"]
                content = msg.get("content", "") or msg.get("reasoning_content", "")
                return content
    except Exception as e:
        log(f"LLM call failed: {str(e)[:80]}")
        return None

def generate_blog_content(topic):
    title = topic["title"]
    tag = topic["tag"]

    system_prompt = f"""You are a Senior Software Architect writing a technical blog post.

RULES:
1. Start directly with H1: # {title}
2. Minimum 4 sections with ## headings
3. Include EXACTLY:
   - 1 markdown table (| Feature | Value | ...|)
   - 1 mermaid code block (```mermaid ... ```) for architecture diagram
   - 2 code blocks with language hints
   - Bullet-point lists
4. End with ## Conclusion
5. Total: 1200-1800 words
6. NO preamble text before the H1
7. Professional tone for senior developers

Mermaid example:
```mermaid
graph TD
  A[Component] --> B{{Decision}}
  B -->|Yes| C[Action]
```

Table example:
| Approach | Latency | Throughput |
|----------|---------|------------|
| Method A | 2ms | 5000 req/s |
"""

    user_prompt = f"""Write a detailed technical blog post about: {title}
Tag: {tag}

Topic context: {topic.get('desc', '')}

Cover:
- Current 2026 landscape and why it matters
- Technical deep-dive with implementation guidance
- Comparison table of approaches/tools
- Architecture diagram in mermaid format  
- Code examples (real patterns)
- Best practices and pitfalls
- Future outlook"""

    log(f"Generating content via local LLM ({LLM_MODEL})...")
    content = call_llm(user_prompt, system_prompt, timeout=300)

    # Check if content is valid
    if content and len(content) >= 1500 and content.strip().startswith('#'):
        log(f"LLM generated {len(content)} chars")
        return content

    log("LLM response too short or invalid, using fallback generator")
    return generate_fallback_content(title, tag)


FALLBACK_TEMPLATE = '''# {{TITLE}}

## Introduction

The technology landscape in 2026 demands that senior engineers stay ahead of rapidly evolving patterns and paradigms. {{TITLE}} represents one of the most impactful shifts in how modern distributed systems are architected and deployed. This article provides a comprehensive technical deep-dive, covering production-ready implementation strategies, architectural trade-offs, and forward-looking insights that every senior developer should understand.

## Current Landscape and Why It Matters

Enterprise adoption of these patterns has accelerated dramatically through 2026. Organizations that have successfully implemented them report measurable improvements across key metrics: deployment frequency increases by 3-5x, mean time to recovery (MTTR) drops by 60%, and team through-put improves by an average of 40%. The maturity of the ecosystem—matured tooling, comprehensive documentation, and a growing body of production case studies—has removed many of the early adoption barriers.

## Architectural Foundation

The core architecture follows a layered design that enforces separation of concerns while maintaining high cohesion. Each component has a clearly defined responsibility, communicating through well-typed interfaces that enable independent evolution of subsystems.

```mermaid
graph TD
  C[Client] --> G[Gateway Layer]
  G --> S[Service Layer]
  S --> D[Domain Logic]
  D --> A[(Data Store)]
  S --> Q[Message Queue]
  Q --> W[Worker Pool]
  W --> E[External APIs]
  D --> R[Cache Layer]
  R --> A
  style C fill:#1e3a5f,color:#fff
  style G fill:#2d5a87,color:#fff
  style S fill:#3a7bd5,color:#fff
  style D fill:#4a90d9,color:#fff
  style A fill:#6b5b95,color:#fff
  style Q fill:#c0392b,color:#fff
  style W fill:#e67e22,color:#fff
```

This architecture provides clear benefits for production systems: each layer can be tested independently, scaling decisions can be made per-component, and technology choices at one layer don't cascade to others.

## Implementation Strategies

### Core Infrastructure Setup

The foundation of any production-grade implementation starts with proper service scaffolding, configuration management, and observability instrumentation. Here is a practical example of setting up the core infrastructure:

```python
import asyncio
from typing import Optional
from dataclasses import dataclass, field
import structlog

logger = structlog.get_logger()

@dataclass
class ServiceConfig:
    """Central configuration for a service instance"""
    name: str
    version: str = "1.0.0"
    max_retries: int = 3
    circuit_breaker_threshold: int = 5
    recovery_timeout_s: int = 60

class ServiceOrchestrator:
    """Manages service lifecycle, health checks, and dependency wiring"""

    def __init__(self, config: ServiceConfig):
        self.config = config
        self._registry: dict[str, object] = {}
        self._health_status: dict[str, bool] = {}

    async def register(self, name: str, service, depends_on: list[str] = None):
        """Register a service with optional dependency declaration"""
        self._registry[name] = service
        logger.info("service.registered", name=name)
        if depends_on:
            for dep in depends_on:
                if dep not in self._registry:
                    raise RuntimeError(f"Dependency {dep} not registered")
        await service.initialize()
        self._health_status[name] = True
```

### Advanced Production Patterns

With the foundation in place, implement robust error handling and resilience patterns:

```typescript
interface ResiliencePolicy {
  retry: {
    maxAttempts: number;
    backoffMs: number;
    jitter: boolean;
  };
  circuitBreaker: {
    threshold: number;
    halfOpenAfterMs: number;
  };
  timeout: {
    requestMs: number;
    connectionMs: number;
  };
}

class AdaptiveResilienceManager {
  private failureCounts: Map<string, number> = new Map();
  private circuitState: Map<string, "CLOSED" | "OPEN" | "HALF_OPEN"> = new Map();
  private lastFailureTime: Map<string, number> = new Map();

  async callWithResilience<T>(
    serviceId: string,
    fn: () => Promise<T>,
    policy: ResiliencePolicy
  ): Promise<T> {
    if (this.isCircuitOpen(serviceId, policy)) {
      throw new CircuitBreakerOpenError(serviceId);
    }

    for (let attempt = 1; attempt <= policy.retry.maxAttempts; attempt++) {
      try {
        const result = await Promise.race([
          fn(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new TimeoutError()), policy.timeout.requestMs)
          ),
        ]);
        this.recordSuccess(serviceId);
        return result;
      } catch (error) {
        if (attempt < policy.retry.maxAttempts) {
          const delay = policy.retry.backoffMs * Math.pow(2, attempt - 1);
          const jitteredDelay = policy.retry.jitter
            ? delay * (0.5 + Math.random() * 0.5)
            : delay;
          await this.sleep(jitteredDelay);
          this.recordFailure(serviceId);
        } else {
          throw error;
        }
      }
    }
    throw new Error("Unreachable");
  }
}
```

## Production-Grade Comparison

Choosing the right approach depends on your specific requirements. The following comparison table highlights key trade-offs:

| Dimension | Synchronous | Event-Driven | Hybrid |
|-----------|------------|-------------|--------|
| Latency P99 | 50-100ms | 200-500ms | 100-200ms |
| Throughput | 10k req/s | 100k+ req/s | 50k req/s |
| Consistency | Strong | Eventual | Configurable |
| Complexity | Low | High | Medium |
| Debugging | Easy | Hard | Moderate |
| Team Expertise | Junior-suitable | Senior-required | Mixed team |
| Operational Cost | $ | $$ | $$ |
| Failure Isolation | Poor | Excellent | Good |

## Best Practices and Common Pitfalls

Based on extensive production experience, here are the critical patterns to follow and mistakes to avoid:

### Do This:
- **Start with observability**: Instrument everything from day one—metrics, structured logging, and distributed tracing are not optional
- **Design for failure**: Assume every dependency will fail and design accordingly with circuit breakers, bulkheads, and graceful degradation
- **Use idempotency keys**: Every mutation endpoint should support idempotency to safely handle retries
- **Document architecture decisions**: Maintain Architecture Decision Records (ADRs) for every significant design choice

### Avoid This:
- **Premature optimization**: Don't optimize for scale you don't yet need—focus on clean abstractions first
- **Over-engineering**: Start with the simplest solution that works, then evolve based on actual bottlenecks
- **Ignoring data consistency**: Eventual consistency requires careful thought about read paths and user expectations
- **Skipping load testing**: Always validate your architecture under realistic traffic patterns before production

## Future Outlook

Looking ahead to the remainder of 2026 and 2027, several trends will shape the evolution of these patterns:

- **AI-Augmented Operations**: Machine learning models will optimize resource allocation, predict failures, and automate incident response with increasing accuracy
- **Green Computing**: Energy-aware scheduling and carbon-aware deployment decisions are becoming first-class architectural concerns
- **Platform Engineering Maturity**: Internal developer platforms will abstract away infrastructure complexity through golden paths and self-service capabilities
- **Security Convergence**: Zero-trust principles will be embedded at the architecture level, not bolted on at the perimeter

## Conclusion

{{TITLE}} represents a fundamental shift in how we build production systems in 2026. By understanding the architectural patterns, implementing proven resilience strategies, and avoiding common pitfalls, senior developers can lead their teams to deliver systems that are not just functional, but truly robust, scalable, and maintainable. The investment in mastering these patterns pays compounding returns as systems grow in complexity and criticality. Start with clean foundations, iterate based on real production data, and keep the developer experience front and center in every design decision.
'''

def generate_fallback_content(title, tag):
    """High-quality fallback content if LLM fails"""
    return FALLBACK_TEMPLATE.replace("{{TITLE}}", title)


def escape_for_ts(content):
    """Escape content for TypeScript template literal (backtick string)"""
    # Order matters: escape backslash first, then backticks, then ${}
    content = content.replace("\\", "\\\\")
    content = content.replace("`", "\\`")
    content = content.replace("${", "\\${")
    return content


def format_date():
    """Return formatted date like 'June 2, 2026'"""
    now = datetime.now()
    return now.strftime("%B %d, %Y")


def update_constants(title, excerpt, date, tag, slug):
    """DEPRECATED v3 — No longer needed. constants.ts derives metadata from .md files at build time."""
    return True


def update_history(history, title, slug, date, tag, word_count, image_url):
    """Update blog history JSON"""
    # Calculate word count from title
    history["totalCreated"] = history.get("totalCreated", 0) + 1
    history["lastTopic"] = title
    history["todayCount"] = history.get("todayCount", 0) + 1
    history["lastGenerated"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    if "blogs" not in history:
        history["blogs"] = {}
    history["blogs"][slug] = {
        "title": title,
        "slug": slug,
        "date": date,
        "tag": tag,
        "wordCount": word_count,
        "status": "published"
    }
    if "images" not in history:
        history["images"] = {}
    history["images"][slug] = image_url

    save_history(history)
    log("Updated blog history")
    return True


def commit_and_push(title, slug):
    """Git commit and push changes"""
    log("Running git operations...")
    try:
        subprocess.run(["git", "config", "user.name", GIT_USER_NAME],
                       cwd=PROJECT_ROOT, check=True, capture_output=True)
        subprocess.run(["git", "config", "user.email", GIT_USER_EMAIL],
                       cwd=PROJECT_ROOT, check=True, capture_output=True)

        # Add changed files
        subprocess.run(["git", "add", f"{CONTENT_DIR}/{slug}.md", f"{PROJECT_ROOT}/data/blogs-history/blog_history.json"],
                       cwd=PROJECT_ROOT, check=True, capture_output=True)

        # Commit
        commit_msg = f"blog: Add {title} - {datetime.now().strftime('%Y-%m-%d')}"
        subprocess.run(["git", "commit", "-m", commit_msg, "-m", "Automated via Qwen 3.5 9B local LLM"],
                       cwd=PROJECT_ROOT, check=True, capture_output=True)
        log("Git commit successful")

        # Push via SSH
        result = subprocess.run(["git", "push", "origin", "main"],
                                cwd=PROJECT_ROOT, capture_output=True, timeout=60)
        if result.returncode == 0:
            log(f"Git push successful")
            return True
        else:
            log(f"Git push failed: {result.stderr.decode()[:200]}")
            return False
    except subprocess.CalledProcessError as e:
        log(f"Git operation failed: {e.stderr.decode() if e.stderr else str(e)}")
        return False


def verify_build():
    """Run npm build to verify everything compiles"""
    log("Verifying build...")
    result = subprocess.run(["npm", "run", "build"],
                            cwd=PROJECT_ROOT, capture_output=True, timeout=120)
    if result.returncode == 0:
        log("Build successful!")
        return True
    else:
        log("Build FAILED:")
        log(result.stderr.decode()[:500])
        return False


def count_words(text):
    """Count words in markdown content"""
    return len(text.split())


def main():
    print("=" * 70)
    print("  Qwen Blog Automation v3.0")
    print("  Model: qwen/qwen3.5-9b (local)")
    print("=" * 70)

    # Load history
    history = load_history()
    current_count = len(history.get("blogs", {}))
    log(f"Current blog count: {current_count}/{MAX_BLOG_COUNT}")

    if current_count >= MAX_BLOG_COUNT:
        log("MAX BLOG COUNT reached. Skipping.")
        return

    # Select topic
    topic = select_topic(history)
    title = topic["title"]
    tag = topic["tag"]
    slug = slugify(title)
    image_key = topic.get("image_key", "code")
    image_url = IMAGES.get(image_key, IMAGES["code"])
    date = format_date()

    log(f"Selected topic: {title}")
    log(f"Slug: {slug}")
    log(f"Tag: {tag}")

    # Generate content
    content = generate_blog_content(topic)
    word_count = count_words(content)
    log(f"Generated {word_count} words ({len(content)} chars)")

    # Create excerpt (first paragraph after the H1)
    excerpt = ""
    for line in content.split("\n"):
        if line.strip() and not line.startswith("#"):
            excerpt = line.strip()
            break
    if len(excerpt) > 200:
        excerpt = excerpt[:197] + "..."

    # Write content Markdown file
    log("Writing blog content to Markdown with frontmatter...")
    if not write_content_md(slug, content, title, tag, date, excerpt, image_url):
        log("Failed to write content Markdown")
        return

    # Update index.json (v3: no-op — metadata from .md frontmatter)
    log("Updating blog index (v3: .md frontmatter is single source of truth)...")
    if not update_index_json(title, excerpt, date, tag, slug):
        log("Failed to update index.json (non-critical, continuing)")
        pass

    # Verify build
    if not verify_build():
        log("Build failed, rolling back...")
        subprocess.run(["git", "checkout", "--", f"{CONTENT_DIR}/{slug}.md"],
                       cwd=PROJECT_ROOT)
        return

    # Update history
    log("Updating blog history...")
    update_history(history, title, slug, date, tag, word_count, image_url)

    # Git commit and push
    log("Committing and pushing to GitHub...")
    push_ok = commit_and_push(title, slug)

    print()
    print("=" * 70)
    print(f"  ✅ Blog Automation Complete!")
    print(f"  Title: {title}")
    print(f"  Words: {word_count}")
    print(f"  Total: {current_count + 1}/{MAX_BLOG_COUNT}")
    print(f"  Push:  {'✅ Success' if push_ok else '⚠️  Failed (commit exists locally)'}")
    print(f"  URL:   https://govindtank.github.io/blog/{slug}")
    print("=" * 70)


if __name__ == "__main__":
    main()
