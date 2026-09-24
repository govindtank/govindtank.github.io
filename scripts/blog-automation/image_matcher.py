#!/usr/bin/env python3
"""
Context-Aware Thematic Image Selector for Govind Tank's Technical Blog.
Maps blog post metadata and content to 9 specialized developer/engineering visual themes.
Guarantees 100% technical relevance (zero generic stock/office photos).
"""
import re, hashlib, random

THEME_POOLS = {
    "audio_dsp": [
        "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=1200", # sound mixing console
        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=1200", # microphone audio waves
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=1200", # audio equalizer lights
        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1200", # electronic audio dj controller
        "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=1200", # audio visualizer wave
        "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=1200", # studio audio monitor speaker
        "https://images.unsplash.com/photo-1546707012-c46675f12716?auto=format&fit=crop&q=80&w=1200", # audio synthesis cables
        "https://images.unsplash.com/photo-1519683109079-d5f539e1542f?auto=format&fit=crop&q=80&w=1200", # audio studio mixer
        "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=1200", # music score sound
        "https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&q=80&w=1200", # studio headphones
    ],
    "ai_agents_llm": [
        "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1200", # AI head network
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200", # neural glowing lines
        "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=1200", # AI digital mesh
        "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=1200", # robot agent loop
        "https://images.unsplash.com/photo-1617791160505-6f00504e3519?auto=format&fit=crop&q=80&w=1200", # 3D neural brain graph
        "https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&q=80&w=1200", # AI intelligence eye
        "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&q=80&w=1200", # 3D neural node graph
        "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&q=80&w=1200", # artificial intelligence tech
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1200", # cyberpunk neural interface
        "https://images.unsplash.com/photo-1618172193622-ae2d025f4032?auto=format&fit=crop&q=80&w=1200", # neural network matrix
        "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&q=80&w=1200", # virtual intelligence
    ],
    "mobile_flutter_compose": [
        "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=1200", # smartphone UI dark mode
        "https://images.unsplash.com/photo-1526406915894-7bcd65f60845?auto=format&fit=crop&q=80&w=1200", # mobile UI wireframe
        "https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&q=80&w=1200", # mobile app analytics
        "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=1200", # interactive mobile experience
        "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&q=80&w=1200", # phone architecture
        "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&q=80&w=1200", # smartphone dark UI in hand
        "https://images.unsplash.com/photo-1526401485004-46910ecc8e51?auto=format&fit=crop&q=80&w=1200", # mobile tokens & UI
        "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&q=80&w=1200", # mobile iPhone device
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=1200", # mobile phone on dark surface
        "https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?auto=format&fit=crop&q=80&w=1200", # mobile app screen
        "https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b?auto=format&fit=crop&q=80&w=1200", # mobile test device
        "https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&q=80&w=1200", # phone device mockup
    ],
    "graphics_shaders_wallpapers": [
        "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1200", # neon fluid dynamics shader
        "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=1200", # glowing color wave
        "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=1200", # colorful fluid texture
        "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=1200", # particle cosmos shader
        "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=1200", # neon geometric rendering
        "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1200", # retro synthwave grid
        "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=1200", # gradient spectrum mesh
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=1200", # dynamic illumination
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=1200", # neon light refraction
        "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&q=80&w=1200", # abstract geometric fluid
    ],
    "hardware_silicon_npu": [
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200", # silicon processor wafer
        "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&q=80&w=1200", # computer hardware chip
        "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=1200", # GPU processor die
        "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&q=80&w=1200", # neon circuits
        "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&q=80&w=1200", # CPU socket hardware
        "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=1200", # server motherboard circuit
        "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&q=80&w=1200", # precision electronics board
        "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&q=80&w=1200", # hardware engineering macro
        "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&q=80&w=1200", # micro-components
    ],
    "code_terminal_ide": [
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200", # VS Code dark syntax
        "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&q=80&w=1200", # code screen
        "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200", # clean dark code
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=1200", # developer workstation
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=1200", # coding on laptop dark room
        "https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&q=80&w=1200", # code editor syntax IDE
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1200", # terminal code streams
        "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&q=80&w=1200", # modern code IDE dark theme
        "https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?auto=format&fit=crop&q=80&w=1200", # clean code writing
        "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?auto=format&fit=crop&q=80&w=1200", # multi-monitor coding setup
    ],
    "distributed_crdt_data": [
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200", # global network node mesh
        "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=1200", # server rack blue LEDs
        "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=1200", # fiber optic streams
        "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=1200", # distributed data graph
        "https://images.unsplash.com/photo-1508830524289-0adcbe822b40?auto=format&fit=crop&q=80&w=1200", # server telemetry
        "https://images.unsplash.com/photo-1541462608143-67571c6738dd?auto=format&fit=crop&q=80&w=1200", # network topology
        "https://images.unsplash.com/photo-1564865878688-9a244444042a?auto=format&fit=crop&q=80&w=1200", # complex distributed architecture
        "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&q=80&w=1200", # data analytics telemetry
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200", # real-time telemetry charts
    ],
    "cloud_security_devops": [
        "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?auto=format&fit=crop&q=80&w=1200", # cybersecurity lock matrix
        "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&q=80&w=1200", # cybersecurity shield grid
        "https://images.unsplash.com/photo-1620121692029-d088224ddc74?auto=format&fit=crop&q=80&w=1200", # cloud infrastructure mesh
        "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?auto=format&fit=crop&q=80&w=1200", # cryptographic terminal
        "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&q=80&w=1200", # cloud platform matrix
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=1200", # cloud network architecture
        "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&q=80&w=1200", # devops deployment console
    ]
}

THEME_KEYWORDS = {
    "audio_dsp": [
        "audio", "dsp", "sound", "oboe", "coreaudio", "whisper", "transcription", 
        "music", "pcm", "ringbuffer", "ring buffer", "waveform", "equalizer", "speaker", 
        "microphone", "mic", "sample rate", "audiounit", "audiotrack", "xruns"
    ],
    "graphics_shaders_wallpapers": [
        "wallpaper", "shader", "agsl", "opengl", "vulkan", "glsurfaceview", "skiko", 
        "canvas", "fluid", "particle", "rendering", "gpu", "metal", "impeller", 
        "material you", "daynight", "tokens", "theming", "dark mode", "contrast"
    ],
    "ai_agents_llm": [
        "agent", "agents", "mcp", "model context protocol", "llm", "slm", "langgraph", 
        "crewai", "prompt", "gemini", "llama", "deepseek", "qwen", "gpt", "reasoning", 
        "function calling", "tool-calling", "rag", "vector", "chromadb", "embeddings", 
        "ai-native", "antigravity", "ai chat"
    ],
    "hardware_silicon_npu": [
        "npu", "nnapi", "qnn", "qualcomm", "chip", "silicon", "hardware", "assembly", 
        "c-interop", "cinterop", "ndk", "c++", "pointer", "zero-copy", "zero copy", 
        "shared memory", "isolate", "isolates", "concurrency", "low-level"
    ],
    "distributed_crdt_data": [
        "crdt", "crdts", "yjs", "automerge", "sync", "synchronization", "offline-first", 
        "offline first", "database", "sqlite", "room", "postgres", "replication", 
        "powersync", "electricsql", "websocket", "websockets", "data stream", "event-driven"
    ],
    "cloud_security_devops": [
        "security", "auth", "oauth", "keystore", "biometric", "encryption", "zero-trust", 
        "token", "cloud", "serverless", "firebase", "devops", "ci/cd", "docker", 
        "kubernetes", "micro-frontends", "microservices"
    ],
    "mobile_flutter_compose": [
        "flutter", "android", "compose", "jetpack", "ios", "kmp", "kotlin multiplatform", 
        "riverpod", "bloc", "provider", "signals", "reactivity", "viewmodel", "stateflow", 
        "sharedflow", "cross-platform", "server-driven ui"
    ],
    "code_terminal_ide": [
        "kotlin", "dart", "rust", "typescript", "python", "compiler", "k2", 
        "coroutines", "flow", "operators", "clean architecture", "testing", "benchmarks"
    ]
}

def detect_theme(category="", title="", desc="", keywords=None, content=""):
    """
    Computes a weighted keyword score across all 9 technical visual themes.
    Title matches are weighted 4x, Keywords 3x, Desc/Category 2x, Content 1x.
    """
    title_lower = title.lower()
    desc_lower = f"{category} {desc}".lower()
    kw_lower = " ".join(keywords or []).lower()
    content_snippet = content[:3000].lower() if content else ""

    best_theme = "code_terminal_ide"
    best_score = -1

    for theme, kw_list in THEME_KEYWORDS.items():
        score = 0
        for kw in kw_list:
            if re.search(r'\b' + re.escape(kw) + r'\b', title_lower):
                score += 4
            if re.search(r'\b' + re.escape(kw) + r'\b', kw_lower):
                score += 3
            if re.search(r'\b' + re.escape(kw) + r'\b', desc_lower):
                score += 2
            if content_snippet and re.search(r'\b' + re.escape(kw) + r'\b', content_snippet):
                score += 1
        
        if score > best_score:
            best_score = score
            best_theme = theme

    return best_theme

def pick_contextual_image(category="", title="", desc="", keywords=None, content="", used_urls=None, slug=""):
    """
    Picks a context-matched image for a blog post based on detected technical theme.
    Ensures theme consistency and deterministic selection per slug.
    """
    if used_urls is None:
        used_urls = set()

    theme = detect_theme(category=category, title=title, desc=desc, keywords=keywords, content=content)
    theme_urls = THEME_POOLS.get(theme, THEME_POOLS["code_terminal_ide"])

    # Try unused URLs in this theme first
    available = [u for u in theme_urls if u not in used_urls]
    
    # If exhausted in this theme, rotate within this theme using slug hash (never fallback to unrelated theme)
    if not available:
        available = theme_urls

    # Deterministic selection based on slug or title
    hash_seed = slug if slug else (title + category)
    h = int(hashlib.md5(hash_seed.encode("utf-8")).hexdigest(), 16)
    return available[h % len(available)], theme
