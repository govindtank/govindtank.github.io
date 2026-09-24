#!/usr/bin/env python3
"""
Generate and assign clean, minimal, non-cluttered SVG architecture & code cover cards
to every blog post across the site.
"""
import os, re, sys
from svg_card_generator import save_svg_for_post
from image_matcher import detect_theme

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../.."))
CONTENT_DIR = f"{ROOT}/src/content/blog"
COVERS_DIR = f"{ROOT}/public/covers"

def main():
    if not os.path.exists(CONTENT_DIR):
        print(f"Error: {CONTENT_DIR} not found")
        sys.exit(1)

    os.makedirs(COVERS_DIR, exist_ok=True)
    posts = []
    
    for fn in sorted(os.listdir(CONTENT_DIR)):
        if not fn.endswith(".md"):
            continue
        path = os.path.join(CONTENT_DIR, fn)
        text = open(path, encoding="utf-8").read()
        cat = re.search(r'^category:\s*"([^"]+)"', text, re.M)
        cov = re.search(r'^coverImage:\s*"([^"]+)"', text, re.M)
        title = re.search(r'^title:\s*"([^"]+)"', text, re.M)
        exc = re.search(r'^excerpt:\s*(?:>)?\s*"?([^\n"]+)"?', text, re.M)
        slug = fn[:-3]
        
        posts.append({
            "slug": slug,
            "filename": fn,
            "title": title.group(1) if title else slug,
            "category": cat.group(1) if cat else "Architecture",
            "desc": exc.group(1) if exc else "",
            "old_cover": cov.group(1) if cov else "",
            "content": text
        })

    print(f"Processing {len(posts)} posts for SVG card generation...")
    updated_count = 0

    for post in posts:
        theme = detect_theme(category=post["category"], title=post["title"], desc=post["desc"], content=post["content"])
        svg_url = save_svg_for_post(
            slug=post["slug"],
            title=post["title"],
            category=post["category"],
            desc=post["desc"],
            theme=theme,
            content=post["content"],
            output_dir=COVERS_DIR
        )

        path = os.path.join(CONTENT_DIR, post["filename"])
        text = post["content"]
        
        if 'coverImage:' in text:
            new_text = re.sub(r'^coverImage:\s*"([^"]*)"', f'coverImage: "{svg_url}"', text, count=1, flags=re.M)
        else:
            new_text = re.sub(r'^(---[\s\S]*?)(---)', f'\\1coverImage: "{svg_url}"\n\\2', text, count=1)

        if text != new_text:
            with open(path, "w", encoding="utf-8") as f:
                f.write(new_text)
            updated_count += 1
            print(f"  ✓ [{theme:22s}] {post['slug'][:45]:48s} -> {svg_url}")

    print(f"\nDone! Generated {len(posts)} SVG cards. Updated frontmatter on {updated_count} posts.")

if __name__ == "__main__":
    main()
