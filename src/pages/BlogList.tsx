import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BLOG_POSTS } from '../constants';
import { Search, Calendar, ArrowRight, Filter, Terminal } from 'lucide-react';
import { motion } from 'motion/react';
import { BlogPost } from '../types';

export default function BlogList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');

  const tags = ['All', ...new Set(BLOG_POSTS.map(post => post.tag))];

  const filteredPosts = useMemo(() => {
    return BLOG_POSTS.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = selectedTag === 'All' || post.tag === selectedTag;
      return matchesSearch && matchesTag;
    }).sort((a, b) => {
      // Sort by date descending (same format: "June 03, 2026" or "Mar 15, 2024")
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
  }, [searchQuery, selectedTag]);

  return (
    <div className="min-h-screen py-32 px-6 relative">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-[1px] bg-primary" />
            <span className="text-primary font-mono text-sm tracking-widest uppercase">System Archives</span>
            <div className="w-10 h-[1px] bg-primary" />
          </div>
          <h1 className="text-5xl md:text-7xl font-sans font-bold text-white mb-6">
            Technical <span className="text-primary italic">Logs</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto font-sans leading-relaxed">
            Full repository of architectural manifests, deep dives, and engineering logs.
          </p>
        </motion.div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between">
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

          <div className="flex items-center gap-3 overflow-x-auto pb-2 w-full md:w-auto">
            <div className="flex items-center gap-2 mr-4 text-slate-500 font-mono text-xs uppercase tracking-widest">
              <Filter className="w-3 h-3" /> Filter:
            </div>
            {tags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-4 py-1.5 rounded-full text-xs font-mono transition-all border ${
                  selectedTag === tag 
                    ? 'bg-primary text-white border-primary' 
                    : 'bg-slate-900/50 text-slate-400 border-white/10 hover:border-primary/30'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

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
