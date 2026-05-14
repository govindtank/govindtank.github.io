/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
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

export default function App() {
  // Smooth scroll behavior
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
        <BlogAndTestimonials />
        <Contact />
        </main>
      <Footer />
    </div>
  );
}

