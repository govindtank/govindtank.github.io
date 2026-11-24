import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Cpu,
  Layers,
  BrainCircuit,
  Radio,
  Terminal as TerminalIcon,
  ShieldCheck,
  CheckCircle2,
  Send,
  Zap,
  Activity,
  HardDrive,
} from 'lucide-react';

const STANDARDS = [
  {
    icon: <Cpu className="w-5 h-5 text-cyan-400" />,
    title: 'Zero-Leak Lifecycle SLA',
    desc: 'Deterministic lifecycle cleanup in Kotlin & Flutter. LeakCanary automated heap verification on all PRs.',
    metric: '0.00 MB Leak SLA',
  },
  {
    icon: <Zap className="w-5 h-5 text-indigo-400" />,
    title: '120Hz VSync Frame Budgeting',
    desc: 'Hard 8.33ms frame budgets. Heavy transforms offloaded to background isolates and GPU AGSL shaders.',
    metric: '120 FPS Locked',
  },
  {
    icon: <Layers className="w-5 h-5 text-emerald-400" />,
    title: 'BLoC / MVI Determinism',
    desc: 'Unidirectional data flows and discrete state machines. Eliminates race conditions and edge-case UI glitches.',
    metric: 'Deterministic State',
  },
  {
    icon: <HardDrive className="w-5 h-5 text-rose-400" />,
    title: 'Offline-First Data Pipeline',
    desc: 'Local SQLite/Room caching as the single source of truth, optimistic updates, and resilient background queues.',
    metric: '100% Offline Capable',
  },
];

const TERMINAL_DATA: Record<string, string[]> = {
  whoami: [
    '> identity: Govind Tank (@govindtank)',
    '> role: Lead Mobile Systems Engineer @ Rysun Labs Pvt. Ltd.',
    '> location: Gandhinagar / Ahmedabad, Gujarat, India',
    '> education: Ahmedabad University · Computer Society of India Member',
    '> track_record: 9+ years building 120Hz mobile & IoT ecosystems',
  ],
  stack: [
    '> mobile_native: Kotlin 2.x · Jetpack Compose · AGSL Shaders · Android Auto · NDK/JNI',
    '> cross_platform: Flutter 4 · Impeller · Bloc · Riverpod · audio_service',
    '> ai_vision: Edge SLMs · llama.cpp NDK · OlliteRT · Health Connect',
    '> backend_cloud: Node.js · TypeScript · FastAPI · AWS CloudFront · MQTT',
  ],
  metrics: [
    '> akshar_amrutam: 100,000+ downloads | 99.95% crash-free session SLA',
    '> baps_prakash: 50,000+ active audio listeners | AWS Signed Cookies',
    '> lacrosse_view: -30% startup latency | -20% RAM | -95% NPE rate',
    '> pub_dev_packages: 10+ open-source Dart/Flutter libraries published',
  ],
  ai: [
    '> local_slm: Qwen 2.5 3B Q4_K_M via llama.cpp NDK @ 18.2 tok/s',
    '> mcp_android: Native Foreground Binder JSON-RPC + sqlite-vec (<2ms RAG)',
    '> aura_vision: Gemma-4-E2B-it on-device vision integration',
    '> copilot_flow: Cursor · Claude Code · Automated Quality Gates',
  ],
  help: ['Available commands: whoami, stack, metrics, ai, clear'],
};

export default function About() {
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<{ cmd: string; output: string[] }[]>([
    {
      cmd: 'manifest --verify',
      output: [
        '> GT_CORE_v9.4 initialized [99.95% SLA verified]',
        '> Active focus: Clean Architecture · 120Hz Shaders · On-Device SLMs',
        '> Type or click a command below to inspect system specs.',
      ],
    },
  ]);

  const handleCommand = (cmdStr: string) => {
    const trimmed = cmdStr.trim().toLowerCase();
    if (!trimmed) return;
    if (trimmed === 'clear') {
      setHistory([]);
      setInputVal('');
      return;
    }
    const result =
      TERMINAL_DATA[trimmed] || [
        `> unknown command '${trimmed}'. Try: whoami, stack, metrics, ai, clear`,
      ];
    setHistory((prev) => [...prev.slice(-4), { cmd: trimmed, output: result }]);
    setInputVal('');
  };

  return (
    <section id="about" className="relative py-16 sm:py-20 bg-transparent overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-cyan-500/[0.04] rounded-full blur-[140px]" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-indigo-500/[0.04] rounded-full blur-[140px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          transition={{ duration: 0.7 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10"
        >
          <div>
            <span className="font-mono-tech text-xs uppercase tracking-[0.28em] text-cyan-400">
              // 01. Engineering_Principles
            </span>
            <h2 className="font-section-title text-4xl sm:text-5xl font-bold tracking-tight text-white mt-2 mb-3">
              Architectural <span className="text-primary">Philosophy</span>
            </h2>
            <p className="max-w-xl text-sm sm:text-base text-slate-400 leading-relaxed font-light">
              For over nine years as a senior mobile developer, I have treated code as an engine of
              precision: sub-200ms cold starts, deterministic state machines, and zero memory leaks.
            </p>
          </div>
          <div className="text-6xl font-black text-white/5 select-none hidden md:block">
            MANIFEST
          </div>
        </motion.div>

        {/* 4 Engineering Standards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {STANDARDS.map((p, idx) => (
            <motion.div
              key={idx}
              
              
              
              transition={{ delay: idx * 0.1, duration: 0.6 }}
              className="spatial-glass rounded-2xl p-6 border-white/10 hover:border-cyan-400/40 transition-colors flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 group-hover:border-cyan-400/30 transition-colors">
                    {p.icon}
                  </div>
                  <span className="font-mono-tech text-[10px] text-cyan-300 font-semibold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-400/20">
                    {p.metric}
                  </span>
                </div>
                <h3 className="font-display font-bold text-lg text-white group-hover:text-cyan-300 transition-colors">
                  {p.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-2 font-light leading-relaxed">
                  {p.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Dual Interactive Shell & Verification Deck */}
        <div className="grid lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Production Rigor Card */}
          <div className="lg:col-span-5 spatial-glass rounded-3xl p-6 sm:p-8 border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-mono-tech text-xs text-emerald-300 uppercase tracking-wider font-semibold">
                  Zero-Regression Quality Gates
                </span>
              </div>
              <h3 className="font-display font-bold text-2xl text-white">
                How Senior Work Is Delivered
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-3 font-light leading-relaxed">
                Great mobile products aren&apos;t just coded — they are engineered with verifiable
                invariants. Every feature delivered to production undergoes strict automated
                profiling before release.
              </p>

              <div className="space-y-3 mt-6">
                {[
                  {
                    title: 'Memory Leak Audits',
                    detail: 'LeakCanary runtimes verify 0 leaked Activities, Fragments, and Composables.',
                  },
                  {
                    title: 'Frame-Pacing Profiler',
                    detail: 'Impeller engine traces verify 120 FPS rasterization with 0 dropped frames.',
                  },
                  {
                    title: 'Encrypted Media Streaming',
                    detail: 'AWS CloudFront Signed Cookies prevent token leakage and unauthorized edge access.',
                  },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-mono-tech text-xs text-white font-semibold">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-light">
                        {item.detail}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between font-mono-tech text-xs text-slate-400">
              <span>99.95% Crash-Free SLA</span>
              <span className="text-cyan-400">150K+ Users In Production</span>
            </div>
          </div>

          {/* Right: Embedded Interactive Telemetry Terminal */}
          <div className="lg:col-span-7 spatial-glass rounded-3xl p-6 sm:p-8 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <TerminalIcon className="w-4 h-4 text-cyan-400" />
                  <span className="font-mono-tech text-xs text-slate-200 font-semibold">
                    SYSTEM_TELEMETRY_SHELL
                  </span>
                </div>
                <span className="font-mono-tech text-[10px] text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-400/30">
                  ACTIVE_SESSION
                </span>
              </div>

              {/* Quick Command Chips */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="font-mono-tech text-[10px] text-slate-400">Quick queries:</span>
                {['whoami', 'stack', 'metrics', 'ai', 'clear'].map((cmd) => (
                  <button
                    key={cmd}
                    type="button"
                    onClick={() => handleCommand(cmd)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-400/40 text-slate-300 hover:text-cyan-300 font-mono-tech text-xs transition-colors cursor-pointer"
                  >
                    ${cmd}
                  </button>
                ))}
              </div>

              {/* Terminal Screen / Log Output */}
              <div className="h-64 sm:h-72 overflow-y-auto rounded-xl bg-black/70 p-4 font-mono-tech text-xs space-y-3 border border-white/10 shadow-inner">
                {history.map((h, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                      <span className="text-slate-500">govind@gateway:~$</span>
                      <span>{h.cmd}</span>
                    </div>
                    {h.output.map((line, j) => (
                      <div
                        key={j}
                        className={
                          line.startsWith('>')
                            ? 'text-slate-300 pl-3 border-l border-cyan-400/30 leading-relaxed'
                            : 'text-slate-400 pl-3 leading-relaxed'
                        }
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Input Line */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCommand(inputVal);
              }}
              className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2"
            >
              <span className="font-mono-tech text-xs text-cyan-400">❯</span>
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Type command (e.g. whoami, stack, metrics)..."
                className="flex-1 bg-transparent border-0 border-b border-white/15 focus:border-cyan-400 px-1 py-1 font-mono-tech text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
              <button
                type="submit"
                className="p-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
