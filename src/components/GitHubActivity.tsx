import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Star, GitFork, Clock, ExternalLink, Github, RefreshCw, Code2, Circle } from 'lucide-react';

interface GitHubRepo {
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  topics: string[];
  fork: boolean;
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Dart: '#00B4AB',
  Kotlin: '#A97BFF',
  Java: '#b07219',
  Python: '#3572A5',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Swift: '#F05138',
  Go: '#00ADD8',
  Rust: '#dea584',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  PHP: '#4F5D95',
  Ruby: '#701516',
};

function getLanguageColor(language: string | null): string {
  if (!language) return '#8b8b8b';
  return LANGUAGE_COLORS[language] || '#8b8b8b';
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

export default function GitHubActivity() {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<string | null>(null);

  const fetchRepos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        'https://api.github.com/users/govindtank/repos?sort=updated&per_page=8&direction=desc'
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch repositories');
      }
      
      const data: GitHubRepo[] = await response.json();
      const nonForkRepos = data.filter(repo => !repo.fork);
      setRepos(nonForkRepos);
      setLastFetched(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  return (
    <section id="github" className="py-24 bg-slate-950 text-slate-100 relative overflow-hidden">
      <div className="absolute inset-0 tech-grid opacity-30 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row items-baseline justify-between gap-4 mb-16">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-4 mb-4"
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Github className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase text-white">
                  GitHub <span className="text-sky-400">Activity</span>
                </h2>
                <p className="text-slate-400 font-mono text-xs mt-1">// Live_Repository_Status.feed</p>
              </div>
            </motion.div>
          </div>
          
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex items-center gap-3"
          >
            {lastFetched && (
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                Updated: {lastFetched}
              </span>
            )}
            <button
              onClick={fetchRepos}
              disabled={loading}
              aria-label="Refresh GitHub repository feeds"
              className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-xl transition-all disabled:opacity-50 text-slate-300 hover:text-white shadow-md"
            >
              <RefreshCw className={`w-4 h-4 text-sky-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </motion.div>
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="system-card p-8 border border-white/10 bg-slate-900/40 rounded-2xl"
              >
                <div className="h-6 bg-white/10 rounded mb-4 animate-pulse" />
                <div className="h-4 bg-white/10 rounded mb-2 w-3/4 animate-pulse" />
                <div className="h-4 bg-white/10 rounded mb-6 w-1/2 animate-pulse" />
                <div className="flex gap-4">
                  <div className="h-4 bg-white/10 rounded w-16 animate-pulse" />
                  <div className="h-4 bg-white/10 rounded w-16 animate-pulse" />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="glass-card p-12 rounded-3xl border border-red-500/20 bg-red-500/5 max-w-md mx-auto">
              <Circle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-slate-300 mb-4 font-semibold">Failed to fetch GitHub repository feeds</p>
              <p className="text-slate-400 text-sm mb-6 font-mono">{error}</p>
              <button
                onClick={fetchRepos}
                className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl transition-all text-red-400 font-mono text-xs uppercase tracking-wider font-bold"
              >
                Retry Request
              </button>
            </div>
          </motion.div>
        )}

        {!loading && !error && repos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {repos.map((repo, index) => (
              <motion.a
                key={repo.name}
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group system-card p-8 transition-all hover:border-sky-500/40 bg-slate-900/50 border border-white/10 rounded-2xl block relative shadow-lg"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10 group-hover:bg-sky-500/20 group-hover:border-sky-500/30 transition-all">
                    <Code2 className="w-6 h-6 text-slate-300 group-hover:text-sky-400 transition-colors" />
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-sky-400" />
                  </motion.div>
                </div>

                <h3 className="text-xl font-bold mb-3 text-white group-hover:text-sky-300 transition-colors font-mono">
                  {repo.name}
                </h3>
                
                <p className="text-slate-300 text-sm mb-6 leading-relaxed line-clamp-2 min-h-[40px] font-sans">
                  {repo.description || 'Architectural repository and production code.'}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {repo.language && (
                    <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded bg-slate-950 border border-white/10 text-slate-300 font-bold">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getLanguageColor(repo.language) }}
                      />
                      {repo.language}
                    </span>
                  )}
                  {repo.topics.slice(0, 2).map(topic => (
                    <span key={topic} className="text-[10px] font-mono tracking-wider px-2 py-1 rounded bg-sky-500/10 border border-sky-500/20 text-sky-400 uppercase font-semibold">
                      {topic}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                      <span>{repo.stargazers_count}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
                      <GitFork className="w-3.5 h-3.5 text-sky-400" />
                      <span>{repo.forks_count}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    <Clock className="w-3 h-3" />
                    <span>{formatRelativeTime(repo.updated_at)}</span>
                  </div>
                </div>

                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Github className="w-16 h-16 text-white/5 rotate-12" />
                </div>
              </motion.a>
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 flex justify-center"
        >
          <a
            href="https://github.com/govindtank"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative px-10 py-6 glass-card border-dashed border-white/20 hover:border-sky-500/40 flex flex-col items-center gap-2 cursor-pointer transition-all bg-slate-900/40 rounded-2xl"
          >
            <Github className="w-5 h-5 text-slate-400 group-hover:text-sky-400 transition-colors relative z-10" />
            <span className="text-xs font-mono text-slate-300 group-hover:text-sky-400 font-bold transition-colors relative z-10 uppercase tracking-widest">
              VIEW_FULL_REPOSITORY_PROFILE
            </span>
            <div className="h-px w-24 bg-white/10 group-hover:w-full group-hover:bg-sky-500/40 transition-all relative z-10" />
          </a>
        </motion.div>

        {!loading && !error && repos.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-8 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500/10 border border-sky-500/20 rounded-full">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[10px] font-mono text-sky-400 uppercase tracking-wider font-bold">
                {repos.length} Active Repositories • Synchronized Live via GitHub API
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
