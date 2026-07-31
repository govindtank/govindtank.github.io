import React from 'react';
import { motion } from 'motion/react';
import { Github, Linkedin, Mail, ArrowRight, Cpu, Smartphone } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-slate-950 text-slate-100">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-sky-500/10 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[120px]" 
        />
      </div>
      
      <div className="tech-grid absolute inset-0 opacity-10" />

      <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7"
          >
            <div className="space-y-2 mb-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sky-400 font-mono text-xs tracking-[0.3em] uppercase font-bold"
              >
                // System.Initialize(Mobile_Architecture)
              </motion.div>
              <h1 className="text-6xl md:text-8xl font-black leading-[0.85] tracking-tighter text-white">
                <motion.div
                  animate={{ 
                    textShadow: [
                      "none", 
                      "2px 2px 0px #0ea5e9, -2px -2px 0px #6366f1", 
                      "none"
                    ],
                    x: [0, -2, 2, 0]
                  }}
                  transition={{ duration: 0.1, repeat: Infinity, repeatDelay: 4 }}
                >
                  GOVIND
                </motion.div>
                <span className="text-outline text-transparent block mt-2" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.3)' }}>
                  TANK.
                </span>
              </h1>
            </div>
            
            <div className="relative mb-12">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ delay: 0.5, duration: 1 }}
                className="h-px bg-gradient-to-r from-sky-500 via-indigo-500 to-transparent"
              />
              <p className="text-xl text-slate-300 max-w-xl py-6 leading-relaxed font-light">
                Bridging the gap between <span className="text-white font-semibold">Robust Systems Architecture</span> and <span className="text-sky-400 font-semibold">Fluid User Experience</span>. 9+ years architecting mobile ecosystems that scale to millions.
              </p>
            </div>

            <div className="flex flex-wrap gap-6 items-center">
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href="#projects"
                aria-label="Explore Govind Tank's project vault"
                className="group relative px-8 py-4 bg-sky-500 text-slate-950 font-bold rounded-full flex items-center gap-2 transition-all shadow-lg hover:shadow-sky-500/20"
              >
                <div className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500 origin-center" />
                <span className="relative z-10 font-bold uppercase tracking-wider text-sm font-mono">Explore Matrix</span>
                <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.a>
              
              <div className="flex items-center gap-4">
                {[
                  { icon: <Github className="w-5 h-5" />, href: "https://github.com/govindtank", label: "GitHub Profile" },
                  { icon: <Linkedin className="w-5 h-5" />, href: "https://linkedin.com/in/govindtank", label: "LinkedIn Profile" },
                  { icon: <Mail className="w-5 h-5" />, href: "mailto:govindtank600@gmail.com", label: "Send Email" }
                ].map((social, i) => (
                  <motion.a
                    key={i}
                    whileHover={{ y: -5, color: '#0ea5e9' }}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="text-slate-400 hover:text-sky-400 transition-all p-2 bg-white/5 hover:bg-white/10 rounded-full"
                  >
                    {social.icon}
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative aspect-square group perspective-1000">
              <div className="absolute inset-0 border-2 border-sky-500/20 rounded-3xl translate-x-4 translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-700" />
              <div className="absolute inset-0 border-2 border-indigo-500/20 rounded-3xl -translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-700 delay-100" />
              
              <motion.div 
                whileHover={{ rotateX: 5, rotateY: -5, scale: 1.02 }}
                className="relative h-full w-full rounded-3xl overflow-hidden glass-card border-white/10 group shadow-[0_0_50px_rgba(14,165,233,0.15)] transform-style-3d"
              >
                <img 
                  src="profile_one.png" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'profile_two.png';
                  }}
                  alt="Govind Tank - Senior Lead Architect"
                  loading="lazy"
                  className="w-full h-full object-cover grayscale brightness-110 contrast-125 saturate-50 group-hover:grayscale-0 group-hover:brightness-100 group-hover:contrast-100 transition-all duration-1000 scale-105 group-hover:scale-100"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-sky-500/5 opacity-80" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(2,6,23,0.4)_100%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-40" />
                
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute top-[25%] left-[15%] flex flex-col items-start gap-1">
                    <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(14,165,233,0.8)]" />
                    <div className="text-[10px] font-mono text-sky-400 bg-slate-950/80 px-2.5 py-0.5 rounded font-bold tracking-tight border border-sky-500/30">FACIAL_RECOGNITION_MATCH</div>
                  </div>
                  
                  <div className="absolute bottom-[35%] right-[15%] flex flex-col items-end gap-1">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                    <div className="text-[10px] font-mono text-indigo-400 bg-slate-950/80 px-2.5 py-0.5 rounded font-bold tracking-tight border border-indigo-500/30">ARCH_LOAD_SUCCESS</div>
                  </div>
                </div>

                <div className="absolute bottom-6 left-6 flex flex-col gap-2">
                  <div className="flex gap-1.5 items-center bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <div className="text-[10px] font-mono text-white tracking-[0.2em] uppercase font-bold">Auth_Passed</div>
                  </div>
                  <div className="text-[9px] font-mono text-sky-400 uppercase tracking-widest pl-1 font-semibold">Biometric_Verified</div>
                </div>
                
                <motion.div 
                  animate={{ top: ['-20%', '120%'] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 w-full h-[2%] bg-gradient-to-b from-transparent via-sky-400 to-transparent shadow-[0_0_15px_rgba(14,165,233,0.5)] pointer-events-none z-20"
                />
              </motion.div>

              <div className="absolute -inset-6 pointer-events-none z-0">
                <svg className="w-full h-full overflow-visible opacity-40">
                  <motion.rect
                    x="0" y="0" width="100%" height="100%" rx="32"
                    fill="none" stroke="currentColor" strokeWidth="1"
                    className="text-sky-400" strokeDasharray="12 6"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />
                </svg>
              </div>
              
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-10 -right-4 px-5 py-3 glass-card text-xs font-mono border-sky-400/40 text-white z-30 shadow-2xl skew-x-[-12deg] bg-slate-900/90"
              >
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-sky-400" />
                  <span className="font-bold tracking-tight">SENIOR_LEAD_ARCHITECT</span>
                </div>
              </motion.div>
              
              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute -bottom-8 -left-4 px-5 py-3 glass-card text-xs font-mono border-indigo-400/40 text-white z-30 shadow-2xl skew-x-[12deg] bg-slate-900/90"
              >
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-indigo-400" />
                  <span className="font-bold tracking-tight">ANDROID_CORE_EXPERT</span>
                </div>
              </motion.div>
            </div>
          </motion.div>

        </div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-400"
      >
        <span className="text-[10px] uppercase tracking-[0.3em] font-mono font-bold">Initialize_Scroll</span>
        <div className="w-px h-12 bg-gradient-to-b from-sky-400 to-transparent" />
      </motion.div>
    </section>
  );
}
