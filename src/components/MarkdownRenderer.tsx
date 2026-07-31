import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Copy, ExternalLink, X, ZoomIn } from 'lucide-react';
import Mermaid from './Mermaid';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class MarkdownErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Markdown rendering error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-slate-900 border border-amber-500/30 rounded-xl text-slate-300">
          <p className="text-amber-400 font-bold text-sm mb-2">Content Rendering Fallback</p>
          <p className="text-xs text-slate-400">Some complex markdown syntax could not be rendered interactively.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<{ src: string; alt: string } | null>(null);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(id);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  // Normalize CRLF line endings
  const normalizedContent = (content || '').replace(/\r\n/g, '\n');

  // Pre-process content to isolate Mermaid diagrams
  const renderBlocks = () => {
    const mermaidRegex = /```mermaid\s*\n([\s\S]*?)\n```/g;
    const parts: { type: 'markdown' | 'mermaid'; content: string }[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = mermaidRegex.exec(normalizedContent)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'markdown',
          content: normalizedContent.substring(lastIndex, match.index),
        });
      }
      parts.push({
        type: 'mermaid',
        content: match[1].trim(),
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < normalizedContent.length) {
      parts.push({
        type: 'markdown',
        content: normalizedContent.substring(lastIndex),
      });
    }

    return parts;
  };

  const blocks = renderBlocks();

  return (
    <MarkdownErrorBoundary>
      <div className="prose prose-invert max-w-none prose-pre:p-0 prose-pre:bg-transparent">
        {blocks.map((block, blockIdx) => {
          if (block.type === 'mermaid') {
            return (
              <div key={`mermaid-${blockIdx}`} className="my-8">
                <Mermaid chart={block.content} />
              </div>
            );
          }

          return (
            <ReactMarkdown
              key={`md-${blockIdx}`}
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1].toLowerCase() : '';
                  const codeString = String(children).replace(/\n$/, '');
                  const codeId = `code-${blockIdx}-${Math.random().toString(36).substr(2, 5)}`;

                  // Fallback for mermaid code blocks passed directly
                  if (language === 'mermaid') {
                    return <Mermaid chart={codeString} />;
                  }

                  if (!inline && language) {
                    const isCopied = copiedIndex === codeId;

                    return (
                      <div className="relative group my-6 rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-slate-950/90">
                        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border-b border-white/10 text-xs font-mono text-slate-400">
                          <div className="flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block"></span>
                            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block"></span>
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block"></span>
                            <span className="ml-2 uppercase tracking-wider text-sky-400 font-bold">
                              {language}
                            </span>
                          </div>

                          <button
                            onClick={() => handleCopyCode(codeString, codeId)}
                            aria-label="Copy code snippet"
                            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all text-xs font-sans"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400 font-semibold">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="p-4 overflow-x-auto text-sm leading-relaxed font-mono">
                          <SyntaxHighlighter
                            style={oneDark}
                            language={language}
                            PreTag="div"
                            customStyle={{
                              margin: 0,
                              padding: 0,
                              background: 'transparent',
                              fontSize: '0.9rem',
                              lineHeight: '1.6',
                            }}
                            {...props}
                          >
                            {codeString}
                          </SyntaxHighlighter>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <code
                      className="px-1.5 py-0.5 rounded bg-white/10 text-sky-300 font-mono text-sm font-normal"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },

                img({ src, alt }: any) {
                  return (
                    <figure className="my-8 group relative inline-block w-full">
                      <div
                        className="relative rounded-xl overflow-hidden border border-white/10 bg-slate-900/50 cursor-pointer shadow-lg transition-transform hover:scale-[1.01]"
                        onClick={() => setActiveImage({ src, alt: alt || 'Technical Diagram' })}
                      >
                        <img
                          src={src}
                          alt={alt || ''}
                          loading="lazy"
                          className="w-full h-auto max-h-[500px] object-cover rounded-xl"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="px-3 py-1.5 rounded-full bg-slate-900/90 text-sky-400 text-xs font-mono flex items-center space-x-1.5 border border-sky-500/30">
                            <ZoomIn className="w-4 h-4" />
                            <span>Click to Zoom</span>
                          </span>
                        </div>
                      </div>
                      {alt && (
                        <figcaption className="text-center text-xs text-slate-400 mt-2 font-mono italic">
                          {alt}
                        </figcaption>
                      )}
                    </figure>
                  );
                },

                a({ href, children }: any) {
                  const isExternal = href?.startsWith('http');
                  return (
                    <a
                      href={href}
                      target={isExternal ? '_blank' : undefined}
                      rel={isExternal ? 'noopener noreferrer' : undefined}
                      className="text-sky-400 hover:text-sky-300 underline underline-offset-4 font-medium transition-colors inline-flex items-center gap-1"
                    >
                      <span>{children}</span>
                      {isExternal && <ExternalLink className="w-3 h-3 inline-block opacity-70" />}
                    </a>
                  );
                },

                blockquote({ children }: any) {
                  return (
                    <blockquote className="my-6 border-l-4 border-amber-500/80 bg-amber-500/5 pl-4 pr-3 py-3 rounded-r-lg text-slate-300 italic font-sans">
                      {children}
                    </blockquote>
                  );
                },

                h1({ children }: any) {
                  return (
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-10 mb-4 tracking-tight border-b border-white/10 pb-3">
                      {children}
                    </h1>
                  );
                },
                h2({ children }: any) {
                  return (
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-100 mt-8 mb-4 tracking-tight">
                      {children}
                    </h2>
                  );
                },
                h3({ children }: any) {
                  return (
                    <h3 className="text-lg font-semibold text-slate-200 mt-6 mb-3">
                      {children}
                    </h3>
                  );
                },
                p({ children }: any) {
                  return (
                    <p className="text-slate-300 leading-relaxed my-4 text-base sm:text-lg">
                      {children}
                    </p>
                  );
                },
                ul({ children }: any) {
                  return <ul className="list-disc list-inside space-y-2 my-4 text-slate-300">{children}</ul>;
                },
                ol({ children }: any) {
                  return <ol className="list-decimal list-inside space-y-2 my-4 text-slate-300">{children}</ol>;
                },
                table({ children }: any) {
                  return (
                    <div className="my-8 overflow-x-auto rounded-xl border border-white/10 shadow-lg">
                      <table className="w-full text-left border-collapse text-sm text-slate-300">
                        {children}
                      </table>
                    </div>
                  );
                },
                thead({ children }: any) {
                  return <thead className="bg-slate-900/90 text-sky-400 font-mono text-xs uppercase">{children}</thead>;
                },
                tr({ children }: any) {
                  return <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">{children}</tr>;
                },
                th({ children }: any) {
                  return <th className="p-3 font-semibold">{children}</th>;
                },
                td({ children }: any) {
                  return <td className="p-3">{children}</td>;
                },
              }}
            >
              {block.content}
            </ReactMarkdown>
          );
        })}

        {/* Lightbox Modal */}
        {activeImage && (
          <div
            className="fixed inset-0 z-[120] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fadeIn"
            onClick={() => setActiveImage(null)}
          >
            <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center">
              <button
                onClick={() => setActiveImage(null)}
                aria-label="Close zoomed image"
                className="absolute -top-12 right-0 p-2 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={activeImage.src}
                alt={activeImage.alt}
                className="max-w-full max-h-[85vh] object-contain rounded-xl border border-white/20 shadow-2xl"
              />
              {activeImage.alt && (
                <p className="mt-3 text-sm text-slate-300 font-mono text-center">
                  {activeImage.alt}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </MarkdownErrorBoundary>
  );
}
