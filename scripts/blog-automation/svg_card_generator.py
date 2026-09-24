#!/usr/bin/env python3
"""
Automated SVG Architecture & Code Cover Card Generator for Govind Tank's Blog.
Generates clean, dark-mode, non-cluttered 1200x630 SVG cards with exact code & architecture.
"""
import os, re, html

# Theme accent colors
THEME_COLORS = {
    "mobile_flutter_compose": {
        "glow": "#0284c7", "accent": "#38bdf8", "border": "rgba(56, 189, 248, 0.3)",
        "bg_pill": "rgba(56, 189, 248, 0.15)", "text_pill": "#38bdf8", "tag": "MOBILE & CROSS-PLATFORM"
    },
    "ai_agents_llm": {
        "glow": "#7c3aed", "accent": "#c084fc", "border": "rgba(192, 132, 252, 0.3)",
        "bg_pill": "rgba(192, 132, 252, 0.15)", "text_pill": "#c084fc", "tag": "AI AGENTS & EDGE ML"
    },
    "audio_dsp": {
        "glow": "#059669", "accent": "#34d399", "border": "rgba(52, 211, 153, 0.3)",
        "bg_pill": "rgba(52, 211, 153, 0.15)", "text_pill": "#34d399", "tag": "AUDIO DSP & NDK"
    },
    "graphics_shaders_wallpapers": {
        "glow": "#d946ef", "accent": "#f472b6", "border": "rgba(244, 114, 182, 0.3)",
        "bg_pill": "rgba(244, 114, 182, 0.15)", "text_pill": "#f472b6", "tag": "GRAPHICS & SHADERS"
    },
    "hardware_silicon_npu": {
        "glow": "#0284c7", "accent": "#38bdf8", "border": "rgba(56, 189, 248, 0.3)",
        "bg_pill": "rgba(56, 189, 248, 0.15)", "text_pill": "#38bdf8", "tag": "HARDWARE & NPU"
    },
    "distributed_crdt_data": {
        "glow": "#2563eb", "accent": "#60a5fa", "border": "rgba(96, 165, 250, 0.3)",
        "bg_pill": "rgba(96, 165, 250, 0.15)", "text_pill": "#60a5fa", "tag": "DISTRIBUTED & CRDT"
    },
    "cloud_security_devops": {
        "glow": "#d97706", "accent": "#fbbf24", "border": "rgba(251, 191, 36, 0.3)",
        "bg_pill": "rgba(251, 191, 36, 0.15)", "text_pill": "#fbbf24", "tag": "SECURITY & CLOUD"
    },
    "code_terminal_ide": {
        "glow": "#4f46e5", "accent": "#818cf8", "border": "rgba(129, 140, 248, 0.3)",
        "bg_pill": "rgba(129, 140, 248, 0.15)", "text_pill": "#818cf8", "tag": "DEVELOPER TOOLING"
    },
    "benchmarks_performance": {
        "glow": "#e11d48", "accent": "#fb7185", "border": "rgba(251, 113, 133, 0.3)",
        "bg_pill": "rgba(251, 113, 133, 0.15)", "text_pill": "#fb7185", "tag": "PERFORMANCE & BENCHMARKS"
    }
}

def clean_xml(text):
    return html.escape(str(text or ""))

def extract_code_preview(content, max_lines=7):
    """Extracts the first high-quality code block from markdown content."""
    if not content:
        return []
    m = re.search(r'```(?:\w+)?\n([\s\S]*?)\n```', content)
    if not m:
        return []
    lines = [l.rstrip() for l in m.group(1).split('\n') if l.strip()]
    return lines[:max_lines]

def generate_svg_cover(slug, title, category="", desc="", theme="mobile_flutter_compose", content=""):
    """
    Generates a clean, minimal, non-cluttered 1200x630 SVG technical card.
    """
    cfg = THEME_COLORS.get(theme, THEME_COLORS["mobile_flutter_compose"])
    
    # Title wrapping
    safe_title = clean_xml(title)
    words = safe_title.split()
    title_line1, title_line2 = "", ""
    if len(safe_title) > 42 and len(words) > 4:
        mid = len(words) // 2
        title_line1 = " ".join(words[:mid])
        title_line2 = " ".join(words[mid:])
    else:
        title_line1 = safe_title
        
    safe_desc = clean_xml(desc or "In-depth engineering blueprint and production trade-offs.")
    if len(safe_desc) > 95:
        safe_desc = safe_desc[:92] + "..."

    code_lines = extract_code_preview(content)
    has_code = len(code_lines) >= 3

    # Generate Code Lines XML
    code_xml = ""
    if has_code:
        for idx, line in enumerate(code_lines):
            c_line = clean_xml(line[:48])
            # Basic syntax coloring keywords
            c_line = re.sub(r'\b(class|val|var|fun|interface|import|async|await|const|let|def|return)\b', r'<tspan fill="#c084fc">\1</tspan>', c_line)
            c_line = re.sub(r'//(.*)$', r'<tspan fill="#64748b">//\1</tspan>', c_line)
            code_xml += f'<text y="{idx * 22}">{c_line}</text>\n'

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630" style="background:#030712; font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Roboto,sans-serif;">
  <defs>
    <pattern id="grid-{slug}" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.03)" stroke-width="1"/>
    </pattern>
    
    <radialGradient id="glow-{slug}" cx="20%" cy="15%" r="65%">
      <stop offset="0%" stop-color="{cfg['glow']}" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#030712" stop-opacity="0"/>
    </radialGradient>
    
    <linearGradient id="card-grad-{slug}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="rgba(15, 23, 42, 0.85)"/>
      <stop offset="100%" stop-color="rgba(15, 23, 42, 0.45)"/>
    </linearGradient>

    <filter id="shadow-{slug}" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Background Layer -->
  <rect width="1200" height="630" fill="#030712"/>
  <rect width="1200" height="630" fill="url(#grid-{slug})"/>
  <rect width="1200" height="630" fill="url(#glow-{slug})"/>

  <!-- Outer Border Frame -->
  <rect x="24" y="24" width="1152" height="582" rx="20" fill="none" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1.5"/>

  <!-- Top Category HUD Badge -->
  <g transform="translate(60, 60)">
    <rect x="0" y="0" width="220" height="32" rx="16" fill="{cfg['bg_pill']}" stroke="{cfg['border']}" stroke-width="1"/>
    <circle cx="16" cy="16" r="4" fill="{cfg['accent']}"/>
    <text x="30" y="21" fill="{cfg['text_pill']}" font-size="11" font-weight="700" font-family="'JetBrains Mono',monospace" letter-spacing="1">{cfg['tag']}</text>

    <rect x="235" y="0" width="140" height="32" rx="16" fill="rgba(255,255,255,0.04)" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1"/>
    <text x="250" y="21" fill="#94a3b8" font-size="11" font-weight="600" font-family="'JetBrains Mono',monospace">{clean_xml(category or 'Architecture')}</text>
  </g>

  <!-- Main Title Area -->
  <g transform="translate(60, 135)">
    <text x="0" y="0" fill="#ffffff" font-size="34" font-weight="800" letter-spacing="-0.5">
      {title_line1}
    </text>
    {f'<text x="0" y="42" fill="#ffffff" font-size="34" font-weight="800" letter-spacing="-0.5">{title_line2}</text>' if title_line2 else ''}
    <text x="0" y="{76 if title_line2 else 36}" fill="#94a3b8" font-size="16" font-weight="400">
      {safe_desc}
    </text>
  </g>

  <!-- Technical Artifact Panel -->
  <g transform="translate(60, {250 if title_line2 else 215})">
    <!-- LEFT: Code / Visual Window -->
    <g filter="url(#shadow-{slug})">
      <rect x="0" y="0" width="{520 if has_code else 1080}" height="{280 if title_line2 else 315}" rx="14" fill="url(#card-grad-{slug})" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1"/>
      <rect x="0" y="0" width="{520 if has_code else 1080}" height="36" rx="14" fill="rgba(15, 23, 42, 0.9)"/>
      <path d="M 0 36 L {520 if has_code else 1080} 36" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1"/>
      
      <circle cx="20" cy="18" r="5" fill="#ef4444"/>
      <circle cx="36" cy="18" r="5" fill="#f59e0b"/>
      <circle cx="52" cy="18" r="5" fill="#10b981"/>
      <text x="75" y="22" fill="#64748b" font-size="11" font-family="'JetBrains Mono',monospace">Implementation Blueprint</text>

      {f'''<g transform="translate(20, 68)" font-family="'JetBrains Mono',monospace" font-size="11" fill="#e2e8f0" xml:space="preserve">
        {code_xml}
      </g>''' if has_code else f'''
      <g transform="translate(30, 80)">
        <text fill="{cfg['accent']}" font-size="18" font-weight="700" font-family="'JetBrains Mono',monospace">⚡ Battle-Tested Architecture</text>
        <text y="30" fill="#94a3b8" font-size="14">Deterministic execution, low-overhead memory lifecycle, and production verification.</text>
      </g>'''}
    </g>

    <!-- RIGHT: Architecture Topology Nodes (if code is present) -->
    {f'''<g transform="translate(550, 0)" filter="url(#shadow-{slug})">
      <rect x="0" y="0" width="530" height="{280 if title_line2 else 315}" rx="14" fill="url(#card-grad-{slug})" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1"/>
      <rect x="0" y="0" width="530" height="36" rx="14" fill="rgba(15, 23, 42, 0.9)"/>
      <path d="M 0 36 L 530 36" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1"/>
      <text x="20" y="22" fill="#cbd5e1" font-size="11" font-weight="700" font-family="'JetBrains Mono',monospace" letter-spacing="0.5">SYSTEM TOPOLOGY &amp; GUARANTEES</text>

      <g transform="translate(20, 56)">
        <rect width="490" height="52" rx="8" fill="rgba(255, 255, 255, 0.04)" stroke="{cfg['border']}" stroke-width="1"/>
        <text x="16" y="24" fill="{cfg['accent']}" font-size="11" font-weight="700" font-family="'JetBrains Mono',monospace">CORE EXECUTION RUNTIME</text>
        <text x="16" y="40" fill="#94a3b8" font-size="10">Deterministic lifecycle • Isolated thread execution • Zero memory leak</text>
      </g>

      <path d="M 265 112 L 265 130" stroke="{cfg['accent']}" stroke-width="2" stroke-dasharray="3,3"/>

      <g transform="translate(20, 135)">
        <rect width="490" height="52" rx="8" fill="rgba(255, 255, 255, 0.04)" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1"/>
        <text x="16" y="24" fill="#f8fafc" font-size="11" font-weight="700" font-family="'JetBrains Mono',monospace">PRODUCTION TARGET CLIENTS</text>
        <text x="16" y="40" fill="#94a3b8" font-size="10">Sub-10ms UI thread responsiveness • High-throughput stream channels</text>
      </g>

      <g transform="translate(20, 202)">
        <rect width="490" height="42" rx="8" fill="rgba(16, 185, 129, 0.08)" stroke="rgba(16, 185, 129, 0.25)" stroke-width="1"/>
        <text x="16" y="26" fill="#34d399" font-size="11" font-weight="700" font-family="'JetBrains Mono',monospace">✔ 100% Shared Logic • Zero JNI Overhead</text>
      </g>
    </g>''' if has_code else ''}
  </g>

  <!-- Footer Branding -->
  <g transform="translate(60, 580)">
    <text x="0" y="0" fill="#64748b" font-size="11" font-weight="600" font-family="'JetBrains Mono',monospace" letter-spacing="1">
      GOVIND TANK • SENIOR MOBILE ARCHITECT &amp; AI ENGINEER
    </text>
    <text x="1080" y="0" text-anchor="end" fill="{cfg['accent']}" font-size="11" font-weight="700" font-family="'JetBrains Mono',monospace">
      govindtank.github.io
    </text>
  </g>
</svg>"""
    return svg

def save_svg_for_post(slug, title, category, desc, theme, content, output_dir="/Users/govind/govindtank.github.io/public/covers"):
    os.makedirs(output_dir, exist_ok=True)
    svg_content = generate_svg_cover(slug, title, category, desc, theme, content)
    filepath = os.path.join(output_dir, f"{slug}.svg")
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(svg_content)
    return f"/covers/{slug}.svg"

if __name__ == "__main__":
    print("SVG Card Generator Module ready.")
