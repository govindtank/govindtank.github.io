#!/usr/bin/env python3
"""
Update all blog frontmatters to use generated local cover images.
Replaces Unsplash URLs with /images/covers/{slug}.png
"""
import os, re, sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../.."))
CONTENT_DIR = f"{ROOT}/src/content/blog"

updated = 0
for fn in sorted(os.listdir(CONTENT_DIR)):
    if not fn.endswith(".md"):
        continue
    slug = fn[:-3]
    path = os.path.join(CONTENT_DIR, fn)
    text = open(path).read()
    
    # Check if already using local cover
    if f'/images/covers/{slug}.png' in text:
        continue
    
    # Replace any existing coverImage line with local cover
    new_cover = f'/images/covers/{slug}.png'
    new_text = re.sub(
        r'^coverImage:\s*".*"$',
        f'coverImage: "{new_cover}"',
        text,
        count=1,
        flags=re.M
    )
    
    if new_text != text:
        open(path, "w").write(new_text)
        print(f"  Updated: {slug}")
        updated += 1
    else:
        # No coverImage line found - add one after title or at end of frontmatter
        # Find end of frontmatter (second ---)
        parts = text.split('---', 2)
        if len(parts) >= 3:
            frontmatter = parts[1]
            rest = parts[2]
            # Insert coverImage after title
            if 'title:' in frontmatter:
                new_fm = re.sub(
                    r'^(title:.*?)$',
                    f'\\1\ncoverImage: "{new_cover}"',
                    frontmatter,
                    count=1,
                    flags=re.M
                )
                new_text = f'---{new_fm}---{rest}'
                open(path, "w").write(new_text)
                print(f"  Added cover: {slug}")
                updated += 1
            else:
                print(f"  SKIP (no title): {slug}")

print(f"\nTotal updated: {updated}")