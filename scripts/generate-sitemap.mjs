#!/usr/bin/env node

// Generate sitemap.xml from .md blog frontmatter — runs as postbuild step
// Reads src/content/blog/*.md directly (no index.json dependency)

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const SITE_URL = 'https://govindtank.github.io';

// Read all .md files and extract frontmatter
const contentDir = resolve(root, 'src/content/blog');
const files = readdirSync(contentDir).filter(f => f.endsWith('.md')).sort();

const posts = files.map((fname) => {
  const raw = readFileSync(resolve(contentDir, fname), 'utf-8');
  const { data } = matter(raw);
  const slug = fname.replace('.md', '');
  return {
    slug,
    date: data.date || '',
  };
}).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

const urls = [
  `  <url>\n    <loc>${SITE_URL}/</loc>\n    <priority>1.0</priority>\n  </url>`,
  `  <url>\n    <loc>${SITE_URL}/blog</loc>\n    <priority>0.9</priority>\n  </url>`,
  ...posts.map((post) => {
    const pubDate = new Date(post.date).toISOString();
    return `  <url>\n    <loc>${SITE_URL}/blog/${encodeURIComponent(post.slug)}</loc>\n    <lastmod>${pubDate}</lastmod>\n    <priority>0.7</priority>\n  </url>`;
  }),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

const outPath = resolve(root, 'dist/sitemap.xml');
writeFileSync(outPath, sitemap, 'utf-8');
console.log(`✅ Sitemap generated: ${outPath} (${urls.length} URLs)`);
