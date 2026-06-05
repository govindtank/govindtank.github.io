import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BLOG_POSTS } from '../constants';
import {
  ArrowLeft,
  Calendar,
  BookOpen,
  Twitter,
  Facebook,
  Linkedin,
  Clipboard,
  Check,
  Terminal,
  Loader
} from 'lucide-react';
import Mermaid from '../components/Mermaid';

// Lazy-loaded content modules — each blog post content is code-split
// into its own JS chunk and loaded on demand for zero initial fetch cost
const contentModules = import.meta.glob<{ content: string }>('../data/blogs/content/*.json');

export default function BlogDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [fullContent, setFullContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  const post = BLOG_POSTS.find((p) => p.slug === slug);

  useEffect(() => {
    if (!post) return;

    setLoadingContent(true);
    const loader = contentModules[`../data/blogs/content/${post.slug}.json`];
    if (loader) {
      loader()
        .then((mod) => {
          setFullContent(mod.content || '');
          setLoadingContent(false);
        })
        .catch(() => {
          setFullContent('');
          setLoadingContent(false);
        });
    } else {
      setFullContent('');
      setLoadingContent(false);
    }
  }, [post]);

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <Terminal className="w-16 h-16 text-slate-700 mb-6" />
        <h1 className="text-4xl font-bold mb-4">Log Not Found</h1>
        <p className="text-slate-400 mb-8">The requested architectural manifest is missing from the archives.</p>
        <button 
          onClick={() => navigate('/')} 
          className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/80 transition-all"
        >
          Return to System Root
        </button>
      </div>
    );
  }

  const shareToPlatform = (platform: string) => {
    const postUrl = window.location.href;
    const shareTitle = encodeURIComponent(post.title);
    const shareText = encodeURIComponent(`Check out this technical insight: ${post.title}`);
    
    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${postUrl}&text=${shareTitle} ${shareText}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${postUrl}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${postUrl}&title=${shareTitle}&summary=${shareText}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(postUrl).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
        break;
    }
  };

  // Remove duplicate title heading from content (the page already renders the title)
  const cleanContent = (content: string) => {
    if (!content) return '';
    return content.replace(/^\s*# .+/m, '').replace(/^\s*\n\s*/, '');
  };

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
          className="prose prose-invert max-w-none"
        >
          {part}
        </ReactMarkdown>
      );
    });
  };

  // JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: {
      '@type': 'Person',
      name: 'Govind Tank'
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-slate-950 text-slate-300 py-16 px-6 transition-colors duration-500">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <button 
              onClick={() => navigate('/blog')}
              className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors group mb-8 font-mono text-xs uppercase tracking-widest"
            >
              <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> root/archives/logs
            </button>

            <div className="glass-card bg-slate-900/80 border-white/10 rounded-t-2xl p-6 border-b-0">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-tighter">
                    {post.tag}
                  </span>
                  <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {post.date}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => shareToPlatform('twitter')} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-sky-400 transition-all" title="Twitter">
                    <Twitter className="w-4 h-4" />
                  </button>
                  <button onClick={() => shareToPlatform('linkedin')} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-blue-600 transition-all" title="LinkedIn">
                    <Linkedin className="w-4 h-4" />
                  </button>
                  <button onClick={() => shareToPlatform('facebook')} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-blue-400 transition-all" title="Facebook">
                    <Facebook className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => shareToPlatform('copy')} 
                    className={`p-2 rounded-lg transition-all flex items-center gap-2 ${copied ? 'bg-green-500/20 text-green-400' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`} 
                    title="Copy Link"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                {post.title}
              </h1>
            </div>
            
            <div className="glass-card bg-slate-900/40 border-white/10 rounded-b-2xl p-8 md:p-12 shadow-2xl">
              <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/10 rounded-xl mb-12">
                <BookOpen className="w-5 h-5 text-primary" />
                <p className="text-primary font-mono text-xs italic m-0">
                  Reading internal architectural manifest... Access granted.
                </p>
              </div>

              {loadingContent ? (
                <div className="flex items-center justify-center py-20">
                  <Loader className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : (
                <div className="blog-content prose prose-invert max-w-none font-sans text-lg leading-relaxed">
                  {renderContent(fullContent || '')}
                </div>
              )}

              <div className="mt-20 pt-8 border-t border-white/5 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs border border-primary/30">
                      GT
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold leading-none">Govind Tank</p>
                      <p className="text-slate-500 text-xs">Senior Lead Architect</p>
                    </div>
                 </div>
                 <div className="text-slate-600 font-mono text-[10px] uppercase tracking-widest">
                   End of Log // {post.date}
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
