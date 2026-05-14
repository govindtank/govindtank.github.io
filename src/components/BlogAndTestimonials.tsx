import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BLOG_POSTS, TESTIMONIALS } from '../constants';
import { BookOpen, Quote, ChevronRight, MessageSquareQuote, X, Share2, Terminal } from 'lucide-react';
import { BlogPost } from '../types';

export default function BlogAndTestimonials() {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  return (
    <section id="blog" className="py-24 bg-slate-900/30 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-3 gap-16">
          {/* Blog Section */}
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
              {BLOG_POSTS.map((post, i) => (
                <motion.div
                  key={post.slug}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setSelectedPost(post)}
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

            {/* About Blogs - New Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12 pt-8 border-t border-white/5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-2">Full Technical Logs</h3>
                  <p className="text-slate-500 text-xs font-light leading-relaxed max-w-xl">
                    Explore complete architectural manifests with full implementation details, technical deep-dives, and production-grade strategies.
                  </p>
                </div>
                <button
                  onClick={() => {
                    // Scroll to top of page to find the blog detail section (which appears after clicking any post or directly)
                    document.getElementById('blog-detail')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-6 py-3 glass-card bg-primary/10 hover:bg-primary/20 transition-all border border-primary/20 group"
                >
                  <span className="text-primary font-mono text-xs font-bold uppercase tracking-widest group-hover:tracking-[0.25em] transition-all">
                    About Blogs →
                  </span>
                </button>
              </div>
            </motion.div>
          </div>

          {/* Testimonials */}
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

      {/* Blog Post Modal */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 backdrop-blur-2xl bg-slate-950/90"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="w-full max-w-4xl max-h-[90vh] glass-card bg-slate-900 overflow-y-auto rounded-3xl border border-white/10 shadow-[0_0_80px_rgba(14,165,233,0.2)] relative"
            >
              {/* Modal Header */}
              <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md p-6 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-widest">{selectedPost.tag}</span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{selectedPost.date}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedPost(null)}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-8 md:p-16">
                <div className="max-w-2xl mx-auto">
                  <h2 className="text-4xl md:text-6xl font-sans font-black text-white mb-10 leading-[0.95] tracking-tighter">
                    {selectedPost.title.split(' ').map((word, i) => (
                      <span key={i} className={i % 2 === 0 ? 'text-white' : 'text-primary italic'}>{word} </span>
                    ))}
                  </h2>

                  <div className="space-y-8 text-slate-300 font-sans text-lg leading-relaxed">
                    <div className="p-6 bg-primary/5 border-l-4 border-primary rounded-r-xl mb-12">
                      <p className="text-primary font-mono text-sm leading-relaxed m-0 italic">
                        {selectedPost.excerpt}
                      </p>
                    </div>

                    <p>
                      As a Senior Architect, navigating the complexities of production-scale systems requires more than just language proficiency. 
                      It demands a deep understanding of infrastructure stability, state consistency, and the human workflow behind the code.
                    </p>

                    <h3 className="text-white text-2xl font-bold mt-16 mb-6 font-mono tracking-tighter uppercase italic">
                      <span className="text-primary mr-2">01.</span> Core Methodologies
                    </h3>
                    <p>
                      In this technical session, we explore the implementation of strict validation layers and how they prevent 
                      cascading failures in high-concurrency environments. By utilizing specific architectural patterns, we can 
                      isolate fault domains and ensure data integrity.
                    </p>

                    <div className="my-16 p-8 bg-black/40 border border-white/5 rounded-2xl font-mono text-sm relative group">
                      <Terminal className="absolute top-4 right-4 w-6 h-6 text-primary/20 group-hover:text-primary/40 transition-colors" />
                      <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/40" />
                      </div>
                      <code className="text-primary/90 block leading-loose">
                        {`// Secure Architecture Guard\nexport async function validateSession(token: string) {\n  const result = await auth.check(token);\n  if (result.status === "ACTIVE") {\n    return initializeSecureHandshake();\n  }\n  throw new SecurityError("MANIFEST_INTEGRITY_FAIL");\n}`}
                      </code>
                    </div>

                    <h3 className="text-white text-2xl font-bold mt-16 mb-6 font-mono tracking-tighter uppercase italic">
                      <span className="text-accent mr-2">02.</span> Strategic Scaling
                    </h3>
                    <p>
                      Scaling from a thousand to a hundred thousand downloads requires aggressive profiling. We focus on:
                    </p>
                    <ul className="grid gap-4 list-none p-0 mt-8">
                      {[
                        "Zero-latency state distribution",
                        "Differential data synchronization",
                        "Adaptive resource allocation per client-tier"
                      ].map((item, index) => (
                        <li key={index} className="flex gap-4 items-center bg-white/5 p-4 rounded-xl border border-white/5">
                           <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-mono text-xs shrink-0">
                             {index + 1}
                           </div>
                           <span className="text-base font-semibold">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-24 pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8">
                     <div className="flex items-center gap-4">
                        <img src="/profile_one.png" className="w-16 h-16 rounded-2xl object-cover border border-white/10 grayscale-[0.5] hover:grayscale-0 transition-all cursor-crosshair" alt="Govind" />
                        <div>
                          <p className="text-white font-bold text-lg m-0 leading-tight">Govind Tank</p>
                          <p className="text-primary font-mono text-xs uppercase tracking-widest mt-1">Senior Lead Architect</p>
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <button className="p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all group">
                          <Share2 className="w-5 h-5 text-slate-400 group-hover:text-primary" />
                        </button>
                        <button 
                          onClick={() => setSelectedPost(null)}
                          className="px-8 py-4 bg-primary text-slate-950 font-sans font-black uppercase text-sm tracking-tighter hover:bg-white transition-all transform hover:-translate-y-1 active:translate-y-0"
                        >
                          Terminate Signal
                        </button>
                     </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

