import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Smartphone,
  Globe,
  Cpu,
  Database,
  BrainCircuit,
  ExternalLink,
  Layers,
  Sparkles,
  ShieldCheck,
  Zap,
  CheckCircle2,
  GitBranch,
  Workflow,
  Activity,
  ArrowRight,
  Code2,
} from 'lucide-react';

const RADAR_AXES = [
  'Android Core',
  'Flutter & Impeller',
  'Clean Arch',
  'On-Device AI',
  'Cloud & MQTT',
  'Shaders & 3D',
];

const PRESETS = {
  architect2026: [96, 94, 95, 88, 86, 90],
  nativeBaseline2021: [88, 68, 82, 42, 70, 58],
};

const DOMAIN_TABS = [
  { id: 'android', label: 'Android Native Core', icon: <Smartphone className="w-4 h-4 text-cyan-400" /> },
  { id: 'flutter', label: 'Flutter & Impeller', icon: <Globe className="w-4 h-4 text-indigo-400" /> },
  { id: 'ai', label: 'Edge AI & SLMs', icon: <BrainCircuit className="w-4 h-4 text-emerald-400" /> },
  { id: 'cloud', label: 'Cloud Edge & IoT', icon: <Database className="w-4 h-4 text-rose-400" /> },
  { id: 'agile', label: 'Agile Delivery Protocol', icon: <Workflow className="w-4 h-4 text-amber-400" />, badge: 'HOW I DELIVER' },
];

const DOMAIN_DATA: Record<string, {
  title: string;
  tagline: string;
  badge: string;
  radarScores: number[];
  skills: {
    name: string;
    desc: string;
    metric: string;
    productionApp: string;
    highlight: string;
  }[];
}> = {
  android: {
    title: 'Native Android Silicon & Core OS',
    tagline: 'Deep Platform Control & Lifecycle Integrity',
    badge: '120Hz VSync Locked',
    radarScores: [98, 70, 92, 80, 84, 88],
    skills: [
      {
        name: 'Kotlin 2.x & Coroutines',
        desc: 'StateFlow, SharedFlow, structured concurrency, and custom serialization.',
        metric: '0 Race Conditions',
        productionApp: 'BAPS Prakash & Akshar Amrutam',
        highlight: 'Deterministic background isolate synchronization',
      },
      {
        name: 'Jetpack Compose',
        desc: 'Declarative UI, custom LayoutNodes, subcomposition, and Material You tokens.',
        metric: '120 FPS Pacing',
        productionApp: 'Enterprise Portals & Utilities',
        highlight: 'Zero redundant recomposition passes',
      },
      {
        name: 'AGSL Fragment Shaders',
        desc: 'GPU fragment shaders running on hardware pipelines for interactive fluid visual effects.',
        metric: '8.33ms Frame Budget',
        productionApp: 'Interactive Playgrounds & UI',
        highlight: 'Real-time radial wave equations with zero CPU overhead',
      },
      {
        name: 'Android NDK & JNI Bridges',
        desc: 'Low-level C/C++ audio pipelines, vector math kernels, and hardware communication.',
        metric: '<15ms Audio Latency',
        productionApp: 'Embedded & Media Engines',
        highlight: 'Direct memory mapping with clean C++ destructors',
      },
      {
        name: 'Android Auto Projections',
        desc: 'In-vehicle head-unit media browser services, custom browsing hierarchies, and voice search.',
        metric: 'Automotive Certified',
        productionApp: 'BAPS Prakash (50K+ Users)',
        highlight: 'Gapless playback with lock-screen media session controls',
      },
      {
        name: 'LeakCanary & Profiler',
        desc: 'Automated memory heap dump verification integrated into CI/CD pipelines.',
        metric: '0.00 MB Leak SLA',
        productionApp: 'All Production Repositories',
        highlight: 'Guaranteed destruction of retained Activity & Fragment refs',
      },
    ],
  },
  flutter: {
    title: 'High-Performance Flutter & Impeller',
    tagline: 'Zero-Jank Cross-Platform Graphics Engine',
    badge: 'Impeller Vulkan/Metal',
    radarScores: [72, 98, 96, 75, 82, 92],
    skills: [
      {
        name: 'Flutter Impeller Architecture',
        desc: 'AOT shader compilation targeting Metal and Vulkan backends with zero compilation jank.',
        metric: '0 Shader Hitch SLA',
        productionApp: 'Akshar Amrutam (100K+)',
        highlight: 'Consistent 120 FPS frame pacing on iOS and Android',
      },
      {
        name: 'BLoC Unidirectional State',
        desc: 'Deterministic event-driven finite state machines with immutable state transitions.',
        metric: '100% Deterministic',
        productionApp: 'Akshar Amrutam & BAPS Prakash',
        highlight: 'Eliminates race conditions across asynchronous API queues',
      },
      {
        name: 'Custom RenderBoxes',
        desc: 'Low-level RenderObject paint, layout, and hit-testing implementations.',
        metric: 'Sub-millisecond Paint',
        productionApp: 'scratch_reveal & island_bar',
        highlight: 'Hardware-accelerated custom Canvas 2D math',
      },
      {
        name: 'audio_service Integration',
        desc: 'Background audio playback engine with notification media controls and lockscreen art.',
        metric: 'Gapless Playback',
        productionApp: 'BAPS Prakash Streaming',
        highlight: 'Resilient foreground notification lifecycle management',
      },
      {
        name: 'Dart Isolates & Concurrency',
        desc: 'Offloading heavy JSON serialization, cryptographic hashing, and image transforms.',
        metric: '0 Main-Thread Stalls',
        productionApp: 'smooth_signature_pad',
        highlight: 'Bidirectional isolate ports with zero memory leaks',
      },
      {
        name: 'Verified pub.dev Maintainer',
        desc: 'Author of 7 verified open-source packages across haptics, security, and input.',
        metric: 'Verified Domain Publisher',
        productionApp: '7 Live Packages',
        highlight: 'Rigorous pure-Dart and Flutter SDK compliance',
      },
    ],
  },
  ai: {
    title: 'Edge AI, Vision & On-Device SLMs',
    tagline: 'Private, Low-Latency Local Intelligence',
    badge: '18+ tok/sec On-Device',
    radarScores: [85, 80, 88, 95, 78, 84],
    skills: [
      {
        name: 'On-Device SLMs (Qwen/Gemma)',
        desc: 'INT4 quantized Small Language Model deployment via llama.cpp NDK bindings.',
        metric: '18.2 tok/s on Edge',
        productionApp: 'Edge Intelligence Prototypes',
        highlight: 'Zero cloud latency; 100% offline private processing',
      },
      {
        name: 'Android IPC Binder RPC Host',
        desc: 'Exposing native mobile capabilities over structured JSON-RPC protocol.',
        metric: '<5ms IPC Roundtrip',
        productionApp: 'Autonomous Mobile Agent Hosts',
        highlight: 'Secure IPC communication between background worker services',
      },
      {
        name: 'Local Vector Search',
        desc: 'sqlite-vec and pure Dart vector cosine similarity search for offline semantic retrieval.',
        metric: '<8ms Query Latency',
        productionApp: 'Offline Knowledge Bases',
        highlight: 'Zero network dependency for high-dimension embeddings',
      },
      {
        name: 'Health Connect Sync',
        desc: 'Synchronizing local midnights biometrics, active calorie burns, and sleep cycles.',
        metric: 'Local-Midnight Filter',
        productionApp: 'AuraFit & Wearable Companions',
        highlight: 'Privacy-first authenticated health records',
      },
      {
        name: 'OlliteRT Multimodal Vision',
        desc: 'On-device vision model inference for visual inspection and meal logging.',
        metric: '<448px INT4 GPU',
        productionApp: 'Vision Systems & OCR',
        highlight: 'Cultural context prompts and disambiguation chips',
      },
      {
        name: 'AI-Augmented Engineering',
        desc: 'Leveraging modern AI tooling with pre-commit automated quality gates.',
        metric: '3x Velocity Gain',
        productionApp: 'Daily Engineering Workflows',
        highlight: 'Rigorous manual code review with 0% unverified code tolerance',
      },
    ],
  },
  cloud: {
    title: 'Cloud Edge, MQTT & IoT Telemetry',
    tagline: 'High-Frequency Real-Time Sockets & Security',
    badge: 'Sub-120ms Edge Ingress',
    radarScores: [82, 85, 90, 75, 96, 78],
    skills: [
      {
        name: 'AWS CloudFront Signed Cookies',
        desc: 'Edge-authenticated HLS audio streaming preventing unauthorized token reuse.',
        metric: '100% Protected Stream',
        productionApp: 'BAPS Prakash (50K+)',
        highlight: 'Military-grade cryptographic cookie validation at AWS edge',
      },
      {
        name: 'High-Frequency MQTT Sockets',
        desc: 'Persistent bi-directional WebSocket & MQTT telemetry queues for real-time sensor sync.',
        metric: '<120ms Socket Ingress',
        productionApp: 'La Crosse View & Autozon',
        highlight: 'Resilient auto-reconnect backoff on network dropouts',
      },
      {
        name: 'BLE GATT Protocol',
        desc: 'Custom Bluetooth Low Energy peripheral scan, bonding, and descriptor read/write.',
        metric: '<500ms Connection SLA',
        productionApp: 'IoT Hardware Synchronization',
        highlight: 'Low-power battery drain profiles during persistent sync',
      },
      {
        name: 'Node.js & TypeScript APIs',
        desc: 'Scalable RESTful microservices and enterprise ERP backend connectors.',
        metric: 'High Concurrency',
        productionApp: 'Internal Enterprise Portals',
        highlight: 'Strict OpenAPI schemas and transactional integrity',
      },
      {
        name: 'FastAPI & Python Pipelines',
        desc: 'High-throughput data normalization, statistical scanners, and automated cronjobs.',
        metric: '<50ms Response Time',
        productionApp: 'Algorithmic Financial Scanners',
        highlight: 'Chunked multi-ticker batch processing with disk cache',
      },
      {
        name: 'Automated CI/CD Workflows',
        desc: 'GitHub Actions quality gates, automated linting, test suites, and Play Store rollout.',
        metric: '100% Test Passed Gate',
        productionApp: 'All 7 pub.dev Repositories',
        highlight: 'Zero human error deployment with strict version tagging',
      },
    ],
  },
};

const AGILE_STAGES = [
  {
    step: '01',
    phase: 'SPRINT PLANNING & FRAME BUDGETS',
    tag: '2-Week Cadence',
    icon: <Workflow className="w-5 h-5 text-cyan-400" />,
    description:
      'Feature slicing in deterministic 2-week Agile sprints. User stories are sized with strict Clean Architecture boundaries. Hard 8.33ms (120Hz) frame budgets and sub-200ms cold start latency benchmarks are defined as non-negotiable definition-of-done criteria.',
    deliverables: [
      'Clean Domain boundary models',
      'BLoC / MVI state transition diagrams',
      'Frame budget allocations (<8.33ms)',
      'Jira / Linear sprint story points',
    ],
    metric: 'Sprint Cadence: 2-Week Agile',
  },
  {
    step: '02',
    phase: 'CLEAN ARCHITECTURE ENGINEERING',
    tag: 'Impeller & Kotlin Native',
    icon: <Code2 className="w-5 h-5 text-indigo-400" />,
    description:
      'Writing production code using strict unidirectional data flows. Heavy workloads are offloaded to background Dart Isolates or Kotlin coroutines. UI components are built with custom AGSL GPU fragment shaders and Impeller pipelines for stutter-free scrolling.',
    deliverables: [
      'Kotlin 2.x coroutine pipelines',
      'Flutter Impeller GPU shaders',
      'NDK C++ audio & spatial bridges',
      'Deterministic local SQLite cache',
    ],
    metric: 'Frame Pacing: 120 FPS Locked',
  },
  {
    step: '03',
    phase: 'AUTOMATED QUALITY GATES & HEAP AUDITS',
    tag: '0-Leak Verification',
    icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
    description:
      'Pre-commit and CI/CD quality gates enforce strict standards: automated LeakCanary heap audits to eliminate memory leaks, Golden widget screenshot regression testing, and Android Memory Profiler benchmarks before any PR merges.',
    deliverables: [
      'LeakCanary automated heap audits',
      'Golden widget visual regression tests',
      'Memory Profiler allocation baseline',
      'Static analysis & pre-commit hooks',
    ],
    metric: 'Memory Leaks: 0.00 MB SLA',
  },
  {
    step: '04',
    phase: 'STAGED PRODUCTION ROLLOUT & TELEMETRY',
    tag: '150K+ Scaled Delivery',
    icon: <Activity className="w-5 h-5 text-rose-400" />,
    description:
      'Staggered rollout across Google Play Console (5% -> 20% -> 50% -> 100%). Edge traffic is routed through AWS CloudFront with signed cookies. Real-time MQTT telemetry and Crashlytics alerts monitor session health to sustain 99.95% crash-free SLAs.',
    deliverables: [
      'Staggered Play Store phased rollout',
      'CloudFront signed cookie security',
      'Real-time MQTT crash & health telemetry',
      'Post-launch SLA verification report',
    ],
    metric: 'Stability: 99.95% Crash-Free SLA',
  },
];

export default function Skills() {
  const [activeTab, setActiveTab] = useState<string>('android');
  const [activeAgileStage, setActiveAgileStage] = useState<number>(0);
  const [selectedSkill, setSelectedSkill] = useState<any>(null);

  const curDomain = DOMAIN_DATA[activeTab] || DOMAIN_DATA.android;
  const values = activeTab === 'agile' ? [96, 94, 95, 88, 86, 90] : curDomain.radarScores;

  const center = 160;
  const radius = 105;
  const totalAxes = RADAR_AXES.length;

  const points = values
    .map((val, i) => {
      const angle = (Math.PI * 2 * i) / totalAxes - Math.PI / 2;
      const r = (val / 100) * radius;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(' ');

  const baselinePoints = PRESETS.nativeBaseline2021
    .map((val, i) => {
      const angle = (Math.PI * 2 * i) / totalAxes - Math.PI / 2;
      const r = (val / 100) * radius;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <section id="skills" className="relative py-16 sm:py-20 bg-transparent overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono-tech text-xs uppercase tracking-[0.28em] text-cyan-400">
                [03] // Engineering_Capabilities
              </span>
            </div>
            <h2 className="font-section-title text-4xl sm:text-5xl font-bold tracking-tight text-white mb-2">
              Technical <span className="text-primary">Arsenal</span>
            </h2>
            <p className="max-w-xl text-sm sm:text-base text-slate-400 leading-relaxed font-light">
              Interactive architectural domain breakdown. Explore native mobile internals, 120Hz Impeller graphics,
              on-device SLMs, and the 4-phase Agile production delivery methodology.
            </p>
          </div>
          <div className="text-6xl font-black text-white/5 select-none hidden md:block">
            EXPERTISE
          </div>
        </div>

        {/* Interactive Domain Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 scrollbar-none border-b border-white/10">
          {DOMAIN_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedSkill(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono-tech text-xs transition-all whitespace-nowrap cursor-pointer border ${
                activeTab === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.2)] font-semibold'
                  : 'bg-white/5 text-slate-400 hover:text-slate-200 border-white/5 hover:border-white/15'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-400/30">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Main Interactive Stage: Radar + Active Domain / Agile Engine */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Interactive Radar Telemetry */}
          <div className="lg:col-span-5 spatial-glass rounded-3xl p-6 sm:p-7 border-white/10 flex flex-col items-center sticky top-24 shadow-xl">
            <div className="w-full flex items-center justify-between pb-3 mb-4 border-b border-white/10 font-mono-tech text-xs">
              <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>RADAR_TELEMETRY.2026</span>
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 font-bold">
                {activeTab === 'agile' ? 'Agile Framework' : curDomain.badge}
              </span>
            </div>

            {/* Radar SVG Diagram */}
            <div className="relative w-full max-w-[320px] aspect-square flex items-center justify-center select-none">
              <svg viewBox="0 0 320 320" className="w-full h-full overflow-visible">
                {/* Concentric rings */}
                {[0.25, 0.5, 0.75, 1].map((pct, idx) => (
                  <circle
                    key={idx}
                    cx={center}
                    cy={center}
                    r={radius * pct}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeDasharray={pct === 1 ? 'none' : '3,3'}
                  />
                ))}

                {/* Axes Lines & Labels */}
                {RADAR_AXES.map((label, idx) => {
                  const angle = (Math.PI * 2 * idx) / totalAxes - Math.PI / 2;
                  const x = center + radius * Math.cos(angle);
                  const y = center + radius * Math.sin(angle);
                  const labelX = center + (radius + 24) * Math.cos(angle);
                  const labelY = center + (radius + 18) * Math.sin(angle);

                  return (
                    <g key={idx}>
                      <line
                        x1={center}
                        y1={center}
                        x2={x}
                        y2={y}
                        stroke="rgba(255, 255, 255, 0.12)"
                      />
                      <text
                        x={labelX}
                        y={labelY}
                        fill="#94a3b8"
                        fontSize="9.5"
                        fontFamily="var(--font-mono)"
                        textAnchor="middle"
                        dominantBaseline="central"
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}

                {/* 2021 Baseline Polygon */}
                <polygon
                  points={baselinePoints}
                  fill="rgba(129, 140, 248, 0.10)"
                  stroke="rgba(129, 140, 248, 0.35)"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                />

                {/* Dynamic Polygon */}
                <motion.polygon
                  points={points}
                  fill="rgba(34, 211, 238, 0.22)"
                  stroke="#22d3ee"
                  strokeWidth="2.5"
                  className="filter drop-shadow-[0_0_12px_rgba(34,211,238,0.5)]"
                />

                {/* Handle Points */}
                {values.map((val, idx) => {
                  const angle = (Math.PI * 2 * idx) / totalAxes - Math.PI / 2;
                  const r = (val / 100) * radius;
                  const x = center + r * Math.cos(angle);
                  const y = center + r * Math.sin(angle);

                  return (
                    <circle
                      key={idx}
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#22d3ee"
                      stroke="#050811"
                      strokeWidth="2"
                    />
                  );
                })}
              </svg>
            </div>

            {/* Readout Scores */}
            <div className="w-full mt-4 grid grid-cols-3 gap-2 font-mono-tech text-xs">
              {RADAR_AXES.map((label, idx) => (
                <div key={idx} className="bg-white/5 rounded-xl p-2 border border-white/5 text-center">
                  <div className="text-[10px] text-slate-400 truncate">{label}</div>
                  <div className="text-sm font-bold text-cyan-300 mt-0.5">{values[idx]}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Interactive Content Area */}
          <div className="lg:col-span-7">
            {activeTab !== 'agile' ? (
              <div className="space-y-4">
                {/* Domain Header Card */}
                <div className="spatial-glass rounded-2xl p-5 border-white/10 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display font-bold text-xl text-white">
                      {curDomain.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-light">
                      {curDomain.tagline}
                    </p>
                  </div>
                  <span className="font-mono-tech text-xs px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 font-bold">
                    {curDomain.badge}
                  </span>
                </div>

                {/* Interactive Skills Tiles */}
                <div className="grid sm:grid-cols-2 gap-3.5">
                  {curDomain.skills.map((skill) => (
                    <button
                      key={skill.name}
                      type="button"
                      onClick={() => setSelectedSkill(skill)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between group ${
                        selectedSkill?.name === skill.name
                          ? 'bg-cyan-500/15 border-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.2)]'
                          : 'bg-white/5 border-white/10 hover:border-cyan-400/30 hover:bg-white/10'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-mono-tech text-xs text-white font-bold group-hover:text-cyan-300 transition-colors">
                            {skill.name}
                          </span>
                          <span className="font-mono-tech text-[10px] text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10">
                            {skill.metric}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-light leading-relaxed">
                          {skill.desc}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono-tech text-slate-500">
                        <span className="text-cyan-400/80">Shipped: {skill.productionApp}</span>
                        <span className="text-slate-400 group-hover:text-white transition-colors">Details →</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Interactive Selected Skill Diagnostic Detail */}
                {selectedSkill && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-2xl bg-cyan-950/30 border border-cyan-400/40 spatial-glass mt-4 space-y-2"
                  >
                    <div className="flex items-center justify-between font-mono-tech text-xs">
                      <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-cyan-400" />
                        <span>PRODUCTION PROOF: {selectedSkill.name}</span>
                      </span>
                      <span className="text-emerald-400 font-bold">{selectedSkill.metric}</span>
                    </div>
                    <div className="text-xs text-slate-300 font-light leading-relaxed">
                      {selectedSkill.highlight}
                    </div>
                    <div className="text-[11px] font-mono-tech text-slate-400 pt-1">
                      Verified Production Deployment: <span className="text-white font-medium">{selectedSkill.productionApp}</span>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              /* AGILE DELIVERY PROTOCOL INTERACTIVE STAGE */
              <div className="space-y-4">
                <div className="spatial-glass rounded-2xl p-5 border-white/10 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display font-bold text-xl text-white">
                      Agile Delivery Methodology
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-light">
                      How Govind engineers, tests, and deploys mission-critical mobile systems in production
                    </p>
                  </div>
                  <span className="font-mono-tech text-xs px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 font-bold">
                    2-Week Sprints
                  </span>
                </div>

                {/* 4 Interactive Agile Steps */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {AGILE_STAGES.map((stg, i) => (
                    <button
                      key={stg.step}
                      type="button"
                      onClick={() => setActiveAgileStage(i)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        activeAgileStage === i
                          ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono-tech">
                        <span className={activeAgileStage === i ? 'text-cyan-300 font-bold' : 'text-slate-500'}>
                          STAGE {stg.step}
                        </span>
                        {activeAgileStage === i && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />}
                      </div>
                      <div className="text-xs font-bold text-white mt-1 truncate">
                        {stg.tag}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Active Stage Detailed Breakdown */}
                <div className="spatial-glass rounded-2xl p-6 border-white/15 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-400/30">
                        {AGILE_STAGES[activeAgileStage].icon}
                      </div>
                      <div>
                        <div className="font-mono-tech text-[10px] text-cyan-400 font-bold">
                          STAGE {AGILE_STAGES[activeAgileStage].step} // DELIVERABLE PROTOCOL
                        </div>
                        <h4 className="font-display font-bold text-lg text-white">
                          {AGILE_STAGES[activeAgileStage].phase}
                        </h4>
                      </div>
                    </div>
                    <span className="font-mono-tech text-xs text-emerald-400 font-bold px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-400/30 hidden sm:inline">
                      {AGILE_STAGES[activeAgileStage].metric}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
                    {AGILE_STAGES[activeAgileStage].description}
                  </p>

                  <div className="space-y-2 pt-2">
                    <div className="font-mono-tech text-[10px] text-slate-400 uppercase tracking-wider">
                      Verified Sprint Artifacts &amp; Quality Gates:
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {AGILE_STAGES[activeAgileStage].deliverables.map((item) => (
                        <div
                          key={item}
                          className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5 font-mono-tech text-xs text-slate-300"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                          <span className="truncate">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
