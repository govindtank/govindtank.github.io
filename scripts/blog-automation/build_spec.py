#!/usr/bin/env python3
"""Build rewrite_spec.json: per-post archetype/persona assignment for the 36 existing posts.
Archetypes are round-robin across posts sorted by date (no two consecutive posts share one).
"""
import os, re, json

CONTENT_DIR = "/Users/govind/govindtank.github.io/src/content/blog"
OUT = "/Users/govind/govindtank.github.io/scripts/blog-automation/rewrite_spec.json"
ARCHETYPES = ["tutorial", "comparison", "explainer", "war-story", "roundup", "opinion"]
PERSONAS = [
    "senior engineer, 12+ years, burned by over-engineering, plain-spoken, first person",
    "curious tinkerer, prototypes everything, enthusiastic but precise, first person",
    "pragmatic staff engineer, skeptical, values simple boring solutions, first person",
]

posts = []
for fn in os.listdir(CONTENT_DIR):
    if not fn.endswith(".md"):
        continue
    text = open(os.path.join(CONTENT_DIR, fn)).read()
    def g(key):
        m = re.search(rf'^{key}:\s*"?([^"\n]+)"?', text, re.M)
        return m.group(1).strip() if m else ""
    posts.append({"slug": fn[:-3], "title": g("title"), "category": g("category"),
                  "date": g("date"), "coverImage": g("coverImage")})

posts.sort(key=lambda p: p["date"])
spec = []
for i, p in enumerate(posts):
    p["archetype"] = ARCHETYPES[i % len(ARCHETYPES)]
    p["persona"] = PERSONAS[i % len(PERSONAS)]
    p["word_target"] = "1400-1800"
    spec.append(p)

json.dump(spec, open(OUT, "w"), indent=1)
print(f"{len(spec)} posts in spec -> {OUT}")
# sanity: show first 8 assignments
for s in spec[:8]:
    print(f"  {s['date'][:10]} | {s['archetype']:10s} | {s['slug'][:55]}")
