import { useLocation, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Command as CommandIcon,
  Palette,
  Activity,
  Menu,
  X,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { ThemeMode } from '../types';

interface NavbarProps {
  activeSection?: string;
  theme?: ThemeMode;
  onThemeChange?: (theme: ThemeMode) => void;
  motionEnabled?: boolean;
  onToggleMotion?: () => void;
  onOpenCommand?: () => void;
  beeEnabled?: boolean;
  onToggleBee?: () => void;
}

const NAV_ITEMS = [
  { id: 'hero', label: 'Core' },
  { id: 'about', label: 'Manifest' },
  { id: 'sandbox', label: '3D Labs' },
  { id: 'skills', label: 'Radar' },
  { id: 'projects', label: 'Vault' },
  { id: 'packages', label: 'Packages' },
  { id: 'experience', label: 'Chronicle' },
  { id: 'logs', label: 'Logs' },
  { id: 'contact', label: 'Connect' },
];

const THEME_OPTIONS: { id: ThemeMode; label: string; dot: string }[] = [
  { id: 'cyber', label: 'Cyber Cyan', dot: 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' },
  { id: 'impeller', label: 'Impeller Neon', dot: 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' },
  { id: 'matrix', label: 'Matrix Core', dot: 'bg-emerald-400 shadow-[0_0_8px_#10b981]' },
];

export default function Navbar({
  activeSection = 'hero',
  theme = 'cyber',
  onThemeChange,
  motionEnabled = true,
  onToggleMotion,
  onOpenCommand,
  beeEnabled = false,
  onToggleBee,
}: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/' || location.pathname === '';
  const [isScrolled, setIsScrolled] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    setThemeDropdownOpen(false);
    if (!isHomePage) {
      navigate(`/#${id}`);
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-3 sm:top-4 inset-x-0 z-50 flex flex-col items-center pointer-events-none px-3 sm:px-4">
      {/* Floating Dynamic Island Nav */}
      <div className="pointer-events-auto flex items-center gap-2 max-w-full">
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className={`relative rounded-[26px] sm:rounded-[30px] border transition-colors duration-300 ${
            isScrolled || mobileMenuOpen
              ? 'bg-[#070b14]/92 border-white/15 shadow-[0_18px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(34,211,238,0.12)]'
              : 'bg-[#070b14]/80 border-white/10 shadow-[0_12px_35px_rgba(0,0,0,0.65)]'
          } backdrop-blur-2xl`}
        >
          <div className="flex items-center gap-1.5 sm:gap-3 px-3 sm:px-4 py-2">
            {/* Brand / Logo Button */}
            <button
              type="button"
              onClick={() => scrollTo('hero')}
              className="flex items-center gap-2 group focus:outline-none"
              aria-label="Go to top"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
              </span>
              <img
                src="https://avatars.githubusercontent.com/u/8425888?v=4"
                alt="Govind Tank"
                className="w-6 h-6 rounded-full border border-cyan-400/40 object-cover"
              />
              <span className="font-mono-tech text-xs tracking-wider text-slate-300 font-semibold group-hover:text-cyan-300 transition-colors hidden md:inline">
                // Govind Tank · Lead Mobile Systems Engineer
              </span>
            </button>

            {/* Desktop Section Links */}
            <nav className="hidden lg:flex items-center gap-1 pl-2 border-l border-white/10">
              {NAV_ITEMS.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollTo(item.id)}
                    className={`relative px-2.5 py-1 rounded-full text-xs font-mono-tech font-medium transition-all ${
                      isActive
                        ? 'text-cyan-300 bg-cyan-400/10 border border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Controls Divider */}
            <div className="h-4 w-[1px] bg-white/10 mx-0.5 sm:mx-1 hidden sm:block" />

            {/* Theme Picker Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setThemeDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono-tech text-slate-300 transition-colors"
                title="Change Shader Palette"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    THEME_OPTIONS.find((t) => t.id === theme)?.dot || 'bg-cyan-400'
                  }`}
                />
                <span className="hidden sm:inline capitalize">{theme}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              <AnimatePresence>
                {themeDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-44 rounded-2xl bg-[#090d16]/95 border border-white/15 p-1.5 shadow-2xl backdrop-blur-2xl z-50 flex flex-col gap-1"
                  >
                    {THEME_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          onThemeChange(opt.id);
                          setThemeDropdownOpen(false);
                        }}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-mono-tech transition-colors text-left ${
                          theme === opt.id
                            ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-400/30'
                            : 'text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${opt.dot}`} />
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Motion Toggle */}
            <button
              type="button"
              onClick={onToggleMotion}
              className={`p-1.5 rounded-full border transition-colors hidden sm:flex items-center justify-center ${
                motionEnabled
                  ? 'border-cyan-400/40 text-cyan-300 bg-cyan-500/10 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                  : 'border-white/10 text-slate-400 hover:text-slate-200 bg-white/5'
              }`}
              title={motionEnabled ? '3D Motion: Active' : '3D Motion: Paused'}
            >
              <Activity className="w-3.5 h-3.5" />
            </button>

            {/* Companion Drone (Bee) Toggle */}
            <button
              type="button"
              onClick={onToggleBee}
              className={`px-2 py-1 rounded-full border transition-all flex items-center gap-1 cursor-pointer text-xs font-mono-tech ${
                beeEnabled
                  ? 'border-amber-400/50 text-amber-300 bg-amber-500/15 shadow-[0_0_12px_rgba(251,191,36,0.25)]'
                  : 'border-white/10 text-slate-400 hover:text-slate-200 bg-white/5'
              }`}
              title={
                beeEnabled
                  ? 'Companion Drone (Bee): ACTIVE (Click to disable)'
                  : 'Companion Drone (Bee): OFF (Click to activate)'
              }
              aria-label="Toggle Companion Drone"
            >
              <span className="text-[11px] leading-none select-none">🐝</span>
              <span className="hidden md:inline text-[10px] font-semibold">{beeEnabled ? 'Drone ON' : 'Drone'}</span>
            </button>

            {/* Command Deck Trigger (Cmd+K) */}
            <button
              type="button"
              onClick={onOpenCommand}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/30 text-xs font-mono-tech text-cyan-300 transition-colors shadow-[0_0_15px_rgba(34,211,238,0.15)]"
              title="Open Command Deck (⌘K)"
            >
              <CommandIcon className="w-3 h-3" />
              <span className="font-bold">K</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="lg:hidden p-1.5 rounded-full text-slate-300 hover:text-white bg-white/5 border border-white/10"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

          {/* Mobile Drawer */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden border-t border-white/10 px-4 py-3 flex flex-col gap-1.5"
              >
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollTo(item.id)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-left font-mono-tech text-xs text-slate-300 hover:bg-white/5 hover:text-cyan-300 transition-colors"
                  >
                    <span>{item.label}</span>
                    <span className="text-slate-600 font-mono-tech">#{item.id}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </header>
  );
}
