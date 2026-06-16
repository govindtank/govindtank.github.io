import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BLOG_POSTS } from '../constants';
import { Search, Calendar, ArrowRight, BookOpen, Clock, ChevronLeft, ChevronRight, Sparkles, TrendingUp, Eye, ExternalLink, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { BlogPost } from '../types';

const TAG_COLORS: Record<string, string> = {
  'Web-Dev': 'from-blue-500/20 to-blue-600/10 text-blue-400 border-blue-500/30',
  'AI-Engineering': 'from-purple-500/20 to-purple-600/10 text-purple-400 border-purple-500/30',
  'AI-Agents': 'from-violet-500/20 to-violet-600/10 text-violet-400 border-violet-500/30',
  'AI-Optimization': 'from-indigo-500/20 to-indigo-600/10 text-indigo-400 border-indigo-500/30',
  'Android': 'from-emerald-500/20 to-emerald-600/10 text-emerald-400 border-emerald-500/30',
  'Kotlin-Multiplatform': 'from-orange-500/20 to-orange-600/10 text-orange-400 border-orange-500/30',
  'Flutter': 'from-cyan-500/20 to-cyan-600/10 text-cyan-400 border-cyan-500/30',
  'Data-Engineering': 'from-rose-500/20 to-rose-600/10 text-rose-400 border-rose-500/30',
  'Security': 'from-red-500/20 to-red-600/10 text-red-400 border-red-500/30',
  'Platform-Engineering': 'from-amber-500/20 to-amber-600/10 text-amber-400 border-amber-500/30',
};

function getTagColor(tag: string): string {
  return TAG_COLORS[tag] || 'from-slate-500/20 to-slate-600/10 text-slate-400 border-slate-500/30';
}

// Fallback gradient for posts without cover images
const CARD_GRADIENTS = [
  'from-sky-900/40 via-slate-900 to-slate-900',
  'from-purple-900/40 via-slate-900 to-slate-900',
  'from-emerald-900/40 via-slate-900 to-slate-900',
  'from-amber-900/40 via-slate-900 to-slate-900',
  'from-rose-900/40 via-slate-900 to-slate-900',
  'from-cyan-900/40 via-slate-900 to-slate-900',
];

export default function BlogList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    BLOG_POSTS.forEach(p => p.tags?.forEach(t => tagSet.add(t)));
    return ['All', ...Array.from(tagSet)];
  }, []);

  const filteredPosts = useMemo(() => {
    return BLOG_POSTS.filter(post => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.tags?.some(t => t.toLowerCase().includes(q));
      const matchesTag = selectedTag === 'All' || post.tags?.includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [searchQuery, selectedTag]);

  // Featured post = first matching post when no search filter
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
    <div className="min-h-screen bg-slate-950 relative">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 max-w-12 bg-gradient-to-r from-transparent to-primary/50" />
            <span className="text-primary font-mono text-xs tracking-[0.2em] uppercase">The Archive</span>
            <div className="h-px flex-1 max-w-12 bg-gradient-to-l from-transparent to-primary/50" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
            Technical <span className="bg-gradient-to-r from-primary via-sky-400 to-primary bg-clip-text text-transparent">Insights</span>
          </h1>
          <p className="text-slate-400 max-w-2xl text-base sm:text-lg leading-relaxed">
            Deep dives into architecture, engineering patterns, and the evolving landscape of mobile &amp; AI.
          </p>
          <div className="flex items-center gap-4 mt-4 text-xs text-slate-600 font-mono">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              {BLOG_POSTS.length} articles
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {Math.round(BLOG_POSTS.reduce((acc, p) => acc + (p.readTime || 4), 0) / BLOG_POSTS.length)} min avg
            </span>
          </div>
        </motion.div>

        {/* Search & Filter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-10"
        >
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl py-3 pl-11 pr-10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Results counter */}
            <div className="text-xs text-slate-600 font-mono whitespace-nowrap">
              {filteredPosts.length === BLOG_POSTS.length
                ? <span className="text-slate-500">All {BLOG_POSTS.length} articles</span>
                : <span><span className="text-primary">{filteredPosts.length}</span> of {BLOG_POSTS.length} articles</span>
              }
            </div>
          </div>

          {/* Tag pills */}
          <div className="relative flex items-center mt-4">
            {canScrollLeft && (
              <button onClick={() => scroll('left')} className="absolute left-0 z-10 h-full flex items-center bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent pl-0 pr-6">
                <ChevronLeft className="w-4 h-4 text-slate-400 hover:text-white transition-colors" />
              </button>
            )}
            <div
              ref={scrollRef}
              className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 px-0 scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    selectedTag === tag
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                      : 'bg-slate-900/50 text-slate-400 border-white/10 hover:border-primary/30 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  {tag === 'All' ? 'All Posts' : tag}
                  {tag !== 'All' && (
                    <span className="ml-1.5 text-[10px] opacity-60">
                      ({BLOG_POSTS.filter(p => p.tags?.includes(tag)).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
            {canScrollRight && (
              <button onClick={() => scroll('right')} className="absolute right-0 z-10 h-full flex items-center bg-gradient-to-l from-slate-950 via-slate-950/80 to-transparent pr-0 pl-6">
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
            className="text-center py-24"
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-white/5 flex items-center justify-center mx-auto mb-6">
              <Search className="w-7 h-7 text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No articles found</h3>
            <p className="text-slate-400 text-sm mb-6">Try adjusting your search or filters</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedTag('All'); }}
              className="px-5 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium rounded-xl border border-primary/20 transition-all"
            >
              Clear filters
            </button>
          </motion.div>
        ) : (
          <>
            {/* Featured post */}
            {featured && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-mono text-amber-400/80 uppercase tracking-wider">Featured</span>
                </div>
                <div
                  onClick={() => navigate(`/blog/${featured.slug}`)}
                  className="group cursor-pointer relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 hover:bg-slate-900/80 transition-all duration-500"
                >
                  {featured.coverImage ? (
                    <div className="relative h-56 sm:h-72 overflow-hidden">
                      <img
                        src={featured.coverImage}
                        alt={featured.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                    </div>
                  ) : (
                    <div className="h-32 bg-gradient-to-br from-primary/10 via-slate-900 to-slate-950" />
                  )}
                  <div className="p-6 sm:p-8">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className={`text-[10px] font-mono font-medium px-2.5 py-1 rounded-full border bg-slate-950/80 ${getTagColor(featured.tag)}`}>
                        {featured.tag}
                      </span>
                      <span className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        {featured.date}
                      </span>
                      <span className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {featured.readTime} min read
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white group-hover:text-primary transition-colors mb-3 leading-tight">
                      {featured.title}
                    </h2>
                    <p className="text-slate-400 text-sm sm:text-base leading-relaxed line-clamp-2">
                      {featured.excerpt}
                    </p>
                    <div className="flex items-center gap-2 mt-6 text-sm text-primary font-medium group-hover:gap-3 transition-all">
                      Read article <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Regular posts grid */}
            {regularPosts.length > 0 && (
              <>
                {featured && (
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-px flex-1 bg-white/5" />
                    <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">Latest Articles</span>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>
                )}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                  {regularPosts.map((post, index) => (
                    <ArticleCard
                      key={post.slug}
                      post={post}
                      index={index}
                      onClick={() => navigate(`/blog/${post.slug}`)}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ArticleCard({ post, index, onClick }: { post: BlogPost; index: number; onClick: () => void }) {
  const gradientIndex = index % CARD_GRADIENTS.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onClick}
      className="group cursor-pointer"
    >
      <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-slate-900/40 hover:bg-slate-900/60 hover:border-white/10 transition-all duration-300 h-full flex flex-col">
        {/* Cover image */}
        {post.coverImage ? (
          <div className="relative h-40 sm:h-44 overflow-hidden">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
          </div>
        ) : (
          <div className={`h-24 bg-gradient-to-br ${CARD_GRADIENTS[gradientIndex]}`} />
        )}

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          {/* Meta row */}
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border bg-slate-950/60 ${getTagColor(post.tag)}`}>
              {post.tag}
            </span>
            <span className="text-[10px] text-slate-600 font-mono flex items-center gap-1 ml-auto">
              <Clock className="w-3 h-3" />
              {post.readTime} min
            </span>
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors leading-snug mb-2 line-clamp-2">
            {post.title}
          </h3>

          {/* Excerpt */}
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-4 flex-1">
            {post.excerpt}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
            <span className="text-[10px] text-slate-600 font-mono">{post.date}</span>
            <span className="text-[10px] text-primary font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all group-hover:gap-1.5">
              Read <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
