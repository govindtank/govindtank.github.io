import React from 'react';
import { motion } from 'motion/react';
import { Github, Linkedin, Mail, ArrowRight, Cpu, Smartphone } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-accent/10 rounded-full blur-[120px]" 
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
                className="text-primary font-mono text-xs tracking-[0.3em] uppercase"
              >
                // System.Initialize(Mobile_Architecture)
              </motion.div>
              <h1 className="text-6xl md:text-8xl font-black leading-[0.85] tracking-tighter">
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
                <span className="text-outline text-transparent block mt-2" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.2)' }}>
                  TANK.
                </span>
              </h1>
            </div>
            
            <div className="relative mb-12">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ delay: 0.5, duration: 1 }}
                className="h-px bg-gradient-to-r from-primary via-accent to-transparent"
              />
              <p className="text-xl text-slate-400 max-w-xl py-6 leading-relaxed font-light">
                Bridging the gap between <span className="text-white font-medium">Robust Engineering</span> and <span className="text-primary font-medium">Fluid UX</span>. 9+ years architecting mobile ecosystems that scale to millions.
              </p>
            </div>

            <div className="flex flex-wrap gap-6 items-center">
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href="#projects"
                className="group relative px-8 py-4 bg-primary text-white font-bold rounded-full flex items-center gap-2 transition-all"
              >
                <div className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500 origin-center" />
                <span className="relative z-10 font-bold">Explore Matrix</span>
                <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.a>
              
              <div className="flex items-center gap-4">
                {[
                  { icon: <Github />, href: "https://github.com/govindtank" },
                  { icon: <Linkedin />, href: "https://linkedin.com/in/govindtank" },
                  { icon: <Mail />, href: "mailto:govindtank600@gmail.com" }
                ].map((social, i) => (
                  <motion.a
                    key={i}
                    whileHover={{ y: -5, color: '#0ea5e9' }}
                    href={social.href}
                    target="_blank"
                    className="text-slate-500 transition-all p-2"
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
              {/* Parallax Background Layers */}
              <div className="absolute inset-0 border-2 border-primary/20 rounded-3xl translate-x-4 translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-700" />
              <div className="absolute inset-0 border-2 border-accent/20 rounded-3xl -translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-700 delay-100" />
              
              {/* Main Image Container with Tilt */}
              <motion.div 
                whileHover={{ rotateX: 5, rotateY: -5, scale: 1.02 }}
                className="relative h-full w-full rounded-3xl overflow-hidden glass-card border-white/10 group shadow-[0_0_50px_rgba(14,165,233,0.15)] transform-style-3d"
              >
                <img 
                  src="profile_one.png" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800';
                  }}
                  alt="Govind Tank - Core Intelligence"
                  className="w-full h-full object-cover grayscale brightness-110 contrast-125 saturate-50 group-hover:grayscale-0 group-hover:brightness-100 group-hover:contrast-100 transition-all duration-1000 scale-105 group-hover:scale-100"
                />
                
                {/* Visual Data Grids & Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-primary/5 opacity-80" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(2,6,23,0.4)_100%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-40" />
                
                {/* Interactive HUD Nodes */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute top-[25%] left-[15%] flex flex-col items-start gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(14,165,233,0.8)]" />
                    <div className="text-[10px] font-mono text-primary bg-slate-950/40 px-1 font-bold tracking-tighter">FACIAL_RECOGNITION_MATCH</div>
                  </div>
                  
                  <div className="absolute bottom-[35%] right-[15%] flex flex-col items-end gap-1">
                    <div className="w-2 h-2 bg-accent rounded-full animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
                    <div className="text-[10px] font-mono text-accent bg-slate-950/40 px-1 font-bold tracking-tighter">ARCH_LOAD_SUCCESS</div>
                  </div>
                </div>

                {/* HUD Elements Overlay */}
                <div className="absolute bottom-6 left-6 flex flex-col gap-2">
                  <div className="flex gap-1.5 items-center bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded border border-white/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <div className="text-[9px] font-mono text-white tracking-[0.2em] uppercase">Auth_Passed</div>
                  </div>
                  <div className="text-[8px] font-mono text-primary/50 uppercase tracking-widest pl-1">Biometric_Verified</div>
                </div>
                
                {/* Animated Scanning Beam */}
                <motion.div 
                  animate={{ top: ['-20%', '120%'] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 w-full h-[2%] bg-gradient-to-b from-transparent via-primary to-transparent shadow-[0_0_15px_rgba(14,165,233,0.5)] pointer-events-none z-20"
                />
              </motion.div>

              {/* Hand-Drawn Blueprint Outline - The "Art" Touch */}
              <div className="absolute -inset-6 pointer-events-none z-0">
                <svg className="w-full h-full overflow-visible opacity-40">
                  <motion.rect
                    x="0" y="0" width="100%" height="100%" rx="32"
                    fill="none" stroke="currentColor" strokeWidth="1"
                    className="text-primary" strokeDasharray="12 6"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />
                </svg>
              </div>
              
              {/* Specialized Badge - Senior Lead */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-10 -right-4 px-5 py-3 glass-card text-xs font-mono border-primary/40 text-white z-30 shadow-2xl skew-x-[-12deg]"
              >
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-primary" />
                  <span className="font-bold tracking-tighter">SENIOR_LEAD_ARCHITECT</span>
                </div>
              </motion.div>
              
              {/* Specialized Badge - Android Expert */}
              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute -bottom-8 -left-4 px-5 py-3 glass-card text-xs font-mono border-accent/40 text-white z-30 shadow-2xl skew-x-[12deg]"
              >
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-accent" />
                  <span className="font-bold tracking-tighter">ANDROID_CORE_EXPERT</span>
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
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500"
      >
        <span className="text-[10px] uppercase tracking-[0.3em] font-mono">Initialize_Scroll</span>
        <div className="w-px h-12 bg-gradient-to-b from-primary to-transparent" />
      </motion.div>
    </section>
  );
}
