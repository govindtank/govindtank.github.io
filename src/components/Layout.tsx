import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import ParticleBackground from './ParticleBackground';
import SystemMascot from './SystemMascot';
import MechanicalFly from './MechanicalFly';
import Navbar from './Navbar';
import Footer from './Footer';
import CommandPalette from './CommandPalette';
import { ThemeMode } from '../types';

export default function Layout() {
  const navigate = useNavigate();

  // Reactive Theme Engine & 3D Settings (persisted across subpages)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('gt_theme') as ThemeMode) || 'cyber';
  });
  const [motionEnabled, setMotionEnabled] = useState(true);
  const [commandOpen, setCommandOpen] = useState(false);
  const [beeEnabled, setBeeEnabled] = useState<boolean>(() => {
    return localStorage.getItem('gt_bee_enabled') === 'true'; // OFF by default
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gt_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('gt_bee_enabled', String(beeEnabled));
  }, [beeEnabled]);

  const handleNavigateSection = (id: string) => {
    navigate(`/#${id}`);
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  return (
    <div className="min-h-screen relative bg-[#050811] text-slate-100 overflow-x-clip selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 3D Particle Starfield with Reactive Hover & Parallax */}
      <ParticleBackground theme={theme} motionEnabled={motionEnabled} />

      {/* Playful Interactive Mascots (Companion Drone OFF by default) */}
      {beeEnabled && <MechanicalFly />}
      <SystemMascot />

      {/* Dynamic Island Floating Navigation */}
      <Navbar
        activeSection="logs"
        theme={theme}
        onThemeChange={setTheme}
        motionEnabled={motionEnabled}
        onToggleMotion={() => setMotionEnabled((prev) => !prev)}
        onOpenCommand={() => setCommandOpen(true)}
        beeEnabled={beeEnabled}
        onToggleBee={() => setBeeEnabled((prev) => !prev)}
      />

      <main className="relative z-10 pt-20">
        <Outlet />
      </main>

      <Footer />

      {/* Command Deck */}
      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onNavigateSection={handleNavigateSection}
        onToggleExplode={() => {}}
        onToggleMotion={() => setMotionEnabled((prev) => !prev)}
        onThemeChange={setTheme}
        onToggleBee={() => setBeeEnabled((prev) => !prev)}
      />
    </div>
  );
}
