#!/usr/bin/env python3
"""
Blog Validation Script
======================
Validates all .md blog posts in src/content/blog/ for:
- Complete YAML frontmatter with required fields
- Valid dates
- Content length > 0
- No duplicate slugs
- Frontmatter consistency across all posts

Usage:
    python3 scripts/validate-blogs.py           # Validate all blogs

No external dependencies — uses only Python stdlib.
"""

import os, sys, re
from datetime import datetime

CONTENT_DIR = "src/content/blog"
VALID_TAGS = [
    "Backend-Architecture", "WebAssembly", "Security", "Edge-AI",
    "Cloud-Native", "Flutter", "PostgreSQL", "TypeScript",
    "React", "DevOps", "AI-ML", "Mobile", "Data", "Architecture",
    "Performance", "Testing", "Database"
]

DATE_FORMATS = ["%B %d, %Y", "%Y-%m-%d", "%b %d, %Y"]


def parse_frontmatter(filepath):
    """Parse YAML frontmatter from .md file.
    Handles: flat keys, quoted values, > block scalars, - list items.
    No external dependencies."""
    with open(filepath) as f:
        content = f.read()

    match = re.match(r'^---\s*\n(.*?)\n(?:---|\.\.\.)\s*\n(.*)', content, re.DOTALL)
    if not match:
        return None, content, "Missing YAML frontmatter (--- delimiters)"

    raw_yaml = match.group(1)
    body = match.group(2).strip()

    fm = {}
    lines = raw_yaml.split('\n')
    i = 0

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # Skip empty / comment lines
        if not stripped or stripped.startswith('#'):
            i += 1
            continue

        # Array item (starting with -) — belongs to previous key
        if stripped.startswith('- '):
            # Find the key this array belongs to
            # Walk backwards to find last defined key
            for j in range(i - 1, -1, -1):
                prev_kv = re.match(r'^([a-zA-Z_][a-zA-Z0-9_]*)\s*:', lines[j])
                if prev_kv:
                    key = prev_kv.group(1)
                    val = stripped[2:].strip().strip('"').strip("'")
                    if key not in fm:
                        fm[key] = []
                    if isinstance(fm[key], list):
                        fm[key].append(val)
                    break
            i += 1
            continue

        # Key-value pair
        kv = re.match(r'^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.*)', line)
        if kv:
            key = kv.group(1)
            val = kv.group(2).strip()

            # Block scalar (> or |)
            if val == '>':
                # Collect following indented lines
                block_lines = []
                j = i + 1
                while j < len(lines) and (lines[j].startswith('  ') or lines[j].startswith('\t')):
                    block_lines.append(lines[j].strip())
                    j += 1
                fm[key] = ' '.join(block_lines)
                i = j
                continue

            if val == '|':
                block_lines = []
                j = i + 1
                while j < len(lines) and (lines[j].startswith('  ') or lines[j].startswith('\t')):
                    block_lines.append(lines[j].strip())
                    j += 1
                fm[key] = '\n'.join(block_lines)
                i = j
                continue

            # Inline array: [item1, item2]
            if val.startswith('[') and val.endswith(']'):
                items = [v.strip().strip('"').strip("'") for v in val[1:-1].split(',') if v.strip()]
                fm[key] = items
                i += 1
                continue

            # Quoted or plain value
            val = val.strip('"').strip("'")
            if val.lower() == 'true':
                fm[key] = True
            elif val.lower() == 'false':
                fm[key] = False
            elif val == '' or val == '[]':
                # Peek ahead: if next non-empty line is an array item, init as list
                next_non_empty = None
                for j in range(i + 1, len(lines)):
                    if lines[j].strip():
                        next_non_empty = lines[j].strip()
                        break
                if next_non_empty and next_non_empty.startswith('- '):
                    fm[key] = []
                else:
                    fm[key] = ''
            else:
                # Try numeric
                try:
                    if '.' in val:
                        fm[key] = float(val)
                    else:
                        fm[key] = int(val)
                except (ValueError, TypeError):
                    fm[key] = val
            i += 1
        else:
            i += 1

    return fm, body, None


def validate_blog(filepath):
    errors = []
    warnings = []
    filename = os.path.basename(filepath)

    fm, body, err = parse_frontmatter(filepath)
    if err:
        return [f"{filename}: {err}"], []
    if fm is None:
        return [f"{filename}: Empty frontmatter"], []

    # Check required fields (support both 'tag' singular and 'tags' array)
    tag_field = (
        fm.get("tag") or
        (fm.get("tags", [])[0] if isinstance(fm.get("tags"), list) and fm["tags"] else None)
    )

    if not fm.get("slug"):
        errors.append(f"{filename}: Missing required field 'slug'")
    if not fm.get("title"):
        errors.append(f"{filename}: Missing required field 'title'")
    if not fm.get("excerpt"):
        errors.append(f"{filename}: Missing required field 'excerpt'")
    if not tag_field:
        errors.append(f"{filename}: Missing required field 'tag' (or 'tags' array with at least one item)")
    if not fm.get("date"):
        errors.append(f"{filename}: Missing required field 'date'")

    # Validate slug matches filename
    expected_slug = os.path.splitext(filename)[0]
    if fm.get("slug") and fm["slug"] != expected_slug:
        warnings.append(f"{filename}: slug '{fm['slug']}' doesn't match filename '{expected_slug}'")

    # Validate date format
    if "date" in fm:
        date_str = str(fm["date"]).strip()
        parsed = False
        for fmt in DATE_FORMATS:
            try:
                datetime.strptime(date_str, fmt)
                parsed = True
                break
            except ValueError:
                continue
        if not parsed:
            errors.append(f"{filename}: Invalid date format '{date_str}'")

    # Validate tag
    if tag_field and tag_field not in VALID_TAGS:
        warnings.append(f"{filename}: Tag '{tag_field}' not in known tags list")

    # Validate content
    if not body or len(body) < 50:
        warnings.append(f"{filename}: Very short or empty content ({len(body) if body else 0} chars)")

    # Check for non-standard image URLs
    image_refs = re.findall(r'!\[.*?\]\((https?://[^\)]+)\)', body)
    for ref in image_refs:
        if 'images.unsplash.com' not in ref and 'github.com' not in ref:
            warnings.append(f"{filename}: Non-standard image URL: {ref[:80]}")

    return errors, warnings


def main():
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    content_dir = os.path.join(project_root, CONTENT_DIR)

    if not os.path.isdir(content_dir):
        print(f"ERROR: Content directory not found: {content_dir}")
        sys.exit(1)

    all_errors = []
    all_warnings = []
    valid_count = 0

    md_files = sorted([f for f in os.listdir(content_dir) if f.endswith('.md')])
    print(f"Validating {len(md_files)} blog posts in {CONTENT_DIR}/\n")

    for fname in md_files:
        filepath = os.path.join(content_dir, fname)
        errors, warnings = validate_blog(filepath)
        all_errors.extend(errors)
        all_warnings.extend(warnings)
        if not errors:
            valid_count += 1

    # Check for duplicate slugs
    slugs = []
    for fname in md_files:
        filepath = os.path.join(content_dir, fname)
        fm, _, _ = parse_frontmatter(filepath)
        if fm and "slug" in fm:
            if fm["slug"] in slugs:
                all_errors.append(f"DUPLICATE slug '{fm['slug']}' in {fname}")
            slugs.append(fm["slug"])

    # Summary
    print(f"  {valid_count}/{len(md_files)} posts valid\n")

    if all_warnings:
        print("Warnings:")
        for w in all_warnings:
            print(f"  ⚠️  {w}")
        print()

    if all_errors:
        print("Errors:")
        for e in all_errors:
            print(f"  ❌  {e}")
        print(f"\n❌  {len(all_errors)} error(s) found")
        sys.exit(1)
    else:
        print("✅  All blog posts validated successfully!")
        sys.exit(0)


if __name__ == "__main__":
    main()
