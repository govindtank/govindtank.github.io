import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Code2, BrainCircuit, Zap, Terminal as TerminalIcon } from 'lucide-react';

const Terminal = () => {
  const [text, setText] = useState('');
  const fullText = "Executing System.Manifest... \n> Status: Senior Mobile Architect\n> Expertise: Android, Flutter, Node.js\n> Mission: Architecting fluid performance for 100k+ users.\n> Ready_";

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-black/80 rounded-xl border border-white/10 p-6 font-mono text-sm leading-relaxed shadow-2xl overflow-hidden min-h-[160px]">
      <div className="flex gap-1.5 mb-4 border-b border-white/5 pb-2">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
      </div>
      <pre className="text-primary/80 whitespace-pre-wrap">{text}<span className="animate-pulse">_</span></pre>
    </div>
  );
};

export default function About() {
  return (
    <section id="about" className="py-24 bg-slate-900/80 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative group"
            >
               <div className="absolute inset-0 tech-grid opacity-30 group-hover:opacity-50 transition-all duration-700" />
               
               <div className="aspect-square glass-card border-white/10 bg-slate-900/50 flex items-center justify-center relative overflow-hidden rounded-[2.5rem] shadow-[0_0_50px_rgba(14,165,233,0.1)] group">
                  <img 
                    src="/profile_two.png" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800';
                    }}
                    alt="Govind Tank Architecture"
                    className="w-full h-full object-cover opacity-30 group-hover:opacity-100 transition-all duration-1000 grayscale group-hover:grayscale-0 group-hover:brightness-125 contrast-150"
                  />
                  
                  {/* Biometric Scanlines Overlay */}
                  <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(14,165,233,0.05)_1px,transparent_1px)] bg-[size:100%_4px] opacity-40 animate-pulse" />
                  
                  {/* Technical Callouts - Only visible on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className="absolute top-[30%] left-[20%] flex items-center gap-2">
                       <div className="w-12 h-px bg-primary/50" />
                       <span className="text-[9px] font-mono text-primary bg-slate-950/80 px-1 border border-primary/20">BIO_AUTH_L3</span>
                    </div>
                    <div className="absolute bottom-[40%] right-[10%] flex items-center gap-2">
                       <span className="text-[9px] font-mono text-accent bg-slate-950/80 px-1 border border-accent/20">MANIFEST_ID_GT01</span>
                       <div className="w-12 h-px bg-accent/50" />
                    </div>
                  </div>

                  {/* Security Clearance Stamp */}
                  <div className="absolute top-8 right-8 border border-accent/50 px-2 py-0.5 rounded rotate-12 opacity-50">
                    <span className="text-[8px] font-mono text-accent font-black tracking-widest uppercase">Restricted</span>
                  </div>
                  
                  {/* Digital Compass / Blueprint Overlay */}
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                    className="absolute w-[150%] h-[150%] border border-primary/10 rounded-full pointer-events-none" 
                  />
                  
                  {/* Identity HUD */}
                  <div className="absolute inset-0 p-8 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                       <div className="text-[10px] font-mono text-primary flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                         GT_SYSTEM_MANIFEST
                       </div>
                       <div className="space-y-1">
                         <div className="w-8 h-0.5 bg-white/20" />
                         <div className="w-4 h-0.5 bg-white/10" />
                       </div>
                    </div>

                    <div className="flex flex-col items-center">
                       <div className="text-5xl font-black text-white/10 group-hover:text-primary/20 transition-colors tracking-[0.4em] uppercase">Architecture</div>
                       <div className="text-[10px] font-mono text-slate-500 mt-2 uppercase tracking-widest">v9.0.4 - Core Stability: 99.9%</div>
                    </div>

                    <div className="flex justify-between items-end border-t border-white/5 pt-4">
                       <div className="text-[10px] font-mono text-slate-500">LOC::72.57E_23.02N</div>
                       <div className="flex gap-2">
                         <div className="w-3 h-3 border border-primary/40 rounded-sm" />
                         <div className="w-3 h-3 border border-primary/20 rounded-sm" />
                       </div>
                    </div>
                  </div>
               </div>
               
               {/* Terminal Overlay */}
               <div className="absolute -bottom-10 -right-4 md:right-10 w-full max-w-sm z-20">
                 <Terminal />
               </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl md:text-7xl font-black mb-8 leading-none">
              THE <span className="text-primary">ENGINEER'S</span> <br />
              PERSPECTIVE.
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-10 font-light">
              I view code as a living machine. For the last <span className="text-white font-medium">9+ years</span>, I've specialized in the delicate art of performance tuning and architectural integrity. Whether it's refactoring legacy monoliths or building new IoT ecosystems, my goal is always <span className="text-white font-medium">Zero-Leak Stability</span>.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-8">
              {[
                { icon: <Code2 className="w-6 h-6" />, title: "Native Core", desc: "Deep SDK architecture in Kotlin/Java." },
                { icon: <Zap className="w-6 h-6" />, title: "Fluid Flutter", desc: "State-driven performance with Bloc/MVVM." },
                { icon: <BrainCircuit className="w-6 h-6" />, title: "AI Forge", desc: "Leveraging generative tools for delivery." },
                { icon: <TerminalIcon className="w-6 h-6" />, title: "Cloud Scale", desc: "AWS and Node.js backend integration." }
              ].map((item, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group flex gap-4"
                >
                  <div className="mt-1 text-primary group-hover:scale-110 transition-transform">{item.icon}</div>
                  <div>
                    <h4 className="text-white font-bold text-base mb-1">{item.title}</h4>
                    <p className="text-slate-500 text-sm">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

