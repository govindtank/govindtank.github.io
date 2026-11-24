import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Command as CommandIcon,
  X,
  Layers,
  Activity,
  Palette,
  ExternalLink,
  ChevronRight,
  Compass,
  FileText,
  Package,
} from 'lucide-react';
import { ThemeMode } from '../types';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigateSection: (id: string) => void;
  onToggleExplode: () => void;
  onToggleMotion: () => void;
  onThemeChange: (theme: ThemeMode) => void;
  onToggleBee?: () => void;
}

export default function CommandPalette({
  open,
  onClose,
  onNavigateSection,
  onToggleExplode,
  onToggleMotion,
  onThemeChange,
  onToggleBee,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');

  // Handle Cmd+K / Ctrl+K and Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (open) onClose();
        else setQuery('');
      } else if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const ACTIONS = [
    {
      group: 'Navigation',
      items: [
        { label: 'Jump to Hero / Core', action: () => onNavigateSection('hero'), icon: <Compass className="w-4 h-4 text-cyan-400" /> },
        { label: 'Jump to Engineering Standards', action: () => onNavigateSection('about'), icon: <FileText className="w-4 h-4 text-indigo-400" /> },
        { label: 'Jump to 3D Labs & Dynamic Island', action: () => onNavigateSection('sandbox'), icon: <Layers className="w-4 h-4 text-cyan-400" /> },
        { label: 'Jump to Skills Radar & Architecture', action: () => onNavigateSection('skills'), icon: <Activity className="w-4 h-4 text-emerald-400" /> },
        { label: 'Jump to Projects Vault', action: () => onNavigateSection('projects'), icon: <Package className="w-4 h-4 text-cyan-400" /> },
        { label: 'Jump to pub.dev Packages', action: () => onNavigateSection('packages'), icon: <Package className="w-4 h-4 text-rose-400" /> },
        { label: 'Jump to Career & Education Chronicle', action: () => onNavigateSection('experience'), icon: <Compass className="w-4 h-4 text-indigo-400" /> },
        { label: 'Jump to Engineering Logs / Blogs', action: () => onNavigateSection('logs'), icon: <FileText className="w-4 h-4 text-amber-400" /> },
        { label: 'Jump to Connect & Direct Channel', action: () => onNavigateSection('contact'), icon: <Compass className="w-4 h-4 text-cyan-400" /> },
      ],
    },
    {
      group: 'Theme & 3D Engine',
      items: [
        { label: 'Shader Palette: Cyber Cyan', action: () => onThemeChange('cyber'), icon: <Palette className="w-4 h-4 text-cyan-400" /> },
        { label: 'Shader Palette: Impeller Neon', action: () => onThemeChange('impeller'), icon: <Palette className="w-4 h-4 text-rose-400" /> },
        { label: 'Shader Palette: Matrix Core', action: () => onThemeChange('matrix'), icon: <Palette className="w-4 h-4 text-emerald-400" /> },
        { label: 'Toggle 3D Ambient Motion & Rotation', action: onToggleMotion, icon: <Activity className="w-4 h-4 text-indigo-400" /> },
        { label: 'Toggle Companion Drone (Bee)', action: () => onToggleBee?.(), icon: <span className="text-xs">🐝</span> },
      ],
    },
    {
      group: 'External Links',
      items: [
        {
          label: 'Open GitHub Profile (@govindtank)',
          action: () => window.open('https://github.com/govindtank', '_blank'),
          icon: <ExternalLink className="w-4 h-4 text-slate-300" />,
        },
        {
          label: 'Open LinkedIn Profile',
          action: () => window.open('https://www.linkedin.com/in/govindtank/', '_blank'),
          icon: <ExternalLink className="w-4 h-4 text-slate-300" />,
        },
        {
          label: 'Open Google Play Developer Portfolio',
          action: () => window.open('https://play.google.com/store/apps/details?id=com.govindtank.portfolio', '_blank'),
          icon: <ExternalLink className="w-4 h-4 text-slate-300" />,
        },
      ],
    },
  ];

  const filteredGroups = ACTIONS.map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      item.label.toLowerCase().includes(query.toLowerCase())
    ),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.96 }}
        className="w-full max-w-xl spatial-glass rounded-3xl border-white/20 shadow-2xl overflow-hidden"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, sections, themes, or links..."
            autoFocus
            className="flex-1 bg-transparent text-white font-mono-tech text-sm placeholder-slate-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command List */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4 font-mono-tech text-xs">
          {filteredGroups.map((group) => (
            <div key={group.group}>
              <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                {group.group}
              </div>
              <div className="space-y-1 mt-1">
                {group.items.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      item.action();
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-cyan-500/15 text-slate-300 hover:text-cyan-200 transition-colors group text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="p-1.5 rounded-lg bg-white/5 group-hover:bg-cyan-500/20 transition-colors">
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          ))}

          {filteredGroups.length === 0 && (
            <div className="py-8 text-center text-slate-500">
              No matching commands found for &quot;{query}&quot;.
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 border-t border-white/10 bg-black/40 flex items-center justify-between text-[11px] font-mono-tech text-slate-500">
          <span>Navigate with mouse or enter</span>
          <span>ESC to close</span>
        </div>
      </motion.div>
    </div>
  );
}
