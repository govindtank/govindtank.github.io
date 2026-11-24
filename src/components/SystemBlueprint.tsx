import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Activity, BrainCircuit, Code2, Cpu, Database, Package, Radio, Sparkles, Zap } from 'lucide-react';

type BlueprintNode = {
  id: string;
  label: string;
  short: string;
  detail: string;
  metric: string;
  icon: React.ReactNode;
  color: 'cyan' | 'violet' | 'emerald' | 'amber';
  position: string;
};

const NODES: BlueprintNode[] = [
  {
    id: 'android',
    label: 'ANDROID',
    short: 'Kotlin / NDK',
    detail: 'Native performance, lifecycle resilience, and platform-level control.',
    metric: 'CORE / 01',
    icon: <Cpu className="h-3.5 w-3.5" />,
    color: 'cyan',
    position: 'node-android',
  },
  {
    id: 'flutter',
    label: 'FLUTTER',
    short: 'Dart / UI',
    detail: 'Expressive interfaces with deliberate state, motion, and frame budgets.',
    metric: 'SURFACE / 02',
    icon: <Code2 className="h-3.5 w-3.5" />,
    color: 'violet',
    position: 'node-flutter',
  },
  {
    id: 'ai',
    label: 'AI SYSTEMS',
    short: 'Edge / Agents',
    detail: 'Private, useful intelligence brought closer to the device and the user.',
    metric: 'INTELLIGENCE / 03',
    icon: <BrainCircuit className="h-3.5 w-3.5" />,
    color: 'amber',
    position: 'node-ai',
  },
  {
    id: 'packages',
    label: 'PACKAGES',
    short: 'Dart / pub.dev',
    detail: 'Focused tools that turn repeated engineering problems into reusable primitives.',
    metric: 'TOOLING / 04',
    icon: <Package className="h-3.5 w-3.5" />,
    color: 'emerald',
    position: 'node-packages',
  },
];

const colorMap = {
  cyan: { accent: '#22d3ee', soft: 'rgba(34, 211, 238, 0.18)', line: 'rgba(34, 211, 238, 0.5)' },
  violet: { accent: '#a78bfa', soft: 'rgba(167, 139, 250, 0.18)', line: 'rgba(167, 139, 250, 0.5)' },
  amber: { accent: '#fbbf24', soft: 'rgba(251, 191, 36, 0.18)', line: 'rgba(251, 191, 36, 0.5)' },
  emerald: { accent: '#34d399', soft: 'rgba(52, 211, 153, 0.18)', line: 'rgba(52, 211, 153, 0.5)' },
};

export default function SystemBlueprint() {
  const [activeId, setActiveId] = useState('android');
  const active = useMemo(() => NODES.find((node) => node.id === activeId) || NODES[0], [activeId]);
  const activeColor = colorMap[active.color];

  return (
    <div className="blueprint-shell" aria-label="Interactive mobile systems blueprint">
      <div className="blueprint-grid" />
      <div className="blueprint-noise" />

      <div className="blueprint-topline">
        <span className="blueprint-kicker"><span className="blueprint-live-dot" /> SYSTEM_MAP / INTERACTIVE</span>
        <span className="blueprint-coordinates">GT // 04.2026</span>
      </div>

      <svg className="blueprint-routes" viewBox="0 0 600 600" role="img" aria-label="Animated connections between mobile engineering capabilities">
        <defs>
          <filter id="blueprintGlow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <radialGradient id="coreGlow"><stop offset="0" stopColor="#38bdf8" stopOpacity="0.26" /><stop offset="1" stopColor="#38bdf8" stopOpacity="0" /></radialGradient>
        </defs>
        <circle cx="300" cy="300" r="185" fill="url(#coreGlow)" />
        <motion.circle cx="300" cy="300" r="208" fill="none" stroke="rgba(148,163,184,0.16)" strokeDasharray="2 12" animate={{ rotate: 360 }} transition={{ duration: 32, repeat: Infinity, ease: 'linear' }} style={{ transformOrigin: '300px 300px' }} />
        <motion.circle cx="300" cy="300" r="148" fill="none" stroke="rgba(56,189,248,0.18)" strokeDasharray="80 22 2 22" animate={{ rotate: -360 }} transition={{ duration: 22, repeat: Infinity, ease: 'linear' }} style={{ transformOrigin: '300px 300px' }} />
        <path d="M300 300 C245 238 160 170 92 137" className="blueprint-route blueprint-route-cyan" />
        <path d="M300 300 C355 238 440 170 508 137" className="blueprint-route blueprint-route-violet" />
        <path d="M300 300 C245 362 160 430 92 463" className="blueprint-route blueprint-route-emerald" />
        <path d="M300 300 C355 362 440 430 508 463" className="blueprint-route blueprint-route-amber" />
        <motion.circle cx="300" cy="300" r="8" fill={activeColor.accent} filter="url(#blueprintGlow)" animate={{ r: [7, 10, 7], opacity: [0.7, 1, 0.7] }} transition={{ duration: 2.4, repeat: Infinity }} />
        <circle cx="300" cy="300" r="28" fill="none" stroke={activeColor.line} strokeDasharray="3 5" />
      </svg>

      <div className="blueprint-core" aria-live="polite">
        <div className="blueprint-core-ring" style={{ borderColor: activeColor.line, boxShadow: `0 0 38px ${activeColor.soft}` }}>
          <div className="blueprint-core-screen">
            <div className="blueprint-screen-notch" />
            <Activity className="h-5 w-5" style={{ color: activeColor.accent }} />
            <span>BUILD</span>
            <strong>WITH INTENT</strong>
            <div className="blueprint-screen-bars"><i /><i /><i /><i /></div>
          </div>
        </div>
        <span className="blueprint-core-label">MOBILE SYSTEM</span>
        <span className="blueprint-core-status">SIGNAL: {active.label}</span>
      </div>

      {NODES.map((node) => {
        const colors = colorMap[node.color];
        const isActive = active.id === node.id;
        return (
          <motion.button
            key={node.id}
            type="button"
            className={`blueprint-node ${node.position} ${isActive ? 'is-active' : ''}`}
            style={{ '--node-accent': colors.accent, '--node-soft': colors.soft } as React.CSSProperties}
            onMouseEnter={() => setActiveId(node.id)}
            onFocus={() => setActiveId(node.id)}
            onClick={() => setActiveId(node.id)}
            aria-label={`Inspect ${node.label}: ${node.detail}`}
            aria-pressed={isActive}
          >
            <span className="blueprint-node-icon">{node.icon}</span>
            <span className="blueprint-node-copy"><strong>{node.label}</strong><small>{node.short}</small></span>
            <span className="blueprint-node-pulse" />
          </motion.button>
        );
      })}

      <motion.div className="blueprint-readout" key={active.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
        <div className="blueprint-readout-top"><span style={{ color: activeColor.accent }}>{active.metric}</span><Sparkles className="h-3 w-3" style={{ color: activeColor.accent }} /></div>
        <p>{active.detail}</p>
        <div className="blueprint-readout-progress"><span style={{ background: activeColor.accent, width: active.id === 'android' ? '92%' : active.id === 'flutter' ? '86%' : active.id === 'ai' ? '78%' : '88%' }} /></div>
      </motion.div>

      <div className="blueprint-footer"><span><Radio className="h-3 w-3" /> Hover / focus nodes to inspect</span><span><Database className="h-3 w-3" /> 04 MODULES ONLINE</span></div>
    </div>
  );
}
