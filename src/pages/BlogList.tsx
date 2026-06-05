import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BLOG_POSTS } from '../constants';
import { Search, Calendar, ArrowRight, Filter, Terminal, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { BlogPost } from '../types';

export default function BlogList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const tags = ['All', ...new Set(BLOG_POSTS.map(post => post.tag))];

  const filteredPosts = useMemo(() => {
    return BLOG_POSTS.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = selectedTag === 'All' || post.tag === selectedTag;
      return matchesSearch && matchesTag;
    }).sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
  }, [searchQuery, selectedTag]);

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
  }, [tags]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen py-32 px-6 relative">
      <div className="max-w-7xl mx-auto">
        {/* Back to Home */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-primary transition-all group font-mono text-xs uppercase tracking-widest"
          >
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
            <span>Return to System Root</span>
          </button>
        </motion.div>

        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-[1px] bg-primary" />
            <span className="text-primary font-mono text-sm tracking-widest uppercase">System Archives</span>
            <div className="w-10 h-[1px] bg-primary" />
          </div>
          <h1 className="text-5xl md:text-7xl font-sans font-bold text-white mb-6">
            Technical <span className="text-primary italic">Logs</span>
          </h1>
          <p className="text-slate-400 max-w-2xl font-sans leading-relaxed">
            Full repository of architectural manifests, deep dives, and engineering logs.
            <span className="block mt-1 text-xs font-mono text-slate-600">
              {BLOG_POSTS.length} entries indexed · Last updated: {BLOG_POSTS[0]?.date || 'N/A'}
            </span>
          </p>
        </motion.div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row gap-6 mb-8 items-start md:items-center justify-between">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search logs... [ctrl+k]"
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white font-mono text-sm focus:outline-none focus:border-primary/50 transition-all placeholder:text-slate-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="w-full md:w-auto">
            <div className="flex items-center gap-2 mb-3 md:hidden">
              <Filter className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Filter by Category</span>
            </div>
            <div className="relative flex items-center">
              {/* Left scroll arrow */}
              {canScrollLeft && (
                <button
                  onClick={() => scroll('left')}
                  className="absolute left-0 z-10 h-full flex items-center bg-gradient-to-r from-slate-950 to-transparent pl-1 pr-4 hidden md:flex"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-400 hover:text-white transition-colors" />
                </button>
              )}
              
              {/* Tag slider */}
              <div
                ref={scrollRef}
                className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 pt-1 px-6 md:px-8 scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <div className="flex items-center gap-1.5 mr-3 text-slate-500 font-mono text-[10px] uppercase tracking-widest shrink-0">
                  <Filter className="w-3 h-3" />
                  <span className="hidden md:inline">Filter:</span>
                </div>
                {tags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-mono transition-all border ${
                      selectedTag === tag 
                        ? 'bg-primary text-white border-primary shadow-[0_0_12px_rgba(14,165,233,0.3)]' 
                        : 'bg-slate-900/50 text-slate-400 border-white/10 hover:border-primary/30 hover:text-white'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Right scroll arrow */}
              {canScrollRight && (
                <button
                  onClick={() => scroll('right')}
                  className="absolute right-0 z-10 h-full flex items-center bg-gradient-to-l from-slate-950 to-transparent pr-1 pl-4 hidden md:flex"
                >
                  <ChevronRight className="w-4 h-4 text-slate-400 hover:text-white transition-colors" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8 text-[10px] font-mono text-slate-600 uppercase tracking-widest"
        >
          Showing {filteredPosts.length} of {BLOG_POSTS.length} logs
          {(searchQuery || selectedTag !== 'All') && (
            <button
              onClick={() => { setSearchQuery(''); setSelectedTag('All'); }}
              className="ml-4 text-primary hover:text-primary/80 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </motion.div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post, index) => (
              <motion.div
                key={post.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/blog/${post.slug}`)}
                className="group cursor-pointer"
              >
                <div className="glass-card p-8 border-white/5 bg-slate-900/40 hover:bg-slate-900/60 transition-all duration-500 rounded-2xl flex flex-col h-full relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Terminal className="w-24 h-24 rotate-12" />
                  </div>

                  <div className="flex justify-between items-start mb-6">
                    <span className="text-[10px] font-mono text-primary border border-primary/30 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                      {post.tag}
                    </span>
                    <div className="flex items-center gap-2 text-slate-500 text-[10px] font-mono">
                      <Calendar className="w-3 h-3" />
                      {post.date}
                    </div>
                  </div>

                  <h3 className="text-xl font-sans font-bold text-white mb-4 group-hover:text-primary transition-colors leading-tight">
                    {post.title}
                  </h3>
                  <p className="text-slate-400 text-sm font-sans mb-8 flex-grow leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center gap-2 text-primary font-mono text-xs group-hover:gap-4 transition-all uppercase tracking-widest font-bold">
                    Read Log <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <Terminal className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">No matching logs found in archives</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
