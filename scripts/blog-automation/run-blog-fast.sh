#!/bin/bash
set -euo pipefail

REPO="/Users/govind/hermes_projects/govindtank.github.io"
LOG="/tmp/blog-fast-cron.log"
LOCK="/tmp/blog-fast-cron.lock"
mkdir -p "$(dirname "$LOG")"

# Prevent concurrent runs
if [ -f "$LOCK" ]; then
  echo "[$(date '+%F %T')] another run is active, skipping" >> "$LOG"
  exit 0
fi
echo $$ > "$LOCK"
trap 'rm -f "$LOCK"' EXIT INT TERM

cd "$REPO"

# 1) Sync with remote without approval prompts
git fetch origin || true
git merge --ff-only origin/main || {
  echo "[$(date '+%F %T')] ff-only merge failed, trying rebase" >> "$LOG"
  git rebase origin/main || true
}

# 2) Quick LLM health check
echo "[$(date '+%F %T')] checking LLM health" >> "$LOG"
LLM_HEALTHY=0
python3 - <<'PY' >> "$LOG" 2>&1
import urllib.request, json, sys
try:
    req = urllib.request.Request(
        "http://127.0.0.1:1234/v1/chat/completions",
        data=json.dumps({"model":"qwen/qwen3.5-9b","messages":[{"role":"user","content":"ping"}],"max_tokens":5}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=8) as resp:
        data = json.loads(resp.read().decode())
        if "choices" in data and data["choices"]:
            print("LLM_HEALTHY=1")
        else:
            print("LLM_HEALTHY=0")
except Exception as e:
    print(f"LLM_HEALTHY=0")
PY

if grep -q "LLM_HEALTHY=1" "$LOG"; then
  echo "[$(date '+%F %T')] LLM healthy, attempting generation" >> "$LOG"
  python3 - <<'PY' >> "$LOG" 2>&1
import subprocess, sys, datetime

log_path = "/tmp/blog-fast-cron.log"
start = datetime.datetime.now()
try:
    result = subprocess.run(
        ["python3", "scripts/blog-automation/blog_automation_qwen.py",
         "--run-id", "cron-morning-" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S")],
        cwd="/Users/govind/hermes_projects/govindtank.github.io",
        capture_output=True,
        text=True,
        timeout=90,
    )
    print(result.stdout)
    if result.stderr:
        print(result.stderr, file=sys.stderr)
    print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] qwen run completed with code {result.returncode}")
except subprocess.TimeoutExpired:
    print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] qwen run timed out after 90s")
except Exception as e:
    print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] qwen run error: {e}")
PY
else
  echo "[$(date '+%F %T')] LLM not healthy, skipping qwen path" >> "$LOG"
fi

# 3) If LLM path did not produce a new blog, use fast manual fallback
if ! grep -q "WROTE /Users/govind/hermes_projects/govindtank.github.io/src/content/blog/" "$LOG"; then
  echo "[$(date '+%F %T')] falling back to manual post generation" >> "$LOG"
  python3 - <<'PY' >> "$LOG" 2>&1
import json, os, re, datetime, random
ROOT = "/Users/govind/hermes_projects/govindtank.github.io"
CONTENT = os.path.join(ROOT, "src/content/blog")
POOL = os.path.join(ROOT, "scripts/blog-automation/verified_images.json")
existing = {f[:-3] for f in os.listdir(CONTENT) if f.endswith(".md")}
TOPICS = [
    ("Agentic AI Development: From Chat Assistants to Autonomous Coding Agents","AI-Engineering"),
    ("MCP in Practice: Model Context Protocol for Real-World Developer Tools","AI-Engineering"),
    ("On-Device AI with NPUs: Running Models on Phone Silicon in 2026","Mobile-AI"),
    ("Compose Multiplatform for iOS: Is Shared UI Production-Ready in 2026","Kotlin"),
    ("Kotlin 2.x and the K2 Compiler: What It Unlocked for Android Developers","Kotlin"),
    ("Flutter Beyond Mobile: Desktop, Web, and Embedded Targets in 2026","Flutter"),
    ("AI-Native App Architecture: Designing Applications Around LLM Calls","AI-Engineering"),
    ("Local-First Applications: Sync Engines, CRDTs, and Offline-First UX","Architecture"),
    ("RAG in Production: Practical Retrieval Patterns Beyond the Demo","AI-ML"),
    ("Android 17 and the Modern Android Stack: What Changed in 2026","Android"),
    ("Building Developer Tools in 2026: From CLI Design to AI-Assisted Extensions","DevTools"),
    ("Dart 4 and the Evolution of the Flutter Ecosystem: What's New in 2026","Flutter"),
    ("WebAssembly in 2026: From Browser to Edge Computing and Beyond","WebAssembly"),
    ("Zero-Trust Architecture: Implementing Security in Distributed Cloud Systems","Security"),
    ("Edge AI: Running Large Language Models on Consumer Devices in 2026","Edge-AI"),
    ("React Server Components: Production Patterns for High-Performance Web Apps","Web-Dev"),
    ("Data Engineering at Scale: Building Real-Time Streaming Pipelines","Data-Engineering"),
    ("PostgreSQL 18 and the Rise of Hybrid Transactional-Analytical Processing","Databases"),
    ("Event Sourcing and CQRS: Practical Patterns for Distributed Systems","Architecture"),
    ("Platform Engineering: Building Internal Developer Portals That Teams Love","DevEx"),
]
random.shuffle(TOPICS)

def slugify(title):
    slug = title.lower().strip()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    return slug.strip('-')

topic = None
for t, tag in TOPICS:
    if slugify(t) not in existing:
        topic = (t, tag)
        break
if topic is None:
    print("No unused topics")
    raise SystemExit(0)
title, tag = topic
slug = slugify(title)
used = set()
for fn in os.listdir(CONTENT):
    if not fn.endswith(".md"):
        continue
    m = re.search(r'^coverImage:\s*"([^"]+)"', open(os.path.join(CONTENT, fn)).read(), re.M)
    if m:
        used.add(m.group(1))
pool = json.load(open(POOL))
avail = [u for u in pool if u not in used]
image = avail[0] if avail else pool[0]
body = f"""# {title}

## Why this keeps happening
I keep seeing teams pick tools before they understand the actual constraint. The hard part is not the API surface. It is the behavior that only shows up once you move past the demo.

## What actually changed in 2026
The ecosystem matured in a boring, useful way. Adoption shifted from experimental to operational. That means the winning choices are now the ones with better debugging, migration paths, and error handling, not the ones with the best launch keynote.

## A minimal mental model
Instead of memorizing every option, think in terms of boundaries. Where does data cross a trust boundary? Where does it need to survive a restart? Where does it need to be read by two systems at once? Most architecture decisions collapse once those three questions are answered.

## The implementation
Start with the simplest representation that preserves those boundaries. If you do not need a distributed log, do not start with one. If you do not need eventual consistency, do not pay for it. The code below is intentionally small because the real complexity is in the contracts, not the syntax.

```python
from dataclasses import dataclass
from typing import Protocol

@dataclass
class Task:
    id: str
    payload: dict
    attempts: int = 0

class Store(Protocol):
    def put(self, task: Task) -> None: ...
    def get(self) -> Task | None: ...
    def ack(self, task_id: str) -> None: ...
```

## What usually breaks
- Latency assumptions. Local tests lie.
- Retry storms. Unlimited retries make outages worse.
- Schema drift. Consumers and producers do not upgrade together.
- Partial failures. The easy path succeeded, but the audit log did not.

## How to decide
Pick the option with fewer failure modes for your specific access pattern. If your workload is write-heavy and latency-sensitive, you need different guarantees than if it is batch-oriented and throughput-focused. Do not let marketing categories substitute for workload analysis.

## Where this is heading
The next interesting shift is toward adaptive boundaries. Systems that can change their consistency and durability guarantees at runtime, based on actual load and failure signals, instead of choosing one mode at startup. That is the real frontier.
"""
date_str = datetime.date.today().strftime("%B %d, %Y")
excerpt = re.sub(r'\s+', ' ', body.split('\n\n',1)[1] if '\n\n' in body else body).strip()[:197] + "..."
path = os.path.join(CONTENT, f"{slug}.md")
with open(path, "w") as f:
    f.write(f"""---
title: "{title}"
slug: "{slug}"
date: "{date_str}"
excerpt: >
  {excerpt}
coverImage: "{image}"
category: "{tag}"
readTime: 7
tags:
  - "{tag}"
---

""")
    f.write(body.lstrip('\n'))
print(f"WROTE {path}")
PY

  git add -A
  git commit -m "blog: fallback post $(date +%Y-%m-%d)" || true
  git push origin main || true
fi

# 4) Final status line for cron logs
echo "[$(date '+%F %T')] blog cron completed" >> "$LOG"
