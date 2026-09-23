import React, { useEffect, useRef } from 'react';
import { MessageSquare, Github } from 'lucide-react';

interface GiscusCommentsProps {
  slug?: string;
  className?: string;
}

export default function GiscusComments({ slug, className = '' }: GiscusCommentsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean previous iframe/script if re-rendering on slug change
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', 'govindtank/govindtank.github.io');
    script.setAttribute('data-repo-id', 'R_kgDOSMvqdw');
    script.setAttribute('data-category', 'General');
    script.setAttribute('data-category-id', 'DIC_kwDOSMvqd84DGOTu');

    // If slug is provided, use specific term mapping so modal and direct URL share the exact same thread
    if (slug) {
      script.setAttribute('data-mapping', 'specific');
      script.setAttribute('data-term', `/blog/${slug}`);
    } else {
      script.setAttribute('data-mapping', 'pathname');
    }

    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'bottom');
    script.setAttribute('data-theme', 'dark');
    script.setAttribute('data-lang', 'en');
    script.setAttribute('data-loading', 'lazy');
    script.setAttribute('crossorigin', 'anonymous');
    script.async = true;

    containerRef.current.appendChild(script);
  }, [slug]);

  return (
    <section className={`mt-16 pt-10 border-t border-white/10 ${className}`}>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Discussions & Comments
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Powered by GitHub Discussions • Zero-spam & Markdown ready
            </p>
          </div>
        </div>

        <a
          href="https://github.com/govindtank/govindtank.github.io/discussions"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-all text-xs font-mono"
        >
          <Github className="w-3.5 h-3.5" />
          <span>View all on GitHub</span>
        </a>
      </div>

      <div
        ref={containerRef}
        className="giscus-wrapper min-h-[160px] rounded-xl bg-slate-900/30 p-2 border border-white/5"
      />
    </section>
  );
}
