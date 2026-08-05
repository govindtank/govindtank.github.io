#!/usr/bin/env python3
"""
Blog Automation v4 — human-sounding, varied-structure technical posts via local LLM.
=====================================================================================
What changed vs v3:
- 6 structure archetypes (tutorial / comparison / explainer / war-story / roundup / opinion),
  rotated so no two consecutive posts share a shape.
- 3 writer personas cycled for voice variety (first person allowed, opinions allowed).
- Hard anti-AI-tell rules: banned phrases list enforced in the prompt AND validated after.
- Humanizer second pass: a separate LLM call strips residual AI patterns.
- Real excerpt generated as a true abstract (not a copy of paragraph 1).
- Cover images: unique, curl-verified public URLs (never reused across posts).
- No static fallback template: retries with another archetype; varied skeletons only as
  absolute last resort.
- --rewrite-all: regenerate existing posts in place (same slug/date/category, new voice).
- git pull --rebase before push (avoids remote-divergence conflicts).

Author: Govind Tank
"""

import json, os, sys, re, time, subprocess, random, urllib.request, urllib.error
from datetime import datetime, timezone

# ======= CONFIGURATION =======
PROJECT_ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../.."))
CONTENT_DIR = f"{PROJECT_ROOT}/src/content/blog"
HISTORY_FILE = f"{PROJECT_ROOT}/data/blogs-history/blog_history.json"
POOL_FILE = f"{PROJECT_ROOT}/scripts/blog-automation/verified_images.json"
STATE_FILE = f"{PROJECT_ROOT}/scripts/blog-automation/.rewrite_state.json"
LLM_URL = "http://localhost:1234/v1/chat/completions"
MODELS = ["qwen/qwen3.5-9b"]  # only model that loads on this machine (gemma-4-12b needs 26GB)
GIT_USER_NAME = "Govind Tank"
GIT_USER_EMAIL = "govindtank600@gmail.com"
MIN_WORDS, TARGET_MIN, TARGET_MAX, MAX_WORDS = 1200, 1500, 2200, 3000
ARCHETYPE_HISTORY = 3          # never repeat an archetype used in the last N posts
MAX_LLM_ATTEMPTS = 3

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)

# ======= TOPIC POOL (new-post path) =======
# NOTE: the daily cron prompt first researches CURRENT trends (web) and prefers a
# trending topic not yet covered; this list is the fallback pool. Keep it fresh.
TOPICS = [
    {"title": "Agentic AI Development: From Chat Assistants to Autonomous Coding Agents", "tag": "AI-Engineering", "desc": "Agentic workflows, MCP protocol, tool-use loops, multi-agent orchestration, and agent evaluation in production"},
    {"title": "MCP in Practice: Model Context Protocol for Real-World Developer Tools", "tag": "AI-Engineering", "desc": "MCP servers, tool definitions, transport options, and integrating MCP into IDEs and CI pipelines"},
    {"title": "On-Device AI with NPUs: Running Models on Phone Silicon in 2026", "tag": "Mobile-AI", "desc": "NPU architecture, TFLite/MLX/CoreML execution, quantized models, and battery-aware inference on Android and iOS"},
    {"title": "Compose Multiplatform for iOS: Is Shared UI Production-Ready in 2026", "tag": "Kotlin", "desc": "Compose Multiplatform iOS stability, performance gaps, design-system sharing, and when shared UI makes sense"},
    {"title": "Kotlin 2.x and the K2 Compiler: What It Unlocked for Android Developers", "tag": "Kotlin", "desc": "K2 compiler features, performance gains, multiplatform improvements, and migration notes"},
    {"title": "Flutter Beyond Mobile: Desktop, Web, and Embedded Targets in 2026", "tag": "Flutter", "desc": "Flutter desktop/web maturity, embedded Linux, game engine integrations, and multi-target release strategies"},
    {"title": "AI-Native App Architecture: Designing Applications Around LLM Calls", "tag": "AI-Engineering", "desc": "LLM API layers, streaming UI patterns, prompt caching, fallback strategies, and cost-aware design"},
    {"title": "Local-First Applications: Sync Engines, CRDTs, and Offline-First UX", "tag": "Architecture", "desc": "Local-first architecture, sync protocols, CRDT libraries, and offline-first mobile UX patterns"},
    {"title": "RAG in Production: Practical Retrieval Patterns Beyond the Demo", "tag": "AI-ML", "desc": "Chunking, embeddings, hybrid search, re-ranking, evaluation, and RAG observability"},
    {"title": "Android 17 and the Modern Android Stack: What Changed in 2026", "tag": "Android", "desc": "Android 17 APIs, edge-to-edge enforcement, Kotlin-first tooling, and the modern Android architecture"},
    {"title": "Building Developer Tools in 2026: From CLI Design to AI-Assisted Extensions", "tag": "DevTools", "desc": "CLI design patterns, LSP protocol, VS Code extensions, and AI-powered code assistance"},
    {"title": "Dart 4 and the Evolution of the Flutter Ecosystem: What's New in 2026", "tag": "Flutter", "desc": "Dart 4 language features, Flutter tooling improvements, and ecosystem changes"},
    {"title": "Building Scalable Microservices with FastAPI and Event-Driven Architecture", "tag": "Backend-Architecture", "desc": "FastAPI microservices with event-driven patterns, message queues, and async processing"},
    {"title": "WebAssembly in 2026: From Browser to Edge Computing and Beyond", "tag": "WebAssembly", "desc": "Wasm runtime evolution, use cases in edge computing, plugin systems, and container alternatives"},
    {"title": "Zero-Trust Architecture: Implementing Security in Distributed Cloud Systems", "tag": "Security", "desc": "Zero-trust principles, identity-aware proxies, mTLS, and continuous verification"},
    {"title": "Edge AI: Running Large Language Models on Consumer Devices in 2026", "tag": "Edge-AI", "desc": "On-device ML inference, quantization techniques, NPU acceleration, and privacy-preserving AI"},
    {"title": "React Server Components: Production Patterns for High-Performance Web Apps", "tag": "Web-Dev", "desc": "RSC architecture, streaming SSR, server/client boundaries, and data fetching patterns"},
    {"title": "Data Engineering at Scale: Building Real-Time Streaming Pipelines", "tag": "Data-Engineering", "desc": "Kafka, Flink, streaming SQL, exactly-once semantics, and schema evolution"},
    {"title": "PostgreSQL 18 and the Rise of Hybrid Transactional-Analytical Processing", "tag": "Databases", "desc": "HTAP databases, columnar storage, parallel query execution, and real-time analytics"},
    {"title": "Event Sourcing and CQRS: Practical Patterns for Distributed Systems", "tag": "Architecture", "desc": "Event sourcing fundamentals, CQRS separation, projection rebuilds, and idempotency"},
    {"title": "Platform Engineering: Building Internal Developer Portals That Teams Love", "tag": "DevEx", "desc": "Backstage-like platforms, golden paths, developer scorecards, and API catalogs"},
    {"title": "Kubernetes Sidecar Patterns for Service Mesh Observability in 2026", "tag": "Cloud-Native", "desc": "Sidecar proxies, eBPF-based observability, OpenTelemetry deep integration, and traffic management"},
    {"title": "Testing AI-Generated Code: Strategies for Reliable Machine Learning Pipelines", "tag": "AI-ML", "desc": "Testing strategies for LLM outputs, evaluation benchmarks, adversarial testing, and CI/CD for ML"},
    {"title": "CSS Container Queries and Style Queries: Responsive Design Beyond Media Queries", "tag": "Web-Dev", "desc": "Container queries, style queries, component-driven responsive design, and browser support in 2026"},
    {"title": "Distributed Tracing with OpenTelemetry: From Instrumentation to Production Debugging", "tag": "Observability", "desc": "OpenTelemetry signals, sampling strategies, trace context propagation, and backend analysis"},
    {"title": "Rust for Systems Programming in 2026: Memory Safety, Concurrency, and Ecosystem Growth", "tag": "Systems", "desc": "Rust ownership model, async runtimes, FFI patterns, embedded systems, and production readiness"},
    {"title": "Building Real-Time Collaborative Apps with CRDTs and Operational Transformation", "tag": "Architecture", "desc": "CRDT data types, OT algorithms, conflict resolution, and live collaboration infrastructure"},
    {"title": "FinOps for Kubernetes: Optimizing Cloud Costs in Containerized Environments", "tag": "DevOps", "desc": "Kubernetes cost allocation, right-sizing, spot instances, and FinOps tooling in 2026"},
    {"title": "The Rise of AI Coding Assistants: Evaluating Code Quality and Productivity Impact", "tag": "AI-Engineering", "desc": "Evaluating LLM code assistants on real tasks, acceptance vs correctness, and team workflows"},
    {"title": "Small Language Models: Running Efficient AI on Edge Devices and Mobile Phones", "tag": "Edge-AI", "desc": "On-device SLM inference, quantization, model distillation, and mobile NPU hardware"},
]

# ======= IMAGE POOL (unique, verified public URLs) =======
def load_pool():
    with open(POOL_FILE) as f:
        return json.load(f)

def used_images():
    used = set()
    for fn in os.listdir(CONTENT_DIR):
        if not fn.endswith(".md"):
            continue
        m = re.search(r'^coverImage:\s*"([^"]+)"', open(os.path.join(CONTENT_DIR, fn)).read(), re.M)
        if m:
            used.add(m.group(1))
    return used

def pick_image(category=""):
    """Deterministic-ish unique image from the verified pool, never reused."""
    pool = [u for u in load_pool() if u not in used_images()]
    if not pool:
        raise RuntimeError("Image pool exhausted — run verify_images.py to expand")
    h = int(hashlib_md5(category + datetime.now().strftime("%Y%m%d")).hexdigest(), 16)
    return pool[h % len(pool)]

def hashlib_md5(s):
    import hashlib
    return hashlib.md5(s.encode())

# ======= ARCHETYPES =======
ARCHETYPES = {
    "tutorial": {
        "label": "hands-on tutorial",
        "structure": [
            "Opening hook: a concrete problem the reader is stuck on, or 'here's what we'll build and why it matters'. No generic preamble.",
            "Brief context: what you need before starting (versions, tools). 1-2 short paragraphs.",
            "Step-by-step walkthrough: numbered steps, each with purpose. 2-4 code blocks, each with a one-line 'what this does'.",
            "A short recap: what we just built and how the pieces fit.",
            "Pitfalls you hit while doing this yourself (specific errors, weird behavior).",
            "Closing: where to go next (docs, related tools), 1-2 sentences.",
        ],
        "notes": "Write like you're walking a colleague through it at a whiteboard. No 'comprehensive' claims.",
    },
    "comparison": {
        "label": "head-to-head comparison",
        "structure": [
            "Opening hook: the decision the reader is stuck on (which tool/library/pattern to pick).",
            "Brief context: why multiple options exist and what changed recently.",
            "Each option gets a fair section: strengths, weaknesses, when it fits. Own the trade-offs.",
            "One comparison table with honest trade-offs. NO fake benchmark numbers.",
            "Decision framework: bulleted 'choose X when...' / 'choose Y when...'.",
            "Closing: your recommendation and why, 2-3 sentences.",
        ],
        "notes": "Treat every option fairly even if you have a favorite. Specific versions and real ergonomic differences beat vague adjectives.",
    },
    "explainer": {
        "label": "how it works under the hood",
        "structure": [
            "Opening hook: a surprising behavior, a common misconception, or a question most devs get wrong.",
            "The mental model first: an analogy or simple framing before any code.",
            "Core mechanics: step-by-step, ONE mermaid diagram, 1-2 small code snippets.",
            "What happens at runtime: walk through a concrete scenario end to end.",
            "Edge cases and gotchas (what breaks, and why).",
            "Closing: why this mental model matters for day-to-day work, 1-2 sentences.",
        ],
        "notes": "Clarity over completeness. If a detail doesn't help the mental model, cut it.",
    },
    "war-story": {
        "label": "field story / postmortem",
        "structure": [
            "Opening hook: the incident or pain point, told from your perspective. First person ('I').",
            "The setup: what the system was, what we assumed.",
            "The failure moment: the symptom, the panic, the wrong guesses first.",
            "The actual fix: the debugging path, tools used, the aha moment.",
            "The fix in code: 1-2 code blocks.",
            "Lessons: what I'd do differently, bulleted.",
            "Closing: practical takeaway for the reader, 1-2 sentences.",
        ],
        "notes": "Specific beats dramatic. Real error messages, real timestamps, real stack traces read human. Don't invent heroic endings.",
    },
    "roundup": {
        "label": "roundup with verdicts",
        "structure": [
            "Opening hook: what the reader is trying to choose between.",
            "Selection criteria: brief and honest about what made the list.",
            "Each item its own short section: what it is, who it's for, verdict (worth it / skip / depends).",
            "One quick-reference table.",
            "Closing: how to evaluate options yourself rather than trusting the list, 2-3 sentences.",
        ],
        "notes": "Verdicts must be opinionated. 'Depends' needs a concrete condition.",
    },
    "opinion": {
        "label": "opinion / thesis piece",
        "structure": [
            "Opening hook: the claim, stated plainly and early. Take a side.",
            "Why most people think otherwise: steelman the mainstream view first.",
            "Your argument: evidence, experience, reasoning. Max 1 code/diagram element.",
            "Counterarguments: where you might be wrong, addressed honestly.",
            "Closing: what this means for the reader's decisions, 2-3 sentences.",
        ],
        "notes": "No hedge soup. If you're unsure about a claim, say so in one clause and move on.",
    },
}

PERSONAS = [
    "A senior engineer with 12+ years of experience who has been burned by over-engineered solutions. Writes plainly, uses first person, calls out trade-offs instead of hiding them.",
    "A curious tinkerer who prototypes everything. Enthusiastic but precise; shares small experiments and what surprised them. First person welcome.",
    "A pragmatic staff engineer who has reviewed a lot of bad production code. Slightly skeptical tone; values simple, boring solutions that work. First person welcome.",
]

BANNED_PHRASES = [
    "technology landscape in 2026", "landscape in 2026", "represents one of the most impactful",
    "comprehensive technical deep-dive", "comprehensive deep dive", "in today's fast-paced",
    "evolving landscape", "delve into", "seamless", "game-changer", "revolutionize", "revolutionizing",
    "unlock the", "harness the power", "it is important to note", "it's worth noting", "it's important to note",
    "In conclusion", "Furthermore", "Moreover", "Additionally,", "🚀", "💡", "✅", "🔥",
    "3-5x", "5x improvement", "cutting-edge", "state-of-the-art", "seamless integration",
    "production-grade", "best-in-class", "At its core", "at its core", "serves as", "stands as",
    "testament", "industry reports", "experts say", "some argue", "let's dive in", "let's explore",
    "in this article", "this article will", "this article provides", "deep dive into", "deep-dive",
    "unleash", "supercharge", "elevate your", "in the realm of", "when it comes to", "in a world where",
    "moving forward", "let me be clear", "the bottom line is", "take a step back",
]

# ======= LLM =======
def call_llm(messages, temperature=0.8, timeout=300):
    """Call qwen (only model that fits this machine). Returns text or None."""
    payload = {"model": MODELS[0], "messages": messages, "temperature": temperature,
               "max_tokens": 4096, "top_p": 0.9}
    try:
        req = urllib.request.Request(LLM_URL, data=json.dumps(payload).encode(),
                                     headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode())
            if "choices" in data and data["choices"]:
                msg = data["choices"][0]["message"]
                content = msg.get("content", "") or msg.get("reasoning_content", "")
                if content and len(content) > 300:
                    return content
    except Exception as e:
        log(f"  LLM call failed: {str(e)[:90]}")
    return None

def build_prompts(topic, archetype, persona, excerpt_only=False):
    arch = ARCHETYPES[archetype]
    if excerpt_only:
        system = "You write concise, honest blog post abstracts. No fluff, no marketing language, no 'In this article'."
        user = (f"Write a 1-2 sentence excerpt (max 200 chars) for a blog post titled '{topic['title']}' "
                f"about {topic.get('desc', '')}. Plain, specific, no AI clichés.")
        return system, user

    banned = "; ".join(BANNED_PHRASES[:24])
    system = f"""You are writing a technical blog post. {persona}

Post type: {arch['label']}.

Structure to follow (in this order, adapt headings naturally — do NOT use these exact labels):
{chr(10).join('- ' + s for s in arch['structure'])}

Style notes:
{arch['notes']}
- Write 1500-2200 words. No padding, no filler sections.
- Headings in sentence case (e.g. '## Why this keeps happening', not '## Why This Keeps Happening').
- Vary sentence length. Short sentences land harder. Long ones can take their time.
- First person is fine and welcome. Opinions are welcome. 'I' is not a dirty word.
- Use 1-3 real, verifiable references: real project names, real versions, real docs URLs,
  real RFCs, real error messages, real GitHub issues. If you cannot recall a specific fact
  confidently, stay generic about numbers rather than inventing precise fake statistics.
- Include a markdown table where the structure calls for it; include a mermaid diagram ONLY
  where the structure calls for it (not every post needs one).
- Code blocks must be realistic and runnable-looking, with a language tag.
- Start directly with the H1: # {topic['title']}
- End with a short closing section, NOT labeled 'Conclusion' and NOT labeled 'Future Outlook'.
- The H1 is the only # heading. Everything else is ## or ###.

HARD BANS — never use these words/phrases, even once:
{banned}

Never write:
- 'In today's fast-paced world of technology'
- 'The technology landscape in 2026 demands'
- 'represents one of the most impactful shifts'
- Any sentence that tells the reader how important the topic is instead of showing it.
- Fake benchmark numbers (x ms vs y ms invented precisely), fake team anecdotes, fake quotes.
- Emojis anywhere.
"""

    user = f"""Write the blog post now.

Title: {topic['title']}
Tag/category: {topic.get('tag', '')}
Topic context: {topic.get('desc', '')}

Remember: {arch['label']}, 1500-2200 words, no banned phrases, human voice, start with the H1."""
    return system, user

def humanize_pass(content, title):
    """Second LLM pass: strip residual AI patterns, tighten prose."""
    system = """You are a sharp copy editor. Rewrite this blog post to sound like it was written by an experienced engineer, not an LLM.

Rules:
1. Cut ALL of these if present: 'delve', 'seamless', 'leverage', 'robust', 'cutting-edge', 'game-changer',
   'it's worth noting', 'Furthermore', 'Moreover', 'In conclusion', 'at its core', 'serves as', 'stands as',
   'testament', 'in today's fast-paced', 'landscape', 'deep dive', 'unlock', 'elevate', 'in the realm of',
   'when it comes to', 'in a world where', 'moving forward', emojis, '🚀💡✅'.
2. Cut redundant intro sentences that just restate the heading (pattern: heading followed by a filler line).
3. Remove negative parallelism ('it's not just X, it's Y'), forced rule-of-three lists, and
   'from X to Y' false ranges.
4. Replace passive voice with active where the actor matters.
5. Vary sentence length. Break any run of three same-length sentences.
6. Keep ALL code blocks, tables, mermaid diagrams, headings, and markdown structure intact.
7. Keep the H1 exactly: # {title}
8. Do not change technical facts. Do not add content. Output the full markdown document only.
"""
    user = "Here is the draft:\n\n" + content
    out = call_llm([{"role": "system", "content": system}, {"role": "user", "content": user}],
                   temperature=0.5, timeout=300)
    return out if out and len(out) > 500 else None

# ======= VALIDATION =======
def validate(content, archetype):
    issues = []
    body = re.sub(r'^---.*?---\n', '', content, flags=re.S)
    wc = len(body.split())
    if wc < MIN_WORDS:
        issues.append(f"too short: {wc} words (< {MIN_WORDS})")
    elif wc > MAX_WORDS:
        issues.append(f"too long: {wc} words (> {MAX_WORDS})")
    if not TARGET_MIN <= wc <= TARGET_MAX:
        issues.append(f"off target range {TARGET_MIN}-{TARGET_MAX} (got {wc})")

    low = body.lower()
    for p in BANNED_PHRASES:
        if p in low:
            issues.append(f"banned phrase: '{p}'")

    if "## conclusion" in low:
        issues.append("banned heading '## Conclusion'")
    if "## future outlook" in low:
        issues.append("banned heading '## Future Outlook'")
    if "```mermaid" not in body and archetype in ("explainer",):
        issues.append("explainer archetype missing mermaid diagram")
    if "|" not in body and archetype in ("comparison", "roundup"):
        issues.append(f"{archetype} archetype missing a table")
    if re.search(r'^(#|\n\n)#{2,3} ', body) is None and len(re.findall(r'^#{2,3} ', body, re.M)) < 3:
        issues.append("fewer than 3 ## headings")
    return issues

# ======= FRONTMATTER / FILES =======
def format_date():
    return datetime.now().strftime("%B %d, %Y")

def slugify(title):
    slug = title.lower().strip()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    return slug.strip('-')

def write_content_md(slug, content, title, tag, date, excerpt, image_url, tags=None, read_time=None):
    if read_time is None:
        read_time = max(3, round(len(content.split()) / 200))
    tags_list = tags or [tag]
    tags_yaml = "\n".join(f'  - "{t}"' for t in tags_list)
    fm = f"""---
title: "{title}"
slug: "{slug}"
date: "{date}"
excerpt: >
  {excerpt}
coverImage: "{image_url}"
category: "{tag}"
readTime: {read_time}
tags:
{tags_yaml}
---

"""
    path = os.path.join(CONTENT_DIR, f"{slug}.md")
    with open(path, "w") as f:
        f.write(fm + content.lstrip())
    return path

def parse_existing(path):
    text = open(path).read()
    def g(key):
        m = re.search(rf'^{key}:\s*"?([^"\n]+)"?', text, re.M)
        return m.group(1).strip() if m else ""
    tags = re.findall(r'^\s+- "([^"]+)"', text, re.M)
    return {
        "title": g("title"), "slug": g("slug") or os.path.basename(path)[:-3],
        "date": g("date"), "category": g("category"), "coverImage": g("coverImage"),
        "tags": tags or [g("category")] or ["Tech"],
    }

def load_history():
    try:
        return json.load(open(HISTORY_FILE))
    except Exception:
        return {}

def save_history(h):
    os.makedirs(os.path.dirname(HISTORY_FILE), exist_ok=True)
    json.dump(h, open(HISTORY_FILE, "w"), indent=2)

def recent_archetypes():
    """Archetypes used by the last N posts (by file mtime)."""
    files = sorted((os.path.join(CONTENT_DIR, f) for f in os.listdir(CONTENT_DIR) if f.endswith(".md")),
                   key=os.path.getmtime)
    archs = []
    for f in files[-ARCHETYPE_HISTORY:]:
        m = re.search(r'^archetype:\s*"?([a-z-]+)"?', open(f).read(), re.M)
        if m:
            archs.append(m.group(1))
    return archs

def choose_archetype():
    recent = recent_archetypes()
    available = [a for a in ARCHETYPES if a not in recent]
    return random.choice(available or list(ARCHETYPES))

def choose_persona():
    return random.choice(PERSONAS)

def generate_blog_content(topic, archetype=None, persona=None, existing_meta=None):
    """Returns (content, archetype, persona, excerpt, image_url)."""
    archetype = archetype or choose_archetype()
    persona = persona or choose_persona()
    log(f"  archetype={archetype} persona_idx={PERSONAS.index(persona)}")

    content = None
    for attempt in range(MAX_LLM_ATTEMPTS):
        system, user = build_prompts(topic, archetype, persona)
        tmp = call_llm([{"role": "system", "content": system}, {"role": "user", "content": user}],
                       temperature=0.75 + attempt * 0.1)
        if tmp and tmp.strip().startswith("#"):
            content = tmp
            break
        log(f"  attempt {attempt + 1} failed/invalid, retrying (temp up)")
    if not content:
        log("  LLM failed for this archetype, switching archetype and retrying once")
        archetype = random.choice([a for a in ARCHETYPES if a != archetype])
        system, user = build_prompts(topic, archetype, persona)
        content = call_llm([{"role": "system", "content": system}, {"role": "user", "content": user}],
                           temperature=0.9)
    if not content:
        return None

    # humanizer pass (non-fatal if it fails)
    hz = humanize_pass(content, topic["title"])
    if hz:
        content = hz

    # excerpt: separate abstract
    excerpt = None
    s2, u2 = build_prompts(topic, archetype, persona, excerpt_only=True)
    e = call_llm([{"role": "system", "content": s2}, {"role": "user", "content": u2}], temperature=0.6, timeout=120)
    if e:
        excerpt = re.sub(r'\s+', ' ', e).strip()
        if len(excerpt) > 220:
            excerpt = excerpt[:217] + "..."
    if not excerpt:
        first = next((l.strip() for l in content.split("\n") if l.strip() and not l.startswith("#")), "")
        excerpt = (first[:217] + "...") if len(first) > 220 else first

    return content, archetype, persona, excerpt

# ======= GIT =======
def commit_and_push(commit_msg, paths=None):
    log("Git operations...")
    try:
        subprocess.run(["git", "config", "user.name", GIT_USER_NAME], cwd=PROJECT_ROOT, check=True, capture_output=True)
        subprocess.run(["git", "config", "user.email", GIT_USER_EMAIL], cwd=PROJECT_ROOT, check=True, capture_output=True)
        # pull --rebase to integrate remote changes first
        pr = subprocess.run(["git", "pull", "--rebase", "origin", "main"], cwd=PROJECT_ROOT, capture_output=True, timeout=120)
        if pr.returncode != 0:
            log(f"  pull --rebase issue: {pr.stderr.decode()[:200]}")
        if paths:
            subprocess.run(["git", "add", "--force", "--"] + paths, cwd=PROJECT_ROOT, check=True, capture_output=True)
        subprocess.run(["git", "add", "--force", "dist/"], cwd=PROJECT_ROOT, check=True, capture_output=True)
        subprocess.run(["git", "commit", "-m", commit_msg, "-m", "Generated via Hermes blog pipeline v4"],
                       cwd=PROJECT_ROOT, check=True, capture_output=True)
        log("  commit ok")
        r = subprocess.run(["git", "push", "origin", "main"], cwd=PROJECT_ROOT, capture_output=True, timeout=120)
        if r.returncode == 0:
            log("  push ok")
            return True
        log(f"  push failed: {r.stderr.decode()[:200]}")
        return False
    except subprocess.CalledProcessError as e:
        log(f"  git error: {(e.stderr or b'').decode()[:200]}")
        return False

def verify_build():
    log("Verifying build...")
    r = subprocess.run(["npm", "run", "build"], cwd=PROJECT_ROOT, capture_output=True, timeout=300)
    if r.returncode == 0:
        log("  build ok")
        return True
    log("  build FAILED: " + (r.stderr.decode()[:400] or r.stdout.decode()[:400]))
    return False

# ======= MAIN: single new post (daily cron path) =======
def main():
    print("=" * 70)
    print("  Blog Automation v4 (human-voice, archetype-rotated)")
    print("=" * 70)
    history = load_history()

    existing = {f[:-3] for f in os.listdir(CONTENT_DIR) if f.endswith(".md")}
    topic = None
    random.shuffle(TOPICS)
    for t in TOPICS:
        if slugify(t["title"]) not in existing:
            topic = t
            break
    if not topic:
        log("All topics already covered. Nothing to do.")
        return

    title, tag = topic["title"], topic["tag"]
    slug = slugify(title)
    log(f"Topic: {title}")
    gen = generate_blog_content(topic)
    if not gen:
        log("Generation failed after retries. Aborting (no static fallback used).")
        return
    content, archetype, persona, excerpt = gen
    image_url = pick_image(tag)
    date = format_date()
    path = write_content_md(slug, content, title, tag, date, excerpt, image_url)
    log(f"Wrote {path} ({len(content.split())} words, archetype={archetype})")

    issues = validate(open(path).read(), archetype)
    if issues:
        log(f"VALIDATION issues ({len(issues)}): {issues[:6]}")
        if len(issues) >= 3:
            log("Too many issues — deleting post and aborting.")
            os.remove(path)
            return

    # stamp archetype into frontmatter for history tracking
    text = open(path).read()
    text = text.replace("---\n", "---\narchetype: \"" + archetype + "\"\n", 1)
    open(path, "w").write(text)

    if not verify_build():
        os.remove(path)
        log("Build failed — removed post.")
        return

    wc = len(content.split())
    history.setdefault("blogs", {})[slug] = {"title": title, "date": date, "tag": tag,
                                             "wordCount": wc, "status": "published"}
    save_history(history)
    ok = commit_and_push(f"blog: {title} ({archetype}) - {datetime.now().strftime('%Y-%m-%d')}")
    log(f"DONE push={'ok' if ok else 'FAILED'} url=https://govindtank.github.io/blog/{slug}")

# ======= REWRITE-ALL: convert existing posts =======
def rewrite_all(only=None):
    print("=" * 70)
    print("  Blog v4 rewrite-all — regenerating existing posts with new voice")
    print("=" * 70)
    state = {}
    if os.path.exists(STATE_FILE):
        state = json.load(open(STATE_FILE))

    files = sorted(f for f in os.listdir(CONTENT_DIR) if f.endswith(".md"))
    if only:
        files = [f for f in files if f[:-3] in only or only == "all"]

    changed_paths = []
    for fn in files:
        slug = fn[:-3]
        if state.get(slug) == "done":
            log(f"skip {slug} (already done)")
            continue
        path = os.path.join(CONTENT_DIR, fn)
        meta = parse_existing(path)
        log(f"\n--- {slug} ---")
        topic = {"title": meta["title"], "tag": meta["category"], "desc": meta["title"]}
        gen = generate_blog_content(topic, existing_meta=meta)
        if not gen:
            log(f"  FAILED for {slug}, leaving original intact")
            state[slug] = "failed"
            json.dump(state, open(STATE_FILE, "w"), indent=2)
            continue
        content, archetype, persona, excerpt = gen
        # keep original date, cover image (already unique), tags
        write_content_md(slug, content, meta["title"], meta["category"], meta["date"],
                         excerpt, meta["coverImage"], tags=meta["tags"])
        text = open(path).read()
        text = text.replace("---\n", "---\narchetype: \"" + archetype + "\"\n", 1)
        open(path, "w").write(text)
        issues = validate(open(path).read(), archetype)
        log(f"  rewrote {slug}: {len(content.split())} words, archetype={archetype}"
            + (f", ISSUES: {issues[:4]}" if issues else ", clean"))
        state[slug] = "done" if not issues else "done-with-issues"
        changed_paths.append(path)
        json.dump(state, open(STATE_FILE, "w"), indent=2)

    if changed_paths:
        log(f"\n{len(changed_paths)} posts rewritten. Building...")
        if verify_build():
            ok = commit_and_push(f"blog: rewrite {len(changed_paths)} posts with human-voice v4 pipeline")
            log(f"PUSH {'ok' if ok else 'FAILED'}")
        else:
            log("Build failed — changes kept locally, nothing pushed.")
    else:
        log("No posts rewritten this run.")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--rewrite-all":
        only = sys.argv[2] if len(sys.argv) > 2 else None
        rewrite_all(only)
    else:
        main()
