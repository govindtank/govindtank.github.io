import React, { useEffect, useState, useRef } from 'react';
import { Eye, Activity } from 'lucide-react';

interface VisitorCounterProps {
  path?: string; // 'TOTAL' or specific path like '/blog/slug'
  label?: string;
  showIcon?: boolean;
  className?: string;
  variant?: 'badge' | 'minimal' | 'cyber';
}

export default function VisitorCounter({
  path = 'TOTAL',
  label = 'verified visits',
  showIcon = true,
  className = '',
  variant = 'badge',
}: VisitorCounterProps) {
  const [targetCount, setTargetCount] = useState<number | null>(null);
  const [displayCount, setDisplayCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const animFrameRef = useRef<number | null>(null);

  // 1. Fetch real count from GoatCounter
  useEffect(() => {
    let cancelled = false;

    async function fetchCount() {
      try {
        const encodedPath = path === 'TOTAL' ? 'TOTAL' : encodeURIComponent(path.replace(/^\//, ''));
        const url = `https://govindtank.goatcounter.com/counter/${encodedPath}.json`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // GoatCounter returns { count: "223", count_unique: "200" }
        const parsed = parseInt(data.count || data.count_unique || '0', 10);
        if (!cancelled && !isNaN(parsed)) {
          setTargetCount(parsed);
        }
      } catch (err) {
        if (!cancelled) {
          setTargetCount(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCount();
    return () => {
      cancelled = true;
    };
  }, [path]);

  // 2. Smooth Animated Count-Up Interpolation (Odometer Easing)
  useEffect(() => {
    if (targetCount === null || targetCount <= 0) {
      setDisplayCount(targetCount ?? 0);
      return;
    }

    const duration = 1200; // 1.2s smooth roll
    const startTime = performance.now();
    const startVal = 0;
    const endVal = targetCount;

    const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutExpo(progress);
      const current = Math.floor(startVal + (endVal - startVal) * eased);

      setDisplayCount(current);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        setDisplayCount(endVal);
      }
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [targetCount]);

  if (loading) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/60 border border-sky-500/20 text-slate-400 text-xs font-mono backdrop-blur-md shadow-sm ${className}`}>
        <div className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
        <span className="text-[11px] text-slate-400">Syncing telemetry...</span>
      </div>
    );
  }

  const formattedCount = displayCount > 0 ? displayCount.toLocaleString() : (targetCount !== null ? targetCount.toLocaleString() : 'Live');

  // Variant: Minimal Inline
  if (variant === 'minimal') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-slate-400 font-mono text-xs ${className}`}>
        {showIcon && <Eye className="w-3.5 h-3.5 text-sky-400" />}
        <span className="text-sky-300 font-semibold transition-all duration-300">{formattedCount}</span>
        <span>{label}</span>
      </span>
    );
  }

  // Variant: Cyber HUD Badge (Hero / Highlights)
  if (variant === 'cyber') {
    return (
      <div className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-sky-500/30 hover:border-sky-400/60 text-xs font-mono shadow-[0_0_15px_rgba(14,165,233,0.12)] backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_20px_rgba(14,165,233,0.25)] group ${className}`}>
        <div className="relative flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <div className="absolute w-3 h-3 rounded-full bg-emerald-400/40 animate-ping" />
        </div>
        {showIcon && <Activity className="w-3.5 h-3.5 text-sky-400 group-hover:rotate-12 transition-transform duration-300" />}
        <span className="bg-gradient-to-r from-sky-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent font-extrabold tracking-tight text-sm">
          {formattedCount}
        </span>
        <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
          {label}
        </span>
      </div>
    );
  }

  // Default: Pill Badge
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-sky-500/25 hover:border-sky-500/50 text-xs font-mono backdrop-blur-sm shadow-sm transition-all duration-200 ${className}`}>
      {showIcon && <Eye className="w-3.5 h-3.5 text-sky-400" />}
      <span className="text-sky-300 font-bold tracking-tight">{formattedCount}</span>
      <span className="text-slate-400 text-[11px]">{label}</span>
    </div>
  );
}
