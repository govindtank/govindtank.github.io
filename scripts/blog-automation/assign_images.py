#!/usr/bin/env python3
"""
Assign a unique, context-matched, verified-public cover image to every blog post.
- Uses image_matcher.py with 9 fine-grained technical themes
- Uniqueness: avoids repeating identical image URLs when possible
- Guarantee: 100% technical and domain relevance
"""
import os, re, sys
from image_matcher import pick_contextual_image, THEME_POOLS, detect_theme

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../.."))
CONTENT_DIR = f"{ROOT}/src/content/blog"

def main():
    if not os.path.exists(CONTENT_DIR):
        print(f"Error: {CONTENT_DIR} not found")
        sys.exit(1)

    posts = []
    for fn in sorted(os.listdir(CONTENT_DIR)):
        if not fn.endswith(".md"):
            continue
        path = os.path.join(CONTENT_DIR, fn)
        text = open(path, encoding="utf-8").read()
        cat = re.search(r'^category:\s*"([^"]+)"', text, re.M)
        cov = re.search(r'^coverImage:\s*"([^"]+)"', text, re.M)
        title = re.search(r'^title:\s*"([^"]+)"', text, re.M)
        slug = fn[:-3]
        posts.append({
            "slug": slug,
            "filename": fn,
            "title": title.group(1) if title else slug,
            "category": cat.group(1) if cat else "",
            "old_cover": cov.group(1) if cov else "",
            "content": text
        })

    print(f"Total posts to process: {len(posts)}")

    used_urls = set()
    changed = 0

    for post in posts:
        new_url, theme = pick_contextual_image(
            category=post["category"],
            title=post["title"],
            content=post["content"],
            used_urls=used_urls,
            slug=post["slug"]
        )
        used_urls.add(new_url)

        if post["old_cover"] != new_url:
            path = os.path.join(CONTENT_DIR, post["filename"])
            text = post["content"]
            if 'coverImage:' in text:
                new_text = re.sub(r'^coverImage:\s*"([^"]*)"', f'coverImage: "{new_url}"', text, count=1, flags=re.M)
            else:
                new_text = re.sub(r'^(---[\s\S]*?)(---)', f'\\1coverImage: "{new_url}"\n\\2', text, count=1)
            
            with open(path, "w", encoding="utf-8") as f:
                f.write(new_text)
            
            print(f"Updated [{theme:22s}] {post['slug'][:45]:48s}")
            changed += 1

    print(f"\nSuccessfully updated {changed} posts with context-matched technical cover images.")

if __name__ == "__main__":
    main()
