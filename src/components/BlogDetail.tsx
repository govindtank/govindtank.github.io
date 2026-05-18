import React from 'react';
import { motion } from 'motion/react';
import { Terminal, Calendar, ArrowLeft, Share2, BookOpen } from 'lucide-react';
import { BlogPost } from '../types';

interface BlogDetailProps {
  selectedPost: BlogPost | null;
  onBack: () => void;
}

export default function BlogDetail({ selectedPost, onBack }: BlogDetailProps) {
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

  const renderContent = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let codeBlock: string[] = [];
    let inCodeBlock = false;
    let codeLanguage = '';

    const flushCodeBlock = () => {
      if (codeBlock.length > 0) {
        elements.push(
          <div key={`code-${elements.length}`} className="my-8 p-6 bg-slate-950 border border-white/5 rounded-xl font-mono text-sm overflow-x-auto">
            {codeLanguage && (
              <div className="text-xs text-slate-500 mb-3 uppercase tracking-wider">{codeLanguage}</div>
            )}
            <pre className="text-primary/90 whitespace-pre">{codeBlock.join('\n')}</pre>
          </div>
        );
        codeBlock = [];
        codeLanguage = '';
      }
    };

    lines.forEach((line, index) => {
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          flushCodeBlock();
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
          codeLanguage = line.slice(3).trim();
        }
        return;
      }

      if (inCodeBlock) {
        codeBlock.push(line);
        return;
      }

      if (line.startsWith('# ')) {
        flushCodeBlock();
        elements.push(
          <h1 key={`h1-${index}`} className="text-3xl md:text-4xl font-bold text-white mt-12 mb-6">
            {line.slice(2)}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        flushCodeBlock();
        elements.push(
          <h2 key={`h2-${index}`} className="text-2xl md:text-3xl font-bold text-white mt-10 mb-5">
            {line.slice(3)}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        flushCodeBlock();
        elements.push(
          <h3 key={`h3-${index}`} className="text-xl md:text-2xl font-bold text-primary mt-8 mb-4">
            {line.slice(4)}
          </h3>
        );
      } else if (line.startsWith('- [ ]') || line.startsWith('- [x]') || line.startsWith('- ')) {
        const text = line.replace(/^- \[[ x]\] /, '').replace(/^- /, '');
        elements.push(
          <li key={`li-${index}`} className="flex items-start gap-3 my-2 text-slate-300">
            <span className="text-primary mt-1">▹</span>
            <span>{text}</span>
          </li>
        );
      } else if (line.startsWith('|')) {
        const cells = line.split('|').filter(cell => cell.trim());
        if (cells.every(cell => cell.trim().match(/^[-:]+$/))) {
          return;
        }
        elements.push(
          <div key={`table-${index}`} className="flex gap-4 my-1 text-sm">
            {cells.map((cell, cellIndex) => (
              <span key={cellIndex} className="flex-1 text-slate-300">
                {cell.trim()}
              </span>
            ))}
          </div>
        );
      } else if (line.trim() === '') {
        flushCodeBlock();
        elements.push(<div key={`br-${index}`} className="h-4" />);
      } else {
        flushCodeBlock();
        const parts = line.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
        elements.push(
          <p key={`p-${index}`} className="my-3 text-slate-300 leading-relaxed">
            {parts.map((part, partIndex) => {
              if (part.startsWith('`') && part.endsWith('`')) {
                return (
                  <code key={partIndex} className="px-2 py-0.5 bg-slate-800 rounded text-primary text-sm">
                    {part.slice(1, -1)}
                  </code>
                );
              } else if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={partIndex} className="text-white">{part.slice(2, -2)}</strong>;
              } else if (part.startsWith('*') && part.endsWith('*')) {
                return <em key={partIndex} className="text-slate-400">{part.slice(1, -1)}</em>;
              }
              return <span key={partIndex}>{part}</span>;
            })}
          </p>
        );
      }
    });

    flushCodeBlock();
    return elements;
  };

  return (
    <section id="blog-detail" className="py-16 bg-slate-900/30 relative min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-4 left-6 z-50"
      >
        <button
          onClick={onBack}
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

            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  const postUrl = window.location.href;
                  await navigator.clipboard.writeText(postUrl);
                  alert('Blog link copied to clipboard!');
                }}
                className="p-3 glass-card rounded-lg hover:bg-primary/10 transition-all group"
                title="Copy Link"
              >
                <Share2 className="w-5 h-5 text-slate-400 group-hover:text-primary" />
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-8 md:p-16 rounded-3xl border border-white/5 bg-slate-900/60"
        >
          <div className="prose prose-invert max-w-none">
            <div className="flex items-center gap-4 p-6 bg-primary/5 border-l-4 border-primary rounded-xl mb-12">
              <BookOpen className="w-6 h-6 text-primary flex-shrink-0" />
              <div>
                <p className="text-primary font-mono text-sm italic m-0">
                  Technical Log Access Granted ✓
                </p>
                <p className="text-slate-500 text-xs mt-1 font-light">
                  {selectedPost.tag} • {selectedPost.date} • Complete Manifest
                </p>
              </div>
            </div>

            <div className="text-lg">
              {selectedPost.content ? renderContent(selectedPost.content) : (
                <p className="text-slate-400 italic">
                  Full content for this technical log is being compiled. Check back soon for the complete architectural manifest.
                </p>
              )}
            </div>
          </div>

          <div className="mt-16 pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-4">
              <img src="/profile_one.png" className="w-16 h-16 rounded-2xl object-cover border border-white/10 grayscale-[0.5] hover:grayscale-0 transition-all cursor-pointer" alt="Govind" />
              <div>
                <p className="text-white font-bold text-lg m-0 leading-tight">Govind Tank</p>
                <p className="text-primary font-mono text-xs uppercase tracking-widest mt-1">Senior Lead Architect</p>
              </div>
            </div>
            <button
              onClick={onBack}
              className="px-8 py-4 bg-primary text-slate-950 font-sans font-black uppercase text-sm tracking-tighter hover:bg-white transition-all transform hover:-translate-y-1 active:translate-y-0 shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_30px_rgba(14,165,233,0.5)]"
            >
              Close Manifest
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
