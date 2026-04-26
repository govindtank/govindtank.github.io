import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BLOG_POSTS } from '../constants';
import { Terminal, Calendar, ArrowRight, X, ChevronRight, Share2, BookOpen } from 'lucide-react';
import { BlogPost } from '../types';

export default function Blog() {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

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
              onClick={() => setSelectedPost(post)}
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
                  {post.excerpt}
                </p>

                <div className="flex items-center gap-2 text-primary font-mono text-xs group-hover:gap-4 transition-all uppercase tracking-widest font-bold">
                  View Full Log <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Blog Modal Overlay */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 backdrop-blur-xl bg-slate-950/80"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-4xl max-h-[90vh] glass-card bg-slate-900 overflow-y-auto rounded-3xl border-white/10 shadow-2xl relative"
            >
              {/* Modal Header */}
              <div className="sticky top-0 z-20 bg-slate-900/90 backdrop-blur-md p-6 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono text-primary bg-primary/10 px-3 py-1 rounded-full uppercase">
                    {selectedPost.tag}
                  </span>
                  <span className="text-xs font-mono text-slate-500">{selectedPost.date}</span>
                </div>
                <button 
                  onClick={() => setSelectedPost(null)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-8 md:p-12">
                <h2 className="text-3xl md:text-5xl font-sans font-bold text-white mb-8 leading-tight">
                  {selectedPost.title}
                </h2>
                
                <div className="prose prose-invert max-w-none">
                  <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/10 rounded-xl mb-12">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <p className="text-primary font-mono text-xs italic m-0">
                      Reading internal architectural manifest... Access granted.
                    </p>
                  </div>

                  <div className="space-y-6 text-slate-300 font-sans text-lg leading-relaxed">
                    <p className="first-letter:text-5xl first-letter:font-bold first-letter:text-primary first-letter:mr-3 first-letter:float-left">
                      {selectedPost.excerpt} This technical log details the specific methodologies and architectural decisions made 
                      during high-stakes development cycles. By focusing on modularity, performance metrics, and 
                      automated validation, we ensure system stability in production environments.
                    </p>
                    
                    <h3 className="text-white text-2xl font-bold mt-12 mb-4">Core Principles</h3>
                    <ul className="list-none space-y-4 p-0">
                      {[
                        "Atomic design patterns in state management",
                        "Automated CI/CD pipelines with strictly enforced linting",
                        "Memory profiling and aggressive leak detection",
                        "Security-first API communication protocols"
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3 m-0">
                          <ChevronRight className="w-5 h-5 text-primary shrink-0 mt-1" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="my-12 p-8 bg-slate-950 border border-white/5 rounded-2xl font-mono text-sm group overflow-hidden">
                      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                        <span className="text-slate-500">manifest_integrity.sh</span>
                        <Share2 className="w-4 h-4 text-slate-600 hover:text-white cursor-pointer transition-colors" />
                      </div>
                      <code className="text-primary block whitespace-pre">
                        {`# Security Check\nif [[ $RECOGNITION -eq 1 ]]; then\n  echo "[OK] Biometric Signature Match"\n  load_arch_manifest\nelze\n  reject --signal SIGKILL\nfi`}
                      </code>
                    </div>

                    <p>
                      In conclusion, maintaining a 99.9% crash-free rate or successfully migrating 
                      enterprise Java codebases isn't just about the code—it's about the technical 
                      discipline and the architecture that supports it.
                    </p>
                  </div>
                </div>

                <div className="mt-16 pt-8 border-t border-white/5 flex justify-between items-center">
                   <div className="flex items-center gap-2">
                      <img src="/profile_one.png" className="w-10 h-10 rounded-full object-cover grayscale brightness-110" alt="Govind" />
                      <div>
                        <p className="text-white text-xs font-bold leading-none m-0">Govind Tank</p>
                        <p className="text-slate-500 text-[10px] m-0">Senior Lead Architect</p>
                      </div>
                   </div>
                   <button 
                    onClick={() => setSelectedPost(null)}
                    className="text-primary font-mono text-xs font-bold uppercase tracking-widest border border-primary/20 bg-primary/5 px-6 py-2 rounded-lg hover:bg-primary/20 transition-all"
                   >
                     Close Log
                   </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
