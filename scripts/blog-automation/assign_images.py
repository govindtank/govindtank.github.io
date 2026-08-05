#!/usr/bin/env python3
"""
Assign a unique, verified-public cover image to every blog post.
- Pool: scripts/blog-automation/verified_images.json (all URLs curl-verified 200 + image/*)
- Uniqueness: a URL is never used twice across the whole site
- Category bucketing: posts get topic-relevant images when possible
- Deterministic: same slug -> same image (stable across runs)
"""
import json, os, re, hashlib, sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../.."))
CONTENT_DIR = f"{ROOT}/src/content/blog"
POOL_FILE = f"{ROOT}/scripts/blog-automation/verified_images.json"

# Theme buckets: photo IDs grouped by visual subject (subset of the verified pool)
THEMES = {
    "code": ["1461749280684", "1517180102446", "1522071820081", "1504384308090",
             "1519389950473", "1526628953301", "1516321318423", "1547658719",
             "1550547660", "1571171637578", "1498050108023", "1587620962725",
             "1534972195531", "1555949963", "1518770660439", "1550745165",
             "1522199755839", "1555066931", "1556761175", "1557804506",
             "1552664730", "1542744173", "1510915228340", "1522542550221"],
    "ai": ["1620712943543", "1551288049", "1677442136019", "1550751827",
           "1563986768609", "1573164713988", "1515879218367", "1531297484001",
           "1504639725590", "1544197150", "1550439062", "1611974789855",
           "1485827404703", "1559526324", "1593642632823"],
    "data": ["1551288049", "1550439062", "1504868584819", "1504639725590",
             "1553877522", "1551650975", "1564865878688", "1551288049"],
    "cloud": ["1451187580459", "1558494949", "1454165804606", "1508830524289",
              "1484417894907", "1499951360447", "1541462608143", "1564865878688",
              "1614064641938", "1620121692029", "1517694712202", "1558494949"],
    "mobile": ["1526374965328", "1511707171634", "1510557880182", "1580910051074",
               "1606220945770", "1512941937669", "1522252234503", "1526401485004"],
    "workspace": ["1486406146926", "1497366216548", "1497366811353", "1524758631624",
                  "1499750310107", "1553877522", "1552664730", "1542744173",
                  "1556761175", "1557804506", "1551650975", "1522199755839",
                  "1559526324", "1593642632823", "1510915228340", "1522542550221"],
}

# Category -> theme mapping (post categories seen on the site)
CATEGORY_THEME = {
    "Flutter": "mobile", "Mobile": "mobile", "Kotlin-Multiplatform": "mobile",
    "Web-Dev": "code", "WebAssembly": "code", "Systems": "code",
    "DevTools": "code", "DevEx": "code", "Backend-Architecture": "code",
    "AI": "ai", "AI-Engineering": "ai", "AI-ML": "ai", "AI-Agents": "ai",
    "Agentic-AI": "ai", "Edge-AI": "ai",
    "Data-Engineering": "data", "Databases": "data", "Observability": "data",
    "Security": "cloud", "Cloud-Native": "cloud", "DevOps": "cloud",
    "Architecture": "workspace",
}

def extract_photo_id(url):
    m = re.search(r"photo-(\d+)-", url)
    return m.group(1) if m else url

def load_pool():
    with open(POOL_FILE) as f:
        return json.load(f)  # parse real JSON, not raw lines

def assign(posts, pool):
    """posts: list of (slug, category, old_cover). Returns dict slug -> new url."""
    by_theme = {}
    for u in pool:
        by_theme.setdefault(extract_photo_id(u), u)
    used = set()          # photo IDs already assigned
    assigned = {}

    # Build per-theme ordered lists of unused photos, stable order
    for slug, category, _ in posts:
        theme = CATEGORY_THEME.get(category, "workspace")
        theme_ids = THEMES.get(theme, THEMES["workspace"])
        # stable per-slug rotation within its theme
        h = int(hashlib.md5(slug.encode()).hexdigest(), 16)
        cands = [i for i in theme_ids if i not in used]
        if not cands:
            cands = [i for i in [extract_photo_id(u) for u in pool] if i not in used]
        if not cands:
            raise RuntimeError("pool exhausted")
        pid = cands[h % len(cands)]
        used.add(pid)
        assigned[slug] = by_theme[pid]
    return assigned

def main():
    posts = []
    for fn in sorted(os.listdir(CONTENT_DIR)):
        if not fn.endswith(".md"):
            continue
        path = os.path.join(CONTENT_DIR, fn)
        text = open(path).read()
        cat = re.search(r'^category:\s*"([^"]+)"', text, re.M)
        cov = re.search(r'^coverImage:\s*"([^"]+)"', text, re.M)
        slug = fn[:-3]
        posts.append((slug, cat.group(1) if cat else "", cov.group(1) if cov else ""))
    print(f"Posts: {len(posts)}, pool: {len(load_pool())}")

    assigned = assign(posts, load_pool())
    changed = 0
    for slug, _, old in posts:
        new = assigned[slug]
        if old == new:
            continue
        path = os.path.join(CONTENT_DIR, slug + ".md")
        text = open(path).read()
        new_text = re.sub(r'^coverImage:\s*"([^"]*)"',
                          f'coverImage: "{new}"', text, count=1, flags=re.M)
        open(path, "w").write(new_text)
        print(f"  {slug[:50]:52s} {extract_photo_id(old)[:14]} -> {extract_photo_id(new)[:14]}")
        changed += 1
    print(f"\nUpdated {changed} posts. Remaining pool: {len(load_pool()) - len(set(assigned.values()))}")

if __name__ == "__main__":
    main()
