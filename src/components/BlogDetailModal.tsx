import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Tag, Clock, BookOpen, Terminal, Twitter, Facebook, Linkedin, Loader, Link, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { BlogPost } from '../types';
import Mermaid from '../components/Mermaid';
import stripFrontmatter from '../lib/stripFrontmatter';

interface BlogDetailModalProps {
  selectedPost: BlogPost | null;
  onClose: () => void;
}

// Lazy-loaded markdown modules — code-split per blog post
const contentModules = import.meta.glob<string>('../content/blog/*.md', { query: '?raw', import: 'default' });

export default function BlogDetailModal({ selectedPost, onClose }: BlogDetailModalProps) {
  const [fullContent, setFullContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);

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
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedPost]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!selectedPost) return null;

  const readingTime = Math.ceil(((fullContent || selectedPost.content || '').split(' ').length || 200) / 200);
  const postUrl = window.location.href;

  const shareToPlatform = async (platform: string) => {
    const shareTitle = encodeURIComponent(selectedPost.title);
    const shareText = encodeURIComponent(`Check out this technical blog: ${selectedPost.title}`);
    
    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${postUrl}&text=${shareText}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${postUrl}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${postUrl}&title=${shareTitle}&summary=${shareText}`, '_blank');
        break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(postUrl);
          alert('Blog link copied to clipboard! 📋');
        } catch (err) {
          console.error('Failed to copy:', err);
          alert('Failed to copy link');
        }
        break;
    }
  };

  function CopyLinkButton() {
    const [copied, setCopied] = useState(false);
    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(postUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    };
    return (
      <button
        onClick={handleCopy}
        className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-primary"
        title={copied ? 'Copied!' : 'Copy Link'}
      >
        {copied ? <Check className="w-4 h-4" /> : <Link className="w-4 h-4" />}
      </button>
    );
  }

  // Fix double title by removing the first # Title if it matches
  // Handles: leading newlines/whitespace, regex special chars, and mismatched H1 vs title
  const cleanContent = (content: string) => {
    if (!content) return '';
    // Remove any leading # heading (the first H1 in content) to prevent double-title
    // This handles cases where content starts with \n\n# Title or just # Title
    const cleaned = content.replace(/^\s*# .+/m, '').replace(/^\s*\n\s*/, '');
    // If removing the first heading left the start empty, trim further
    return cleaned;
  };

  const renderMarkdown = (content: string) => {
    const parts = content.split(/```mermaid([\s\S]*?)```/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <Mermaid key={index} chart={part.trim()} />;
      }
      return (
        <ReactMarkdown 
          key={index} 
          remarkPlugins={[remarkGfm]}
          components={{
            code({node, inline, className, children, ...props}) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  className="rounded-xl my-6 border border-white/5"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className="px-1.5 py-0.5 bg-slate-800 rounded text-primary font-mono text-sm" {...props}>
                  {children}
                </code>
              );
            },
            h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-white mt-10 mb-6 leading-tight" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-2xl font-bold text-white mt-10 mb-4 flex items-center gap-3 border-l-4 border-primary pl-4" {...props} />,
            h3: ({node, ...props}) => <h3 className="text-xl font-bold text-primary mt-8 mb-3" {...props} />,
            p: ({node, ...props}) => <p className="my-4 text-slate-300 leading-relaxed text-lg" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc pl-6 my-4 space-y-2 text-slate-300" {...props} />,
            ol: ({node, ...props}) => <ol className="list-decimal pl-6 my-4 space-y-2 text-slate-300" {...props} />,
            li: ({node, ...props}) => <li className="leading-relaxed" {...props} />,
            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary/30 pl-4 italic my-6 text-slate-400" {...props} />,
            img: ({node, ...props}) => <img className="rounded-2xl my-8 mx-auto shadow-2xl border border-white/10" {...props} />,
            table: ({node, ...props}) => (
              <div className="overflow-x-auto my-8 rounded-xl border border-white/10 shadow-lg">
                <table className="w-full border-collapse text-sm" {...props} />
              </div>
            ),
            thead: ({node, ...props}) => (
              <thead className="bg-primary/10 border-b border-primary/20" {...props} />
            ),
            th: ({node, ...props}) => (
              <th className="px-4 py-3 text-left text-xs font-bold text-primary uppercase tracking-wider border-r border-white/5 last:border-r-0" {...props} />
            ),
            tr: ({node, ...props}) => (
              <tr className="border-b border-white/5 last:border-b-0 even:bg-white/[0.02] hover:bg-white/[0.04] transition-colors" {...props} />
            ),
            td: ({node, ...props}) => (
              <td className="px-4 py-3 text-slate-300 border-r border-white/5 last:border-r-0" {...props} />
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
            <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-white/5 px-6 md:px-12 py-4 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                  <Tag className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-mono text-primary uppercase tracking-wider">{selectedPost.tag}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Calendar className="w-3 h-3" />
                  <span className="text-[10px] font-mono uppercase tracking-wider">{selectedPost.date}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span className="text-[10px] font-mono uppercase tracking-wider">{readingTime} min read</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="px-6 md:px-12 py-8 md:py-12">
              <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-8 leading-tight tracking-tight">
                {selectedPost.title}
              </h1>

              <div className="flex items-center justify-between mb-12 pb-8 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <img src="/profile_one.png" className="w-14 h-14 rounded-full object-cover grayscale brightness-110 border-2 border-primary/20" alt="Govind" />
                  <div>
                    <p className="text-white text-base font-bold">Govind Tank</p>
                    <p className="text-slate-500 text-sm">Senior Lead Architect</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => shareToPlatform('twitter')}
                    className="p-2.5 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-[#1DA1F2]"
                    title="Share on Twitter"
                  >
                    <Twitter className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => shareToPlatform('facebook')}
                    className="p-2.5 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-[#1877F2]"
                    title="Share on Facebook"
                  >
                    <Facebook className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => shareToPlatform('linkedin')}
                    className="p-2.5 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-[#0A66C2]"
                    title="Share on LinkedIn"
                  >
                    <Linkedin className="w-5 h-5" />
                  </button>
                  <CopyLinkButton />
                </div>
              </div>

              <div className="mb-12 p-6 bg-primary/5 border-l-4 border-primary rounded-r-2xl">
                <p className="text-slate-300 text-lg italic leading-relaxed">
                  {selectedPost.excerpt}
                </p>
              </div>

              <div className="blog-content">
                {loadingContent ? (
                  <div className="text-center py-24">
                    <Loader className="w-12 h-12 text-primary animate-spin mx-auto mb-6" />
                    <p className="text-slate-400 font-mono animate-pulse">Downloading technical manifest...</p>
                  </div>
                ) : fullContent ? renderMarkdown(cleanContent(fullContent)) : (
                  <div className="text-center py-24">
                    <BookOpen className="w-16 h-16 text-slate-700 mx-auto mb-6" />
                    <p className="text-slate-400 italic text-lg">
                      Full content for this technical log is being compiled.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-24 pt-12 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Terminal className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold">End of Technical Log</p>
                    <p className="text-slate-500 text-[10px] font-mono uppercase tracking-widest">Status: Manifest Complete</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="px-8 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/80 transition-all shadow-lg shadow-primary/20"
                >
                  Close Archive →
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
