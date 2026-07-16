import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { BLOG_POSTS } from '../constants';
import {
  ArrowLeft,
  Calendar,
  BookOpen,
  Twitter,
  Linkedin,
  Clipboard,
  Check,
  Terminal,
  Loader,
  Clock,
  ChevronUp,
  Share2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  CheckCircle2,
  List,
  X,
} from 'lucide-react';
import Mermaid from '../components/Mermaid';
import stripFrontmatter from '../lib/stripFrontmatter';
import type { BlogPost } from '../types';

const contentModules = import.meta.glob<string>('../content/blog/*.md', { query: '?raw', import: 'default' });

export default function BlogDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [fullContent, setFullContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [activeHeading, setActiveHeading] = useState('');
  const [contentError, setContentError] = useState<string | null>(null);

  const post = BLOG_POSTS.find((p) => p.slug === slug);
  const currentIndex = post ? BLOG_POSTS.indexOf(post) : -1;
  const prevPost = currentIndex > 0 ? BLOG_POSTS[currentIndex - 1] : null;
  const nextPost = currentIndex < BLOG_POSTS.length - 1 ? BLOG_POSTS[currentIndex + 1] : null;

  useEffect(() => {
    if (!post) return;
    setLoadingContent(true);
    setContentError(null);
    const loader = contentModules[`../content/blog/${post.slug}.md`];
    if (loader) {
      loader()
        .then((raw: string) => {
          const parsed = stripFrontmatter(raw);
          setFullContent(parsed.content || '');
          setLoadingContent(false);
        })
        .catch((err: unknown) => {
          console.error('[BlogDetail] Failed to load content:', err);
          setContentError(err instanceof Error ? err.message : 'Failed to load content');
          setFullContent('');
          setLoadingContent(false);
        });
    } else {
      console.warn('[BlogDetail] No loader found for:', `../content/blog/${post.slug}.md`);
      setContentError('Content loader not found');
      setFullContent('');
      setLoadingContent(false);
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [post]);

  // Track active heading for TOC
  useEffect(() => {
    if (!fullContent) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -80% 0px' }
    );
    const headings = document.querySelectorAll('h2, h3');
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [fullContent, loadingContent]);

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-white/5 flex items-center justify-center mb-6">
          <Terminal className="w-7 h-7 text-slate-500" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Article not found</h1>
        <p className="text-slate-400 mb-8">This article doesn't exist in the archive.</p>
        <button
          onClick={() => navigate('/blog')}
          className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/80 transition-all"
        >
          Back to archive
        </button>
      </div>
    );
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const shareToPlatform = (platform: string) => {
    const title = encodeURIComponent(post.title);
    const text = encodeURIComponent(`Check out "${post.title}"`);
    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${shareUrl}&text=${text}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${shareUrl}&title=${title}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(shareUrl).then(() => {
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
  const tocItems = useMemo(() => {
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
                <h2 id={id} className="text-2xl font-bold text-white mt-12 mb-5 flex items-center gap-3 scroll-mt-24" {...props}>
                  <span className="w-1.5 h-6 bg-primary rounded-full shrink-0" />
                  {children}
                </h2>
              );
            },
            h3: ({ children, ...props }) => {
              const text = extractText(children);
              const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
              return (
                <h3 id={id} className="text-lg font-bold text-primary/90 mt-8 mb-3 scroll-mt-24" {...props}>
                  {children}
                </h3>
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
                      onClick={() => {
                        navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                      }}
                      className="text-[10px] font-mono text-slate-600 hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <Clipboard className="w-3 h-3" />
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: { '@type': 'Person', name: 'Govind Tank' },
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-slate-950 relative">
        {/* Decorative gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/[0.03] via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          {/* Back button */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/blog')}
              className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors group text-sm"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="font-mono text-xs uppercase tracking-wider">Back to Archive</span>
            </button>
          </div>

          {/* Article header */}
          <article>
            <header className="mb-10">
              {/* Meta */}
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <span className="text-xs font-mono font-medium px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {post.tag}
                </span>
                <span className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {post.date}
                </span>
                <span className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {post.readTime} min read
                </span>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-[1.15] tracking-tight mb-5">
                {post.title}
              </h1>

              {/* Excerpt */}
              <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-3xl">
                {post.excerpt}
              </p>

              {/* Author & Share */}
              <div className="flex items-center justify-between flex-wrap gap-4 mt-8 pt-6 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <img
                    src="/profile_one.png"
                    className="w-10 h-10 rounded-full object-cover grayscale brightness-110 border border-primary/20"
                    alt="Govind Tank"
                  />
                  <div>
                    <p className="text-white text-sm font-semibold">Govind Tank</p>
                    <p className="text-slate-500 text-xs">Senior Lead Architect</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {post.tags && post.tags.length > 1 && (
                    <div className="hidden sm:flex items-center gap-1.5 mr-2">
                      {post.tags.slice(1).map(t => (
                        <span key={t} className="text-[10px] text-slate-600 font-mono px-2 py-0.5 border border-white/5 rounded-full">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => shareToPlatform('twitter')}
                    className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-sky-400 transition-all"
                    title="Share on X"
                  >
                    <Twitter className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => shareToPlatform('linkedin')}
                    className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-blue-500 transition-all"
                    title="Share on LinkedIn"
                  >
                    <Linkedin className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => shareToPlatform('copy')}
                    className={`p-2 rounded-lg transition-all ${copied ? 'bg-green-500/20 text-green-400' : 'hover:bg-white/5 text-slate-500 hover:text-white'}`}
                    title={copied ? 'Copied!' : 'Copy link'}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Cover image */}
              {post.coverImage && (
                <div className="mt-8 rounded-2xl overflow-hidden border border-white/5">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-48 sm:h-64 lg:h-80 object-cover"
                  />
                </div>
              )}
            </header>

            {/* TOC trigger for mobile */}
            {tocItems.length > 0 && (
              <div className="sm:hidden mb-6">
                <button
                  onClick={() => setShowToc(!showToc)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-sm text-slate-400 hover:text-white transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <List className="w-4 h-4" />
                    Table of Contents
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showToc ? 'rotate-180' : ''}`} />
                </button>
                {showToc && (
                  <div className="mt-2 p-3 bg-slate-900/80 border border-white/10 rounded-xl">
                    {tocItems.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        onClick={(e) => { e.preventDefault(); document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' }); setShowToc(false); }}
                        className={`block px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          item.level === 3 ? 'ml-4' : ''
                        } ${activeHeading === item.id ? 'text-primary bg-primary/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                      >
                        {item.text}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Content - flex layout with sidebar on desktop */}
            <div className="lg:flex lg:gap-10 lg:items-start">
              {/* Desktop TOC sidebar — now in normal document flow */}
              {tocItems.length > 0 && (
                <aside className="hidden lg:block lg:w-64 lg:shrink-0 lg:order-first">
                  <div className="lg:sticky lg:top-24">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1 h-4 bg-primary/50 rounded-full" />
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">On this page</span>
                    </div>
                    <nav className="space-y-0.5">
                      {tocItems.map((item) => (
                        <a
                          key={item.id}
                          href={`#${item.id}`}
                          onClick={(e) => { e.preventDefault(); document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' }); }}
                          className={`block text-sm py-1.5 border-l-2 transition-all ${
                            item.level === 3 ? 'ml-4 pl-3' : ''
                          } ${
                            activeHeading === item.id
                              ? 'text-primary border-primary font-medium'
                              : 'text-slate-500 border-transparent hover:text-slate-300 hover:border-white/20'
                          }`}
                        >
                          {item.text}
                        </a>
                      ))}
                    </nav>
                  </div>
                </aside>
              )}

              <div className="min-h-[50vh] flex-1 min-w-0">
                {loadingContent ? (
                  <div className="flex flex-col items-center justify-center py-32">
                    <Loader className="w-8 h-8 text-primary animate-spin mb-4" />
                    <p className="text-slate-500 text-sm font-mono">Loading content...</p>
                  </div>
                ) : contentError ? (
                  <div className="text-center py-20">
                    <BookOpen className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-500 italic mb-2">Could not load article content.</p>
                    <p className="text-xs text-slate-600 font-mono">Error: {contentError}</p>
                    <button
                      onClick={() => navigate('/blog')}
                      className="mt-6 px-5 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium rounded-xl border border-primary/20 transition-all"
                    >
                      Back to archive
                    </button>
                  </div>
                ) : (
                  <div className="blog-content prose prose-invert max-w-none">
                    {fullContent ? (
                      (() => {
                        try { return renderContent(fullContent); }
                        catch (e) { console.error('[BlogDetail] renderContent error:', e); return <div className="text-center py-20"><p className="text-slate-500 italic">Error rendering content.</p></div>; }
                      })()
                    ) : (
                      <div className="text-center py-20">
                        <BookOpen className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-500 italic">Full content being compiled.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Article footer */}
            <footer className="mt-16 pt-8 border-t border-white/5">
              {/* Author card */}
              <div className="flex flex-col sm:flex-row items-start gap-4 p-5 rounded-xl bg-slate-900/40 border border-white/5 mb-10">
                <img src="/profile_one.png" className="w-14 h-14 rounded-xl object-cover border border-white/5 shrink-0" alt="Govind Tank" />
                <div>
                  <p className="text-white font-semibold text-base mb-1">Govind Tank</p>
                  <p className="text-slate-500 text-sm mb-3">Senior Lead Architect — Android, Flutter & AI Systems</p>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Architecting scalable mobile solutions with clean architecture, state management, and AI-augmented development workflows.
                  </p>
                </div>
              </div>

              {/* Prev/Next navigation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {prevPost ? (
                  <Link
                    to={`/blog/${prevPost.slug}`}
                    className="group flex items-center gap-3 p-4 rounded-xl bg-slate-900/30 border border-white/5 hover:border-primary/20 hover:bg-slate-900/50 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-primary shrink-0 transition-colors" />
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-600 font-mono uppercase tracking-wider">Previous</span>
                      <p className="text-sm text-slate-300 group-hover:text-white truncate transition-colors">{prevPost.title}</p>
                    </div>
                  </Link>
                ) : <div />}
                {nextPost && (
                  <Link
                    to={`/blog/${nextPost.slug}`}
                    className="group flex items-center gap-3 p-4 rounded-xl bg-slate-900/30 border border-white/5 hover:border-primary/20 hover:bg-slate-900/50 transition-all text-right sm:text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-slate-600 font-mono uppercase tracking-wider">Next</span>
                      <p className="text-sm text-slate-300 group-hover:text-white truncate transition-colors">{nextPost.title}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-primary shrink-0 transition-colors" />
                  </Link>
                )}
              </div>
            </footer>
          </article>
        </div>

        {/* Scroll-to-top button */}
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 p-3 rounded-xl bg-slate-900/90 border border-white/10 text-slate-400 hover:text-white hover:border-primary/30 hover:bg-slate-800/90 transition-all shadow-lg backdrop-blur-md opacity-0 animate-[fadeIn_0.5s_ease-in-out_1s_forwards]"
          title="Scroll to top"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      </div>
    </>
  );
}

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    const n = node as any;
    if (n.props?.children) return extractText(n.props.children);
  }
  return '';
}
