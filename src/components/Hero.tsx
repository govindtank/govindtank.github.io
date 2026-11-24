import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Github,
  Linkedin,
  Mail,
  ArrowRight,
  Layers,
  Zap,
  Play,
  Rotate3d,
  Cpu,
  CheckCircle2,
  Workflow,
  Sparkles,
  GitBranch,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import TechnicalPortraitVisualizer from './TechnicalPortraitVisualizer';
import { ThemeMode } from '../types';

interface HeroProps {
  theme: ThemeMode;
  motionEnabled: boolean;
  exploded: boolean;
  onToggleExplode: () => void;
}

const STATS = [
  {
    value: '9+ YRS',
    label: 'Mobile Systems Tenure',
    detail: 'Android · Flutter · IoT',
  },
  {
    value: '150K+',
    label: 'Production Reach',
    detail: 'Active Users & Downloads',
  },
  {
    value: '99.95%',
    label: 'Runtime Stability',
    detail: 'Crash-Free Session SLA',
  },
  {
    value: '535',
    label: 'Open Repositories',
    detail: 'Public Engineering Artifacts',
  },
];

const AGILE_STAGES = [
  {
    id: 'plan',
    step: '01',
    title: 'Domain Modeling & Sprint Planning',
    short: 'Architecture Sprint',
    description:
      'Feature slicing in 2-week agile sprints, strict Clean Domain boundaries, BLoC/MVVM deterministic state machines, and non-negotiable 8.3ms frame budgets.',
    metric: 'Sprint Cadence: 2-Week Agile',
    tags: ['Domain-Driven Design', 'BLoC Pattern', 'Frame Budgets', 'Jira / Linear'],
  },
  {
    id: 'build',
    step: '02',
    title: 'High-Performance Native Engineering',
    short: 'Impeller Native',
    description:
      'Writing Kotlin 2.x coroutines, custom AGSL fragment shaders, Flutter Impeller rendering pipelines, and NDK C++ audio/spatial bridges.',
    metric: 'Frame Pacing: 120 FPS Locked',
    tags: ['Kotlin 2.x', 'Flutter Impeller', 'AGSL Shaders', 'Android Auto'],
  },
  {
    id: 'verify',
    step: '03',
    title: 'Automated Quality Gates & CI/CD',
    short: '0-Leak Verification',
    description:
      'Automated LeakCanary heap audits, golden widget regression tests, Memory Profiler benchmarking, and pre-commit security scans.',
    metric: 'Memory Leaks: 0.00 MB SLA',
    tags: ['LeakCanary', 'Golden Tests', 'CI Quality Gates', 'Static Analysis'],
  },
  {
    id: 'ship',
    step: '04',
    title: 'Staged Production Delivery & Telemetry',
    short: '150K+ Scaled Rollout',
    description:
      'Gradual staged rollout to 150K+ production users with AWS CloudFront signed cookies, real-time MQTT telemetry, and real-time crash alerting.',
    metric: 'Stability: 99.95% Crash-Free',
    tags: ['Staged Rollout', 'CloudFront Signed Cookies', 'MQTT Sockets', 'Google Play'],
  },
];

export default function Hero({
  theme,
  motionEnabled,
  exploded,
  onToggleExplode,
}: HeroProps) {
  const [activeAgileStage, setActiveAgileStage] = useState(0);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const curStage = AGILE_STAGES[activeAgileStage];

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center pt-24 pb-14 overflow-hidden bg-transparent"
    >
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-cyan-500/10 blur-[140px]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-indigo-500/10 blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-blue-600/[0.03] blur-[160px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Title, Subhead, Intro & Agile Delivery HUD */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7 flex flex-col items-start text-left"
          >
            {/* Command Badge */}
            <div className="flex items-center gap-2.5 mb-4 flex-wrap">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full spatial-glass border-white/10 font-mono-tech text-xs text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>LEAD @ RYSUN LABS</span>
              </span>
              <span className="font-mono-tech text-xs tracking-wider text-cyan-400 font-semibold">
                // Govind Tank · Lead Mobile Systems Engineer
              </span>
            </div>

            {/* Signature High-Impact Title Typography */}
            <div className="space-y-2 mb-4 relative group">
              <div className="flex items-center gap-2 mb-1.5 font-mono-tech text-[10px] text-cyan-400/80 tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>[SYS.ENGINEERING // 120Hz_IMPELLER_RUNTIME]</span>
              </div>
              <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-[5.75rem] font-black leading-[0.85] tracking-tighter text-white font-sans uppercase select-none">
                <motion.div
                  animate={{
                    textShadow: [
                      'none',
                      '2px 2px 0px #0ea5e9, -2px -2px 0px #6366f1',
                      'none',
                    ],
                    x: [0, -2, 2, 0],
                  }}
                  transition={{ duration: 0.1, repeat: Infinity, repeatDelay: 4 }}
                >
                  GOVIND
                </motion.div>
                <div className="relative inline-block mt-2">
                  <span
                    className="text-transparent block hover:text-cyan-400/90 transition-all duration-300 cursor-default"
                    style={{ WebkitTextStroke: '1.5px rgba(255, 255, 255, 0.4)' }}
                  >
                    TANK.
                  </span>
                  <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 via-indigo-500 to-transparent opacity-70 group-hover:opacity-100 transition-opacity" />
                </div>
              </h1>
            </div>

            {/* Subhead with Grounded Designation */}
            <div className="font-mono-tech text-sm sm:text-base text-cyan-300 font-semibold tracking-wide mt-2">
              Lead Mobile Systems Engineer · Android &amp; Flutter Specialist
            </div>

            {/* Narrative Description */}
            <p className="mt-3.5 text-slate-300/90 text-sm sm:text-base leading-relaxed max-w-2xl font-light">
              Engineering zero-leak mobile runtimes, custom GPU fragment shaders, and offline on-device
              AI pipelines. Over <strong className="text-white font-medium">9+ years</strong>{' '}
              delivering rock-solid Android, Flutter, and IoT products into 120Hz experiences scaled
              to <strong className="text-white font-medium">150K+ production users</strong>.
            </p>

            {/* Spectacular Agile Engineering Delivery HUD */}
            <div className="w-full mt-7 p-4 sm:p-5 rounded-2xl spatial-glass border-white/10 shadow-xl">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                <div className="flex items-center gap-2 font-mono-tech text-xs">
                  <Workflow className="w-4 h-4 text-cyan-400" />
                  <span className="text-white font-bold tracking-wide">
                    AGILE ENGINEERING METHODOLOGY
                  </span>
                </div>
                <span className="font-mono-tech text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-400/30">
                  {curStage.metric}
                </span>
              </div>

              {/* Agile Stage Selectors */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                {AGILE_STAGES.map((stg, i) => (
                  <button
                    key={stg.id}
                    type="button"
                    onClick={() => setActiveAgileStage(i)}
                    className={`p-2 rounded-xl text-left font-mono-tech transition-all cursor-pointer ${
                      activeAgileStage === i
                        ? 'bg-cyan-500/20 border border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                        : 'bg-white/5 border border-white/5 hover:bg-white/10 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={activeAgileStage === i ? 'text-cyan-300 font-bold' : 'text-slate-500'}>
                        {stg.step}
                      </span>
                      {activeAgileStage === i && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />}
                    </div>
                    <div className="text-[11px] font-bold text-white truncate mt-0.5">
                      {stg.short}
                    </div>
                  </button>
                ))}
              </div>

              {/* Active Stage Detail */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={curStage.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-2 pt-1"
                >
                  <div className="text-xs text-slate-300 leading-relaxed font-light">
                    {curStage.description}
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {curStage.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono-tech text-[10px] text-cyan-200"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Action Buttons */}
            <div className="mt-7 flex flex-wrap items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => scrollTo('projects')}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 text-slate-950 font-mono-tech text-xs font-bold tracking-wider uppercase hover:opacity-95 transition-opacity shadow-[0_0_28px_rgba(34,211,238,0.35)] flex items-center gap-2 cursor-pointer"
              >
                <span>Explore Vault</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => scrollTo('sandbox')}
                className="px-6 py-3 rounded-full spatial-glass border-white/15 hover:border-cyan-400/40 text-slate-200 hover:text-cyan-300 font-mono-tech text-xs font-semibold tracking-wider uppercase transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>Interactive 3D Labs</span>
              </button>
            </div>

            {/* Social Verified Links */}
            <div className="mt-6 flex items-center gap-3 text-slate-400 flex-wrap">
              <a
                href="https://github.com/govindtank"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full spatial-glass border-white/10 hover:border-cyan-400/40 hover:text-cyan-300 transition-colors"
                title="GitHub (@govindtank)"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://www.linkedin.com/in/govindtank/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full spatial-glass border-white/10 hover:border-cyan-400/40 hover:text-cyan-300 transition-colors"
                title="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="mailto:govindtank600@gmail.com"
                className="p-2.5 rounded-full spatial-glass border-white/10 hover:border-cyan-400/40 hover:text-cyan-300 transition-colors"
                title="Email Govind"
              >
                <Mail className="w-4 h-4" />
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=com.govindtank.portfolio"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-full spatial-glass border-white/10 hover:border-cyan-400/40 font-mono-tech text-xs text-slate-300 hover:text-cyan-300 transition-colors inline-flex items-center gap-1.5"
                title="Google Play Portfolio App"
              >
                <Play className="w-3 h-3 text-cyan-400" />
                <span>Play Store App</span>
              </a>
            </div>

            {/* 4 Telemetry Metrics Cards */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
              {STATS.map((stat, i) => (
                <div
                  key={i}
                  className="spatial-glass rounded-2xl p-3 border-white/10 flex flex-col justify-between hover:border-cyan-400/30 transition-colors group"
                >
                  <div className="font-display font-extrabold text-2xl text-white tracking-tight group-hover:text-cyan-300 transition-colors">
                    {stat.value}
                  </div>
                  <div className="mt-1">
                    <div className="font-mono-tech text-[10px] text-slate-300 font-semibold leading-tight">
                      {stat.label}
                    </div>
                    <div className="font-mono-tech text-[9.5px] text-slate-400 mt-0.5 truncate">
                      {stat.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Column: Interactive 3D Technical Portrait Visualizer */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="lg:col-span-5 w-full flex flex-col items-center"
          >
            <TechnicalPortraitVisualizer theme={theme} motionEnabled={motionEnabled} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
