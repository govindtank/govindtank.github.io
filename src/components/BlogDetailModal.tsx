import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Share2, Calendar, Tag, Clock, BookOpen, Terminal, Twitter, Facebook, Linkedin } from 'lucide-react';
import { BlogPost } from '../types';

interface BlogDetailModalProps {
  selectedPost: BlogPost | null;
  onClose: () => void;
}

export default function BlogDetailModal({ selectedPost, onClose }: BlogDetailModalProps) {
  React.useEffect(() => {
    if (selectedPost) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedPost]);

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!selectedPost) return null;

  const renderContent = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let codeBlock: string[] = [];
    let inCodeBlock = false;
    let codeLanguage = '';
    let inTable = false;
    let tableRows: string[][] = [];

    const flushCodeBlock = () => {
      if (codeBlock.length > 0) {
        elements.push(
          <div key={`code-${elements.length}`} className="my-8 rounded-xl overflow-hidden border border-white/5">
            <div className="bg-slate-950/80 px-4 py-2 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
              </div>
              {codeLanguage && (
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{codeLanguage}</span>
              )}
            </div>
            <div className="bg-slate-950 p-6 overflow-x-auto">
              <pre className="text-primary/90 whitespace-pre text-sm font-mono leading-relaxed">{codeBlock.join('\n')}</pre>
            </div>
          </div>
        );
        codeBlock = [];
        codeLanguage = '';
      }
    };

    const flushTable = () => {
      if (tableRows.length > 0) {
        elements.push(
          <div key={`table-${elements.length}`} className="my-8 overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-950/80 border-b border-white/5">
                  {tableRows[0].map((cell, i) => (
                    <th key={i} className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-primary">{cell.trim()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.slice(1).map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-3 text-slate-300">{cell.trim()}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        inTable = false;
      }
    };

    lines.forEach((line, index) => {
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          flushCodeBlock();
          inCodeBlock = false;
        } else {
          flushTable();
          inCodeBlock = true;
          codeLanguage = line.slice(3).trim();
        }
        return;
      }

      if (inCodeBlock) {
        codeBlock.push(line);
        return;
      }

      if (line.startsWith('|') && line.trim().endsWith('|')) {
        inTable = true;
        const cells = line.split('|').slice(1, -1);
        if (!cells.every(cell => cell.trim().match(/^[-:]+$/))) {
          tableRows.push(cells);
        }
        return;
      } else if (inTable) {
        flushTable();
      }

      if (line.startsWith('# ')) {
        flushCodeBlock();
        elements.push(
          <h1 key={`h1-${index}`} className="text-3xl md:text-4xl font-bold text-white mt-12 mb-6 leading-tight">
            {line.slice(2)}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        flushCodeBlock();
        elements.push(
          <div key={`h2-${index}`} className="mt-12 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-px bg-primary" />
              <h2 className="text-2xl md:text-3xl font-bold text-white">{line.slice(3)}</h2>
            </div>
          </div>
        );
      } else if (line.startsWith('### ')) {
        flushCodeBlock();
        elements.push(
          <h3 key={`h3-${index}`} className="text-xl md:text-2xl font-bold text-primary mt-8 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            {line.slice(4)}
          </h3>
        );
      } else if (line.startsWith('- [ ]') || line.startsWith('- [x]') || line.startsWith('- ')) {
        flushCodeBlock();
        const text = line.replace(/^- \[[ x]\] /, '').replace(/^- /, '');
        elements.push(
          <div key={`li-${index}`} className="flex items-start gap-3 my-3 p-3 rounded-lg bg-white/5 border border-white/5 hover:border-primary/20 transition-colors">
            <span className="text-primary mt-0.5 font-mono">›</span>
            <span className="text-slate-300 leading-relaxed">{text}</span>
          </div>
        );
      } else if (line.trim() === '') {
        flushCodeBlock();
        flushTable();
        elements.push(<div key={`br-${index}`} className="h-4" />);
      } else {
        flushCodeBlock();
        flushTable();
        const parts = line.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
        elements.push(
          <p key={`p-${index}`} className="my-3 text-slate-300 leading-relaxed text-base">
            {parts.map((part, partIndex) => {
              if (part.startsWith('`') && part.endsWith('`')) {
                return (
                  <code key={partIndex} className="px-2 py-0.5 bg-slate-800/80 rounded text-primary text-sm font-mono border border-white/5">
                    {part.slice(1, -1)}
                  </code>
                );
              } else if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={partIndex} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
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
    flushTable();
    return elements;
  };

  const readingTime = Math.ceil((selectedPost.content?.split(' ').length || 200) / 200);
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
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                {selectedPost.title}
              </h1>

              <div className="flex items-center gap-4 mb-8 pb-8 border-b border-white/5">
                <img src="/profile_one.png" className="w-12 h-12 rounded-full object-cover grayscale brightness-110 border border-white/10" alt="Govind" />
                <div>
                  <p className="text-white text-sm font-semibold">Govind Tank</p>
                  <p className="text-slate-500 text-xs">Senior Lead Architect</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(window.location.href);
                    }}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-primary"
                    title="Copy Link"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <div className="relative group">
                    <button 
                      className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4 text-slate-400" />
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                      <div className="py-2">
                        <button 
                          className="w-full text-left px-4 py-2 text-xs hover:bg-white/5 text-slate-300 flex items-center gap-2" 
                          onClick={() => shareToPlatform('twitter')}
                        >
                          <Twitter className="w-4 h-4" />
                          <span>Twitter</span>
                        </button>
                        <button 
                          className="w-full text-left px-4 py-2 text-xs hover:bg-white/5 text-slate-300 flex items-center gap-2" 
                          onClick={() => shareToPlatform('facebook')}
                        >
                          <Facebook className="w-4 h-4" />
                          <span>Facebook</span>
                        </button>
                        <button 
                          className="w-full text-left px-4 py-2 text-xs hover:bg-white/5 text-slate-300 flex items-center gap-2" 
                          onClick={() => shareToPlatform('linkedin')}
                        >
                          <Linkedin className="w-4 h-4" />
                          <span>LinkedIn</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-8 p-4 bg-primary/5 border-l-2 border-primary rounded-r-lg">
                <p className="text-slate-300 italic leading-relaxed">{selectedPost.excerpt}</p>
              </div>

              <div className="text-base">
                {selectedPost.content ? renderContent(selectedPost.content) : (
                  <div className="text-center py-16">
                    <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 italic">
                      Full content for this technical log is being compiled.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-16 pt-8 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Terminal className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-semibold">End of Technical Log</p>
                    <p className="text-slate-500 text-[10px] font-mono">MANIFEST_COMPLETE</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl transition-all group"
                >
                  <span className="text-primary font-mono text-xs font-bold uppercase tracking-wider group-hover:tracking-widest transition-all">
                    Close Log →
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
