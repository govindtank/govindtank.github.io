import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Tag as TagIcon, Clock, BookOpen, Terminal, Linkedin, Loader, Check, ChevronRight, List, ChevronDown } from 'lucide-react';
import { BlogPost } from '../types';
import stripFrontmatter from '../lib/stripFrontmatter';
import MarkdownRenderer from './MarkdownRenderer';

interface BlogDetailModalProps {
  selectedPost: BlogPost | null;
  onClose: () => void;
}

const contentModules = import.meta.glob<string>('../content/blog/*.md', { query: '?raw', import: 'default' });

export default function BlogDetailModal({ selectedPost, onClose }: BlogDetailModalProps) {
  const [fullContent, setFullContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!selectedPost) return;
    setFullContent(null);
    setLoadingContent(true);
    const loader = contentModules[`../content/blog/${selectedPost.slug}.md`];
    if (loader) {
      loader()
        .then((raw: string) => {
          const parsed = stripFrontmatter(raw);
          setFullContent(parsed.content || null);
          setLoadingContent(false);
        })
        .catch(() => {
          setFullContent(null);
          setLoadingContent(false);
        });
    } else {
      setFullContent(null);
      setLoadingContent(false);
    }
  }, [selectedPost]);

  useEffect(() => {
    if (selectedPost) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedPost]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!selectedPost) return null;

  const postUrl = typeof window !== 'undefined' ? `${window.location.origin}/blog/${selectedPost.slug}` : '';

  const shareToPlatform = (platform: string) => {
    const shareTitle = encodeURIComponent(selectedPost.title);
    const shareText = encodeURIComponent(`Check out: ${selectedPost.title}`);
    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${shareText}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(postUrl)}&title=${shareTitle}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(postUrl).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
        break;
    }
  };

  const cleanContent = (content: string) => {
    if (!content) return '';
    return content.replace(/^\s*# .+/m, '').replace(/^\s*\n\s*/, '');
  };

  // Extract headings for TOC
  const tocItems = React.useMemo(() => {
    if (!fullContent) return [];
    const cleaned = cleanContent(fullContent);
    const headingRegex = /^(#{2,3})\s+(.+)$/gm;
    const items: { level: number; text: string; id: string }[] = [];
    let match;
    while ((match = headingRegex.exec(cleaned)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      items.push({ level, text, id });
    }
    return items;
  }, [fullContent]);

  return (
    <AnimatePresence>
      {selectedPost && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-start justify-center bg-slate-950/90 backdrop-blur-xl overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            className="w-full max-w-5xl mx-4 my-12 bg-slate-900 border border-white/10 rounded-3xl shadow-[0_0_100px_rgba(14,165,233,0.15)] relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky header */}
            <div className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-white/10 px-6 md:px-10 py-4 flex justify-between items-center rounded-t-3xl">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-sky-500/10 border border-sky-500/20 rounded-full">
                  <TagIcon className="w-3 h-3 text-sky-400" />
                  <span className="text-[10px] font-mono text-sky-400 uppercase tracking-wider">{selectedPost.tag}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  {selectedPost.date}
                </span>
                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  {selectedPost.readTime || 8} min read
                </span>
              </div>
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 md:px-10 py-8">
              {/* Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight mb-6">
                {selectedPost.title}
              </h1>

              {/* Author & Share */}
              <div className="flex items-center justify-between flex-wrap gap-4 mb-8 pb-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <img
                    src="/profile_one.png"
                    className="w-10 h-10 rounded-full object-cover border border-sky-500/30"
                    alt="Govind Tank"
                    loading="lazy"
                  />
                  <div>
                    <p className="text-white text-sm font-bold">Govind Tank</p>
                    <p className="text-slate-400 text-xs font-mono">Senior Lead Architect</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => shareToPlatform('twitter')}
                    aria-label="Share on X"
                    className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-sky-400 transition-all"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </button>
                  <button
                    onClick={() => shareToPlatform('linkedin')}
                    aria-label="Share on LinkedIn"
                    className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-blue-400 transition-all"
                  >
                    <Linkedin className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => shareToPlatform('copy')}
                    aria-label="Copy article link"
                    className={`p-2 rounded-lg transition-all ${copied ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/10 text-slate-400 hover:text-white'}`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>}
                  </button>
                </div>
              </div>

              {/* Cover image */}
              {selectedPost.coverImage && (
                <div className="mb-8 rounded-2xl overflow-hidden border border-white/10">
                  <img src={selectedPost.coverImage} alt={selectedPost.title} className="w-full h-48 sm:h-64 object-cover" loading="lazy" />
                </div>
              )}

              {/* Excerpt */}
              <div className="mb-8 p-5 bg-sky-500/5 border-l-4 border-sky-400 rounded-r-2xl">
                <p className="text-slate-300 italic leading-relaxed">{selectedPost.excerpt}</p>
              </div>

              {/* Mobile TOC */}
              {tocItems.length > 0 && (
                <div className="md:hidden mb-6">
                  <button
                    onClick={() => setShowToc(!showToc)}
                    aria-label="Toggle Table of Contents"
                    className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-slate-800/80 border border-white/10 rounded-xl text-sm text-slate-300 hover:text-white transition-colors"
                  >
                    <span className="flex items-center gap-2 font-mono text-xs uppercase text-sky-400"><List className="w-4 h-4" /> Table of Contents</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showToc ? 'rotate-180' : ''}`} />
                  </button>
                  {showToc && (
                    <div className="mt-2 p-3 bg-slate-800/80 border border-white/10 rounded-xl">
                      {tocItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            const el = document.getElementById(item.id);
                            el?.scrollIntoView({ behavior: 'smooth' });
                            setShowToc(false);
                          }}
                          className={`block w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors ${
                            item.level === 3 ? 'ml-4 text-slate-400' : 'text-slate-200 font-semibold'
                          } hover:bg-white/5`}
                        >
                          {item.text}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Blog content */}
              <div className="blog-content">
                {loadingContent ? (
                  <div className="text-center py-24">
                    <Loader className="w-10 h-10 text-sky-400 animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 font-mono text-sm animate-pulse">Loading content...</p>
                  </div>
                ) : fullContent ? (
                  <MarkdownRenderer content={cleanContent(fullContent)} />
                ) : (
                  <div className="text-center py-24">
                    <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 italic">Full content being compiled.</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-16 pt-8 border-t border-white/10 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                    <Terminal className="w-5 h-5 text-sky-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">End of Article</p>
                    <p className="text-slate-400 text-[10px] font-mono uppercase tracking-widest">Manifest Complete</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-sky-500 text-slate-950 font-bold rounded-xl hover:bg-sky-400 transition-all shadow-lg flex items-center gap-2 text-sm"
                >
                  Close <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
