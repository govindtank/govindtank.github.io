/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import Hero from './components/Hero';
import About from './components/About';
import Skills from './components/Skills';
import Experience from './components/Experience';
import Portfolio from './components/Portfolio';
import GitHubActivity from './components/GitHubActivity';
import BlogAndTestimonials from './components/BlogAndTestimonials';
import Contact from './components/Contact';

export default function App() {
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
    <>
      <Hero />
      <About />
      <Skills />
      <Experience />
      <Portfolio />
      <GitHubActivity />
      <BlogAndTestimonials />
      <Contact />
    </>
  );
}
