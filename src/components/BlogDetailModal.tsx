import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Tag as TagIcon, Clock, BookOpen, Terminal, Twitter, Linkedin, Loader, Check, ChevronRight, List, ChevronDown, ArrowLeft, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { BlogPost } from '../types';
import Mermaid from '../components/Mermaid';
import stripFrontmatter from '../lib/stripFrontmatter';

interface BlogDetailModalProps {
  selectedPost: BlogPost | null;
  onClose: () => void;
}

const contentModules = import.meta.glob<string>('../content/blog/*.md', { query: '?raw', import: 'default' });

export default function BlogDetailModal({ selectedPost, onClose }: BlogDetailModalProps) {
  const [fullContent, setFullContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedPost) return;
    let cancelled = false;
    setFullContent(null);
    setLoadingContent(true);
    setContentError(null);
    const loader = contentModules[`../content/blog/${selectedPost.slug}.md`];
    if (loader) {
      loader()
        .then((raw: string) => {
          if (cancelled) return;
          const parsed = stripFrontmatter(raw);
          setFullContent(parsed.content || null);
          setLoadingContent(false);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          console.error('[BlogModal] Failed to load content:', err, 'slug:', selectedPost.slug);
          setContentError(err instanceof Error ? err.message : 'Failed to load content');
          setFullContent(null);
          setLoadingContent(false);
        });
    } else {
      console.warn('[BlogModal] No loader found for:', `../content/blog/${selectedPost.slug}.md`);
      setContentError(`Content not found`);
      setFullContent(null);
      setLoadingContent(false);
    }
    return () => { cancelled = true; };
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

  const postUrl = typeof window !== 'undefined' ? window.location.href : '';

  const shareToPlatform = (platform: string) => {
    const shareTitle = encodeURIComponent(selectedPost.title);
    const shareText = encodeURIComponent(`Check out: ${selectedPost.title}`);
    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${postUrl}&text=${shareText}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${postUrl}&title=${shareTitle}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(postUrl).then(() => setCopied(true)) && setTimeout(() => setCopied(false), 2000);
        break;
    }
  };

  const [copied, setCopied] = useState(false);

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

  function extractText(node: React.ReactNode): string {
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(extractText).join('');
    if (node && typeof node === 'object' && 'props' in node) {
      const n = node as any;
      if (n.props?.children) return extractText(n.props.children);
    }
    return '';
  }

  const renderContent = (content: string) => {
    const cleaned = cleanContent(content);
    const parts = cleaned.split(/```mermaid([\s\S]*?)```/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <Mermaid key={index} chart={part.trim()} />;
      }
      return (
        <ReactMarkdown
          key={index}
          remarkPlugins={[remarkGfm]}
          components={{
            h2: ({ children, ...props }) => {
              const text = extractText(children);
              const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
              return (
                <h2 id={id} className="text-2xl font-bold text-white mt-10 mb-5 flex items-center gap-3 scroll-mt-24" {...props}>
                  <span className="w-1.5 h-6 bg-primary rounded-full shrink-0" />
                  {children}
                </h2>
              );
            },
            h3: ({ children, ...props }) => {
              const text = extractText(children);
              const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
              return (
                <h3 id={id} className="text-lg font-bold text-primary/90 mt-8 mb-3 scroll-mt-24" {...props}>{children}</h3>
              );
            },
            h1: ({ children, ...props }) => (
              <h1 className="text-3xl font-bold text-white mt-10 mb-6 leading-tight" {...props}>{children}</h1>
            ),
            p: ({ children, ...props }) => (
              <p className="my-4 text-slate-300 leading-[1.75] text-base sm:text-lg" {...props}>{children}</p>
            ),
            ul: ({ children, ...props }) => (
              <ul className="list-none pl-0 my-4 space-y-2 text-slate-300" {...props}>{children}</ul>
            ),
            ol: ({ children, ...props }) => (
              <ol className="list-decimal pl-6 my-4 space-y-2 text-slate-300" {...props}>{children}</ol>
            ),
            li: ({ children, ...props }) => (
              <li className="flex items-start gap-2.5 leading-relaxed" {...props}>
                <span className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-2.5 shrink-0" />
                <div className="min-w-0 flex-1 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{children}</div>
              </li>
            ),
            blockquote: ({ children, ...props }) => (
              <blockquote className="border-l-2 border-primary/30 pl-5 italic my-6 text-slate-400 bg-primary/[0.02] py-3 pr-4 rounded-r-xl" {...props}>{children}</blockquote>
            ),
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <div className="relative group my-6">
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 border border-white/5 border-b-0 rounded-t-xl">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{match[1]}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ''))}
                      className="text-[10px] font-mono text-slate-600 hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      Copy
                    </button>
                  </div>
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    className="rounded-b-xl !mt-0 border border-white/5 border-t-0"
                    customStyle={{ margin: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <code className="px-1.5 py-0.5 bg-slate-800/80 rounded text-primary font-mono text-sm border border-white/5" {...props}>
                  {children}
                </code>
              );
            },
            a: ({ children, href, ...props }) => (
              <a href={href} target="_blank" rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 underline underline-offset-2 decoration-primary/30 transition-colors" {...props}>
                {children}
              </a>
            ),
            img: ({ src, alt, ...props }) => (
              <div className="my-8 rounded-xl overflow-hidden border border-white/5">
                <img src={src} alt={alt || ''} className="w-full object-cover" loading="lazy" {...props} />
              </div>
            ),
            hr: () => <hr className="my-12 border-white/5" />,
            strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
            table: ({ children, ...props }) => (
              <div className="overflow-x-auto my-8 rounded-xl border border-white/10 shadow-lg">
                <table className="w-full border-collapse text-sm" {...props}>{children}</table>
              </div>
            ),
            thead: ({ children, ...props }) => (
              <thead className="bg-primary/10 border-b border-primary/20" {...props}>{children}</thead>
            ),
            th: ({ children, ...props }) => (
              <th className="px-4 py-3 text-left text-xs font-bold text-primary uppercase tracking-wider border-r border-white/5 last:border-r-0" {...props}>{children}</th>
            ),
            tr: ({ children, ...props }) => (
              <tr className="border-b border-white/5 last:border-b-0 even:bg-white/[0.02] hover:bg-white/[0.04] transition-colors" {...props}>{children}</tr>
            ),
            td: ({ children, ...props }) => (
              <td className="px-4 py-3 text-slate-300 border-r border-white/5 last:border-r-0" {...props}>{children}</td>
            ),
          }}
          className="prose prose-invert max-w-none"
        >
          {part}
        </ReactMarkdown>
      );
    });
  };

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
            <div className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-white/5 px-6 md:px-10 py-4 flex justify-between items-center rounded-t-3xl">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                  <TagIcon className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-mono text-primary uppercase tracking-wider">{selectedPost.tag}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  {selectedPost.date}
                </span>
                <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  {selectedPost.readTime || Math.ceil((selectedPost.excerpt?.split(' ').length || 200) / 200)} min read
                </span>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 md:px-10 py-8">
              {/* Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-[1.15] tracking-tight mb-6">
                {selectedPost.title}
              </h1>

              {/* Author & Share */}
              <div className="flex items-center justify-between flex-wrap gap-4 mb-8 pb-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <img src="/profile_one.png" className="w-10 h-10 rounded-full object-cover grayscale brightness-110 border border-primary/20" alt="Govind Tank" />
                  <div>
                    <p className="text-white text-sm font-semibold">Govind Tank</p>
                    <p className="text-slate-500 text-xs">Senior Lead Architect</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => shareToPlatform('twitter')} className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-sky-400 transition-all">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </button>
                  <button onClick={() => shareToPlatform('linkedin')} className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-blue-500 transition-all">
                    <Linkedin className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { navigator.clipboard.writeText(postUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    className={`p-2 rounded-lg transition-all ${copied ? 'bg-green-500/20 text-green-400' : 'hover:bg-white/5 text-slate-500 hover:text-white'}`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>}
                  </button>
                </div>
              </div>

              {/* Cover image */}
              {selectedPost.coverImage && (
                <div className="mb-8 rounded-2xl overflow-hidden border border-white/5">
                  <img src={selectedPost.coverImage} alt={selectedPost.title} className="w-full h-48 sm:h-64 object-cover" loading="lazy" />
                </div>
              )}

              {/* Excerpt */}
              <div className="mb-8 p-5 bg-primary/5 border-l-4 border-primary rounded-r-2xl">
                <p className="text-slate-300 italic leading-relaxed">{selectedPost.excerpt}</p>
              </div>

              {/* Mobile TOC */}
              {tocItems.length > 0 && (
                <div className="md:hidden mb-6">
                  <button
                    onClick={() => setShowToc(!showToc)}
                    className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-slate-800/80 border border-white/10 rounded-xl text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    <span className="flex items-center gap-2"><List className="w-4 h-4" /> Table of Contents</span>
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
                          className={`block w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            item.level === 3 ? 'ml-4' : ''
                          } text-slate-400 hover:text-white hover:bg-white/5`}
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
                    <Loader className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 font-mono text-sm animate-pulse">Loading content...</p>
                  </div>
                ) : contentError ? (
                  <div className="text-center py-24">
                    <BookOpen className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-500 italic mb-1">Could not load article content.</p>
                    <p className="text-[10px] text-slate-600 font-mono">Error: {contentError}</p>
                  </div>
                ) : fullContent ? (() => {
                  try { return renderContent(fullContent); }
                  catch (e) { console.error('[BlogModal] renderContent error:', e); return <div className="text-center py-20"><p className="text-slate-500 italic">Error rendering content.</p></div>; }
                })() : (
                  <div className="text-center py-24">
                    <BookOpen className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-500 italic">Full content being compiled.</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-16 pt-8 border-t border-white/10 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Terminal className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">End of Article</p>
                    <p className="text-slate-500 text-[10px] font-mono uppercase tracking-widest">Manifest Complete</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/80 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 text-sm"
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
