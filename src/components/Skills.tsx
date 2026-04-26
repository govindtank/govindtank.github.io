import React from 'react';
import { motion } from 'motion/react';
import { SKILLS } from '../constants';
import { Smartphone, Code2, Cpu, Globe, Database, BrainCircuit } from 'lucide-react';

const icons = {
  "Languages": <Code2 className="w-6 h-6" />,
  "Android Native": <Smartphone className="w-6 h-6" />,
  "Flutter Ecosystem": <Globe className="w-6 h-6" />,
  "Architecture": <Cpu className="w-6 h-6" />,
  "Backend & Cloud": <Database className="w-6 h-6" />,
  "AI & Next-Gen": <BrainCircuit className="w-6 h-6" />
};

export default function Skills() {
  return (
    <section id="skills" className="py-24 bg-slate-950 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Technical <span className="text-primary">Arsenal</span></h2>
            <p className="text-slate-400 max-w-xl">
              Over a decade of refining my craft in mobile ecosystems, from low-level Android SDK to cross-platform architecture and server-side logic.
            </p>
          </div>
          <div className="text-6xl font-black text-white/5 select-none hidden md:block">EXPERTISE</div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
          {/* Artistic Doodle Annotation */}
          <div className="absolute -top-10 -right-10 pointer-events-none hidden xl:block opacity-40">
             <svg width="200" height="200" viewBox="0 0 200 200" className="text-primary font-mono scale-110">
               <motion.path
                 d="M30,50 Q50,10 90,30 T150,50"
                 fill="none"
                 stroke="currentColor"
                 strokeWidth="2"
                 strokeDasharray="5,5"
                 initial={{ pathLength: 0 }}
                 whileInView={{ pathLength: 1 }}
                 transition={{ duration: 2 }}
               />
               <text x="100" y="20" className="text-[10px] fill-primary uppercase italic">Mixed_Reality_Stack</text>
               <circle cx="150" cy="50" r="4" className="fill-accent" />
             </svg>
          </div>

          {SKILLS.map((skill, index) => (
            <motion.div
              key={skill.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-8 group hover:border-primary/50 transition-colors"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                {icons[skill.category as keyof typeof icons]}
              </div>
              <h3 className="text-xl font-bold mb-4 text-white uppercase tracking-wider">{skill.category}</h3>
              <div className="flex flex-wrap gap-2">
                {skill.items.map((item) => (
                  <motion.span 
                    key={item}
                    whileHover={{ scale: 1.1, rotate: -2, backgroundColor: "rgba(14, 165, 233, 0.2)", borderColor: "rgba(14, 165, 233, 0.4)" }}
                    className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-sm text-slate-400 hover:text-white transition-all cursor-default"
                  >
                    {item}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
