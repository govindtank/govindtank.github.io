import React from 'react';
import { motion } from 'motion/react';
import { PROJECTS } from '../constants';
import { ExternalLink, Github, Terminal, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Portfolio() {
  return (
    <section id="projects" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-baseline gap-4 mb-16">
          <h2 className="text-5xl md:text-7xl font-black italic-serif tracking-tighter">
            THE <span className="text-primary italic">VAULT</span>
          </h2>
          <span className="text-slate-500 font-mono text-xs uppercase tracking-widest">// Selected_Works.v2</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6">
          {PROJECTS.map((project, index) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ 
                y: -15, 
                rotate: 0.5,
                scale: 1.01,
                transition: { type: "spring", stiffness: 400, damping: 10 } 
              }}
              className={cn(
                "group system-card flex flex-col p-8 transition-all hover:border-primary/40",
                index === 0 ? "md:col-span-8 md:row-span-2" : "md:col-span-4",
                index === 1 ? "md:col-span-4 md:row-span-2" : "",
                index === 2 ? "md:col-span-6" : "",
                index === 3 ? "md:col-span-6" : ""
              )}
            >
              <div className="flex justify-between items-start mb-8">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 group-hover:bg-primary/20 group-hover:border-primary/30 transition-all">
                  <Terminal className="w-6 h-6 text-slate-400 group-hover:text-white" />
                </div>
                <div className="flex gap-2">
                  <motion.button whileHover={{ scale: 1.1 }} className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
                    <Github className="w-4 h-4" />
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.1 }} className="h-10 w-10 flex items-center justify-center rounded-full bg-primary hover:bg-sky-400 text-white transition-all shadow-lg shadow-primary/20">
                    <ExternalLink className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              <div className="flex-grow">
                <h3 className="text-3xl font-bold mb-4 group-hover:glitch-text transition-all">{project.title}</h3>
                <p className="text-slate-400 font-light leading-relaxed mb-6">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-8">
                  {project.tags.map(tag => (
                    <span key={tag} className="text-[10px] font-mono tracking-tighter px-2 py-1 rounded bg-slate-950 border border-white/5 text-slate-500 uppercase">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Unique Art/Graphic for each project box */}
              <div className="relative h-48 w-full mt-auto bg-slate-950 rounded-xl overflow-hidden border border-white/5">
                <img 
                  src={project.image} 
                  alt={project.title}
                  className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-700 grayscale group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent" />
                {/* Simulated Data Visualization */}
                <div className="absolute bottom-4 left-4 flex items-end gap-1 h-12">
                   {Array.from({length: 12}).map((_, i) => (
                     <motion.div 
                       key={i}
                       initial={{ height: 0 }}
                       whileInView={{ height: `${Math.random() * 100}%` }}
                       className="w-1.5 bg-primary/40 rounded-t"
                     />
                   ))}
                </div>
                <div className="absolute top-4 right-4 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                   System_Status: Stable
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-150 opacity-10 group-hover:opacity-20 transition-all duration-1000">
                  <Sparkles className="w-24 h-24 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 flex justify-center">
           <motion.div 
             whileHover={{ scale: 1.05 }}
             className="px-10 py-6 glass-card border-dashed border-white/20 flex flex-col items-center gap-2 group cursor-pointer"
           >
              <span className="text-xs font-mono text-slate-500 group-hover:text-primary transition-colors">INITIATE_FULL_CATALOG</span>
              <div className="h-px w-24 bg-white/10 group-hover:w-full transition-all" />
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white" />
           </motion.div>
        </div>
      </div>
    </section>
  );
}

