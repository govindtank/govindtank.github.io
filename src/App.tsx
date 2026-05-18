/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Skills from './components/Skills';
import Experience from './components/Experience';
import Portfolio from './components/Portfolio';
import BlogAndTestimonials from './components/BlogAndTestimonials';
import BlogDetail from './components/BlogDetail';
import Contact from './components/Contact';
import Footer from './components/Footer';
import InteractiveBackground from './components/InteractiveBackground';
import SystemMascot from './components/SystemMascot';
import { BlogPost } from './types';

export default function App() {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

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

  const handlePostSelect = (post: BlogPost) => {
    setSelectedPost(post);
    setTimeout(() => {
      document.getElementById('blog-detail')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleBackFromDetail = () => {
    setSelectedPost(null);
    setTimeout(() => {
      document.getElementById('blog')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen relative">
      <InteractiveBackground />
      <SystemMascot />
      <Navbar />
      <main className="relative z-10">
        <Hero />
        <About />
        <Skills />
        <Experience />
        <Portfolio />
        <BlogAndTestimonials onPostSelect={handlePostSelect} />
        <BlogDetail selectedPost={selectedPost} onBack={handleBackFromDetail} />
        <Contact />
        </main>
      <Footer />
    </div>
  );
}

