import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  List,
  Sparkles,
} from 'lucide-react';
import stripFrontmatter from '../lib/stripFrontmatter';
import MarkdownRenderer, { slugifyHeading } from '../components/MarkdownRenderer';
import { useSEO } from '../hooks/useSEO';

const contentModules = import.meta.glob<string>('../content/blog/*.md', { query: '?raw', import: 'default' });

export default function BlogDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [fullContent, setFullContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);
  const [showToc, setShowToc] = useState(false);
  const [activeHeading, setActiveHeading] = useState('');
  const [scrollProgress, setScrollProgress] = useState(0);

  const post = BLOG_POSTS.find((p) => p.slug === slug);
  const currentIndex = post ? BLOG_POSTS.indexOf(post) : -1;
  const prevPost = currentIndex > 0 ? BLOG_POSTS[currentIndex - 1] : null;
  const nextPost = currentIndex < BLOG_POSTS.length - 1 ? BLOG_POSTS[currentIndex + 1] : null;

  // SEO setup
  useSEO({
    title: post?.title || 'Blog Post',
    description: post?.excerpt || 'Technical deep dive by Govind Tank.',
    image: post?.coverImage || 'https://govindtank.github.io/profile_one.png',
    url: window.location.href,
    type: 'article',
  });

  // Calculate Reading Progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, currentProgress)));
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load content
  useEffect(() => {
    if (!post) return;
    let cancelled = false;
    setLoadingContent(true);
    setContentError(null);
    const loader = contentModules[`../content/blog/${post.slug}.md`];
    if (loader) {
      loader()
        .then((raw: string) => {
          if (cancelled) return;
          const parsed = stripFrontmatter(raw);
          setFullContent(parsed.content || '');
          setLoadingContent(false);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
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
    window.scrollTo(0, 0);
    return () => { cancelled = true; };
  }, [post]);

  // Track active heading for TOC based on scroll position
  useEffect(() => {
    if (!fullContent) return;
    const handleScroll = () => {
      const headings = Array.from(document.querySelectorAll('h2[id], h3[id]')) as HTMLElement[];
      if (!headings.length) return;
      const scrollY = window.scrollY + 120;
      let current = headings[0].id;
      for (const h of headings) {
        if (h.offsetTop <= scrollY) {
          current = h.id;
        } else {
          break;
        }
      }
      setActiveHeading(current);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [fullContent, loadingContent]);

  // Related Articles
  const relatedPosts = useMemo(() => {
    if (!post) return [];
    return BLOG_POSTS
      .filter((p) => p.slug !== post.slug)
      .map((p) => {
        let score = 0;
        if (p.tag === post.tag) score += 3;
        if (p.tags && post.tags) {
          const common = p.tags.filter((t) => post.tags?.includes(t));
          score += common.length * 2;
        }
        return { post: p, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((item) => item.post);
  }, [post]);

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
          className="px-6 py-3 bg-sky-500 text-slate-950 font-bold rounded-xl hover:bg-sky-400 transition-all"
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
      const id = slugifyHeading(text);
      if (id) {
        items.push({ level, text, id });
      }
    }
    return items;
  }, [fullContent]);

  const handleTocClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
      setActiveHeading(id);
      window.history.replaceState(null, '', `#${id}`);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative">
      {/* Top Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-900 z-[100]">
        <div
          className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-amber-500 transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-500/[0.04] via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Navigation bar */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => navigate('/blog')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-all text-xs font-mono uppercase tracking-wider font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Archive</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => shareToPlatform('twitter')}
              aria-label="Share on Twitter"
              className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-sky-400 transition-all"
            >
              <Twitter className="w-4 h-4" />
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
              aria-label="Copy post URL"
              className={`p-2 rounded-lg transition-all ${
                copied ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Article header */}
        <article>
          <header className="mb-10">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 uppercase tracking-wider">
                {post.tag}
              </span>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {post.date}
              </span>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {post.readTime || 8} min read
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight mb-6">
              {post.title}
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed font-sans max-w-3xl mb-8">
              {post.excerpt}
            </p>

            {/* Author bar */}
            <div className="flex items-center justify-between flex-wrap gap-4 pt-6 border-t border-white/10">
              <div className="flex items-center gap-3.5">
                <img
                  src="/profile_one.png"
                  className="w-11 h-11 rounded-full object-cover border-2 border-sky-500/30 shadow-md"
                  alt="Govind Tank"
                  loading="lazy"
                />
                <div>
                  <p className="text-white text-sm font-bold">Govind Tank</p>
                  <p className="text-slate-400 text-xs font-mono">Senior Lead Architect</p>
                </div>
              </div>

              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[11px] text-slate-400 font-mono px-2.5 py-0.5 border border-white/10 rounded-full bg-white/5"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Cover image */}
            {post.coverImage && (
              <div className="mt-8 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  loading="lazy"
                  className="w-full h-56 sm:h-80 lg:h-96 object-cover"
                />
              </div>
            )}
          </header>

          {/* TOC trigger for mobile */}
          {tocItems.length > 0 && (
            <div className="lg:hidden mb-8">
              <button
                onClick={() => setShowToc(!showToc)}
                aria-label="Toggle Table of Contents"
                className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-slate-900/90 border border-white/10 rounded-xl text-sm text-slate-300 hover:text-white transition-colors"
              >
                <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-sky-400 font-bold">
                  <List className="w-4 h-4" />
                  Table of Contents
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showToc ? 'rotate-180' : ''}`} />
              </button>
              {showToc && (
                <div className="mt-2 p-4 bg-slate-900/95 border border-white/10 rounded-xl space-y-1">
                  {tocItems.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={(e) => {
                        handleTocClick(e, item.id);
                        setShowToc(false);
                      }}
                      className={`block px-3 py-2 text-xs rounded-lg transition-all ${
                        item.level === 3 ? 'ml-4 text-slate-400' : 'text-slate-200 font-semibold'
                      } ${
                        activeHeading === item.id ? 'text-sky-400 bg-sky-500/10 font-bold' : 'hover:bg-white/5'
                      }`}
                    >
                      {item.text}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Main Layout Grid */}
          <div className="lg:grid lg:grid-cols-12 lg:gap-10 lg:items-start">
            {/* Desktop TOC Sidebar with left padding (pl-3) */}
            {tocItems.length > 0 && (
              <aside className="hidden lg:block lg:col-span-3 lg:sticky lg:top-24 pl-3">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-1.5 h-4 bg-sky-500 rounded-full" />
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-bold">
                    Contents
                  </span>
                </div>
                <nav className="space-y-1 max-h-[70vh] overflow-y-auto pr-2">
                  {tocItems.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={(e) => handleTocClick(e, item.id)}
                      className={`block text-xs py-2 pl-3 border-l-2 transition-all rounded-r-md cursor-pointer ${
                        item.level === 3 ? 'ml-3 pl-3 text-slate-400' : 'font-medium'
                      } ${
                        activeHeading === item.id
                          ? 'text-sky-400 border-sky-400 bg-sky-500/10 font-bold'
                          : 'text-slate-400 border-transparent hover:text-slate-200 hover:border-white/20 hover:bg-white/5'
                      }`}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              </aside>
            )}

            {/* Body Content */}
            <div className={`min-h-[50vh] ${tocItems.length > 0 ? 'lg:col-span-9' : 'lg:col-span-12'}`}>
              {loadingContent ? (
                <div className="flex flex-col items-center justify-center py-32">
                  <Loader className="w-8 h-8 text-sky-400 animate-spin mb-4" />
                  <p className="text-slate-400 text-sm font-mono">Loading deep dive markdown...</p>
                </div>
              ) : contentError ? (
                <div className="p-8 bg-slate-900/80 rounded-2xl border border-red-500/30 text-center">
                  <p className="text-red-400 font-bold mb-2 font-mono">Error loading article content</p>
                  <p className="text-xs text-slate-400">{contentError}</p>
                </div>
              ) : (
                <div className="blog-content">
                  {fullContent ? (
                    <MarkdownRenderer content={cleanContent(fullContent)} />
                  ) : (
                    <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-white/10">
                      <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400 font-mono text-sm">Full article being processed.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Related Articles Section */}
          {relatedPosts.length > 0 && (
            <section className="mt-20 pt-12 border-t border-white/10">
              <div className="flex items-center space-x-2 mb-8">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Related Technical Deep Dives
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((rPost) => (
                  <Link
                    key={rPost.slug}
                    to={`/blog/${rPost.slug}`}
                    className="group flex flex-col justify-between p-5 rounded-xl bg-slate-900/50 border border-white/10 hover:border-sky-500/40 hover:bg-slate-900/80 transition-all shadow-md"
                  >
                    <div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 uppercase tracking-wider mb-3 inline-block">
                        {rPost.tag}
                      </span>
                      <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors line-clamp-2 mb-2 leading-snug">
                        {rPost.title}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                        {rPost.excerpt}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-3 border-t border-white/5">
                      <span>{rPost.date}</span>
                      <span className="flex items-center text-sky-400 font-semibold group-hover:translate-x-1 transition-transform">
                        Read <ChevronRight className="w-3 h-3 ml-1" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Article footer navigation */}
          <footer className="mt-12 pt-8 border-t border-white/10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {prevPost ? (
                <Link
                  to={`/blog/${prevPost.slug}`}
                  className="group flex items-center gap-3 p-4 rounded-xl bg-slate-900/40 border border-white/10 hover:border-sky-500/40 hover:bg-slate-900/80 transition-all"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-sky-400 shrink-0 transition-colors" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Previous</span>
                    <p className="text-sm text-slate-200 group-hover:text-white truncate font-medium">{prevPost.title}</p>
                  </div>
                </Link>
              ) : <div />}

              {nextPost && (
                <Link
                  to={`/blog/${nextPost.slug}`}
                  className="group flex items-center gap-3 p-4 rounded-xl bg-slate-900/40 border border-white/10 hover:border-sky-500/40 hover:bg-slate-900/80 transition-all text-right sm:text-left justify-end sm:justify-start"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Next</span>
                    <p className="text-sm text-slate-200 group-hover:text-white truncate font-medium">{nextPost.title}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-400 shrink-0 transition-colors" />
                </Link>
              )}
            </div>
          </footer>
        </article>
      </div>

      {/* Floating Scroll to Top button */}
      <button
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className="fixed bottom-6 right-6 z-40 p-3 rounded-xl bg-slate-900/90 border border-white/10 text-slate-300 hover:text-white hover:border-sky-500/40 hover:bg-slate-800 transition-all shadow-xl backdrop-blur-md"
      >
        <ChevronUp className="w-5 h-5" />
      </button>
    </div>
  );
}
