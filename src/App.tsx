/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Skills from './components/Skills';
import Experience from './components/Experience';
import Portfolio from './components/Portfolio';
import GitHubActivity from './components/GitHubActivity';
import BlogAndTestimonials from './components/BlogAndTestimonials';
import BlogDetailModal from './components/BlogDetailModal';
import Contact from './components/Contact';
import Footer from './components/Footer';
import InteractiveBackground from './components/InteractiveBackground';
import SystemMascot from './components/SystemMascot';
import { BlogPost } from './types';

export default function App() {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const location = useLocation();

  useEffect(() => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e: any) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (!targetId) return;
        const target = document.querySelector(targetId);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth'
          });
        }
      });
    });
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

  return (
    <div className="min-h-screen relative bg-slate-950 text-slate-100">
      <InteractiveBackground />
      <SystemMascot />
      <Navbar />
      <main className="relative z-10">
        <Hero />
        <About />
        <Skills />
        <Experience />
        <Portfolio />
        <GitHubActivity />
        <BlogAndTestimonials onPostSelect={handlePostSelect} />
        <Contact />
      </main>
      <Footer />
      <BlogDetailModal selectedPost={selectedPost} onClose={handleCloseModal} />
    </div>
  );
}
