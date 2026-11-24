import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BLOG_POSTS } from '../constants';
import { Search, Calendar, ArrowRight, BookOpen, Clock, ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react';
import { motion } from 'motion/react';
import type { BlogPost } from '../types';
import { useSEO } from '../hooks/useSEO';

const TAG_COLORS: Record<string, string> = {
  'Web-Dev': 'text-cyan-300 border-cyan-400/30 bg-cyan-500/10',
  'AI-Engineering': 'text-indigo-300 border-indigo-400/30 bg-indigo-500/10',
  'AI-Agents': 'text-purple-300 border-purple-400/30 bg-purple-500/10',
  'AI-Optimization': 'text-blue-300 border-blue-400/30 bg-blue-500/10',
  'Android': 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10',
  'Kotlin-Multiplatform': 'text-amber-300 border-amber-400/30 bg-amber-500/10',
  'Flutter': 'text-cyan-300 border-cyan-400/30 bg-cyan-500/10',
  'Data-Engineering': 'text-rose-300 border-rose-400/30 bg-rose-500/10',
  'Security': 'text-red-300 border-red-400/30 bg-red-500/10',
  'Platform-Engineering': 'text-amber-300 border-amber-400/30 bg-amber-500/10',
};

function getTagColor(tag: string): string {
  return TAG_COLORS[tag] || 'text-slate-300 border-white/10 bg-white/5';
}

export default function BlogList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useSEO({
    title: 'Architectural Logs & Technical Deep Dives',
    description: 'Explore technical blogs by Govind Tank on Android Architecture, Flutter, Kotlin Multiplatform, AI Agents, and Scalable Cloud Pipelines.',
    url: window.location.href,
  });

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    BLOG_POSTS.forEach((p) => p.tags?.forEach((t) => tagSet.add(t)));
    return ['All', ...Array.from(tagSet)];
  }, []);

  const filteredPosts = useMemo(() => {
    return BLOG_POSTS.filter((post) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.tags?.some((t) => t.toLowerCase().includes(q));
      const matchesTag = selectedTag === 'All' || post.tags?.includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [searchQuery, selectedTag]);

  const featured = useMemo(() => {
    if (searchQuery || selectedTag !== 'All') return null;
    return filteredPosts[0];
  }, [filteredPosts, searchQuery, selectedTag]);

  const regularPosts = useMemo(() => {
    if (featured) return filteredPosts.slice(1);
    return filteredPosts;
  }, [filteredPosts, featured]);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      return () => el.removeEventListener('scroll', checkScroll);
    }
  }, [allTags]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction === 'left' ? -250 : 250, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative bg-transparent text-slate-100 min-h-screen">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header matching main website aesthetic */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono-tech text-xs uppercase tracking-[0.28em] text-cyan-400">
                  [07] // Technical_Archive
                </span>
              </div>
              <h1 className="font-section-title text-4xl sm:text-5xl font-bold tracking-tight text-white mb-2">
                Architectural <span className="text-primary">Logs</span>
              </h1>
              <p className="text-slate-400 max-w-2xl text-sm sm:text-base leading-relaxed font-light">
                Deep dives into mobile systems architecture, 120Hz Impeller graphics, on-device SLMs,
                and production reliability.
              </p>
            </div>
            <div className="text-6xl font-black text-white/5 select-none hidden md:block">
              ARCHIVE
            </div>
          </div>

          <div className="flex items-center gap-3 mt-3 text-xs text-slate-400 font-mono-tech flex-wrap">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-cyan-300">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              {BLOG_POSTS.length} Engineering Articles
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {Math.round(BLOG_POSTS.reduce((acc, p) => acc + (p.readTime || 8), 0) / BLOG_POSTS.length)} min avg read
            </span>
          </div>
        </motion.div>

        {/* Search & Tag Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-10 space-y-4"
        >
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-cyan-400 transition-colors" />
              <input
                type="text"
                placeholder="Search articles by topic, keyword, title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#080c16]/90 border border-white/10 rounded-full py-2.5 pl-11 pr-10 text-white font-mono-tech text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 shadow-inner transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Counter */}
            <div className="text-xs text-slate-400 font-mono-tech whitespace-nowrap">
              {filteredPosts.length === BLOG_POSTS.length ? (
                <span>Showing all <strong className="text-cyan-400">{BLOG_POSTS.length}</strong> articles</span>
              ) : (
                <span>Found <strong className="text-cyan-400">{filteredPosts.length}</strong> of {BLOG_POSTS.length} articles</span>
              )}
            </div>
          </div>

          {/* Tag Pills Bar */}
          <div className="relative flex items-center">
            {canScrollLeft && (
              <button
                onClick={() => scroll('left')}
                aria-label="Scroll left tags"
                className="absolute left-0 z-10 h-full flex items-center bg-gradient-to-r from-[#050811] via-[#050811]/90 to-transparent pl-0 pr-6"
              >
                <ChevronLeft className="w-4 h-4 text-slate-400 hover:text-white transition-colors" />
              </button>
            )}
            <div
              ref={scrollRef}
              className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 px-0 scroll-smooth"
            >
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-mono-tech transition-all cursor-pointer border ${
                    selectedTag === tag
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.2)] font-semibold'
                      : 'spatial-glass text-slate-400 hover:text-slate-200 border-white/10'
                  }`}
                >
                  {tag === 'All' ? 'All Topics' : tag}
                  {tag !== 'All' && (
                    <span className="ml-1.5 text-[10px] opacity-70">
                      ({BLOG_POSTS.filter((p) => p.tags?.includes(tag)).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
            {canScrollRight && (
              <button
                onClick={() => scroll('right')}
                aria-label="Scroll right tags"
                className="absolute right-0 z-10 h-full flex items-center bg-gradient-to-l from-[#050811] via-[#050811]/90 to-transparent pr-0 pl-6"
              >
                <ChevronRight className="w-4 h-4 text-slate-400 hover:text-white transition-colors" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Results */}
        {filteredPosts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 spatial-glass rounded-3xl border-white/10 max-w-md mx-auto p-8"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No matching logs found</h3>
            <p className="text-slate-400 text-xs mb-6">Try refining your search keyword or selected tag filter</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedTag('All'); }}
              className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-mono-tech rounded-xl border border-cyan-400/40 transition-colors cursor-pointer"
            >
              Clear filters
            </button>
          </motion.div>
        ) : (
          <>
            {/* Featured Post Card */}
            {featured && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-mono-tech text-amber-400 uppercase tracking-wider font-bold">
                    Featured Deep Dive
                  </span>
                </div>
                <Link
                  to={`/blog/${featured.slug}`}
                  className="group relative block overflow-hidden rounded-3xl border border-white/10 hover:border-cyan-400/50 spatial-glass transition-all duration-300 shadow-2xl"
                >
                  {featured.coverImage ? (
                    <div className="relative h-60 sm:h-80 overflow-hidden">
                      <img
                        src={featured.coverImage}
                        alt={featured.title}
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#080c16] via-[#080c16]/60 to-transparent" />
                    </div>
                  ) : (
                    <div className="h-32 bg-gradient-to-br from-cyan-950/40 via-slate-900 to-[#080c16]" />
                  )}
                  <div className="p-6 sm:p-8">
                    <div className="flex flex-wrap items-center gap-2.5 mb-3 font-mono-tech text-xs">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${getTagColor(featured.tag)}`}>
                        {featured.tag}
                      </span>
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {featured.date}
                      </span>
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {featured.readTime || 8} min read
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white group-hover:text-cyan-300 transition-colors mb-3 leading-tight font-display">
                      {featured.title}
                    </h2>
                    <p className="text-slate-300 text-sm sm:text-base leading-relaxed line-clamp-2 mb-5 font-light">
                      {featured.excerpt}
                    </p>
                    <div className="flex items-center gap-2 text-xs font-mono-tech text-cyan-400 font-bold group-hover:gap-3 transition-all">
                      <span>Read Deep Dive</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}

            {/* Regular Grid */}
            {regularPosts.length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {regularPosts.map((post) => (
                  <ArticleCard key={post.slug} post={post} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ArticleCard({ post }: { post: BlogPost }) {
  return (
    <Link to={`/blog/${post.slug}`} className="group block h-full">
      <div className="spatial-glass rounded-3xl p-6 border-white/10 hover:border-cyan-400/40 transition-all duration-300 h-full flex flex-col justify-between group shadow-lg hover:shadow-[0_15px_40px_rgba(34,211,238,0.12)]">
        <div>
          {post.coverImage && (
            <div className="relative h-44 rounded-2xl overflow-hidden mb-4 border border-white/5">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080c16] via-transparent to-transparent" />
            </div>
          )}

          <div className="flex items-center justify-between gap-2 mb-2.5 font-mono-tech text-xs">
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${getTagColor(post.tag)}`}>
              {post.tag}
            </span>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {post.readTime || 8}m
            </span>
          </div>

          <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug mb-2 line-clamp-2 font-display">
            {post.title}
          </h3>

          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-4 font-light">
            {post.excerpt}
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs font-mono-tech text-slate-400">
          <span>{post.date}</span>
          <span className="text-cyan-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Read <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
