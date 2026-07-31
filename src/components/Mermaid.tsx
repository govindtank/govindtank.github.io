import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  themeVariables: {
    primaryColor: '#0ea5e9',
    primaryTextColor: '#ffffff',
    primaryBorderColor: '#0ea5e9',
    lineColor: '#38bdf8',
    secondaryColor: '#1e293b',
    tertiaryColor: '#0f172a'
  }
});

export default function Mermaid({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState<boolean>(false);

  useEffect(() => {
    if (!ref.current || !chart) return;
    setRenderError(false);
    const id = 'mermaid-diag-' + Math.random().toString(36).substring(2, 9);

    try {
      mermaid
        .render(id, chart)
        .then((res) => {
          if (ref.current) {
            ref.current.innerHTML = res.svg;
          }
        })
        .catch(() => {
          setRenderError(true);
        });
    } catch {
      setRenderError(true);
    }
  }, [chart]);

  if (renderError) {
    return (
      <div className="my-6 p-4 rounded-xl border border-white/10 bg-slate-950 font-mono text-xs text-slate-400 overflow-x-auto">
        <div className="text-amber-400 font-bold mb-2">// Architecture Flow Diagram</div>
        <pre className="whitespace-pre">{chart}</pre>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="my-8 flex justify-center overflow-x-auto p-4 bg-slate-900/60 rounded-xl border border-white/10 shadow-lg"
    />
  );
}
