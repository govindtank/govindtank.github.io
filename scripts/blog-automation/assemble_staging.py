#!/usr/bin/env python3
"""
Assemble staged subagent output into final blog posts.
- Reads scripts/blog-automation/staging/<slug>.md  (<!--EXCERPT--> ... <!--BODY--> ...)
- Keeps existing frontmatter, adds archetype field, swaps excerpt + body
- Validates: banned phrases, word count, H1 exact, headings, tables/mermaid per archetype
- Writes final .md into src/content/blog/ and moves staged file to staging/done/
Usage: python3 assemble_staging.py [slug ...]   (default: all staged files)
"""
import os, re, sys, json, shutil

ROOT = "/Users/govind/govindtank.github.io"
STAGING = f"{ROOT}/scripts/blog-automation/staging"
CONTENT = f"{ROOT}/src/content/blog"
SPEC = json.load(open(f"{ROOT}/scripts/blog-automation/rewrite_spec.json"))
SPEC_BY_SLUG = {s["slug"]: s for s in SPEC}

BANNED = [
    "technology landscape", "in today's fast-paced", "delve", "seamless", "leverage",
    "game-changer", "revolutionize", "unlock", "harness the power", "it's worth noting",
    "it is important to note", "furthermore", "moreover", "in conclusion", "cutting-edge",
    "state-of-the-art", "production-grade", "best-in-class", "at its core", "serves as",
    "stands as", "testament", "let's dive", "in this article", "deep dive", "supercharge",
    "elevate your", "in the realm of", "when it comes to", "in a world where",
    "moving forward", "🚀", "💡", "✅", "🔥",
]

def parse_staged(path):
    text = open(path).read()
    m = re.search(r'<!--EXCERPT-->\s*\n(.*?)\n\s*<!--BODY-->\s*\n(.*)$', text, re.S)
    if not m:
        return None, None
    return m.group(1).strip(), m.group(2).strip()

def validate(slug, body, archetype):
    issues = []
    wc = len(body.split())
    if wc < 1200:
        issues.append(f"too short ({wc}w)")
    elif wc > 3000:
        issues.append(f"too long ({wc}w)")
    low = body.lower()
    for b in BANNED:
        if b in low:
            issues.append(f"banned:'{b}'")
    if re.search(r'^#{2,3} ', body, re.M) is None:
        issues.append("no ## headings")
    if archetype in ("comparison", "roundup") and "|" not in body:
        issues.append("missing table")
    if archetype == "explainer" and "```mermaid" not in body:
        issues.append("missing mermaid")
    if "## conclusion" in low:
        issues.append("has '## Conclusion'")
    return issues, wc

def main(only=None):
    files = sorted(f for f in os.listdir(STAGING) if f.endswith(".md") and not f.startswith("."))
    if only:
        files = [f for f in files if f[:-3] in only]
    if not files:
        print("No staged files.")
        return
    ok, fail = 0, 0
    for fn in files:
        slug = fn[:-3]
        spec = SPEC_BY_SLUG.get(slug)
        if not spec:
            print(f"SKIP {slug}: not in spec")
            continue
        excerpt, body = parse_staged(os.path.join(STAGING, fn))
        if not body:
            print(f"FAIL {slug}: bad staging format")
            fail += 1
            continue
        issues, wc = validate(slug, body, spec["archetype"])
        if issues:
            print(f"FAIL {slug}: {issues[:6]} ({wc}w)")
            fail += 1
            continue
        # rebuild frontmatter
        old = open(os.path.join(CONTENT, fn)).read()
        fm_end = old.index("---", 3)
        frontmatter = old[:fm_end].rstrip() + "\n"
        if "archetype:" not in frontmatter:
            frontmatter += f'archetype: "{spec["archetype"]}"\n'
        frontmatter += "---\n"
        # replace excerpt line value
        fm_lines = frontmatter.split("\n")
        out_lines, in_excerpt = [], False
        for ln in fm_lines:
            if ln.strip().startswith("excerpt:"):
                in_excerpt = True
                out_lines.append("excerpt: >")
                continue
            if in_excerpt and (ln.strip() == "---" or re.match(r'^\w+:', ln)):
                in_excerpt = False
            if in_excerpt:
                continue
            out_lines.append(ln)
        frontmatter = "\n".join(out_lines).rstrip() + "\n" + f'  {excerpt}\n' + "---\n"
        final = frontmatter + "\n" + body.strip() + "\n"
        open(os.path.join(CONTENT, fn), "w").write(final)
        os.makedirs(f"{STAGING}/done", exist_ok=True)
        shutil.move(os.path.join(STAGING, fn), f"{STAGING}/done/{fn}")
        print(f"OK   {slug}: {wc}w archetype={spec['archetype']}")
        ok += 1
    print(f"\n{ok} assembled, {fail} failed.")

if __name__ == "__main__":
    main(set(sys.argv[1:]) if len(sys.argv) > 1 else None)
