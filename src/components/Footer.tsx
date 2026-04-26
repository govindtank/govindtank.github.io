import React from 'react';
import { Smartphone, Github, Linkedin, Twitter, Mail } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-slate-950 border-t border-white/5 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Smartphone className="text-white w-5 h-5" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">Govind<span className="text-primary">.dev</span></span>
            </div>
            <p className="text-slate-500 max-w-sm mb-8 leading-relaxed">
              Crafting high-performance mobile experiences with a decade of expertise in Clean Architecture and full-stack integration.
            </p>
            <div className="flex gap-4">
              {[
                { icon: <Github className="w-5 h-5" />, href: "https://github.com/govindtank" },
                { icon: <Linkedin className="w-5 h-5" />, href: "https://linkedin.com/in/govindtank" },
                { icon: <Mail className="w-5 h-5" />, href: "mailto:govindtank600@gmail.com" }
              ].map((s, i) => (
                <a key={i} href={s.href} className="text-slate-500 hover:text-white transition-colors">
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-6 uppercase tracking-widest">Navigation</h4>
            <ul className="space-y-4">
              <li><a href="#about" className="text-slate-500 hover:text-primary transition-colors text-sm">About</a></li>
              <li><a href="#skills" className="text-slate-500 hover:text-primary transition-colors text-sm">Skills</a></li>
              <li><a href="#projects" className="text-slate-500 hover:text-primary transition-colors text-sm">Projects</a></li>
              <li><a href="#blog" className="text-slate-500 hover:text-primary transition-colors text-sm">Blog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-6 uppercase tracking-widest">Legal & Tech</h4>
            <ul className="space-y-4">
              <li><span className="text-slate-500 text-sm">Built with React + Vite</span></li>
              <li><span className="text-slate-500 text-sm">Styled with Tailwind</span></li>
              <li><span className="text-slate-500 text-sm">Hosted on GitHub Pages</span></li>
              <li><span className="text-slate-500 text-sm">© {currentYear} Govind Tank</span></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs text-slate-600 font-mono">
            // Crafting excellence since 2014
          </p>
          <div className="flex gap-8">
            <span className="text-[10px] text-slate-700 font-mono">System.Identity: Secure</span>
            <span className="text-[10px] text-slate-700 font-mono">Build.Status: Verified</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
