import React from 'react';
import { Smartphone, Github, Linkedin, Mail } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-slate-950 border-t border-white/10 py-12 text-slate-300">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center shadow-md">
                <Smartphone className="text-slate-950 w-5 h-5 font-bold" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white font-mono">Govind<span className="text-sky-400">.dev</span></span>
            </div>
            <p className="text-slate-300 max-w-sm mb-8 leading-relaxed text-sm font-sans">
              Architecting high-performance mobile experiences with a decade of expertise in Clean Architecture, Flutter, Kotlin, and AI systems.
            </p>
            <div className="flex gap-4">
              {[
                { icon: <Github className="w-5 h-5" />, href: "https://github.com/govindtank", label: "GitHub Profile" },
                { icon: <Linkedin className="w-5 h-5" />, href: "https://linkedin.com/in/govindtank", label: "LinkedIn Profile" },
                { icon: <Mail className="w-5 h-5" />, href: "mailto:govindtank600@gmail.com", label: "Send Email" }
              ].map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="text-slate-400 hover:text-sky-400 transition-colors p-2 bg-white/5 hover:bg-white/10 rounded-full"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs mb-6 uppercase tracking-widest font-mono">Navigation</h4>
            <ul className="space-y-3 font-sans">
              <li><a href="#about" className="text-slate-400 hover:text-sky-400 transition-colors text-sm">About</a></li>
              <li><a href="#skills" className="text-slate-400 hover:text-sky-400 transition-colors text-sm">Skills</a></li>
              <li><a href="#projects" className="text-slate-400 hover:text-sky-400 transition-colors text-sm">Projects</a></li>
              <li><a href="/blog" className="text-slate-400 hover:text-sky-400 transition-colors text-sm">Architectural Logs</a></li>
              <li><a href="#contact" className="text-slate-400 hover:text-sky-400 transition-colors text-sm">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs mb-6 uppercase tracking-widest font-mono">Infrastructure</h4>
            <ul className="space-y-3 font-mono text-xs text-slate-400">
              <li><span>React 19 + Vite 6</span></li>
              <li><span>Tailwind CSS v4</span></li>
              <li><span>GitHub Pages Deployment</span></li>
              <li className="text-slate-300 font-semibold pt-2"><span>© {currentYear} Govind Tank</span></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 text-xs font-mono text-slate-400">
          <p>
            // Architecting mobile excellence since 2014
          </p>
          <div className="flex gap-6">
            <span className="text-sky-400/80">System.Identity: Verified</span>
            <span className="text-emerald-400/80">Build.Status: Passing</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
