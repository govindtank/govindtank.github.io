import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { BLOG_POSTS, TESTIMONIALS } from '../constants';
import { BookOpen, Quote, ChevronRight, MessageSquareQuote, ArrowDown } from 'lucide-react';

export default function BlogAndTestimonials() {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  
  const visiblePosts = showAll ? BLOG_POSTS : BLOG_POSTS.slice(0, 3);
  
  return (
    <section id="blog" className="py-24 bg-slate-900/30 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-3 gap-16">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-4 mb-12">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <BookOpen className="text-primary w-6 h-6" />
              </div>
              <div>
                <h2 className="text-4xl font-bold italic-serif tracking-tighter uppercase font-black">Architectural <span className="text-primary">Logs</span></h2>
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">Status: Monitoring_Industry_Trends</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {visiblePosts.map((post, i) => (
                <motion.div
                  key={post.slug}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => navigate(`/blog/${post.slug}`)}
                  className="group relative p-8 system-card hover:bg-slate-800/40 transition-all cursor-pointer overflow-hidden border border-white/5"
                >
                  <div className="absolute right-0 top-0 h-full w-1 translate-x-1 group-hover:translate-x-0 bg-primary transition-transform" />
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-[10px] font-mono uppercase tracking-widest px-3 py-1 bg-slate-950 text-slate-400 border border-white/5 rounded">
                      {post.tag}
                    </span>
                    <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">{post.date}</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-primary transition-all tracking-tight leading-tight">{post.title}</h3>
                  <p className="text-slate-400 text-base mb-6 font-light">{post.excerpt}</p>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 group-hover:text-white uppercase tracking-[0.2em] transition-all">
                    Initialize_Read_Sequence <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              ))}
            </div>

            <AnimatePresence>
              {!showAll && BLOG_POSTS.length > 3 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-8"
                >
                  <button
                    onClick={() => setShowAll(true)}
                    className="w-full group relative flex items-center justify-center gap-3 py-4 px-6 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 rounded-xl transition-all overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <ArrowDown className="w-4 h-4 text-primary group-hover:translate-y-1 transition-transform relative z-10" />
                    <span className="text-xs font-mono text-slate-400 group-hover:text-primary uppercase tracking-widest relative z-10">
                      Load {BLOG_POSTS.length - 3} More Technical Logs
                    </span>
                    <div className="absolute bottom-0 left-0 h-[2px] bg-primary w-0 group-hover:w-full transition-all duration-700" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {showAll && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-8 text-center"
              >
                <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
                  ✓ All {BLOG_POSTS.length} Technical Logs Loaded
                </p>
              </motion.div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-4 mb-12">
              <MessageSquareQuote className="text-accent w-8 h-8" />
              <h2 className="text-4xl font-bold italic tracking-tighter">Social <span className="text-accent underline decoration-accent/30 underline-offset-8">Proof</span></h2>
            </div>

            <div className="space-y-8">
              {TESTIMONIALS.map((t, i) => (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="relative p-8 glass-card border border-white/5 bg-slate-800/40 rounded-2xl"
                >
                  <Quote className="absolute top-4 right-4 w-12 h-12 text-white/5" />
                  <p className="relative z-10 text-slate-300 italic mb-8 leading-relaxed font-sans">
                    "{t.content}"
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-white text-xs border border-white/10">
                       {t.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm leading-none">{t.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
