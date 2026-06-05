#!/usr/bin/env node

// Generate RSS 2.0 feed from .md blog frontmatter — runs as postbuild step
// Reads src/content/blog/*.md directly (no index.json dependency)

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const SITE_URL = 'https://govindtank.github.io';
const SITE_TITLE = "Govind Tank's Tech Log";
const SITE_DESC = 'Architecture, mobile engineering, AI systems, and technical deep dives.';

// Read all .md files and extract frontmatter
const contentDir = resolve(root, 'src/content/blog');
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
    slug,
  };
}).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

const items = posts
  .map((post) => {
    const pubDate = new Date(post.date).toUTCString();
    const postUrl = `${SITE_URL}/blog/${encodeURIComponent(post.slug)}`;

    return `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${post.excerpt}]]></description>
      <category>${post.tag}</category>
    </item>`;
  })
  .join('\n');

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${SITE_TITLE}</title>
    <link>${SITE_URL}</link>
    <description>${SITE_DESC}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

const outPath = resolve(root, 'dist/rss.xml');
writeFileSync(outPath, rss, 'utf-8');
console.log(`✅ RSS feed generated: ${outPath} (${posts.length} items)`);
