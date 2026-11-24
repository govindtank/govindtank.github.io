import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  Activity,
  MapPin,
  Sparkles,
  Layers,
  Cpu,
  Rotate3d,
} from 'lucide-react';
import { ThemeMode } from '../types';

interface TechnicalPortraitVisualizerProps {
  theme: ThemeMode;
  motionEnabled: boolean;
}

export default function TechnicalPortraitVisualizer({
  theme,
  motionEnabled,
}: TechnicalPortraitVisualizerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const cardRef = useRef<HTMLDivElement | null>(null);

  // Smooth 3D Perspective Mouse Tracker with Specular Reflection Physics
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = -((y - centerY) / centerY) * 8;
    const rotY = ((x - centerX) / centerX) * 8;

    setRotate({ x: rotX, y: rotY });
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setRotate({ x: 0, y: 0 });
    setIsHovered(false);
  }, []);

  return (
    <div className="w-full relative perspective-1000 select-none">
      {/* 3D Tilting Editorial Glass Card */}
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        animate={{
          rotateX: motionEnabled ? rotate.x : 0,
          rotateY: motionEnabled ? rotate.y : 0,
          scale: isHovered ? 1.015 : 1.0,
        }}
        transition={{
          type: 'spring',
          stiffness: 240,
          damping: 26,
          mass: 0.7,
        }}
        className="relative w-full rounded-3xl p-4 sm:p-5 spatial-glass border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.85)] preserve-3d overflow-visible group"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Dynamic Specular Glass Sheen on Hover */}
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none z-30 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle 380px at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.08), transparent 70%)`,
          }}
          aria-hidden="true"
        />

        {/* Top Identification Strip */}
        <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-white/10 font-mono-tech text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-200 font-semibold tracking-wider text-xs">
              LEAD MOBILE SYSTEMS ENGINEER
            </span>
          </div>

          <span className="font-mono-tech text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-400/20">
            L2 @ RYSUN LABS
          </span>
        </div>

        {/* Photo Viewport Container */}
        <div className="relative w-full h-[410px] sm:h-[460px] rounded-2xl bg-[#070b14] overflow-hidden border border-white/10 flex items-center justify-center">
          {/* Subtle Ambient Backlight Glow */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050811] via-transparent to-cyan-500/10 pointer-events-none" />

          {/* Full High-Definition Portrait Photo */}
          <div className="relative w-full h-full overflow-hidden bg-slate-900 flex items-center justify-center">
            <img
              src="/profile_one.png"
              alt="Govind Tank - Lead Mobile Systems Engineer"
              className="w-full h-full object-cover object-top filter contrast-105 brightness-100 transition-transform duration-700 group-hover:scale-103"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://avatars.githubusercontent.com/u/8425888?v=4';
              }}
            />

            {/* Subtle Gradient Vignette Rim */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20 pointer-events-none" />

            {/* Bottom Integrated Frosted Metadata Plate */}
            <div className="absolute bottom-3 inset-x-3 p-3.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-white/10 flex items-center justify-between text-xs font-mono-tech">
              <div>
                <div className="font-display font-bold text-sm text-white tracking-tight">
                  Govind Tank
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  <span>Ahmedabad, India · [23.02° N, 72.57° E]</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-cyan-300 font-bold text-[11px]">9+ Years Tenure</div>
                <div className="text-[10px] text-slate-400">150K+ Scaled Users</div>
              </div>
            </div>
          </div>
        </div>

        {/* 3D Floating Telemetry Badges in Z-Space */}
        <div
          className="absolute -top-3 -right-2 sm:-right-3 px-3 py-1.5 rounded-xl bg-slate-900/95 border border-cyan-400/40 shadow-2xl backdrop-blur-md font-mono-tech text-[10px] text-cyan-300 flex items-center gap-1.5"
          style={{ transform: 'translateZ(40px)' }}
        >
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="font-bold">VERIFIED PUB.DEV PUBLISHER</span>
        </div>

        {/* Bottom Interactive Telemetry */}
        <div className="flex items-center justify-between pt-3 mt-1 text-slate-400 font-mono-tech text-[10px]">
          <span className="inline-flex items-center gap-1 text-slate-400">
            <Rotate3d className="w-3 h-3 text-cyan-400" />
            <span>Interactive 3D spatial perspective</span>
          </span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Ready for Production</span>
          </span>
        </div>
      </motion.div>
    </div>
  );
}
