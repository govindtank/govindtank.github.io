import React from 'react';
import { motion } from 'motion/react';
import { BLOG_POSTS } from '../constants';
import { Terminal, Calendar, ArrowLeft, Share2, BookOpen, ChevronRight } from 'lucide-react';
import { BlogPost } from '../types';

export default function BlogDetail() {
  const [selectedPost, setSelectedPost] = React.useState<BlogPost | null>(null);

  // Smooth scroll back to top on mount
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!selectedPost) {
    return (
      <section id="blog-detail" className="py-24 bg-slate-900/30 relative min-h-[80vh] flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-16 rounded-3xl border border-white/10 bg-slate-900/80"
          >
            <Terminal className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-4xl font-bold italic-serif tracking-tighter uppercase font-black text-white mb-6">
              Select a Blog Post
            </h2>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed font-light">
              Scroll back to the blog section and click on any post to view its full technical manifest.
            </p>
            <div className="flex items-center justify-center gap-3 text-primary font-mono text-sm">
              <Terminal className="w-5 h-5" />
              <span>await user.selectBlogPost()</span>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="blog-detail" className="py-16 bg-slate-900/30 relative min-h-screen">
      {/* Back Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-4 left-6 z-50"
      >
        <button
          onClick={() => window.scrollTo({ top: document.getElementById('blog')?.offsetTop || 0, behavior: 'smooth' })}
          className="glass-card p-4 rounded-xl border border-white/10 hover:border-primary/30 transition-all group"
        >
          <div className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
            <span className="text-slate-300 font-mono text-sm uppercase tracking-wider group-hover:text-white">
              Back to Logs
            </span>
          </div>
        </button>
      </motion.div>

      <div className="max-w-5xl mx-auto px-6 pt-24 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-16"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-px h-12 bg-primary" />
            <div>
              <span className="text-xs font-mono text-primary uppercase tracking-widest">{selectedPost.tag}</span>
              <span className="text-slate-500 mx-2">•</span>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">{selectedPost.date}</span>
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-sans font-bold text-white mb-8 leading-tight">
            {selectedPost.title}
          </h1>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <img src="/profile_one.png" className="w-12 h-12 rounded-full object-cover grayscale brightness-110" alt="Govind" />
              <div>
                <p className="text-white text-sm font-bold leading-none">Govind Tank</p>
                <p className="text-slate-500 text-xs">Senior Lead Architect</p>
              </div>
            </div>

            {/* Social Share */}
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  const postUrl = window.location.origin + window.location.pathname;
                  await navigator.clipboard.writeText(postUrl);
                  alert('Blog link copied to clipboard! 📋');
                }}
                className="p-3 glass-card rounded-lg hover:bg-primary/10 transition-all group"
                title="Copy Link"
              >
                <Share2 className="w-5 h-5 text-slate-400 group-hover:text-primary" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-8 md:p-16 rounded-3xl border border-white/5 bg-slate-900/60"
        >
          <div className="prose prose-invert max-w-none">
            {/* Reading Notice */}
            <div className="flex items-center gap-4 p-6 bg-primary/5 border-l-4 border-primary rounded-xl mb-12">
              <BookOpen className="w-6 h-6 text-primary flex-shrink-0" />
              <div>
                <p className="text-primary font-mono text-sm italic m-0">
                  Internal Manifest Loading... ✓
                </p>
                <p className="text-slate-500 text-xs mt-1 font-light">
                  Architecture log • Production Ready • 2026 Secure
                </p>
              </div>
            </div>

            {/* Main Excerpt - Full Content */}
            <div className="space-y-8 text-slate-300 font-sans leading-relaxed text-lg">
              <p className="first-letter:text-7xl first-letter:font-bold first-letter:text-primary first-letter:mr-6 first-letter:float-left">
                {selectedPost.excerpt} As a Senior Architect, navigating the complexities of production-scale systems requires more than just language proficiency. 
                It demands a deep understanding of infrastructure stability, state consistency, and the human workflow behind the code.

                This technical session details specific implementation strategies that have been battle-tested in high-stakes environments where milliseconds matter and availability is non-negotiable.
              </p>

              {/* Core Methodologies */}
              <div className="my-16 p-8 bg-slate-950/50 border border-white/5 rounded-2xl font-mono text-sm relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-3">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">manifest_integrity.log</span>
                  <Terminal className="w-4 h-4 text-primary" />
                </div>
                <code className="text-primary block whitespace-pre">
                  {`# System Manifest: ${selectedPost.title}
├─ [OK] Architecture Validation Complete
├─ [OK] Performance Metrics Within Thresholds
├─ [OK] Security Protocols Verified
└─ [COMPLETE] Implementation Ready for Production`}
                </code>
              </div>

              <h3 className="text-white text-2xl font-bold mt-16 mb-6 font-mono tracking-tighter uppercase italic">
                <span className="text-primary mr-3">01.</span> Core Methodologies
              </h3>
              <p>
                In this technical deep-dive, we explore the implementation of strict validation layers and how they prevent 
                cascading failures in high-concurrency environments. By utilizing specific architectural patterns, we can 
                isolate fault domains and ensure data integrity across distributed systems.
              </p>

              {/* Technical Principles */}
              <h3 className="text-white text-2xl font-bold mt-16 mb-6 font-mono tracking-tighter uppercase italic">
                <span className="text-accent mr-3">02.</span> Technical Pillars
              </h3>
              <ul className="space-y-4 p-0">
                {[\n                  "Atomic design patterns in state management","Automated CI/CD pipelines with strictly enforced linting",\n                  "Memory profiling and aggressive leak detection","Security-first API communication protocols",\n                  "Zero-downtime deployment strategies","Real-time error aggregation and alerting"\n                ].map((item, i) => (\n                  <li key={i} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5">
                    <ChevronRight className="w-5 h-5 text-primary flex-shrink-0 mt-1" />\n                    <span>{item}</span>\n                  </li>\n                ))}\n              </ul>

              {/* Scaling Strategies */}
              <h3 className="text-white text-2xl font-bold mt-16 mb-6 font-mono tracking-tighter uppercase italic">
                <span className="text-primary mr-3">03.</span> Strategic Scaling
              </h3>
              <p>
                When scaling from thousands to hundreds of thousands of concurrent users, the focus shifts from 
                feature completeness to infrastructure resilience. We concentrate on:
              </p>

              <div className="grid md:grid-cols-2 gap-4 mt-8">
                {[\n                  "Zero-latency state distribution across edge nodes",\n                  "Differential data synchronization minimizing payload size",\n                  "Adaptive resource allocation per client-tier tiering",\n                  "Predictive scaling based on historical patterns"\n                ].map((item, index) => (\n                  <div key={index} className="flex gap-4 items-center p-5 rounded-xl bg-primary/5 border border-primary/10 hover:border-primary/30 transition-all">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {index + 1}\n                    </div>\n                    <span className="text-base font-semibold text-slate-200">{item}</span>\n                  </div>\n                ))}\n              </div>

              {/* Key Takeaways */}
              <div className="mt-16 p-8 bg-slate-950/50 border border-white/5 rounded-2xl font-mono text-sm">
                <h4 className="text-primary font-bold uppercase tracking-wider mb-4">Key Technical Takeaways</h4>\n                <ul className="space-y-3">\n                  {[
                    "Maintaining 99.9%+ availability requires proactive monitoring and automated recovery",\n                    "Code migration must preserve behavior while improving maintainability",\n                    "Performance optimization is an iterative process, not a one-time fix",\n                    "Security is built into the architecture, not bolted on afterward"\n                  ].map((takeaway, i) => (\n                    <li key={i} className="flex items-start gap-3">\n                      <span className="text-primary text-xl mt-1">✓</span>\n                      <span>{takeaway}</span>\n                    </li>\n                  ))}\n                </ul>\n              </div>

              {/* Conclusion */}
              <p className="mt-12 text-slate-400 italic border-l-4 border-primary/30 pl-6 py-4 bg-primary/5 rounded-r-xl">\n                In conclusion, maintaining a 99.9% crash-free rate or successfully migrating enterprise \n                Java codebases isn't just about the code—it's about the technical discipline, architectural \n                vision, and the team culture that supports sustainable engineering excellence.\n              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-16 pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-4">
              <img src="/profile_one.png" className="w-16 h-16 rounded-2xl object-cover border border-white/10 grayscale-[0.5] hover:grayscale-0 transition-all cursor-pointer" alt="Govind" />
              <div>\n                <p className="text-white font-bold text-lg m-0 leading-tight">Govind Tank</p>\n                <p className="text-primary font-mono text-xs uppercase tracking-widest mt-1">Senior Lead Architect</p>\n              </div>\n            </div>
            <button
              onClick={() => setSelectedPost(null)}
              className="px-8 py-4 bg-primary text-slate-950 font-sans font-black uppercase text-sm tracking-tighter hover:bg-white transition-all transform hover:-translate-y-1 active:translate-y-0 shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_30px_rgba(14,165,233,0.5)]"
            >\n              Close Manifest\n            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
