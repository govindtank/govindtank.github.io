/**
 * Custom hook for dynamic document title, description, and OpenGraph / Twitter meta tags.
 */

import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

export function useSEO({
  title = "Govind Tank | Senior Lead Architect & Android Expert",
  description = "Senior Lead Architect & Android Expert specializing in high-scale mobile systems, Flutter, Kotlin Multiplatform, and AI-augmented engineering.",
  image = "https://govindtank.github.io/profile_one.png",
  url = window.location.href,
  type = "website"
}: SEOProps = {}) {
  useEffect(() => {
    // 1. Update Title
    const fullTitle = title.includes("Govind Tank") ? title : `${title} | Govind Tank`;
    document.title = fullTitle;

    // 2. Helper to set/update meta tag
    const setMetaTag = (selector: string, attrName: string, attrVal: string, content: string) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 3. Helper for link tags (canonical)
    const setCanonicalLink = (href: string) => {
      let link: HTMLLinkElement | null = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    };

    // Meta Description
    setMetaTag('meta[name="description"]', 'name', 'description', description);

    // OpenGraph Tags
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', image);
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', url);
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', type);

    // Twitter Card Tags
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', image);

    // Canonical URL
    setCanonicalLink(url);
  }, [title, description, image, url, type]);
}
