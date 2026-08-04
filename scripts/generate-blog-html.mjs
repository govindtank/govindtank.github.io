#!/usr/bin/env node

// Generate static HTML for each blog post — runs as postbuild step
// Creates dist/blog/{slug}/index.html with correct OG/Twitter meta tags
// So LinkedIn/Twitter crawlers see the right content without JS execution

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const SITE_URL = 'https://govindtank.github.io';
const SITE_TITLE = "Govind Tank | Senior Lead Architect & Android Expert";
const DEFAULT_IMAGE = `${SITE_URL}/profile_one.png`;

const contentDir = resolve(root, 'src/content/blog');
const distBlogDir = resolve(root, 'dist/blog');

const files = readdirSync(contentDir).filter(f => f.endsWith('.md')).sort();

const posts = files.map((fname) => {
  const raw = readFileSync(resolve(contentDir, fname), 'utf-8');
  const { data } = matter(raw);
  const slug = fname.replace('.md', '');
  return {
    title: data.title || '',
    excerpt: data.excerpt || '',
    date: data.date || '',
    tag: Array.isArray(data.tags) && data.tags.length > 0 ? data.tags[0] : (data.tag || ''),
    coverImage: data.coverImage || DEFAULT_IMAGE,
    slug,
  };
}).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

// Read base index.html (already built by Vite)
const baseHtml = readFileSync(resolve(root, 'dist/index.html'), 'utf-8');

// Ensure dist/blog exists
if (!existsSync(distBlogDir)) {
  mkdirSync(distBlogDir, { recursive: true });
}

posts.forEach(post => {
  const postUrl = `${SITE_URL}/blog/${encodeURIComponent(post.slug)}`;
  const fullTitle = post.title.includes('Govind Tank') ? post.title : `${post.title} | Govind Tank`;
  const ogImage = post.coverImage.startsWith('http') ? post.coverImage : `${SITE_URL}${post.coverImage}`;

  // Build meta tags for this post
  const metaTags = `
    <title>${fullTitle}</title>
    <meta name="description" content="${post.excerpt.replace(/"/g, '"')}" />
    <meta property="og:title" content="${fullTitle.replace(/"/g, '"')}" />
    <meta property="og:description" content="${post.excerpt.replace(/"/g, '"')}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:url" content="${postUrl}" />
    <meta property="og:type" content="article" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${fullTitle.replace(/"/g, '"')}" />
    <meta name="twitter:description" content="${post.excerpt.replace(/"/g, '"')}" />
    <meta name="twitter:image" content="${ogImage}" />
    <link rel="canonical" href="${postUrl}" />`.trim();

  // Targeted replacement: find the section between SEO Meta Tags comment and Structured Data comment
  const seoStart = baseHtml.indexOf('<!-- SEO Meta Tags -->');
  const structuredStart = baseHtml.indexOf('<!-- Structured Data (JSON-LD) -->');
  
  if (seoStart === -1 || structuredStart === -1) {
    console.warn(`  ⚠ Could not find marker comments for ${post.slug}, skipping`);
    return;
  }

  // Find the end of the line containing SEO Meta Tags
  const seoEnd = baseHtml.indexOf('\n', seoStart);
  if (seoEnd === -1) return;

  const beforeSeo = baseHtml.slice(0, seoEnd + 1);
  const afterStructured = baseHtml.slice(structuredStart);

  const postHtml = beforeSeo + '\n' + metaTags + '\n\n    ' + afterStructured;

  const slugDir = resolve(distBlogDir, encodeURIComponent(post.slug));
  if (!existsSync(slugDir)) {
    mkdirSync(slugDir, { recursive: true });
  }
  writeFileSync(resolve(slugDir, 'index.html'), postHtml, 'utf-8');
  console.log(`  ✓ Generated ${post.slug}/index.html`);
});

console.log(`✅ Static blog HTML generated for ${posts.length} posts in dist/blog/`);