#!/usr/bin/env node

// Generate sitemap.xml from blog metadata — runs as postbuild step
// Reads src/data/blogs/index.json, writes dist/sitemap.xml

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const SITE_URL = 'https://govindtank.github.io';

// Read blog index
const indexPath = resolve(root, 'src/data/blogs/index.json');
if (!existsSync(indexPath)) {
  console.error('❌ Blog index not found at', indexPath);
  process.exit(1);
}

const posts = JSON.parse(readFileSync(indexPath, 'utf-8'));

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
