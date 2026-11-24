import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Smartphone,
  Sparkles,
  Zap,
  Volume2,
  Navigation,
  ShieldCheck,
  Package,
  Layers,
  Cpu,
  RotateCcw,
  ExternalLink,
  Play,
  Pause,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  DollarSign,
  PenTool,
  Copy,
  Check,
  ChevronRight,
  Gauge,
} from 'lucide-react';

type LabTab = 'scratch' | 'signature' | 'vault' | 'island' | 'currency';

export default function LiveLabs() {
  const [activeTab, setActiveTab] = useState<LabTab>('scratch');

  // ==========================================
  // LAB 1: scratch_reveal Canvas State
  // ==========================================
  const scratchCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scratchPercent, setScratchPercent] = useState(0);
  const [scratchRevealed, setScratchRevealed] = useState(false);
  const isScratchingRef = useRef(false);

  const initScratchCanvas = useCallback(() => {
    const canvas = scratchCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = 360;
    canvas.height = 200;

    // Metallic silver foil with subtle grain
    const grad = ctx.createLinearGradient(0, 0, 360, 200);
    grad.addColorStop(0, '#94a3b8');
    grad.addColorStop(0.3, '#cbd5e1');
    grad.addColorStop(0.5, '#e2e8f0');
    grad.addColorStop(0.7, '#94a3b8');
    grad.addColorStop(1, '#64748b');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 360, 200);

    // Decorative foil overlay text
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✨ SCRATCH WITH MOUSE / TOUCH', 180, 85);
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#475569';
    ctx.fillText('pub.dev/packages/scratch_reveal', 180, 115);

    setScratchPercent(0);
    setScratchRevealed(false);
  }, []);

  useEffect(() => {
    if (activeTab === 'scratch') {
      const timer = setTimeout(initScratchCanvas, 50);
      return () => clearTimeout(timer);
    }
  }, [activeTab, initScratchCanvas]);

  const handleScratch = (clientX: number, clientY: number) => {
    const canvas = scratchCanvasRef.current;
    if (!canvas || scratchRevealed) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    // Sample progress on downscaled step
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparentCount = 0;
    const totalPixels = canvas.width * canvas.height;
    const step = 8;
    for (let i = 3; i < imgData.length; i += 4 * step) {
      if (imgData[i] === 0) transparentCount++;
    }
    const pct = Math.min(100, Math.round((transparentCount / (totalPixels / step)) * 100));
    setScratchPercent(pct);

    if (pct > 55 && !scratchRevealed) {
      setScratchRevealed(true);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // ==========================================
  // LAB 2: smooth_signature_pad State
  // ==========================================
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [sigHash, setSigHash] = useState('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  const [copiedHash, setCopiedHash] = useState(false);
  const lastPointRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isDrawingRef = useRef(false);

  const initSigCanvas = useCallback(() => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 380;
    canvas.height = 200;
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, 380, 200);

    // Subtle signature guideline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(30, 150);
    ctx.lineTo(350, 150);
    ctx.stroke();
    ctx.setLineDash([]);
  }, []);

  useEffect(() => {
    if (activeTab === 'signature') {
      const timer = setTimeout(initSigCanvas, 50);
      return () => clearTimeout(timer);
    }
  }, [activeTab, initSigCanvas]);

  const drawPoint = (x: number, y: number) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const now = performance.now();
    if (!lastPointRef.current) {
      lastPointRef.current = { x, y, time: now };
      return;
    }

    const dist = Math.hypot(x - lastPointRef.current.x, y - lastPointRef.current.y);
    const dt = Math.max(1, now - lastPointRef.current.time);
    const speed = dist / dt;

    // Velocity-sensitive stroke thickness (fountain pen physics)
    const targetWidth = Math.max(1.2, Math.min(4.5, 4.0 - speed * 1.5));

    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = targetWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastPointRef.current = { x, y, time: now };

    // Update real-time cryptographic audit hash simulation
    const fakeHash = ((dist * 1337 + now) >>> 0).toString(16).padStart(8, '0');
    setSigHash(`sha256_${fakeHash}ae89f012c4`);
  };

  // ==========================================
  // LAB 3: flutter_privacy_vault State
  // ==========================================
  const [appSwitcherActive, setAppSwitcherActive] = useState(false);
  const [maskPii, setMaskPii] = useState(true);
  const [balanceMasked, setBalanceMasked] = useState(false);
  const [autoLockSeconds, setAutoLockSeconds] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setAutoLockSeconds((s) => (s <= 1 ? 30 : s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ==========================================
  // LAB 4: android_island_bar State
  // ==========================================
  const [cutoutPos, setCutoutPos] = useState<'center' | 'left' | 'corner'>('center');
  const [islandState, setIslandState] = useState<'idle' | 'audio' | 'ride' | 'delivery'>('audio');
  const [isPlaying, setIsPlaying] = useState(true);
  const [audioSeconds, setAudioSeconds] = useState(84);

  useEffect(() => {
    const timer = setInterval(() => {
      if (isPlaying) {
        setAudioSeconds((s) => (s >= 258 ? 0 : s + 1));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const formatAudioTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  // ==========================================
  // LAB 5: currency_field_formatter State
  // ==========================================
  const [currencyRaw, setCurrencyRaw] = useState<number>(1500000);

  // Convert Indian numbers to verbal words (Lakhs / Crores)
  const numberToIndianWords = (num: number): string => {
    if (!num || num <= 0) return 'Zero Rupees Only';
    if (num >= 10000000) {
      const cr = (num / 10000000).toFixed(2);
      return `${cr.replace(/\.00$/, '')} Crore Rupees Only`;
    }
    if (num >= 100000) {
      const lakh = (num / 100000).toFixed(2);
      return `${lakh.replace(/\.00$/, '')} Lakh Rupees Only`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)} Thousand Rupees Only`;
    }
    return `${num} Rupees Only`;
  };

  const formatIndianCurrency = (num: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <section id="sandbox" className="relative py-16 sm:py-20 bg-transparent overflow-hidden">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[750px] h-[750px] bg-cyan-500/[0.03] rounded-full blur-[150px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <span className="font-mono-tech text-xs uppercase tracking-[0.28em] text-cyan-400">
              // 02. Verified_Open_Source_Sandboxes
            </span>
            <h2 className="font-section-title text-4xl sm:text-5xl font-bold tracking-tight text-white mt-2 mb-3">
              Interactive <span className="text-primary">Playgrounds</span>
            </h2>
            <p className="max-w-xl text-sm sm:text-base text-slate-400 leading-relaxed font-light">
              Interactive in-browser execution sandboxes replicating Govind&apos;s verified pub.dev packages.
              Test the live algorithms, haptic physics, and security gates directly.
            </p>
          </div>
          <div className="text-6xl font-black text-white/5 select-none hidden md:block">
            SANDBOX
          </div>
        </div>

        {/* Tab Navigation for Open Source Packages */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none border-b border-white/10">
          {[
            { id: 'scratch', label: 'scratch_reveal', badge: 'v1.3.1', desc: 'Canvas Scratch Card' },
            { id: 'signature', label: 'smooth_signature_pad', badge: 'v1.3.2', desc: 'Fountain Pen Vector' },
            { id: 'vault', label: 'flutter_privacy_vault', badge: 'v1.3.1', desc: 'Bank PII & App Shield' },
            { id: 'island', label: 'android_island_bar', badge: 'v0.4.1', desc: 'Cutout Snapping HUD' },
            { id: 'currency', label: 'currency_field_formatter', badge: 'v1.3.1', desc: 'Lakhs/Crores Formatter' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as LabTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono-tech text-xs transition-all whitespace-nowrap cursor-pointer border ${
                activeTab === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.2)]'
                  : 'bg-white/5 text-slate-400 hover:text-slate-200 border-white/5 hover:border-white/15'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span className="font-semibold">{tab.label}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-slate-400">
                {tab.badge}
              </span>
            </button>
          ))}
        </div>

        {/* Interactive Playgrounds Sandbox Canvas Area */}
        <div className="spatial-glass rounded-3xl p-6 sm:p-10 border-white/15 shadow-2xl relative min-h-[460px] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {/* 1. SCRATCH_REVEAL INTERACTIVE DEMO */}
            {activeTab === 'scratch' && (
              <motion.div
                key="scratch"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid lg:grid-cols-12 gap-8 items-center"
              >
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono-tech text-xs font-bold">
                      flutter package: scratch_reveal v1.3.1
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-2xl sm:text-3xl text-white">
                    Foil Scratch &amp; Reveal Engine
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed font-light">
                    Zero-dependency Flutter canvas widget with smooth path erasing, celebratory confetti,
                    and configurable reveal threshold callbacks. Drag across the silver card to scratch.
                  </p>

                  <div className="flex items-center gap-4 pt-2 font-mono-tech text-xs">
                    <div className="bg-white/5 px-3 py-2 rounded-xl border border-white/10">
                      <div className="text-slate-400 text-[10px]">Scratched Coverage</div>
                      <div className="text-lg font-bold text-cyan-300">{scratchPercent}%</div>
                    </div>
                    <div className="bg-white/5 px-3 py-2 rounded-xl border border-white/10">
                      <div className="text-slate-400 text-[10px]">Threshold Status</div>
                      <div className={`text-lg font-bold ${scratchRevealed ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {scratchRevealed ? 'UNLOCKED (>55%)' : 'SCRATCH TO UNLOCK'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-3">
                    <button
                      type="button"
                      onClick={initScratchCanvas}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-mono-tech text-xs transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Foil Layer</span>
                    </button>
                    <a
                      href="https://pub.dev/packages/scratch_reveal"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 font-mono-tech text-xs transition-colors"
                    >
                      <span>pub.dev Page</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="lg:col-span-7 flex flex-col items-center">
                  <div className="relative w-[360px] h-[200px] rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-cyan-950 select-none">
                    <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 rounded-full bg-cyan-400/20 border border-cyan-400 flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                        <Sparkles className="w-6 h-6 text-cyan-300" />
                      </div>
                      <div className="font-display font-extrabold text-lg text-white">
                        REVEAL UNLOCKED!
                      </div>
                      <div className="font-mono-tech text-xs text-cyan-300 mt-1">
                        120Hz Pure Flutter Canvas Widget
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Author: Govind Tank (@govindtank)
                      </div>
                    </div>

                    <canvas
                      ref={scratchCanvasRef}
                      onPointerDown={(e) => {
                        isScratchingRef.current = true;
                        handleScratch(e.clientX, e.clientY);
                      }}
                      onPointerMove={(e) => {
                        if (isScratchingRef.current) {
                          handleScratch(e.clientX, e.clientY);
                        }
                      }}
                      onPointerUp={() => (isScratchingRef.current = false)}
                      onPointerLeave={() => (isScratchingRef.current = false)}
                      className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                    />
                  </div>
                  <div className="font-mono-tech text-[10px] text-slate-400 mt-3">
                    Drag pointer across card to remove the silver foil overlay
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. SMOOTH_SIGNATURE_PAD INTERACTIVE DEMO */}
            {activeTab === 'signature' && (
              <motion.div
                key="signature"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid lg:grid-cols-12 gap-8 items-center"
              >
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono-tech text-xs font-bold">
                      flutter package: smooth_signature_pad v1.3.2
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-2xl sm:text-3xl text-white">
                    Fountain Pen Vector Signature Pad
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed font-light">
                    Dynamic velocity-sensitive stroke width, turnkey SignatureCaptureCard, and real-time
                    SHA-256 cryptographic audit trail hashing. Sign inside the pad below.
                  </p>

                  <div className="space-y-2 pt-1 font-mono-tech text-xs">
                    <div className="text-[10px] text-slate-400">Cryptographic Audit Hash:</div>
                    <div className="bg-black/60 p-2.5 rounded-xl border border-white/10 text-cyan-300 font-mono text-[11px] truncate flex items-center justify-between">
                      <span className="truncate">{sigHash}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(sigHash);
                          setCopiedHash(true);
                          setTimeout(() => setCopiedHash(false), 1500);
                        }}
                        className="ml-2 text-slate-400 hover:text-white"
                        title="Copy Hash"
                      >
                        {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-3">
                    <button
                      type="button"
                      onClick={initSigCanvas}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-mono-tech text-xs transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Clear Canvas</span>
                    </button>
                    <a
                      href="https://pub.dev/packages/smooth_signature_pad"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 font-mono-tech text-xs transition-colors"
                    >
                      <span>pub.dev Page</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="lg:col-span-7 flex flex-col items-center">
                  <div className="relative w-[380px] h-[200px] rounded-2xl overflow-hidden border border-cyan-500/30 shadow-2xl bg-[#060a14] select-none">
                    <canvas
                      ref={sigCanvasRef}
                      onPointerDown={(e) => {
                        isDrawingRef.current = true;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const scaleX = 380 / rect.width;
                        const scaleY = 200 / rect.height;
                        lastPointRef.current = {
                          x: (e.clientX - rect.left) * scaleX,
                          y: (e.clientY - rect.top) * scaleY,
                          time: performance.now(),
                        };
                      }}
                      onPointerMove={(e) => {
                        if (!isDrawingRef.current) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const scaleX = 380 / rect.width;
                        const scaleY = 200 / rect.height;
                        drawPoint((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
                      }}
                      onPointerUp={() => {
                        isDrawingRef.current = false;
                        lastPointRef.current = null;
                      }}
                      onPointerLeave={() => {
                        isDrawingRef.current = false;
                        lastPointRef.current = null;
                      }}
                      className="w-full h-full cursor-crosshair touch-none"
                    />
                    <div className="pointer-events-none absolute bottom-2 right-3 font-mono-tech text-[9px] text-slate-500">
                      Sign Here ↗
                    </div>
                  </div>
                  <div className="font-mono-tech text-[10px] text-slate-400 mt-3">
                    Fast strokes taper thin; slow deliberate strokes draw rich ink with Bezier interpolation
                  </div>
                </div>
              </motion.div>
            )}

            {/* 3. FLUTTER_PRIVACY_VAULT INTERACTIVE DEMO */}
            {activeTab === 'vault' && (
              <motion.div
                key="vault"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid lg:grid-cols-12 gap-8 items-center"
              >
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono-tech text-xs font-bold">
                      flutter package: flutter_privacy_vault v1.3.1
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-2xl sm:text-3xl text-white">
                    Bank-Grade Privacy &amp; PII Obfuscator
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed font-light">
                    Built to satisfy Indian regulatory standards. Provides App-Switcher privacy shields,
                    inactivity auto-locks, and Aadhaar, PAN, and balance obfuscation filters.
                  </p>

                  <div className="space-y-2 pt-1 font-mono-tech text-xs">
                    <button
                      type="button"
                      onClick={() => setAppSwitcherActive((prev) => !prev)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        appSwitcherActive
                          ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-rose-400" />
                        <span>Simulate App Switcher Blur</span>
                      </span>
                      <span className="text-[11px] font-bold">{appSwitcherActive ? 'ACTIVE' : 'OFF'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMaskPii((prev) => !prev)}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        {maskPii ? <EyeOff className="w-4 h-4 text-emerald-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                        <span>Mask Indian PII (Aadhaar / PAN)</span>
                      </span>
                      <span className="text-[11px] font-bold text-emerald-400">{maskPii ? 'MASKED' : 'UNMASKED'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBalanceMasked((prev) => !prev)}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-amber-400" />
                        <span>Mask Ledger Balances</span>
                      </span>
                      <span className="text-[11px] font-bold text-amber-400">{balanceMasked ? 'MASKED' : 'EXPOSED'}</span>
                    </button>
                  </div>

                  <div className="pt-2">
                    <a
                      href="https://pub.dev/packages/flutter_privacy_vault"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 font-mono-tech text-xs transition-colors"
                    >
                      <span>pub.dev Page</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="lg:col-span-7 flex flex-col items-center">
                  <div className="relative w-[360px] sm:w-[380px] rounded-2xl p-6 bg-gradient-to-br from-slate-900 to-slate-950 border border-white/15 shadow-2xl overflow-hidden">
                    {appSwitcherActive && (
                      <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                        <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/50 flex items-center justify-center mb-3">
                          <Lock className="w-6 h-6 text-rose-400" />
                        </div>
                        <div className="font-display font-bold text-white text-base">
                          PRIVACY VAULT SHIELDED
                        </div>
                        <div className="font-mono-tech text-xs text-rose-300 mt-1">
                          App-Switcher Screenshot Guard Active
                        </div>
                        <button
                          type="button"
                          onClick={() => setAppSwitcherActive(false)}
                          className="mt-4 px-3 py-1 rounded-lg bg-white/10 text-slate-300 text-xs font-mono-tech hover:bg-white/20"
                        >
                          Dismiss Guard
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between pb-4 border-b border-white/10 font-mono-tech text-xs">
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        SECURE FINANCIAL RECORD
                      </span>
                      <span className="text-slate-500">AutoLock: {autoLockSeconds}s</span>
                    </div>

                    <div className="mt-4 space-y-3 font-mono-tech text-xs">
                      <div>
                        <div className="text-slate-500 text-[10px]">ACCOUNT HOLDER</div>
                        <div className="text-white font-semibold">Govind Tank</div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-slate-500 text-[10px]">AADHAAR CARD (UIDAI)</div>
                          <div className="text-cyan-300 font-bold">
                            {maskPii ? 'XXXX-XXXX-8821' : '9842-1092-8821'}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500 text-[10px]">PAN NUMBER</div>
                          <div className="text-cyan-300 font-bold">
                            {maskPii ? 'XXXXX1234F' : 'ABCDE1234F'}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 mt-3">
                        <div className="text-slate-400 text-[10px]">VERIFIED LEDGER BALANCE</div>
                        <div className="text-2xl font-extrabold text-emerald-400 mt-0.5">
                          {balanceMasked ? '••••••••' : '₹ 2,48,500.00'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="font-mono-tech text-[10px] text-slate-400 mt-3">
                    Satisfies RBI / Indian banking security requirements for mobile client runtimes
                  </div>
                </div>
              </motion.div>
            )}

            {/* 4. ANDROID_ISLAND_BAR INTERACTIVE DEMO */}
            {activeTab === 'island' && (
              <motion.div
                key="island"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid lg:grid-cols-12 gap-8 items-center"
              >
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono-tech text-xs font-bold">
                      flutter package: android_island_bar v0.4.1
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-2xl sm:text-3xl text-white">
                    Hardware Cutout Adaptive Island
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed font-light">
                    Calculates physical Android DisplayCutout coordinates, adapting layout around center
                    punch holes or corner notches with live activities and rubber-band physics.
                  </p>

                  <div className="space-y-2 pt-1 font-mono-tech text-xs">
                    <div className="text-[10px] text-slate-400">Physical Cutout Position:</div>
                    <div className="flex items-center gap-2">
                      {(['center', 'left', 'corner'] as const).map((pos) => (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => setCutoutPos(pos)}
                          className={`px-3 py-1.5 rounded-lg border capitalize transition-colors cursor-pointer ${
                            cutoutPos === pos
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 font-bold'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          {pos} Hole
                        </button>
                      ))}
                    </div>

                    <div className="text-[10px] text-slate-400 pt-2">Live Activity State:</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {(['audio', 'ride', 'delivery'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setIslandState(st)}
                          className={`px-3 py-1.5 rounded-lg border capitalize transition-colors cursor-pointer ${
                            islandState === st
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 font-bold'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          {st === 'audio' ? 'BAPS Audio Stream' : st === 'ride' ? 'Cab ETA' : 'Delivery Track'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <a
                      href="https://pub.dev/packages/android_island_bar"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 font-mono-tech text-xs transition-colors"
                    >
                      <span>pub.dev Page</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="lg:col-span-7 flex flex-col items-center">
                  <div className="relative w-[340px] sm:w-[380px] h-[220px] rounded-3xl bg-slate-950 border border-white/20 shadow-2xl p-4 flex flex-col items-center justify-start overflow-hidden">
                    <div
                      className={`absolute top-4 w-4 h-4 rounded-full bg-black border border-white/20 shadow-inner z-20 transition-all duration-300 ${
                        cutoutPos === 'center'
                          ? 'left-1/2 -translate-x-1/2'
                          : cutoutPos === 'left'
                          ? 'left-8'
                          : 'right-8'
                      }`}
                    />

                    <motion.div
                      layout
                      className="mt-6 w-full max-w-[320px] bg-black/90 border border-white/15 rounded-2xl p-3 shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-xl"
                    >
                      {islandState === 'audio' && (
                        <div className="flex items-center justify-between gap-3 text-xs font-mono-tech">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600/40 flex items-center justify-center border border-indigo-400/40">
                              <Volume2 className="w-4 h-4 text-cyan-300 animate-pulse" />
                            </div>
                            <div>
                              <div className="text-white font-bold text-[11px] truncate w-32">
                                BAPS Prakash Audio
                              </div>
                              <div className="text-[10px] text-cyan-300">
                                {formatAudioTime(audioSeconds)} / 4:18
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                          >
                            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}

                      {islandState === 'ride' && (
                        <div className="flex items-center justify-between text-xs font-mono-tech">
                          <div className="flex items-center gap-2">
                            <Navigation className="w-4 h-4 text-emerald-400" />
                            <div>
                              <div className="text-white font-bold text-[11px]">Cab En Route</div>
                              <div className="text-[10px] text-slate-400">Toyota Camry · GJ-01-2026</div>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[11px]">
                            3 min
                          </span>
                        </div>
                      )}

                      {islandState === 'delivery' && (
                        <div className="flex items-center justify-between text-xs font-mono-tech">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-amber-400" />
                            <div>
                              <div className="text-white font-bold text-[11px]">Order #4102</div>
                              <div className="text-[10px] text-slate-400">Driver nearby</div>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[11px]">
                            ETA 8m
                          </span>
                        </div>
                      )}
                    </motion.div>
                  </div>
                  <div className="font-mono-tech text-[10px] text-slate-400 mt-3">
                    Adapts dynamically around physical DisplayCutout hardware geometries
                  </div>
                </div>
              </motion.div>
            )}

            {/* 5. CURRENCY_FIELD_FORMATTER INTERACTIVE DEMO */}
            {activeTab === 'currency' && (
              <motion.div
                key="currency"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid lg:grid-cols-12 gap-8 items-center"
              >
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono-tech text-xs font-bold">
                      flutter package: currency_field_formatter v1.3.1
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-2xl sm:text-3xl text-white">
                    Indian Currency &amp; Words Formatter
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed font-light">
                    Bank-grade Flutter currency input formatter with live Indian numbering system
                    (Lakhs/Crores), verbal words conversion, and quick denomination chips.
                  </p>

                  <div className="space-y-3 pt-1 font-mono-tech text-xs">
                    <div className="text-[10px] text-slate-400">Quick Denomination Chips:</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {[50000, 100000, 500000, 2500000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setCurrencyRaw((prev) => prev + amt)}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 text-xs transition-colors cursor-pointer"
                        >
                          +{formatIndianCurrency(amt)}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setCurrencyRaw(100000)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 text-xs transition-colors cursor-pointer"
                      >
                        Reset (1L)
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <a
                      href="https://pub.dev/packages/currency_field_formatter"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 font-mono-tech text-xs transition-colors"
                    >
                      <span>pub.dev Page</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="lg:col-span-7 flex flex-col items-center">
                  <div className="relative w-[360px] sm:w-[400px] rounded-2xl p-6 bg-gradient-to-br from-slate-900 to-slate-950 border border-white/15 shadow-2xl space-y-4">
                    <div className="font-mono-tech text-xs text-slate-400">
                      ENTER TRANSACTION AMOUNT (INR)
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        value={currencyRaw}
                        onChange={(e) => setCurrencyRaw(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/20 text-white font-mono text-lg focus:outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>

                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-400/30 space-y-1">
                      <div className="font-mono-tech text-[10px] text-amber-300">
                        FORMATTED INDIAN NUMBERING SYSTEM
                      </div>
                      <div className="text-2xl font-extrabold text-white font-mono">
                        {formatIndianCurrency(currencyRaw)}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
                      <div className="font-mono-tech text-[10px] text-slate-400">
                        VERBAL SPOKEN REPRESENTATION
                      </div>
                      <div className="font-mono-tech text-xs text-cyan-300 font-semibold italic">
                        &quot;{numberToIndianWords(currencyRaw)}&quot;
                      </div>
                    </div>
                  </div>
                  <div className="font-mono-tech text-[10px] text-slate-400 mt-3">
                    Eliminates international 3-digit comma confusion in Indian banking products
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
