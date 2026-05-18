import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { BLOG_POSTS } from '../constants';
import { Terminal, Calendar, ArrowRight } from 'lucide-react';

export default function Blog() {
  const navigate = useNavigate();
  
  return (
    <section id="logs" className="py-32 relative overflow-hidden bg-slate-950">
      <div className="container mx-auto px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-[1px] bg-primary" />
            <span className="text-primary font-mono text-sm tracking-widest uppercase">System Archives</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-sans font-bold text-white mb-6">
            Technical <span className="text-primary italic">Logs</span>
          </h2>
          <p className="text-slate-400 max-w-2xl font-sans leading-relaxed">
            Architectural insights, migration strategies, and deep dives into the 
            evolving landscape of mobile engineering and AI integration.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {BLOG_POSTS.map((post, index) => (
            <motion.div
              key={post.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate(`/blog/${post.slug}`)}
              className="group cursor-pointer"
            >
              <div className="glass-card p-8 border-white/5 bg-slate-900/40 hover:bg-slate-900/60 transition-all duration-500 rounded-2xl flex flex-col h-full relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Terminal className="w-24 h-24 rotate-12" />
                </div>

                <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] font-mono text-primary border border-primary/30 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                    {post.tag}
                  </span>
                  <div className="flex items-center gap-2 text-slate-500 text-[10px] font-mono">
                    <Calendar className="w-3 h-3" />
                    {post.date}
                  </div>
                </div>

                <h3 className="text-xl font-sans font-bold text-white mb-4 group-hover:text-primary transition-colors leading-tight">
                  {post.title}
                </h3>
                <p className="text-slate-400 text-sm font-sans mb-8 flex-grow leading-relaxed">
                  <span className="line-clamp-5">
                    {post.excerpt}
                  </span>
                </p>

                <div className="flex items-center gap-2 text-primary font-mono text-xs group-hover:gap-4 transition-all uppercase tracking-widest font-bold">
                  View Full Log <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
