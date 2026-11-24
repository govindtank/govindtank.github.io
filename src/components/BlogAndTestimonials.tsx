import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BLOG_POSTS, TESTIMONIALS } from '../constants';
import {
  BookOpen,
  Quote,
  MessageSquareQuote,
  Search,
  Filter,
  ExternalLink,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { BlogPost } from '../types';
import { useNavigate } from 'react-router-dom';

interface BlogAndTestimonialsProps {
  onPostSelect: (post: BlogPost) => void;
}

const MAX_HOME_BLOGS = 6;

const TAG_COLORS: Record<string, string> = {
  'Mobile-Architecture': 'text-cyan-400 bg-cyan-500/10 border-cyan-400/30',
  'Android': 'text-emerald-400 bg-emerald-500/10 border-emerald-400/30',
  'Flutter': 'text-cyan-400 bg-cyan-500/10 border-cyan-400/30',
  'AI-Engineering': 'text-indigo-400 bg-indigo-500/10 border-indigo-400/30',
  'AI-Agents': 'text-purple-400 bg-purple-500/10 border-purple-400/30',
  'Performance': 'text-amber-400 bg-amber-500/10 border-amber-400/30',
};

function getTagColor(tag: string): string {
  return TAG_COLORS[tag] || 'text-slate-400 bg-white/5 border-white/10';
}

export default function BlogAndTestimonials({ onPostSelect }: BlogAndTestimonialsProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filteredPosts = useMemo(() => {
    return BLOG_POSTS.filter((post) => {
      const matchesSearch =
        searchTerm.trim() === '' ||
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags?.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesTag = selectedTag === null || post.tags?.includes(selectedTag);
      return matchesSearch && matchesTag;
    })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, MAX_HOME_BLOGS);
  }, [searchTerm, selectedTag]);

  const allTags = [...new Set(BLOG_POSTS.flatMap((p) => p.tags || [p.tag]))].slice(0, 8);

  const handleCardClick = (post: BlogPost) => {
    navigate(`/blog/${post.slug}`);
  };

  return (
    <section id="logs" className="relative py-16 sm:py-20 bg-transparent overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2 font-mono-tech text-xs text-cyan-400">
              <BookOpen className="w-3.5 h-3.5" />
              <span>// 07. Engineering_Logs</span>
            </div>
            <h2 className="font-section-title text-4xl sm:text-5xl font-bold tracking-tight text-white mb-2">
              Architectural <span className="text-primary">Logs</span>
            </h2>
            <p className="max-w-xl text-sm sm:text-base text-slate-400 leading-relaxed font-light">
              In-depth engineering breakdowns covering AGSL fragment shaders, Impeller frame
              budgets, zero-leak reactive systems, and on-device SLM execution.
            </p>
          </div>
          <div className="text-6xl font-black text-white/5 select-none hidden md:block">
            ARTICLES
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-white/10">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search engineering logs by keyword, topic, or tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full spatial-glass border-white/10 text-white font-mono-tech text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400/50 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1.5 rounded-full font-mono-tech text-xs whitespace-nowrap transition-colors cursor-pointer ${
                selectedTag === null
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-semibold'
                  : 'spatial-glass text-slate-400 hover:text-slate-200 border-white/10'
              }`}
            >
              All Topics
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                className={`px-3 py-1.5 rounded-full font-mono-tech text-xs whitespace-nowrap transition-colors cursor-pointer ${
                  selectedTag === tag
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-semibold'
                    : 'spatial-glass text-slate-400 hover:text-slate-200 border-white/10'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Main Grid: Articles + Testimonials */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Articles Column */}
          <div className="lg:col-span-8 space-y-4">
            {filteredPosts.map((post, idx) => (
              <motion.div
                key={post.slug}
                
                
                
                transition={{ delay: idx * 0.05 }}
                onClick={() => handleCardClick(post)}
                className="spatial-glass rounded-3xl p-6 border-white/10 hover:border-cyan-400/40 transition-all cursor-pointer group shadow-lg"
              >
                <div className="flex flex-col sm:flex-row gap-5">
                  {post.coverImage && (
                    <div className="sm:w-44 sm:min-w-[11rem] h-32 sm:h-auto rounded-2xl overflow-hidden border border-white/10 shrink-0">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                  )}

                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span
                          className={`font-mono-tech text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getTagColor(
                            post.tag
                          )}`}
                        >
                          {post.tag}
                        </span>
                        {post.readTime && (
                          <span className="font-mono-tech text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-cyan-400" />
                            {post.readTime} min read
                          </span>
                        )}
                      </div>

                      <h3 className="font-display font-bold text-lg sm:text-xl text-white group-hover:text-cyan-300 transition-colors leading-snug">
                        {post.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-400 mt-2 font-light line-clamp-2 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/5 font-mono-tech text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {post.date}
                      </span>
                      <span className="text-cyan-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <span>Read Log</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* View Full Archive Button */}
            <div className="pt-4">
              <button
                type="button"
                onClick={() => navigate('/blog')}
                className="w-full py-4 rounded-2xl spatial-glass border-white/10 hover:border-cyan-400/40 text-center font-mono-tech text-xs text-slate-300 hover:text-cyan-300 transition-all font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <span>Explore Full Engineering Archive ({BLOG_POSTS.length} Articles)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Social Proof / Testimonials Column */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-2 mb-4 font-mono-tech text-xs text-amber-400">
              <MessageSquareQuote className="w-4 h-4" />
              <span>// Verified_Endorsements</span>
            </div>

            {TESTIMONIALS.map((t, idx) => (
              <motion.div
                key={t.name}
                
                
                
                transition={{ delay: idx * 0.1 }}
                className="spatial-glass rounded-3xl p-6 border-white/10 hover:border-amber-400/30 transition-all relative group"
              >
                <Quote className="absolute top-4 right-4 w-7 h-7 text-white/5" />
                <p className="text-xs sm:text-sm text-slate-300 font-light italic leading-relaxed mb-6">
                  &quot;{t.content}&quot;
                </p>
                <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center font-mono-tech font-bold text-slate-950 text-xs">
                    {t.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <div className="font-display font-bold text-xs text-white">{t.name}</div>
                    <div className="font-mono-tech text-[10px] text-slate-400">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
