#!/usr/bin/env python3
"""
Generate unique, blog-contextual cover images using Pillow.
- Deterministic per slug (same slug = same image, stable across runs)
- Dark cyberpunk gradient + topic-relevant geometric patterns
- Blog title overlaid at bottom
- Falls back gracefully if fonts are missing
Output: public/images/covers/{slug}.png  (1200x630, OpenGraph optimal)
"""
import os, sys, json, hashlib, math, re
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../.."))
OUTPUT_DIR = f"{ROOT}/public/images/covers"
os.makedirs(OUTPUT_DIR, exist_ok=True)

W, H = 1200, 630  # OpenGraph recommended

# ─── Color palettes per topic category ───────────────────────────────────────
TOPIC_PALETTES = {
    "ai": [
        ((15, 10, 35), (40, 10, 80)),       # deep indigo → purple
        ((10, 25, 60), (20, 80, 120)),      # dark blue → cyan
    ],
    "flutter": [
        ((10, 30, 60), (20, 100, 160)),     # dark navy → sky blue
        ((20, 10, 50), (60, 20, 120)),      # deep purple → violet
    ],
    "kotlin": [
        ((30, 10, 15), (100, 30, 50)),     # near-black → crimson
        ((10, 25, 55), (30, 80, 130)),     # dark blue → steel blue
    ],
    "android": [
        ((10, 30, 20), (30, 100, 60)),     # dark green → emerald
        ((15, 20, 10), (50, 80, 30)),      # dark forest → green
    ],
    "web": [
        ((10, 15, 40), (40, 60, 130)),     # dark navy → cornflower
        ((20, 10, 45), (80, 40, 130)),    # dark purple → magenta
    ],
    "cloud": [
        ((5, 20, 40), (20, 60, 110)),      # near-black → ocean blue
        ((15, 25, 30), (50, 90, 120)),    # dark slate → steel
    ],
    "data": [
        ((5, 15, 35), (20, 60, 110)),      # dark blue → azure
        ((10, 25, 20), (30, 90, 70)),     # dark teal → cyan-green
    ],
    "architecture": [
        ((10, 15, 30), (40, 60, 100)),    # dark navy → slate
        ((20, 20, 40), (70, 70, 130)),    # dark purple → lavender
    ],
    "security": [
        ((25, 5, 5), (100, 20, 20)),       # near-black → dark red
        ((10, 20, 30), (40, 80, 100)),    # dark slate → steel
    ],
    "default": [
        ((10, 15, 35), (40, 60, 110)),    # dark navy → blue
        ((15, 10, 40), (60, 40, 130)),    # dark purple → violet
    ],
}

def get_topic_key(slug):
    """Map a slug to its topic category for palette selection."""
    slug_lower = slug.lower()
    if any(k in slug_lower for k in ["ai-", "agent", "llm", "gpt", "llm", "chatgpt", "claude", "openai"]):
        return "ai"
    if any(k in slug_lower for k in ["flutter", "dart"]):
        return "flutter"
    if any(k in slug_lower for k in ["kotlin", "k2-compiler"]):
        return "kotlin"
    if any(k in slug_lower for k in ["android", "jetpack", "compose"]):
        return "android"
    if any(k in slug_lower for k in ["web-", "react", "vue", "css", "html", "frontend"]):
        return "web"
    if any(k in slug_lower for k in ["cloud", "kubernetes", "k8s", "devops", "docker", "aws", "gcp", "azure"]):
        return "cloud"
    if any(k in slug_lower for k in ["data", "database", "postgres", "mysql", "mongodb", "sql", "stream", "flink", "kafka"]):
        return "data"
    if any(k in slug_lower for k in ["arch", "microservice", "cqrs", "event-sourcing", "system-design"]):
        return "architecture"
    if any(k in slug_lower for k in ["security", "auth", "oauth", "zero-trust", "encryption"]):
        return "security"
    return "default"


# ─── Geometric pattern generators ─────────────────────────────────────────────
def draw_ai_network(draw, W, H, seed):
    """Draw neural-network-style connected nodes."""
    rng = __import__("random")
    rng.seed(seed)
    nodes = [(rng.randint(50, W-50), rng.randint(50, H-200), rng.randint(3, 8))
             for _ in range(rng.randint(12, 20))]
    # Draw edges first
    for i, (x1, y1, r1) in enumerate(nodes):
        for x2, y2, r2 in nodes[i+1:]:
            dist = math.hypot(x2-x1, y2-y1)
            if dist < 250:
                alpha = max(0, int(180 * (1 - dist/250)))
                col = (80, 120, 255, alpha)
                draw.line([(x1, y1), (x2, y2)], fill=col, width=1)
    # Draw nodes
    for x, y, r in nodes:
        col = (120, 160, 255)
        draw.ellipse([x-r, y-r, x+r, y+r], fill=col)
        draw.ellipse([x-r//2, y-r//2, x+r//2, y+r//2], fill=(200, 220, 255))


def draw_circuit_board(draw, W, H, seed):
    """Draw circuit-board-style traces."""
    rng = __import__("random")
    rng.seed(seed)
    # Horizontal and vertical traces
    for _ in range(rng.randint(8, 15)):
        x = rng.randint(0, W)
        y = rng.randint(0, H-200)
        length = rng.randint(80, 300)
        horizontal = rng.choice([True, False])
        col = (60, 180, 120, 160)
        if horizontal:
            draw.line([(x, y), (x+length, y)], fill=col, width=2)
            draw.rectangle([x+length-4, y-4, x+length+4, y+4], fill=(60, 220, 160))
        else:
            draw.line([(x, y), (x, y+length)], fill=col, width=2)
            draw.rectangle([x-4, y+length-4, x+4, y+length+4], fill=(60, 220, 160))


def draw_hex_grid(draw, W, H, seed):
    """Draw a hexagonal grid pattern."""
    rng = __import__("random")
    rng.seed(seed)
    cols = ["ai", "kotlin", "android", "web", "cloud", "data", "architecture", "default"]
    palette = {c: (rng.randint(40,100), rng.randint(80,200), rng.randint(120,255)) for c in cols}
    key = cols[seed % len(cols)]
    base_col = palette[key]
    hex_size = 40
    for row in range(-2, H // (hex_size * 3 // 2) + 2):
        for col in range(-2, W // (hex_size * 2) + 2):
            x = col * hex_size * 2 + (row % 2) * hex_size
            y = row * int(hex_size * 1.73)
            # Draw hexagon
            points = [
                (x + hex_size * math.cos(math.radians(a)), y + hex_size * math.sin(math.radians(a)))
                for a in range(0, 360, 60)
            ]
            draw.polygon(points, outline=base_col, width=1)


def draw_data_streams(draw, W, H, seed):
    """Draw data stream / flowing lines pattern."""
    rng = __import__("random")
    rng.seed(seed)
    num_streams = rng.randint(5, 10)
    for s in range(num_streams):
        x = rng.randint(0, W)
        points = [(x, 0)]
        y = 0
        while y < H - 200:
            y += rng.randint(20, 60)
            x += rng.randint(-40, 40)
            x = max(0, min(W, x))
            points.append((x, y))
        col = (40, 120 + s*12, 200 - s*10, 150)
        draw.line(points, fill=col, width=rng.randint(1, 3))


def draw_geometric_blocks(draw, W, H, seed):
    """Draw abstract geometric blocks / floating rectangles."""
    rng = __import__("random")
    rng.seed(seed)
    for _ in range(rng.randint(10, 20)):
        x = rng.randint(0, W)
        y = rng.randint(0, H-200)
        w = rng.randint(40, 180)
        h = rng.randint(30, 120)
        col = (rng.randint(40, 120), rng.randint(60, 160), rng.randint(100, 220), 120)
        draw.rectangle([x, y, x+w, y+h], outline=col, width=1)
        # Inner accent
        draw.rectangle([x+4, y+4, x+w//2, y+h//2], fill=col)


PATTERNS = {
    "ai":        draw_ai_network,
    "flutter":   draw_circuit_board,
    "kotlin":    draw_circuit_board,
    "android":   draw_geometric_blocks,
    "web":       draw_geometric_blocks,
    "cloud":     draw_data_streams,
    "data":      draw_data_streams,
    "architecture": draw_hex_grid,
    "security":  draw_circuit_board,
    "default":   draw_hex_grid,
}


# ─── Font helpers ─────────────────────────────────────────────────────────────
FONT_CACHE = {}
def get_font(size, bold=False):
    key = (size, bold)
    if key in FONT_CACHE:
        return FONT_CACHE[key]
    candidates = [
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/HelveticaNeue.ttc",
        "/System/Library/Fonts/ヒラギノ角ゴシック W7.ttc",
        "/System/Library/Fonts/Arial Unicode.ttf",
        "/System/Library/Fonts/SFNSMono.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                font = ImageFont.truetype(path, size)
                FONT_CACHE[key] = font
                return font
            except Exception:
                pass
    FONT_CACHE[key] = ImageFont.load_default()
    return FONT_CACHE[key]


def wrap_text(text, font, max_width, draw):
    """Wrap text to fit within max_width pixels."""
    words = text.split()
    lines, current = [], ""
    for word in words:
        test = (current + " " + word).strip()
        if draw.textlength(test, font=font) <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


# ─── Main image generator ─────────────────────────────────────────────────────
def generate_cover(slug, title, output_path=None):
    """Generate a deterministic cover image for a blog post."""
    if output_path is None:
        output_path = f"{OUTPUT_DIR}/{slug}.png"

    # Deterministic seed from slug
    seed = int(hashlib.md5(slug.encode()).hexdigest(), 16)

    # Select palette
    topic = get_topic_key(slug)
    palettes = TOPIC_PALETTES.get(topic, TOPIC_PALETTES["default"])
    (c1_r, c1_g, c1_b), (c2_r, c2_g, c2_b) = palettes[seed % len(palettes)]

    # Create base gradient image
    img = Image.new("RGBA", (W, H))
    draw = ImageDraw.Draw(img)
    for y in range(H):
        ratio = y / H
        r = int(c1_r + (c2_r - c1_r) * ratio)
        g = int(c1_g + (c2_g - c1_g) * ratio)
        b = int(c1_b + (c2_b - c1_b) * ratio)
        draw.line([(0, y), (W, y)], fill=(r, g, b, 255))
    
    # Add subtle noise/grain texture
    rng = __import__("random")
    rng.seed(seed)
    noise = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    nd = ImageDraw.Draw(noise)
    for _ in range(3000):
        x, y = rng.randint(0, W-1), rng.randint(0, H-1)
        v = rng.randint(0, 40)
        nd.point((x, y), fill=(255, 255, 255, v))
    img = Image.alpha_composite(img, noise)

    draw = ImageDraw.Draw(img)

    # Draw topic-specific pattern
    pattern_fn = PATTERNS.get(topic, PATTERNS["default"])
    pattern_fn(draw, W, H, seed)

    # Dark gradient overlay at bottom for text readability
    for y in range(max(0, H-280), H):
        alpha = int(min(220, 255 * (y - (H-280)) / 280))
        draw.line([(0, y), (W, y)], fill=(5, 5, 15, alpha))

    # ─── Title text ──────────────────────────────────────────────────────────
    # Clean title: remove markdown artifacts
    clean_title = re.sub(r'[`*_~#\[\]]', '', title)
    if len(clean_title) > 70:
        clean_title = clean_title[:67] + "..."

    # Title font
    title_font = get_font(42, bold=True)
    small_font = get_font(26, bold=False)

    # Wrap title
    max_text_w = W - 120
    lines = []
    words = clean_title.split()
    current = ""
    for word in words:
        test = (current + " " + word).strip()
        if draw.textlength(test, font=title_font) <= max_text_w:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    if len(lines) > 3:
        lines = lines[:3]
        lines[-1] = lines[-1][:max(0, 60)] + "..."

    # Draw title lines
    line_h = 55
    total_h = len(lines) * line_h
    start_y = H - 60 - total_h
    for i, line in enumerate(lines):
        lw = draw.textlength(line, font=title_font)
        tx = (W - lw) // 2
        ty = start_y + i * line_h
        # Shadow
        draw.text((tx+2, ty+2), line, font=title_font, fill=(0, 0, 0, 180))
        draw.text((tx, ty), line, font=title_font, fill=(230, 235, 255))


    # ─── Subtle top accent bar ───────────────────────────────────────────────
    accent_col = (100, 160, 255, 180) if topic == "ai" else \
                 (80, 200, 140, 180) if topic in ("android", "flutter") else \
                 (120, 180, 255, 180)
    draw.rectangle([0, 0, W, 4], fill=accent_col)

    # Save as PNG
    img = img.convert("RGB")
    img.save(output_path, "PNG", optimize=True)
    return output_path


def generate_for_blog(slug, title):
    """Convenience: generate cover and return public URL path."""
    out = generate_cover(slug, title)
    # Return the public URL path (relative to public/)
    return f"/images/covers/{os.path.basename(out)}"


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Generate blog cover images")
    parser.add_argument("--slug", help="Blog slug")
    parser.add_argument("--title", help="Blog title")
    parser.add_argument("--all", action="store_true", help="Regenerate all covers")
    parser.add_argument("--dry", action="store_true", help="Show what would be generated")
    args = parser.parse_args()

    if args.all:
        # Regenerate all existing covers
        content_dir = f"{ROOT}/src/content/blog"
        for fn in sorted(os.listdir(content_dir)):
            if not fn.endswith(".md"):
                continue
            slug = fn[:-3]
            text = open(os.path.join(content_dir, fn)).read()
            m = re.search(r'^title:\s*["\']?(.+?)["\']?\s*$', text, re.M)
            title = m.group(1).strip() if m else slug
            out_path = f"{OUTPUT_DIR}/{slug}.png"
            if args.dry:
                print(f"  [dry] {slug}: {title}")
            else:
                generate_cover(slug, title, out_path)
                print(f"  \u2713 {slug}")
        print(f"\nDone. Covers in {OUTPUT_DIR}")
    elif args.slug and args.title:
        url = generate_for_blog(args.slug, args.title)
        print(f"Generated: {url}")
    else:
        print("Usage: generate_blog_cover.py --slug <slug> --title <title>")
        print("       generate_blog_cover.py --all [--dry]")
