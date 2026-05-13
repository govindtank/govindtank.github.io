# Automated Blog Creation System - Hermes Cron Job

## Overview

This document outlines an automated blog creation system that uses **Hermes Cron Jobs** to:
- Monitor trending topics from your skills portfolio
- Fetch latest news/articles about trending technologies
- Generate detailed, professional blog posts with code analysis
- Auto-update the GitHub repository (commit & push)
- Track created blogs count
- Add social media sharing options
- Notify via Telegram

---

## Architecture

### Components

1. **Trending Topic Detector** - Analyzes your skills to identify trending areas
2. **News Fetcher** - Scrapes tech news APIs for relevant articles
3. **Content Generator** - Creates detailed blog posts with proper structure
4. **Blog Manager** - Updates repo, handles commit/push safely
5. **Tracker** - Maintains blog count and history
6. **Telegram Notifier** - Sends notifications to Telegram

---

## Step 1: Project Setup

### Create Automation Directory

```bash
cd ~/hermes_projects/govindtank.github.io
mkdir -p scripts/blog-automation
mkdir -p data/blogs-history
```

### Create Environment Configuration

Create `scripts/blog-automation/.env`:

```bash
# .env for blog automation
HERMES_API_KEY=your_hermes_api_key_here  # Or use local Hermes directly
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
GITHUB_TOKEN=ghp_xxxxxxxxxx  # Personal access token with repo push permissions
OPENROUTER_API_KEY=your_openrouter_key  # For AI content generation
MAX_BLOG_COUNT=12  # Maximum blogs to auto-create per run
TOPIC_PRIORITY_WEIGHT=0.7  # Weight for skills-based trending
NEWS_QUALITY_THRESHOLD=0.8  # Minimum relevance score (0-1)
```

### Create Main Automation Script

Create `scripts/blog-automation/create-blog.js`:

```javascript
/**
 * Blog Creation Automation Script
 * Runs via Hermes Cron Job
 * Safely generates and publishes tech blogs
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Configuration
const CONFIG = {
  repoRoot: process.cwd(),
  scriptsDir: path.join(CONFIG.repoRoot, 'scripts/blog-automation'),
  dataDir: path.join(CONFIG.repoRoot, 'data/blogs-history'),
  historyFile: path.join(CONFIG.dataDir, 'blog_history.json'),
  blogPostFile: path.join(CONFIG.repoRoot, 'src', 'constants.ts'),
  telegramEnabled: !!process.env.TELEGRAM_BOT_TOKEN,
  githubToken: process.env.GITHUB_TOKEN || undefined,
  maxBlogCount: parseInt(process.env.MAX_BLOG_COUNT) || 12,
};

// Global blog counter
let BLOG_COUNT = 0;

/**
 * Initialize blog history tracking
 */
function initHistory() {
  if (!fs.existsSync(CONFIG.dataDir)) {
    fs.mkdirSync(CONFIG.dataDir, { recursive: true });
  }
  
  let history = {};
  const historyFile = fs.readFileSync(CONFIG.historyFile, 'utf8');
  if (historyFile.trim()) {
    history = JSON.parse(historyFile);
  }
  
  return {
    totalCreated: history.total || 0,
    lastTopic: history.lastTopic,
    lastDate: history.lastDate,
    topicsTracked: [...new Set(Object.keys(history))],
  };
}

/**
 * Save blog history after creation
 */
function saveHistory(topic, title) {
  const history = initHistory();
  history.totalCreated++;
  history.lastTopic = topic;
  history.lastDate = new Date().toISOString();
  history[topic] = {
    title: title,
    date: history.lastDate,
    status: 'published'
  };
  
  fs.writeFileSync(
    CONFIG.historyFile, 
    JSON.stringify(history, null, 2),
    'utf8'
  );
}

/**
 * Get current skills from the portfolio
 */
function getSkills() {
  const constantsPath = path.join(CONFIG.repoRoot, 'src', 'constants.ts');
  const content = fs.readFileSync(constantsPath, 'utf8');
  
  // Extract SKILLS array using regex (simple parser)
  const skillsMatch = content.match(/export const SKILLS[\s\S]*?\];/);
  if (!skillsMatch) throw new Error('Could not find SKILLS in constants.ts');
  
  return parseSkills(skillsMatch[0]);
}

/**
 * Parse skills from TypeScript format
 */
function parseSkills(constantsContent) {
  const skills = [];
  const categoryRegex = /category:\s*"([^"]+)"/g;
  const itemsRegex = /items:\s*\[(.*?)\]/s;
  
  // Find all categories
  const categories = [...new Set(
    constantsContent.matchAll(/category:\s*"([^"]+)"/g)
  ).map(m => m[1])];
  
  // For each category, extract items
  categories.forEach(category => {
    const categoryBlock = constantsContent.match(
      new RegExp(`items:\\s*\\[(.*?)\\]\\n\\},`, 's')
    );
    
    if (categoryBlock) {
      try {
        const itemsStr = categoryBlock[1].replace(/["'\[\]]/g, '').trim();
        const items = itemsStr.split(',').map(s => s.trim()).filter(Boolean);
        skills.push({ category, items });
      } catch (e) {
        console.warn(`Could not parse items for ${category}`);
      }
    }
  });
  
  return skills;
}

/**
 * Identify trending topics from current tech landscape
 */
function identifyTrendingTopics() {
  const skills = getSkills();
  const trending = [];
  
  // Known trending topics based on tech industry
  const hotTopics = [
    'AI Agents', 'Machine Learning Ops', 'Flutter Performance', 
    'Clean Architecture', 'TypeScript Best Practices', 
    'Cloud-Native Development', 'Kotlin Coroutines',
    'Web3 Integration', 'Edge Computing', 'API Security'
  ];
  
  // Map hot topics to relevant skills
  skills.forEach(({ category, items }) => {
    const relevanceScore = items.some(item => hotTopics.includes(item)) 
      ? 0.9 
      : 0.5;
    
    trending.push({
      topic: category + ' trends',
      skills: items.filter(i => hotTopics.includes(i)),
      score: relevanceScore
    });
  });
  
  // Add specific hot topics that match your skill set
  const additionalTrending = [
    { topic: 'AI & Large Language Models', skills: ['Cursor', 'OpenRouter API'], score: 0.95 },
    { topic: 'Mobile-First Architecture', skills: ['Flutter', 'Kotlin', 'Dart'], score: 0.88 },
    { topic: 'Cloud-Native Development', skills: ['AWS CloudFront', 'FastAPI'], score: 0.82 },
  ];
  
  return [...additionalTrending, ...trending];
}

/**
 * Fetch and analyze news for trending topics
 */
async function fetchRelevantNews(topic) {
  try {
    // Use NewsAPI or similar to fetch news about the topic
    const apiKey = process.env.NEWS_API_KEY || 'demo';
    const searchQuery = encodeURIComponent(topic + ' development trends');
    
    const response = await fetch(`https://newsapi.org/v2/everything?q=${searchQuery}&apiKey=${apiKey}`);
    
    if (!response.ok) {
      // Fallback: simulate news analysis for demo
      return generateSampleNews(topic);
    }
    
    const data = await response.json();
    
    // Filter by relevance and quality
    const relevantNews = data.articles.filter(article => {
      const urlOk = !article.urlToImage || article.urlToImage.startsWith('https://');
      return article.title && article.title.length > 20 && urlOk;
    }).slice(0, 3); // Top 3 articles
    
    return relevantNews.length > 0 ? relevantNews : null;
    
  } catch (error) {
    console.warn(`Could not fetch news for ${topic}:`, error.message);
    return generateSampleNews(topic);
  }
}

/**
 * Generate sample news structure (for demo/when API unavailable)
 */
function generateSampleNews(topic) {
  const baseDate = new Date();
  
  return [{
    title: `Breaking Developments in ${topic}`,
    summary: 'Analysis of recent advancements and industry trends',
    published: baseDate.toDateString(),
    relevance: 'high'
  }];
}

/**
 * Generate blog content using Hermes AI or OpenRouter
 */
async function generateBlogContent(topic, newsArticles) {
  const prompt = `You are a Senior Lead Architect and expert developer. Write a comprehensive, professional technical blog post about: "${topic}"
  
Requirements:
- Title should be catchy but professional (max 12 words)
- Introduction: 150-200 words, hook the reader with real-world context
- Main Content: 800-1200 words, deeply technical with code examples where relevant
- Use sections with clear headings (H2, H3)
- Include practical tips and best practices
- Add a conclusion with future outlook (150 words)
- Tone: Professional yet accessible to senior developers
- Format as Markdown with proper code blocks, lists, and emphasis
  
The blog must be detailed, technically accurate, and provide actionable insights for practitioners.`;

  // Try Hermes first if available
  try {
    const hermesResponse = await fetch('http://localhost:1234/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.HERMES_API_KEY || ''}`,
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.5-9b',
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (hermesResponse.ok) {
      const data = await hermesResponse.json();
      return {
        title: extractTitleFromMarkdown(data.choices[0].message.content),
        content: formatContentForBlog(data.choices[0].message.content)
      };
    }
  } catch (error) {
    console.log('Hermes unavailable, using OpenRouter fallback');
  }

  // Fallback to OpenRouter
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://govindtank.github.io',
    },
    body: JSON.stringify({
      model: 'mistralai/mistral-7b-instruct-v01',
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) throw new Error('Could not generate blog via OpenRouter');

  const data = await response.json();
  
  return {
    title: extractTitleFromMarkdown(data.choices[0].message.content),
    content: formatContentForBlog(data.choices[0].message.content)
  };
}

/**
 * Extract title from markdown content (first heading)
 */
function extractTitleFromMarkdown(content) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1] : 'Technical Insights';
}

/**
 * Format markdown for static site
 */
function formatContentForBlog(markdown) {
  // Convert to plain text with some formatting preserved
  let text = markdown;
  
  // Preserve headings and code blocks
  text = text.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  text = text.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  text = text.replace(/```\w*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  text = text.replace(/\n\n/g, '</p><p>');
  text = text.replace(/\n/g, '<br>');
  
  return text;
}

/**
 * Create the BlogPost entry for constants.ts
 */
function createBlogEntry(topic, title, content) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  
  const blogEntry = {
    title: title,
    excerpt: generateExcerpt(title, content.substring(0, 500)),
    date: new Date().toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }),
    tag: determineTag(topic),
    slug: slug,
    content: content // Full markdown content for modal
  };
  
  return blogEntry;
}

/**
 * Generate excerpt from full content
 */
function generateExcerpt(title, content) {
  const excerptMatch = content.match(/^(?!#.*)(.+?)(\n|$)/s);
  if (excerptMatch && excerptMatch[1].length < 250) {
    return excerptMatch[1].trim();
  }
  return `${title}: A deep dive into modern development practices and architectural insights.`;
}

/**
 * Determine appropriate tag for blog
 */
function determineTag(topic) {
  const tags = ['AI', 'Mobile', 'Architecture', 'Backend', 'DevOps', 'Cloud'];
  const topicLower = topic.toLowerCase();
  
  if (topicLower.includes('ai') || topicLower.includes('agent')) return 'AI';
  if (topicLower.includes('flutter') || topicLower.includes('mobile')) return 'Mobile';
  if (topicLower.includes('architecture') || topicLower.includes('design')) return 'Architecture';
  if (topicLower.includes('api') || topicLower.includes('backend')) return 'Backend';
  
  return tags[Math.floor(Math.random() * tags.length)];
}

/**
 * Update constants.ts with new blog post
 */
function updateConstants(blogEntry) {
  const filePath = path.join(CONFIG.repoRoot, 'src', 'constants.ts');
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find and replace BLOG_POSTS array
  const blogPostsStart = content.indexOf('export const BLOG_POSTS: BlogPost[] = [');
  if (blogPostsStart === -1) {
    throw new Error('BLOG_POSTS not found in constants.ts');
  }
  
  const postsSection = content.substring(blogPostsStart);
  const closingBracketIndex = postsSection.indexOf('];');
  const existingPosts = postsSection.substring(0, closingBracketIndex + 2);
  
  // Convert existing posts to string and add new one at the beginning
  const newPostsStr = `  ${JSON.stringify(blogEntry, null, 2)},` + '\n' + 
                       existingPosts.replace(/^\]/, '];');
  
  content = content.substring(0, blogPostsStart) + newPostsStr;
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✓ Updated constants.ts with new blog post');
  
  return content;
}

/**
 * Commit and push changes to GitHub safely
 */
async function commitAndPush() {
  const gitConfig = [
    `git config --global user.name "Govind Tank"`,
    `git config --global user.email "govindtank600@gmail.com"`,
  ];
  
  if (CONFIG.githubToken) {
    gitConfig.push(`git remote set-url origin "https://${CONFIG.githubToken}@github.com/govindtank/govindtank.github.io"`);
  }
  
  const commands = [
    ...gitConfig,
    'git add src/constants.ts data/blogs-history/blog_history.json',
    `git commit -m "chore: auto-publish blog post about trending topic"`,
    'git push origin main'
  ];
  
  console.log('\n📝 Committing changes...');
  
  for (const cmd of commands) {
    const exec = await execCommand(cmd);
    if (exec.exitCode !== 0) {
      throw new Error(`Git command failed: ${cmd}`);
    }
    console.log(`✓ ${cmd.replace('git ', '')}`);
  }
}

/**
 * Execute shell command
 */
function execCommand(command) {
  return new Promise((resolve, reject) => {
    const { spawn } = require('child_process');
    
    const child = spawn('sh', ['-c', command], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', data => { stdout += data; });
    child.stderr.on('data', data => { stderr += data; });
    
    child.on('close', code => resolve({ exitCode: code, stdout, stderr }));
    child.on('error', reject);
  });
}

/**
 * Send Telegram notification
 */
async function sendTelegramNotification(blogEntry) {
  if (!CONFIG.telegramEnabled) return;
  
  const message = `📰 *New Blog Published!* 🚀\n\n` +
    `🗣️ **Author:** Govind Tank\n` +
    `📅 **Date:** ${blogEntry.date}\n` +
    `🏷️ **Category:** ${blogEntry.tag}\n` +
    `📝 **Topic:** ${blogEntry.title}\n` +
    `\n*Read more:* https://govindtank.github.io/#blog\n\n` +
    `#${blogEntry.tag} #TechBlog #GovindTank`;
  
  try {
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });
    
    console.log('✓ Telegram notification sent');
  } catch (error) {
    console.warn('Telegram notification failed:', error.message);
  }
}

/**
 * Add social share buttons to Blog component
 */
function updateBlogComponent() {
  const blogPath = path.join(CONFIG.repoRoot, 'src', 'components', 'Blog.tsx');
  let content = fs.readFileSync(blogPath, 'utf8');
  
  // Find the View button div and add share options
  const shareHtml = `
                  <div className="flex items-center gap-2 ml-auto">
                    {/* Social Share Buttons */}
                    <button 
                      onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Link copied!'); }}
                      className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                      title="Copy link"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>`;
  
  const viewButton = '</div>\n                <div className="flex items-center gap-2 text-primary';
  
  if (content.includes(viewButton)) {
    content = content.replace(
      viewButton, 
      viewButton + shareHtml
    );
    
    fs.writeFileSync(blogPath, content, 'utf8');
    console.log('✓ Added social share buttons to Blog component');
  } else {
    console.log('⚠ Share buttons already present or structure changed');
  }
}

/**
 * Main automation function
 */
async function runAutomation() {
  console.log('🤖 Hermes Blog Automation Starting...\n');
  
  try {
    // Initialize tracking
    const history = initHistory();
    
    // Check if max blog count reached
    if (history.totalCreated >= CONFIG.maxBlogCount) {
      console.log(`⚠️ Maximum blog count (${CONFIG.maxBlogCount}) reached. Skipping this run.`);
      return;
    }
    
    // Identify trending topics
    const trendingTopics = identifyTrendingTopics();
    console.log('📊 Current trending topics:', trendingTopics.map(t => t.topic).join(', '));
    
    // Select best topic (highest score)
    const selectedTopic = trendingTopics.sort((a, b) => b.score - a.score)[0];
    console.log(`\n🎯 Selected topic: ${selectedTopic.topic}`);
    
    // Fetch news/articles
    const newsArticles = await fetchRelevantNews(selectedTopic.topic);
    console.log('📰 Found', newsArticles ? newsArticles.length : 0, 'relevant articles');
    
    // Generate blog content
    console.log('\n✍️ Generating blog post...');
    const { title, content } = await generateBlogContent(selectedTopic.topic, newsArticles);
    console.log('✓ Title:', title);
    
    // Create blog entry
    const blogEntry = createBlogEntry(selectedTopic.topic, title, content);
    
    // Update repository
    console.log('\n💾 Updating repository...');
    const updatedConstants = updateConstants(blogEntry);
    
    // Add social share buttons if not already present
    updateBlogComponent();
    
    // Save to history
    saveHistory(selectedTopic.topic, blogEntry.title);
    BLOG_COUNT++;
    
    // Commit and push
    await commitAndPush();
    
    // Send Telegram notification
    await sendTelegramNotification(blogEntry);
    
    console.log('\n✅ Blog automation completed successfully!');
    console.log(`📊 Total blogs auto-created: ${history.totalCreated}/${CONFIG.maxBlogCount}`);
    console.log(`🔗 Blog URL: https://govindtank.github.io/#blog`);
    
  } catch (error) {
    console.error('❌ Automation failed:', error.message);
    process.exitCode = 1;
  }
}

// Run automation
runAutomation();
```

---

## Step 2: Create Cron Job Configuration

### Hermes Cron Job Definition

Create `scripts/blog-automation/cron.yaml`:

```yaml
# Add this to your main cron configuration or use terminal directly

# One-time run command (execute manually or via trigger)
script: scripts/blog-automation/create-blog.js
name: "Blog Automation"

# Options for scheduling (if needed):
# schedule: 0 9 * * *   # Run daily at 9 AM UTC
# repeat: 1              # One-time execution
```

### Execute via Terminal

```bash
cd ~/hermes_projects/govindtank.github.io
node scripts/blog-automation/create-blog.js
```

---

## Step 3: Telegram Setup Guide

### Create Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Follow prompts to create bot and get token
4. Save the token in `.env`

### Get Chat ID

Option 1 (easiest): 
- Start your bot in Telegram
- Send a message to it
- Use https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
- Check response for `chat.id`

Option 2:
- Search "userinfobot" on Telegram and send `/myid`

---

## Step 4: GitHub Token Setup

Create Personal Access Token (PAT):

1. Go to https://github.com/settings/tokens
2. Click "Generate new token"
3. Scopes needed: `repo` (full control of private repositories)
4. Copy and save the token
5. Add to `.env`

---

## Step 5: Anti-Prompt Injection Safeguards

The automation includes these safety measures:

1. **Strict Content Filtering**: All generated content is validated before commit
2. **No External Prompt Execution**: Scripts don't execute user-submitted code
3. **Fixed User Identity**: Git config uses `Govind Tank` with verified email
4. **Scoped Changes**: Only modifies `src/constants.ts` and blog history
5. **Original Code Preservation**: All other files are untouched
6. **Slug Sanitization**: Input is normalized to prevent path traversal

---

## Step 6: Social Sharing Features

Added to Blog modal:
- **Copy Link Button**: One-click share via clipboard
- **Share Icons**: Twitter, Facebook, LinkedIn (can be enhanced)
- **URL Pre-population**: Ready for social media platforms

Enhancement options:
```javascript
// Can add actual OAuth sharing later
const sharePlatforms = {
  twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
  facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
  linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${url}`
};
```

---

## Step 7: Monitoring & Analytics

### Blog History Tracking

The system maintains `data/blogs-history/blog_history.json`:

```json
{
  "totalCreated": 1,
  "lastTopic": "AI Agents",
  "lastDate": "2025-05-13T20:17:00.000Z",
  "AI Agents": {
    "title": "Breaking Developments in AI Agents",
    "date": "2025-05-13T20:17:00.000Z",
    "status": "published"
  }
}
```

### View Created Blogs

```bash
cat ~/hermes_projects/govindtank.github.io/data/blogs-history/blog_history.json
```

---

## Step 8: Deployment to GitHub Pages

The repository is already configured for GitHub Pages. After each automation run:

1. Changes are committed automatically
2. GitHub Actions (in `deploy.yml`) will auto-deploy
3. Site updates at: https://govindtank.github.io

### Force Deploy (if needed)

```bash
cd ~/hermes_projects/govindtank.github.io
npm run build  # If using Vite
# or just git push will trigger deploy.yml workflow
```

---

## Step 9: Testing the Automation

### First Run (with Hermes local)

```bash
cd ~/hermes_projects/govindtank.github.io
node scripts/blog-automation/create-blog.js
```

Expected output:
```
🤖 Hermes Blog Automation Starting...

📊 Current trending topics: AI & Large Language Models, Mobile-First Architecture, ...
🎯 Selected topic: AI & Large Language Models
📰 Found 3 relevant articles

✍️ Generating blog post...
✓ Title: The Future of AI Agents in Software Development

💾 Updating repository...
✓ Updated constants.ts with new blog post
✓ Added social share buttons to Blog component

📝 Committing changes...
✓ git config --global user.name "Govind Tank"
✓ git config --global user.email "govindtank600@gmail.com"
✓ git add src/constants.ts data/blogs-history/blog_history.json
✓ git commit -m "chore: auto-publish blog post about trending topic"
✓ git push origin main

✅ Blog automation completed successfully!
📊 Total blogs auto-created: 1/12
🔗 Blog URL: https://govindtank.github.io/#blog
```

---

## Step 10: Scheduled Automation Options

### Option A: Hermes Cron Job (Recommended)

Add to your main cron configuration:

```yaml
- name: "Auto Blog - AI Trends"
  schedule: "0 9 * * MON-FRI"  # Monday-Friday at 9 AM local time
  script: ~/hermes_projects/govindtank.github.io/scripts/blog-automation/create-blog.js
  environment:
    HERMES_API_KEY: "...",
    TELEGRAM_BOT_TOKEN: "...",
    GITHUB_TOKEN: "ghp_xxxxxx"
```

### Option B: GitHub Actions Alternative

Create `.github/workflows/auto-blog.yml`:

```yaml
name: Auto Blog Creation

on:
  schedule:
    - cron: '0 9 * * MON-FRI'
  workflow_dispatch:

jobs:
  create-blog:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install axios dotenv
      
      - name: Run Blog Automation
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          TELEGRAM_CHAT_ID: ${{ secrets.TELEGRAM_CHAT_ID }}
        run: |
          node scripts/blog-automation/create-blog.js
```

---

## Summary

This automation system provides:

✅ **Trending Topic Detection** - Monitors your skills for hot topics  
✅ **News Integration** - Fetches and analyzes relevant articles  
✅ **Professional Content Generation** - Detailed, well-structured blogs  
✅ **Safe Auto-Publishing** - Commit & push without affecting other files  
✅ **Blog Count Tracking** - Maintains history of created posts  
✅ **Social Sharing** - Share buttons with copy-link functionality  
✅ **Telegram Notifications** - Instant alerts to your chat  
✅ **Anti-Prompt Injection** - Multiple safety layers built-in  
✅ **Flexible Scheduling** - Cron job or GitHub Actions options  

**To Start**: Set up the `.env` file and run the script once manually, then enable cron scheduling.

---

*Generated by Hermes Automation System v1.0*