import React from "react";
import { Smartphone, Github, Linkedin, Mail, Play, ShieldCheck, ArrowUp } from "lucide-react";
import VisitorCounter from "./VisitorCounter";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative bg-[#04060c] border-t border-white/10 py-16 text-slate-400 font-mono-tech text-xs overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-display font-extrabold text-xl text-white tracking-tight">
                GOVIND<span className="text-kinetic-gradient">TANK.</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-400/30 text-cyan-300">
                LEAD MOBILE SYSTEMS ENGINEER
              </span>
            </div>

            <p className="text-slate-400 text-xs sm:text-sm font-light leading-relaxed max-w-md font-sans">
              Lead Mobile Systems Engineer with 9+ years experience engineering zero-leak Android
              Core runtimes, 120Hz Flutter Impeller graphics, on-device SLMs, and cloud-edge telemetry.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <a
                href="https://github.com/govindtank"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl spatial-glass border-white/10 hover:border-cyan-400/40 text-slate-300 hover:text-cyan-300 transition-colors"
                title="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com/in/govindtank"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl spatial-glass border-white/10 hover:border-cyan-400/40 text-slate-300 hover:text-cyan-300 transition-colors"
                title="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=com.govindtank.portfolio"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl spatial-glass border-white/10 hover:border-cyan-400/40 text-slate-300 hover:text-cyan-300 transition-colors"
                title="Play Store"
              >
                <Play className="w-4 h-4" />
              </a>
              <a
                href="mailto:govindtank600@gmail.com"
                className="p-2 rounded-xl spatial-glass border-white/10 hover:border-cyan-400/40 text-slate-300 hover:text-cyan-300 transition-colors"
                title="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Core Specs Col */}
          <div>
            <div className="font-mono-tech text-[11px] uppercase tracking-wider text-slate-200 font-bold mb-3">
              TELEMETRY &amp; SLA
            </div>
            <ul className="space-y-2 text-slate-400 text-[11px]">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Runtime: 99.95% Crash-Free</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Reach: 150K+ Active Users</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span>Frame Budget: 120Hz VSync</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span>Pub.dev: Verified Publisher</span>
              </li>
            </ul>
          </div>

          {/* Quick Jumps */}
          <div>
            <div className="font-mono-tech text-[11px] uppercase tracking-wider text-slate-200 font-bold mb-3">
              SYSTEM JUMPS
            </div>
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              <a href="#hero" className="hover:text-cyan-300 transition-colors">Core</a>
              <a href="#about" className="hover:text-cyan-300 transition-colors">Manifesto</a>
              <a href="#sandbox" className="hover:text-cyan-300 transition-colors">3D Labs</a>
              <a href="#skills" className="hover:text-cyan-300 transition-colors">Radar</a>
              <a href="#projects" className="hover:text-cyan-300 transition-colors">Vault</a>
              <a href="#packages" className="hover:text-cyan-300 transition-colors">Packages</a>
              <a href="#experience" className="hover:text-cyan-300 transition-colors">Chronicle</a>
              <a href="#logs" className="hover:text-cyan-300 transition-colors">Logs</a>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
              <VisitorCounter />
              <button
                type="button"
                onClick={scrollToTop}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 transition-colors"
                title="Back to Top"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom credits */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            &copy; {currentYear} Govind Tank. Engineered with React, Three.js, Tailwind &amp; Impeller Precision.
          </div>
          <div className="flex items-center gap-4">
            <span className="text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              All Systems Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
