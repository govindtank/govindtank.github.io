import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BLOG_POSTS } from '../constants';
import { 
  ArrowLeft, 
  Calendar, 
  BookOpen, 
  Share2, 
  Twitter, 
  Facebook, 
  Linkedin, 
  Clipboard,
  Check
} from 'lucide-react';
import Mermaid from '../components/Mermaid';

export default function BlogDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-bold mb-4">Post not found</h1>
        <p className="text-slate-400 mb-8">The technical log you are looking for has been archived or moved.</p>
        <button 
          onClick={() => navigate('/')} 
          className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/80 transition-all"
        >
          Return to Home
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

  const renderContent = (content: string) => {
    const parts = content.split(/```mermaid([\s\S]*?)```/g);
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 py-20 px-6 transition-colors duration-500">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-12 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
        </button>

        <header className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-xs font-mono text-primary bg-primary/10 px-3 py-1 rounded-full uppercase">
              {post.tag}
            </span>
            <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {post.date}
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-8">
            {post.title}
          </h1>
          
          <div className="flex items-center justify-between p-4 bg-slate-900/50 border border-white/5 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                GT
              </div>
              <div>
                <p className="text-white text-sm font-bold leading-none">Govind Tank</p>
                <p className="text-slate-500 text-xs">Senior Lead Architect</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={() => shareToPlatform('twitter')} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-sky-400 transition-all" title="Twitter">
                <Twitter className="w-5 h-5" />
              </button>
              <button onClick={() => shareToPlatform('linkedin')} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-blue-600 transition-all" title="LinkedIn">
                <Linkedin className="w-5 h-5" />
              </button>
              <button onClick={() => shareToPlatform('facebook')} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-blue-400 transition-all" title="Facebook">
                <Facebook className="w-5 h-5" />
              </button>
              <button 
                onClick={() => shareToPlatform('copy')} 
                className={`p-2 rounded-lg transition-all flex items-center gap-2 ${copied ? 'bg-green-500/20 text-green-400' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`} 
                title="Copy Link"
              >
                {copied ? <Check className="w-5 h-5" /> : <Clipboard className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </header>

        <div className="relative">
          <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/10 rounded-xl mb-12">
            <BookOpen className="w-5 h-5 text-primary" />
            <p className="text-primary font-mono text-xs italic m-0">
              Reading internal architectural manifest... Access granted.
            </p>
          </div>

          <div className="blog-content">
            {renderContent(post.content || '')}
          </div>
        </div>

        <footer className="mt-20 pt-8 border-t border-white/5 text-center">
          <p className="text-slate-500 text-sm font-mono">
            End of Log // System stable // 2026-v1.0
          </p>
        </footer>
      </div>
    </div>
  );
}
