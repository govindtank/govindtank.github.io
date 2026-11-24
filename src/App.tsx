/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import LiveLabs from './components/LiveLabs';
import Skills from './components/Skills';
import Experience from './components/Experience';
import Portfolio from './components/Portfolio';
import Packages from './components/Packages';
import GitHubActivity from './components/GitHubActivity';
import BlogAndTestimonials from './components/BlogAndTestimonials';
import BlogDetailModal from './components/BlogDetailModal';
import Contact from './components/Contact';
import Footer from './components/Footer';
import ParticleBackground from './components/ParticleBackground';
import CommandPalette from './components/CommandPalette';
import SystemMascot from './components/SystemMascot';
import MechanicalFly from './components/MechanicalFly';
import { BlogPost, ThemeMode } from './types';

export default function App() {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const location = useLocation();

  // Arena-Inspired Reactive Theme Engine & 3D Settings
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('gt_theme') as ThemeMode) || 'cyber';
  });
  const [motionEnabled, setMotionEnabled] = useState(true);
  const [exploded, setExploded] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [beeEnabled, setBeeEnabled] = useState<boolean>(() => {
    return localStorage.getItem('gt_bee_enabled') === 'true'; // OFF by default
  });

  useEffect(() => {
    localStorage.setItem('gt_bee_enabled', String(beeEnabled));
  }, [beeEnabled]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gt_theme', theme);
  }, [theme]);

  // Section observer for Dynamic Island active pill
  useEffect(() => {
    const sections = [
      'hero',
      'about',
      'sandbox',
      'skills',
      'projects',
      'packages',
      'experience',
      'logs',
      'contact',
    ];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-40% 0px -40% 0px' }
    );

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Handle hash navigation & scroll restoration
  useEffect(() => {
    const savedPos = sessionStorage.getItem('home_scroll_pos');
    if (location.hash) {
      const id = location.hash.replace('#', '');
      setTimeout(() => {
        const target = document.getElementById(id);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }, 200);
    } else if (savedPos) {
      setTimeout(() => {
        window.scrollTo({ top: Number(savedPos), behavior: 'smooth' });
        sessionStorage.removeItem('home_scroll_pos');
      }, 150);
    }
  }, [location.hash, location.pathname]);

  const handlePostSelect = (post: BlogPost) => {
    setScrollPosition(window.scrollY);
    setSelectedPost(post);
    document.body.style.overflow = 'hidden';
  };

  const handleCloseModal = () => {
    setSelectedPost(null);
    document.body.style.overflow = 'unset';
    setTimeout(() => {
      window.scrollTo({ top: scrollPosition, behavior: 'smooth' });
    }, 100);
  };

  const handleNavigateSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen relative bg-[#050811] text-slate-100 overflow-x-clip selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 3D Particle Starfield */}
      <ParticleBackground theme={theme} motionEnabled={motionEnabled} />

      {/* Playful Interactive Mascots */}
      {beeEnabled && <MechanicalFly />}
      <SystemMascot />

      {/* Dynamic Island Floating Navigation */}
      <Navbar
        activeSection={activeSection}
        theme={theme}
        onThemeChange={setTheme}
        motionEnabled={motionEnabled}
        onToggleMotion={() => setMotionEnabled((prev) => !prev)}
        onOpenCommand={() => setCommandOpen(true)}
        beeEnabled={beeEnabled}
        onToggleBee={() => setBeeEnabled((prev) => !prev)}
      />

      {/* Main Sections */}
      <main className="relative z-10">
        <Hero
          theme={theme}
          motionEnabled={motionEnabled}
          exploded={exploded}
          onToggleExplode={() => setExploded((prev) => !prev)}
        />
        <About />
        <LiveLabs />
        <Skills />
        <Portfolio />
        <Packages />
        <GitHubActivity />
        <Experience />
        <BlogAndTestimonials onPostSelect={handlePostSelect} />
        <Contact />
      </main>

      <Footer />

      {/* Modals & Command Deck */}
      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onNavigateSection={handleNavigateSection}
        onToggleExplode={() => setExploded((prev) => !prev)}
        onToggleMotion={() => setMotionEnabled((prev) => !prev)}
        onThemeChange={setTheme}
        onToggleBee={() => setBeeEnabled((prev) => !prev)}
      />

      <BlogDetailModal selectedPost={selectedPost} onClose={handleCloseModal} />
    </div>
  );
}
