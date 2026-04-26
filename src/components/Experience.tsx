import React from 'react';
import { motion } from 'motion/react';
import { EXPERIENCES } from '../constants';
import { Briefcase, MapPin, Calendar } from 'lucide-react';

export default function Experience() {
  return (
    <section id="experience" className="py-24 bg-slate-950">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-4">
           <div>
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic-serif">Chronicle</h2>
              <p className="text-slate-500 font-mono text-xs mt-2">// Professional_Deployment_History.log</p>
           </div>
           <div className="text-right hidden md:block">
              <span className="text-[10px] font-mono text-slate-700 uppercase tracking-[0.4em]">Auth: Secure_Level_09</span>
           </div>
        </div>

        <div className="space-y-4 max-w-5xl mx-auto relative">
          {/* Hand drawn arrow doodle */}
          <div className="absolute -top-12 -left-20 pointer-events-none hidden xl:block opacity-30">
            <svg width="120" height="120" viewBox="0 0 100 100" className="text-primary transform -rotate-12">
               <motion.path
                 d="M10,90 Q40,95 60,60 T90,10"
                 fill="none"
                 stroke="currentColor"
                 strokeWidth="3"
                 initial={{ pathLength: 0 }}
                 whileInView={{ pathLength: 1 }}
                 transition={{ duration: 1.5 }}
               />
               <motion.path
                 d="M80,20 L90,10 L75,10"
                 fill="none"
                 stroke="currentColor"
                 strokeWidth="3"
                 initial={{ opacity: 0 }}
                 whileInView={{ opacity: 1 }}
                 transition={{ delay: 1 }}
               />
               <text x="0" y="80" className="text-[10px] fill-primary font-mono uppercase font-bold">Latest_Ops</text>
            </svg>
          </div>

          {EXPERIENCES.map((exp, index) => (
            <motion.div
              key={exp.company + exp.period}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative grid md:grid-cols-12 gap-6 p-8 system-card hover:bg-white/5 transition-all"
            >
              <div className="md:col-span-3 border-r border-white/5 pr-6 hidden md:block">
                 <span className="text-xs font-mono text-primary uppercase tracking-widest">{exp.period}</span>
                 <p className="text-[10px] text-slate-600 font-mono mt-2 uppercase">{exp.location}</p>
                 
                 {/* Visual Stamp for seniority */}
                 {index === 0 && (
                   <div className="mt-8 border-2 border-primary/20 rounded px-2 py-1 inline-block rotate-[-15deg] opacity-40 group-hover:opacity-100 transition-opacity">
                     <span className="text-[10px] font-mono text-primary font-black uppercase tracking-tighter">Verified_Lead</span>
                   </div>
                 )}
              </div>
              
              <div className="md:col-span-9">
                 <div className="md:hidden mb-4">
                    <span className="text-xs font-mono text-primary uppercase tracking-widest">{exp.period}</span>
                 </div>
                 <h3 className="text-2xl font-bold text-white group-hover:text-primary transition-colors">{exp.company}</h3>
                 <p className="text-sm font-mono text-sky-400 mb-6 uppercase tracking-wider">{exp.role}</p>
                 
                 <div className="grid md:grid-cols-2 gap-4">
                    {exp.achievements.map((item, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex gap-3 text-sm text-slate-400 font-light leading-relaxed group/item"
                      >
                        <div className="mt-1 w-2 h-2 rounded-full bg-primary/40 group-hover/item:bg-primary group-hover/item:scale-150 transition-all" />
                        {item}
                      </motion.div>
                    ))}
                 </div>
              </div>

              {/* Decorative Corner Element */}
              <div className="absolute top-0 right-0 p-2 text-white/5 group-hover:text-primary/10 transition-colors">
                 <Briefcase className="w-12 h-12 rotate-12" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

