#!/usr/bin/env python3
"""
Blog Automation v4.1 — human-sounding, archetype-rotated technical posts via LLM.
Features:
- Dynamic trending topic discovery & auto-replenishment from ~/.hermes/cron/topics.json
- Topic relevance scoring prioritized by Govind's Mobile Architecture & AI skillset
- 6 structure archetypes & 3 writer personas cycled for natural voice
- Anti-AI-tell rules and structure validation
- Unique verified Unsplash cover images
- Multi-tier LLM execution (Local LM Studio with fast fallback to Kilo AI Gateway)
- Deduplication against all existing blog markdown files

Author: Govind Tank
"""

import json, os, sys, re, time, subprocess, random, urllib.request, urllib.error
from datetime import datetime, timezone
import hashlib

# Import the fine-grained contextual image matcher and SVG card generator
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from image_matcher import pick_contextual_image, detect_theme
from svg_card_generator import save_svg_for_post

# ======= CONFIGURATION =======
PROJECT_ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../.."))
CONTENT_DIR = f"{PROJECT_ROOT}/src/content/blog"
HISTORY_FILE = f"{PROJECT_ROOT}/data/blogs-history/blog_history.json"
POOL_FILE = f"{PROJECT_ROOT}/scripts/blog-automation/verified_images.json"
STATE_FILE = f"{PROJECT_ROOT}/scripts/blog-automation/.rewrite_state.json"
TOPICS_JSON_PATH = os.path.expanduser("~/.hermes/cron/topics.json")

# LLM Providers Configuration
GEMINI_LLM_URL = "http://localhost:20128/v1/chat/completions"
GEMINI_MODELS = [
    "antigravity/gemini-3.7-flash-low",
    "auto/gemini"
]

LOCAL_LLM_URL = os.environ.get("HERMES_LOCAL_MODEL_URL", "http://127.0.0.1:1234/v1/chat/completions")
LOCAL_MODELS = ["qwen/qwen3.5-9b", "google/gemma-4-12b"]

KILO_LLM_URL = "https://api.kilo.ai/api/gateway/v1/chat/completions"
KILO_MODELS = [
    "stepfun/step-3.7-flash:free",
    "kilo-auto/free"
]

GIT_USER_NAME = "Govind Tank"
GIT_USER_EMAIL = "govindtank600@gmail.com"

MIN_WORDS = 450
ARCHETYPE_HISTORY = 3
MAX_LLM_ATTEMPTS = 3

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)

# ======= TOPIC REPLENISHMENT & MANAGEMENT =======
FALLBACK_TOPICS = [
    {
        "title": "Material You on Android: Dark Mode Implementation with DayNight Tokens",
        "tag": "Mobile-Architecture",
        "desc": "DayNight color token mapping, dynamic theming contrast handling, and edge-to-edge support in Jetpack Compose.",
        "keywords": ["Material You", "dark mode", "DayNight", "color tokens", "theming"]
    },
    {
        "title": "Kotlin Multiplatform: State Management Patterns for Cross-Platform Apps",
        "tag": "Mobile-Development",
        "desc": "StateFlow, SharedFlow, and Compose Multiplatform business logic sharing between Android and iOS.",
        "keywords": ["KMP", "StateFlow", "SharedFlow", "Compose Multiplatform"]
    },
    {
        "title": "Android Live Wallpapers with OpenGL ES: Performance Optimization Guide",
        "tag": "Mobile-Architecture",
        "desc": "GLSurfaceView lifecycle, battery preservation, shader optimization, and matrix rendering techniques.",
        "keywords": ["wallpaper", "graphics", "GPU optimization", "rendering"]
    },
    {
        "title": "Flutter: Riverpod vs Bloc vs Provider - Performance Benchmarks 2026",
        "tag": "Flutter",
        "desc": "State management trade-offs, rebuild overhead, memory profiling, and architecture scalability.",
        "keywords": ["Riverpod", "Bloc", "Provider", "performance"]
    },
    {
        "title": "Agentic AI: Building Autonomous Workflows with LangGraph and MCP Protocol",
        "tag": "AI-Engineering",
        "desc": "MCP server integrations, tool-calling loops, multi-agent orchestration, and eval pipelines.",
        "keywords": ["AI agents", "autonomous workflows", "MCP", "orchestration"]
    },
    {
        "title": "Local LLMs on Android: Llama.cpp GGUF Quantization for Mobile Edge AI",
        "tag": "Mobile-AI",
        "desc": "On-device inference with llama.cpp, GGUF quantization, NPU acceleration, and memory constraints.",
        "keywords": ["GGUF", "quantization", "on-device ML", "NPU", "llama.cpp"]
    },
    {
        "title": "Jetpack Compose Multiplatform: Sharing Business Logic Between iOS and Android",
        "tag": "Kotlin",
        "desc": "Architecture patterns for sharing UI and domain logic across iOS and Android with Compose Multiplatform.",
        "keywords": ["Compose", "multiplatform", "business logic", "reusability"]
    },
    {
        "title": "RAG Pipelines on Mobile: Vector Search with ChromaDB for Offline AI",
        "tag": "AI-Engineering",
        "desc": "Local vector embeddings, sqlite-vec / chromadb on-device, and low-latency offline retrieval.",
        "keywords": ["RAG", "vector-search", "offline-ai", "embeddings"]
    },
    {
        "title": "Flutter Antigravity: Building AI Features with OpenAI and Streaming SSE",
        "tag": "Flutter",
        "desc": "Streaming responses, markdown token rendering, resilient retry channels, and client-side chat state.",
        "keywords": ["Flutter", "chat interface", "LLM streaming", "SSE"]
    },
    {
        "title": "Kotlin Coroutines Flow Collection Operators: Best Practices and Performance",
        "tag": "Mobile-Development",
        "desc": "collectLatest vs flatMapLatest, buffer strategies, and eliminating memory leaks in UI observation.",
        "keywords": ["Flow", "collectLatest", "stateIn", "coroutines"]
    },
    {
        "title": "Android NPU Acceleration: Implementing ONNX Runtime for Mobile ML Inference",
        "tag": "Mobile-AI",
        "desc": "NNAPI and QNN execution providers in ONNX Runtime for low-power mobile computer vision and NLP.",
        "keywords": ["NPU", "ONNX", "machine learning", "acceleration"]
    },
    {
        "title": "Offline-First Mobile Apps: CRDTs for Conflict-Free Replication in Flutter",
        "tag": "Mobile-Architecture",
        "desc": "Implementing Yjs / Automerge CRDT synchronization over WebSockets for multi-device sync.",
        "keywords": ["CRDT", "sync", "offline", "conflict resolution"]
    }
]

def load_topics_from_file():
    """Load topics from ~/.hermes/cron/topics.json or fallback list."""
    topics = []
    if os.path.exists(TOPICS_JSON_PATH):
        try:
            with open(TOPICS_JSON_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict):
                    topics = data.get("trending_topics", []) or data.get("topics", [])
                elif isinstance(data, list):
                    topics = data
        except Exception as e:
            log(f"Error loading {TOPICS_JSON_PATH}: {e}")

    # Ensure all fallback topics are present in the list
    existing_titles = {t["title"].strip().lower() for t in topics if "title" in t}
    for fb in FALLBACK_TOPICS:
        if fb["title"].strip().lower() not in existing_titles:
            topics.append(fb)
    return topics

def save_topics_to_file(topics):
    """Save topics list to ~/.hermes/cron/topics.json."""
    os.makedirs(os.path.dirname(TOPICS_JSON_PATH), exist_ok=True)
    try:
        with open(TOPICS_JSON_PATH, "w", encoding="utf-8") as f:
            json.dump({"trending_topics": topics}, f, indent=2)
        log(f"Saved {len(topics)} topics to {TOPICS_JSON_PATH}")
    except Exception as e:
        log(f"Failed to write topics to file: {e}")

def extract_json_payload(raw_text):
    """Safely extracts JSON array or object from LLM response."""
    if not raw_text:
        return None
    m = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', raw_text)
    candidate = m.group(1).strip() if m else raw_text.strip()
    
    m_arr = re.search(r'\[\s*\{[\s\S]*\}\s*\]', candidate)
    if m_arr:
        try:
            return json.loads(m_arr.group(0))
        except Exception:
            pass
    try:
        return json.loads(candidate)
    except Exception:
        return None

def replenish_trending_topics(existing_slugs, existing_titles):
    """Generates 15 fresh trending topics matching Govind's profile via LLM."""
    log("Replenishing topic pool with fresh 2026 tech trends...")
    prompt = """Generate 15 fresh, viral, high-value technical blog post topics for a Senior Mobile Architect & AI Engineer (Govind Tank).
Focus on real-world engineering problems developers actively search for and share:
1. Flutter 3.29+ / Dart 3.7+ (Impeller Vulkan profiling, Signals vs Riverpod, WASM Web performance, isolating memory leaks)
2. Modern Android (Android 16/17, Material 3 Expressive, Predictive Back, AGSL Shaders, NDK zero-copy audio/video)
3. Kotlin Multiplatform 2.2 (Compose Multiplatform iOS memory & binary size, Ktor 3.0 SSE, C-Interop bindings)
4. Edge AI & On-Device SLMs (DeepSeek-R1, Qwen 2.5, Llama.cpp NDK compilation, GGUF Q4_K_M, Qualcomm QNN/NPU benchmarks)
5. Agentic AI & Model Context Protocol (MCP hosts on Android, tool-calling loops, multi-agent state machines, local RAG with sqlite-vec)
6. Local-First Systems & CRDTs (PowerSync vs Automerge vs ElectricSQL, offline SQLite sync)

Title Formulation Rules:
- Write high-CTR, problem-first titles that engineers click (e.g. 'Why Your Flutter App Janks...', 'How We Ran 3B SLMs on Android...', 'Signals vs Riverpod in 2026: Benchmark Numbers').
- Avoid dry academic jargon or generic high-level overviews.
- Format STRICTLY as a JSON array of objects:
[
  {
    "title": "Compelling Practitioner-Focused Title",
    "tag": "Mobile-Architecture / Flutter / AI-Engineering / Mobile-AI / Kotlin / Architecture",
    "desc": "1-2 sentences detailing the exact production pain point, architecture fix, and measurable takeaway.",
    "keywords": ["keyword1", "keyword2", "keyword3"]
  }
]
Output ONLY valid JSON."""

    raw = call_llm([
        {"role": "system", "content": "You are a senior tech strategist. Respond with strict JSON only."},
        {"role": "user", "content": prompt}
    ], max_tokens=4000, timeout=75)
    
    items = extract_json_payload(raw)
    if not items or not isinstance(items, list):
        log("Could not parse new topics JSON from LLM.")
        return load_topics_from_file()

    added = []
    current_topics = load_topics_from_file()
    current_titles = {t["title"].strip().lower() for t in current_topics if "title" in t}

    for item in items:
        title = item.get("title", "").strip()
        slug = slugify(title)
        if not title or slug in existing_slugs or title.lower() in existing_titles or title.lower() in current_titles:
            continue
        tag = item.get("tag", "Tech")
        desc = item.get("desc", title)
        kw = item.get("keywords", [tag])
        new_entry = {"title": title, "tag": tag, "desc": desc, "keywords": kw}
        current_topics.append(new_entry)
        current_titles.add(title.lower())
        added.append(new_entry)

    if added:
        save_topics_to_file(current_topics)
        log(f"Added {len(added)} brand new trending topics to pool.")
    return current_topics

SKILL_WEIGHTS = {
    "flutter": 4, "dart": 4, "android": 4, "jetpack": 4, "compose": 4, "material you": 4,
    "kotlin": 3, "kmp": 4, "edge ai": 4, "npu": 4, "onnx": 4, "llama.cpp": 4, "gguf": 4,
    "quantization": 3, "agentic": 4, "mcp": 4, "agents": 3, "crdt": 4, "local-first": 4,
    "fastapi": 3, "react": 2, "vite": 2, "opengl": 3, "live wallpaper": 3
}

def score_topic(topic):
    """Score topic based on Govind's profile skills and timeliness."""
    text = (topic.get("title", "") + " " + topic.get("tag", "") + " " + topic.get("desc", "")).lower()
    score = 1
    for kw, weight in SKILL_WEIGHTS.items():
        if kw in text:
            score += weight
    return score

# ======= IMAGE POOL =======
def load_pool():
    if not os.path.exists(POOL_FILE):
        return []
    with open(POOL_FILE) as f:
        return json.load(f)

def used_images():
    used = set()
    if not os.path.exists(CONTENT_DIR):
        return used
    for fn in os.listdir(CONTENT_DIR):
        if not fn.endswith(".md"):
            continue
        try:
            m = re.search(r'^coverImage:\s*\"([^\"]+)\"', open(os.path.join(CONTENT_DIR, fn), encoding="utf-8").read(), re.M)
            if m:
                used.add(m.group(1))
        except Exception:
            pass
    return used

def pick_image(category="", topic_title="", topic_desc="", topic_keywords=None, content="", slug=""):
    """
    Context-aware image selection: matches keywords from title/desc/tags
    against fine-grained technical themes (Audio DSP, AI Agents, Mobile UI, Shaders, Silicon/NPU, Distributed CRDT, Cloud Security).
    Returns verified, live high-resolution CDN URLs.
    """
    used = used_images()
    img_url, theme = pick_contextual_image(
        category=category,
        title=topic_title,
        desc=topic_desc,
        keywords=topic_keywords,
        content=content,
        used_urls=used,
        slug=slug
    )
    log(f"Contextual CDN image matched [{theme}]: {img_url}")
    return img_url

# ======= ARCHETYPES & PERSONAS =======
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
            "Core mechanics: step-by-step, clear architecture breakdown, 1-2 small code snippets.",
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
    "A senior mobile architect with 12+ years of experience who values clean architecture, battery & memory efficiency, and concise code. Writes plainly, uses first person, calls out trade-offs honestly.",
    "A curious tinkerer and AI engineer who prototypes everything on real devices. Enthusiastic but precise; shares small experiments, profiling stats, and what surprised them.",
    "A pragmatic staff engineer who has reviewed lots of production PRs. Slightly skeptical tone; values simple, boring solutions that survive production traffic."
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

# ======= LLM CALLER =======
def call_llm(messages, temperature=0.75, max_tokens=6000, timeout=45):
    """
    Tiered LLM caller:
    1. Gemini 3.7 Low (Local Gateway at localhost:20128 - prioritized)
    2. Kilo Gateway (Fast fallback with stepfun/step-3.7-flash, kilo-auto)
    3. Local LM Studio endpoint (fallback)
    """
    # Primary: Gemini 3.7 Low via Local Gateway
    for model in GEMINI_MODELS:
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "top_p": 0.9
        }
        req = urllib.request.Request(
            GEMINI_LLM_URL,
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                resp_data = json.loads(resp.read().decode())
                if "choices" in resp_data and resp_data["choices"]:
                    msg = resp_data["choices"][0]["message"]
                    content = msg.get("content", "")
                    if (not content or not content.strip()) and msg.get("reasoning"):
                        reasoning = msg.get("reasoning", "")
                        m_draft = re.search(r'(?:Let\'s draft|Draft|Here is the|#\s+)([\s\S]+)', reasoning, re.I)
                        if m_draft:
                            content = m_draft.group(1).strip()
                    if content and len(content.strip()) > 50:
                        log(f"  Gemini LLM succeeded with {model}")
                        return content
        except Exception as e:
            log(f"  Gemini LLM failed with {model}: {str(e)[:80]}")
            continue

    # Secondary: Kilo Gateway
    for model in KILO_MODELS:
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "top_p": 0.9
        }
        req = urllib.request.Request(
            KILO_LLM_URL,
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                resp_data = json.loads(resp.read().decode())
                if "choices" in resp_data and resp_data["choices"]:
                    msg = resp_data["choices"][0]["message"]
                    content = msg.get("content", "")
                    # If model puts generation in reasoning/thought when output tokens run out
                    if (not content or not content.strip()) and msg.get("reasoning"):
                        reasoning = msg.get("reasoning", "")
                        # Try to extract the draft/content if present
                        m_draft = re.search(r'(?:Let\'s draft|Draft|Here is the|#\s+)([\s\S]+)', reasoning, re.I)
                        if m_draft:
                            content = m_draft.group(1).strip()
                    if content and len(content.strip()) > 50:
                        log(f"  Kilo LLM succeeded with {model}")
                        return content
        except Exception as e:
            log(f"  Kilo LLM failed with {model}: {str(e)[:80]}")
            continue

    # Tertiary: Try Local LM Studio endpoint
    for local_model in LOCAL_MODELS:
        payload = {
            "model": local_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        req = urllib.request.Request(
            LOCAL_LLM_URL,
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                resp_data = json.loads(resp.read().decode())
                if "choices" in resp_data and resp_data["choices"]:
                    msg = resp_data["choices"][0]["message"]
                    content = msg.get("content", "")
                    if content and len(content.strip()) > 50:
                        log(f"  Local LLM succeeded with {local_model}")
                        return content
        except Exception:
            pass

    return None

def build_prompts(topic, archetype, persona, excerpt_only=False):
    arch = ARCHETYPES[archetype]
    if excerpt_only:
        system = "You write concise, compelling, high-CTR blog post abstracts. Max 200 characters. No fluff, no marketing hype, no 'In this article'."
        user = (f"Write a 1-2 sentence high-impact excerpt (max 200 chars) for a blog post titled '{topic['title']}' "
                f"about {topic.get('desc', '')}. Highlight the concrete problem and payoff.")
        return system, user

    banned = "; ".join(BANNED_PHRASES[:25])
    system = f"""You are writing a high-signal, practitioner-grade technical blog post that developers bookmark and share. {persona}

Post type: {arch['label']}.

Structure to follow:
- Start immediately with H1: # {topic['title']}
- Immediately following the H1, ALWAYS include a clean executive TL;DR callout box:
  > **TL;DR**: [1-2 sentences summarizing the core finding, pattern, or decision].
  > - **The Problem**: [What caused friction, latency, memory pressure, or jank]
  > - **The Solution**: [The concrete architecture pattern or code fix]
  > - **The Result**: [Concrete metric: e.g. sub-10ms latency, 60 FPS, 0 cloud API cost]
{chr(10).join('- ' + s for s in arch['structure'])}
- Always include a section on 'What broke in practice' or 'Common pitfalls and how to avoid them'.
- Always include clean, realistic, compilable code snippets with inline comments explaining why specific choices were made.
- If relevant to the archetype, include a crisp Markdown comparison / decision matrix table.

Rules:
- Write with practitioner authority. Provide rich technical depth, realistic architecture, and concrete code without artificial truncation.
- Ensure the post is completely written from start to finish. Never stop mid-thought, mid-sentence, or mid-code-block.
- Sentence-case headings. Short, descriptive, and punchy.
- First person welcome ('I', 'we'). Call out real trade-offs honestly without sugarcoating.
- End with a complete, practical action item for the reader's codebase, NOT 'Conclusion' or 'Future Outlook'.
- Only H1 is #. Subsections use ## and ###.

Banned clichés: {banned}
No emojis. No fake benchmarks. No invented stats."""

    user = f"""Write the complete, highly engaging blog post now from the H1 title down to the practical takeaways.

Title: {topic['title']}
Tag/category: {topic.get('tag', 'Mobile-Architecture')}
Topic context: {topic.get('desc', '')}

Remember: {arch['label']}, include the TL;DR callout block at the top, high-signal code with comments, real production pitfalls, sentence-case headings, no banned phrases, and ensure the post is fully completed."""
    return system, user

# ======= VALIDATION & COMPLETION CHECK =======
def is_content_complete(content):
    """
    Strictly verifies if markdown content terminates cleanly.
    Returns (is_complete, reason).
    """
    if not content or len(content.strip()) < 100:
        return False, "content empty or critically short"
    
    body = re.sub(r'^---.*?---\n', '', content, flags=re.S).strip()
    
    # Check 1: Open code fences
    fence_count = len(re.findall(r'^```', body, re.M))
    if fence_count % 2 != 0:
        return False, "unclosed code block (odd number of markdown fences)"
    
    # Check 2: Terminal punctuation / clean ending
    last_line = body.split("\n")[-1].strip()
    
    # Allow clean endings: ends with terminal punctuation, markdown bold/italic closure, table pipe, blockquote, or code fence
    valid_terminal_chars = ('.', '!', '?', '"', '\'', '`', ')', ']', '}', '>', '*', '_')
    if not (last_line.endswith(valid_terminal_chars) or last_line.endswith('-->') or last_line == '```'):
        return False, f"ends mid-sentence/truncated line: '{last_line[-60:]}'"
        
    # Check 3: Cutoff indicators
    cutoff_signals = [" the ", " and ", " or ", " with ", " to ", " of ", " in ", " for ", " because ", " when ", " if ", " that ", " while "]
    if any(last_line.lower().endswith(sig.strip()) for sig in cutoff_signals):
        return False, f"ends on conjunction/preposition: '{last_line[-40:]}'"
        
    return True, "complete"

def validate(content, archetype):
    issues = []
    body = re.sub(r'^---.*?---\n', '', content, flags=re.S)
    wc = len(body.split())
    if wc < MIN_WORDS:
        issues.append(f"too short: {wc} words (< {MIN_WORDS})")
    
    complete, reason = is_content_complete(content)
    if not complete:
        issues.append(f"incomplete/truncated: {reason}")

    low = body.lower()
    for p in BANNED_PHRASES:
        if p in low:
            issues.append(f"banned phrase: '{p}'")
    if "## conclusion" in low:
        issues.append("banned heading '## Conclusion'")
    if "## future outlook" in low:
        issues.append("banned heading '## Future Outlook'")
    if "|" not in body and archetype in ("comparison", "roundup"):
        issues.append(f"{archetype} archetype missing a table")
    if len(re.findall(r'^#{2,3} ', body, re.M)) < 2:
        issues.append("fewer than 2 ## headings")
    return issues

# ======= FRONTMATTER & FILE WRITING =======
def format_date():
    return datetime.now().strftime("%B %d, %Y")

def slugify(title):
    slug = title.lower().strip()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    return slug.strip("-")

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
    with open(path, "w", encoding="utf-8") as f:
        f.write(fm + content.lstrip())
    return path

def load_history():
    try:
        if os.path.exists(HISTORY_FILE):
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass
    return {}

def save_history(h):
    os.makedirs(os.path.dirname(HISTORY_FILE), exist_ok=True)
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(h, f, indent=2)

def recent_archetypes():
    if not os.path.exists(CONTENT_DIR):
        return []
    files = sorted((os.path.join(CONTENT_DIR, f) for f in os.listdir(CONTENT_DIR) if f.endswith(".md")),
                   key=os.path.getmtime)
    archs = []
    for f in files[-ARCHETYPE_HISTORY:]:
        try:
            m = re.search(r'^archetype:\s*\"?([a-z-]+)\"?', open(f, encoding="utf-8").read(), re.M)
            if m:
                archs.append(m.group(1))
        except Exception:
            pass
    return archs

def choose_archetype():
    recent = recent_archetypes()
    available = [a for a in ARCHETYPES if a not in recent]
    return random.choice(available or list(ARCHETYPES))

def choose_persona():
    return random.choice(PERSONAS)

def clean_post_content(raw_content, title):
    """Ensure post starts directly with H1 title and has clean markdown."""
    text = raw_content.strip()
    # Strip opening markdown fence if present
    text = re.sub(r'^```(?:markdown)?\s*', '', text)
    text = re.sub(r'\s*```$', '', text)
    
    # If text doesn't start with '# ', prepend H1
    if not text.startswith("# "):
        # Remove any leading preamble
        m = re.search(r'^#\s+.*$', text, re.M)
        if m:
            text = text[m.start():]
        else:
            text = f"# {title}\n\n{text}"
    return text

def generate_single_post(topic, archetype=None, persona=None):
    """Generates and writes a single verified blog post. Returns tuple or None."""
    archetype = archetype or choose_archetype()
    persona = persona or choose_persona()
    title = topic["title"]
    tag = topic.get("tag", "Mobile-Architecture")
    slug = slugify(title)
    log(f"Generating post: '{title}' [{tag}] (archetype={archetype})")

    content = None
    for attempt in range(MAX_LLM_ATTEMPTS):
        system, user = build_prompts(topic, archetype, persona)
        tmp = call_llm([{"role": "system", "content": system}, {"role": "user", "content": user}],
                       temperature=0.7 + attempt * 0.1, max_tokens=6000)
        if tmp and len(tmp.strip().split()) >= MIN_WORDS - 50:
            content = clean_post_content(tmp, title)
            break
        log(f"  Attempt {attempt + 1} yielded insufficient words ({len((tmp or '').split())}), retrying...")

    if not content:
        alt_archetype = random.choice([a for a in ARCHETYPES if a != archetype])
        log(f"  Retrying with alternate archetype: {alt_archetype}")
        system, user = build_prompts(topic, alt_archetype, persona)
        tmp = call_llm([{"role": "system", "content": system}, {"role": "user", "content": user}],
                       temperature=0.8, max_tokens=6000)
        if tmp and len(tmp.strip().split()) >= MIN_WORDS - 50:
            content = clean_post_content(tmp, title)
            archetype = alt_archetype

    if not content:
        log("  Failed to generate post content after retries.")
        return None

    # Excerpt generation
    excerpt = None
    s2, u2 = build_prompts(topic, archetype, persona, excerpt_only=True)
    e = call_llm([{"role": "system", "content": s2}, {"role": "user", "content": u2}],
                 temperature=0.5, max_tokens=1500, timeout=35)
    if e:
        excerpt = re.sub(r'\s+', ' ', e).strip().strip('"').strip("'")
        if len(excerpt) > 220:
            excerpt = excerpt[:217] + "..."
    if not excerpt:
        first = next((l.strip() for l in content.split("\n") if l.strip() and not l.startswith("#")), "")
        excerpt = (first[:217] + "...") if len(first) > 220 else first

    image_url = pick_image(
        category=tag,
        topic_title=title,
        topic_desc=topic.get("desc", ""),
        topic_keywords=topic.get("keywords", []),
        content=content,
        slug=slug
    )
    date = format_date()
    path = write_content_md(slug, content, title, tag, date, excerpt, image_url)
    
    # Stamp archetype in frontmatter
    text = open(path, encoding="utf-8").read()
    text = text.replace("---\n", f"---\narchetype: \"{archetype}\"\n", 1)
    open(path, "w", encoding="utf-8").write(text)

    wc = len(content.split())
    log(f"Wrote {path} ({wc} words, archetype={archetype})")

    # Validate
    issues = validate(open(path, encoding="utf-8").read(), archetype)
    if issues:
        log(f"Validation notices ({len(issues)}): {issues}")
        has_fatal_issue = any("incomplete/truncated" in iss or "too short" in iss for iss in issues)
        if has_fatal_issue or len(issues) >= 4:
            log("Critical validation failure (incomplete or severely malformed). Rejecting post.")
            if os.path.exists(path):
                os.remove(path)
            return None

    social = generate_social_snippet(topic, title, excerpt, tag, slug)
    return path, slug, title, tag, date, wc, archetype, social

# ======= SOCIAL MEDIA SNIPPET GENERATOR =======
def generate_social_snippet(topic, title, excerpt, tag, slug):
    """
    Generates a catchy social-media ready short title, punchy description, and popular relatable hashtags.
    """
    url = f"https://govindtank.github.io/blog/{slug}"
    tag_map = {
        "Mobile-Architecture": ["#AndroidDev", "#MobileArchitecture", "#Kotlin", "#SoftwareEngineering", "#JetpackCompose"],
        "Mobile-Development": ["#MobileDev", "#AndroidDev", "#iOSDev", "#SoftwareEngineering", "#TechTrends"],
        "Flutter": ["#FlutterDev", "#DartLang", "#MobileDev", "#CrossPlatform", "#AppDevelopment"],
        "AI-Engineering": ["#AIEngineering", "#GenerativeAI", "#LLMs", "#AI", "#TechInnovation"],
        "Mobile-AI": ["#OnDeviceAI", "#MobileAI", "#EdgeAI", "#AndroidDev", "#MachineLearning"],
        "Kotlin": ["#Kotlin", "#AndroidDev", "#KMP", "#CleanCode", "#SoftwareArchitecture"],
        "Architecture": ["#SoftwareArchitecture", "#SystemDesign", "#CleanCode", "#TechLead", "#Developers"]
    }
    fallback_tags = list(tag_map.get(tag, ["#Tech", "#SoftwareEngineering", "#Programming", "#Developers", "#TechBlog"]))
    
    for kw in topic.get("keywords", []):
        clean_kw = re.sub(r'[^a-zA-Z0-9]', '', kw.title())
        if clean_kw and len(clean_kw) > 2 and f"#{clean_kw}" not in fallback_tags:
            fallback_tags.append(f"#{clean_kw}")
    fallback_tags = fallback_tags[:6]

    system_prompt = (
        "You are an expert tech developer advocate and social media copywriter. "
        "Create an engaging, viral, developer-friendly social media teaser for LinkedIn and X/Twitter."
    )
    user_prompt = f"""Given this technical blog post:
Title: {title}
Category: {tag}
Summary: {excerpt or topic.get('desc', '')}
URL: {url}

Generate a JSON object with:
- "short_title": A catchy, high-impact headline/hook for social media (under 60 chars, e.g. '⚡ Mastering Offline RAG on Android').
- "description": A punchy 1-2 sentence description explaining the key technical insight or value (under 180 chars).
- "tags": An array of 4-6 popular, relatable developer hashtags (e.g. ["#AndroidDev", "#Kotlin", "#JetpackCompose"]).

Return ONLY valid JSON."""

    try:
        raw = call_llm([{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
                       temperature=0.7, max_tokens=300, timeout=25)
        if raw:
            m = re.search(r'\{[\s\S]*\}', raw)
            if m:
                data = json.loads(m.group(0))
                short_title = data.get("short_title", title).strip()
                description = data.get("description", excerpt).strip()
                tags = data.get("tags", fallback_tags)
                if isinstance(tags, list) and len(tags) >= 2:
                    clean_tags = []
                    for t in tags:
                        t = t.strip()
                        if not t.startswith('#'):
                            t = f"#{t}"
                        clean_tags.append(t)
                    tags = clean_tags[:6]
                else:
                    tags = fallback_tags
                return {
                    "short_title": short_title,
                    "description": description,
                    "tags": tags,
                    "url": url
                }
    except Exception as e:
        log(f"  Social snippet notice: {e}")

    # Deterministic fallback
    short_title = title if len(title) <= 65 else (title[:62].rsplit(' ', 1)[0] + "...")
    description = excerpt if excerpt else topic.get("desc", title)
    if len(description) > 180:
        description = description[:177].rsplit(' ', 1)[0] + "..."
    return {
        "short_title": short_title,
        "description": description,
        "tags": fallback_tags,
        "url": url
    }

# ======= BUILD & GIT =======
def verify_build():
    log("Verifying VitePress & React site build...")
    r1 = subprocess.run(["npx", "vitepress", "build", "docs"], cwd=PROJECT_ROOT, capture_output=True, timeout=180)
    if r1.returncode != 0:
        log(f"VitePress build failed: {r1.stderr.decode()[:300]}")
        return False
    r2 = subprocess.run(["npm", "run", "build"], cwd=PROJECT_ROOT, capture_output=True, timeout=300)
    if r2.returncode != 0:
        log(f"React build failed: {r2.stderr.decode()[:300]}")
        return False
    log("Build verification successful.")
    return True

def commit_and_push(commit_msg, paths=None):
    log("Running Git sync and push...")
    try:
        subprocess.run(["git", "config", "user.name", GIT_USER_NAME], cwd=PROJECT_ROOT, check=True, capture_output=True)
        subprocess.run(["git", "config", "user.email", GIT_USER_EMAIL], cwd=PROJECT_ROOT, check=True, capture_output=True)
        
        pr = subprocess.run(["git", "pull", "--rebase", "origin", "main"], cwd=PROJECT_ROOT, capture_output=True, timeout=120)
        if pr.returncode != 0:
            log(f"  pull --rebase notice: {pr.stderr.decode()[:200]}")

        if paths:
            subprocess.run(["git", "add", "--force", "--"] + paths, cwd=PROJECT_ROOT, check=True, capture_output=True)
        subprocess.run(["git", "add", "-A"], cwd=PROJECT_ROOT, check=True, capture_output=True)
        
        diff_check = subprocess.run(["git", "diff", "--staged", "--quiet"], cwd=PROJECT_ROOT)
        if diff_check.returncode == 0:
            log("Nothing staged to commit.")
            return True

        subprocess.run(["git", "commit", "-m", commit_msg, "-m", "Automated release via Hermes Blog Pipeline v4.1"],
                       cwd=PROJECT_ROOT, check=True, capture_output=True)
        log("  Commit created.")

        token = subprocess.run(["gh", "auth", "token"], cwd=PROJECT_ROOT,
                               capture_output=True, text=True, timeout=15).stdout.strip()
        if token:
            push_url = f"https://x-access-token:{token}@github.com/govindtank/govindtank.github.io.git"
            r = subprocess.run(["git", "push", push_url, "HEAD:main"], cwd=PROJECT_ROOT, capture_output=True, timeout=180)
            if r.returncode == 0:
                log("  Git push to origin/main succeeded.")
                return True
            else:
                log(f"  Token push failed ({r.stderr.decode()[:200]}), attempting standard push...")

        r_std = subprocess.run(["git", "push", "origin", "main"], cwd=PROJECT_ROOT, capture_output=True, timeout=180)
        if r_std.returncode == 0:
            log("  Standard git push succeeded.")
            return True
        log(f"  Git push failed: {r_std.stderr.decode()[:200]}")
        return False
    except Exception as e:
        log(f"Git operation error: {e}")
        return False

# ======= MAIN RUNNER =======
def main(count=1):
    print("=" * 70)
    print(f"  Blog Automation v4.1 — Target: {count} new blog post(s)")
    print("=" * 70)

    existing_files = [f for f in os.listdir(CONTENT_DIR) if f.endswith(".md")] if os.path.exists(CONTENT_DIR) else []
    existing_slugs = {f[:-3] for f in existing_files}
    existing_titles = set()
    for f in existing_files:
        try:
            m = re.search(r'^title:\s*[\"\x27]?(.*?)[\"\x27]?\s*$', open(os.path.join(CONTENT_DIR, f), encoding="utf-8").read(), re.M)
            if m:
                existing_titles.add(m.group(1).strip().lower())
        except Exception:
            pass

    log(f"Found {len(existing_slugs)} existing published blog posts.")

    all_topics = load_topics_from_file()
    available_topics = []
    for t in all_topics:
        title = t.get("title", "").strip()
        if not title:
            continue
        if slugify(title) not in existing_slugs and title.lower() not in existing_titles:
            available_topics.append(t)

    log(f"Available uncovered topics in pool: {len(available_topics)}")

    # Auto-replenish if available pool is running low
    if len(available_topics) < 10:
        all_topics = replenish_trending_topics(existing_slugs, existing_titles)
        available_topics = [t for t in all_topics if slugify(t.get("title", "")) not in existing_slugs and t.get("title", "").strip().lower() not in existing_titles]
        log(f"Available topics after replenishment: {len(available_topics)}")

    if not available_topics:
        log("No available topics found even after replenishment attempt. Aborting.")
        return

    # Sort topics by relevance score (highest first), with some random jitter for variety
    available_topics.sort(key=lambda t: score_topic(t) + random.uniform(0, 1.5), reverse=True)

    generated_posts = []
    history = load_history()

    for i in range(min(count, len(available_topics))):
        topic = available_topics[i]
        log(f"\n--- Generating Post {i+1} of {count} ---")
        res = generate_single_post(topic)
        if res:
            path, slug, title, tag, date, wc, archetype, social = res
            generated_posts.append({
                "path": path, "slug": slug, "title": title, "tag": tag,
                "date": date, "wc": wc, "archetype": archetype,
                "social": social
            })
            existing_slugs.add(slug)
            existing_titles.add(title.lower())
            history.setdefault("blogs", {})[slug] = {
                "title": title, "date": date, "tag": tag,
                "wordCount": wc, "status": "published",
                "social": social
            }

    if not generated_posts:
        log("No new posts were successfully generated.")
        return

    log(f"\nSuccessfully generated {len(generated_posts)} new post(s).")
    save_history(history)

    # Build and verify site
    if not verify_build():
        log("Site build failed. Reverting generated posts...")
        for p in generated_posts:
            if os.path.exists(p["path"]):
                os.remove(p["path"])
        return

    # Commit and push
    titles_summary = ", ".join(f"'{p['title']}'" for p in generated_posts)
    commit_msg = f"feat(blog): publish {len(generated_posts)} new post(s) - {datetime.now().strftime('%Y-%m-%d')}\n\n" + "\n".join(f"- {p['title']} ({p['tag']})" for p in generated_posts)
    
    paths = [p["path"] for p in generated_posts]
    ok = commit_and_push(commit_msg, paths=paths)
    
    print("\n" + "=" * 70)
    print(f"  AUTOMATION RESULT: {len(generated_posts)} post(s) generated, push={'SUCCESS' if ok else 'FAILED'}")
    print("=" * 70)
    for idx, p in enumerate(generated_posts, start=1):
        soc = p.get("social", {})
        short_title = soc.get("short_title", p["title"])
        desc = soc.get("description", p.get("title", ""))
        tags_list = soc.get("tags", [])
        tags_str = " ".join(tags_list)
        url = soc.get("url", f"https://govindtank.github.io/blog/{p['slug']}")

        print("\n" + "─" * 70)
        print(f"📱 SOCIAL MEDIA POST #{idx} — READY TO SHARE")
        print("─" * 70)
        print(f"🎯 Catchy Short Title: {short_title}")
        print(f"💡 Key Insight/Hook:   {desc}")
        print(f"🔗 Published Blog URL: {url}")
        print(f"🏷️ Relatable Tags:     {tags_str}")
        print("\n📋 [Ready-to-Copy Social Mix]:")
        print(f"🚀 {short_title}\n\n{desc}\n\n📖 Read the full deep-dive:\n👉 {url}\n\n{tags_str}")
        print("─" * 70)
    print("=" * 70)

if __name__ == "__main__":
    count = 1
    if "--count" in sys.argv:
        idx = sys.argv.index("--count")
        if idx + 1 < len(sys.argv) and sys.argv[idx + 1].isdigit():
            count = int(sys.argv[idx + 1])
    elif "COUNT" in os.environ and os.environ["COUNT"].isdigit():
        count = int(os.environ["COUNT"])
    
    main(count=count)
