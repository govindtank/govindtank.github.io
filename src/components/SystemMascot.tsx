import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { Bot, MessageSquare, Terminal as TerminalIcon, Cpu, Smartphone, Code2, Sparkles, ChevronRight, BookOpen, ArrowUp, List, Search } from 'lucide-react';

const HOME_MESSAGES = [
  "System Initializing... User: Govind Tank",
  "Architecting Scalable Solutions. v9.0.4",
  "Analyzing Project: Akshar Amrutam...",
  "Status: 99.9% Crash Free",
  "Clean Architecture Mode: Active",
  "I specialize in Kotlin & Flutter!",
  "Check out 'The Vault' below.",
  "Need a consultant? Let's connect!",
];

const BLOG_MESSAGES = [
  "Browsing the technical archive...",
  "Deep dives into architecture & AI.",
  "Reading mode: engaged.",
  "Check out the latest articles!",
  "Knowledge base at your fingertips.",
];

const QUICK_ACTIONS_HOME = [
  { icon: <Code2 className="w-4 h-4" />, label: "Projects", target: "#projects" },
  { icon: <MessageSquare className="w-4 h-4" />, label: "Contact", target: "#contact" },
  { icon: <TerminalIcon className="w-4 h-4" />, label: "Logs", target: "#blog" },
  { icon: <Sparkles className="w-4 h-4" />, label: "Skills", target: "#skills" },
];

const QUICK_ACTIONS_BLOG = [
  { icon: <Search className="w-4 h-4" />, label: "Search", action: "search" },
  { icon: <List className="w-4 h-4" />, label: "All Tags", action: "tags" },
  { icon: <ArrowUp className="w-4 h-4" />, label: "Top", action: "top" },
  { icon: <BookOpen className="w-4 h-4" />, label: "Archive", action: "archive" },
];

export default function SystemMascot() {
  const location = useLocation();
  const [msgIndex, setMsgIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const isBlogPage = location.pathname.startsWith('/blog');

  // Pick message pool based on current page
  const MESSAGES = isBlogPage ? BLOG_MESSAGES : HOME_MESSAGES;
  const QUICK_ACTIONS = isBlogPage ? QUICK_ACTIONS_BLOG : QUICK_ACTIONS_HOME;

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 3000);
    const interval = setInterval(() => {
      setIsThinking(true);
      setTimeout(() => {
        setMsgIndex((prev) => (prev + 1) % MESSAGES.length);
        setIsThinking(false);
      }, 500);
    }, 8000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [isBlogPage]);

  const scrollToSection = (target: string) => {
    document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
    setShowActions(false);
  };

  const handleBlogAction = (action: string) => {
    switch (action) {
      case 'search':
        // Focus the search input on blog listing page
        const input = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (input) { input.focus(); input.scrollIntoView({ behavior: 'smooth' }); }
        break;
      case 'tags':
        // Scroll to tag filter area
        const tagArea = document.querySelector('[class*="overflow-x-auto"]');
        if (tagArea) tagArea.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'top':
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      case 'archive':
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
    }
    setShowActions(false);
  };

  const handleAction = isBlogPage
    ? (action: string) => handleBlogAction(action)
    : (target: string) => scrollToSection(target);

  // Don't show on blog detail pages — it would interfere with reading
  if (isBlogPage && location.pathname !== '/blog') {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100] pointer-events-none md:pointer-events-auto">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.8 }}
            className="flex flex-col items-end gap-2"
          >
            {/* Quick actions panel */}
            <AnimatePresence>
              {showActions && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="mb-1 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-2.5 shadow-xl min-w-[180px]"
                >
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                      {isBlogPage ? 'Blog Actions' : 'Quick Navigation'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {QUICK_ACTIONS.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => handleAction((action as any).target || (action as any).action)}
                        className="flex items-center gap-2 px-2.5 py-2 bg-white/5 hover:bg-primary/10 border border-white/5 hover:border-primary/20 rounded-lg transition-all group text-left"
                      >
                        <span className="text-slate-400 group-hover:text-primary transition-colors shrink-0">{action.icon}</span>
                        <span className="text-[11px] font-mono text-slate-300 group-hover:text-white">{action.label}</span>
                        <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-primary ml-auto transition-colors" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Message bubble */}
            <motion.div
              animate={isThinking ? { scale: 0.95, opacity: 0.8 } : { scale: 1, opacity: 1 }}
              className="bg-slate-900/95 backdrop-blur-xl border border-primary/20 p-3 rounded-xl rounded-br-none shadow-lg max-w-[200px] relative"
            >
              <div className="flex gap-2 mb-1.5 items-center border-b border-white/5 pb-1.5">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                  {isBlogPage ? 'BROWSER_GT' : 'DRONE_GT_0X1'}
                </span>
              </div>
              <p className="text-[12px] text-white font-mono leading-relaxed">
                {MESSAGES[msgIndex]}
              </p>
            </motion.div>

            {/* Bot icon */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              onClick={() => setShowActions(!showActions)}
              className="w-14 h-14 relative flex items-center justify-center cursor-pointer group"
            >
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/30 transition-colors" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border border-primary/20 rounded-full border-dashed"
              />
              <div className="w-11 h-11 bg-slate-950 rounded-xl border border-primary/40 shadow-lg shadow-primary/20 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                <Bot className="text-primary w-6 h-6" />
              </div>
              <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
