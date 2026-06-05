#!/usr/bin/env node

// Generate RSS 2.0 feed from blog metadata — runs as postbuild step
// Reads src/data/blogs/index.json, writes dist/rss.xml

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const SITE_URL = 'https://govindtank.github.io';
const SITE_TITLE = "Govind Tank's Tech Log";
const SITE_DESC = 'Architecture, mobile engineering, AI systems, and technical deep dives.';

// Read blog index
const indexPath = resolve(root, 'src/data/blogs/index.json');
if (!existsSync(indexPath)) {
  console.error('❌ Blog index not found at', indexPath);
  process.exit(1);
}

const posts = JSON.parse(readFileSync(indexPath, 'utf-8'));

// Read content for full-content RSS (optional — just include excerpts for feed size sanity)
// We only use excerpts in the RSS description

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
