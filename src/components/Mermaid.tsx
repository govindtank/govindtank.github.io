import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: true,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
  themeVariables: {
    primaryColor: '#3b82f6',
    primaryTextColor: '#fff',
    primaryBorderColor: '#3b82f6',
    lineColor: '#94a3b8',
    secondaryColor: '#1e293b',
    tertiaryColor: '#0f172a'
  }
});

export default function Mermaid({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      mermaid.render('mermaid-diag-' + Math.random().toString(36).substr(2, 9), chart).then((res) => {
        if (ref.current) {
          ref.current.innerHTML = res.svg;
        }
      });
    }
  }, [chart]);

  return <div ref={ref} className="my-8 flex justify-center overflow-x-auto p-4 bg-slate-900/50 rounded-xl border border-white/5" />;
}
