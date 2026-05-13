/**
 * Hermes Blog Automation System v2.1 - Production Ready
 * Uses OpenRouter as primary (free tier available) with Hermes local fallback
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'env.cjs') });

// ============================================
// CONFIGURATION
// ============================================
const repoRoot = process.cwd();
const scriptsDir = path.join(repoRoot, 'scripts/blog-automation');
const dataDir = path.join(repoRoot, 'data/blogs-history');
const historyFile = path.join(dataDir, 'blog_history.json');
const blogPostFile = path.join(repoRoot, 'src', 'constants.ts');

// Use OpenRouter as primary for reliability (free tier: https://openrouter.ai)
const PRIMARY_MODEL = process.env.PRIMARY_MODEL || 'openai/gpt-4o-mini';
const PRIMARY_URL = 'https://openrouter.ai/api/v1/chat/completions';
const FALLBACK_MODELS = ['google/gemma-2-9b', 'mistralai/mixtral-8x7b-instruct-v01'];

// Environment defaults
const telegramEnabled = !!process.env.TELEGRAM_BOT_TOKEN;
const githubToken = process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN.length > 10 ? process.env.GITHUB_TOKEN : undefined;
const maxBlogCountPerDay = parseInt(process.env.MAX_BLOG_COUNT) || 12;
const minWordCount = parseInt(process.env.CONTENT_MIN_LENGTH) || 500;
const gitUser = process.env.GIT_USER_NAME || 'Govind Tank';
const gitEmail = process.env.GIT_USER_EMAIL || 'govindtank600@gmail.com';

// Counters
let BLOG_COUNT_SESSION = 0;
let todayCount = 0;

// Logger
const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  success: (msg) => console.log(`\n✅ [SUCCESS] ${msg}\n`),
  warn: (msg) => console.warn(`⚠️ [WARN] ${msg}`),
  error: (msg) => console.error(`❌ [ERROR] ${msg}`),
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function initHistory() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  
  let history = {};
  const file = fs.existsSync(historyFile) ? JSON.parse(fs.readFileSync(historyFile, 'utf8')) : null;
  
  return {
    version: '2.1',
    ...file || {},
  };
}

function saveHistory(updates) {
  const history = initHistory();
  Object.assign(history, updates);
  if (history.totalCreated % 5 === 0) {
    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
  }
}

function getTodayCount() {
  return initHistory().todayCount || 0;
}

// ============================================
// OPENROUTER API CALL (Primary - reliable & free)
// ============================================

async function callOpenRouter(prompt, model = PRIMARY_MODEL) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  logger.info(`🎯 Using: ${model}`);
  
  const response = await fetch(PRIMARY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://govindtank.github.io'
    },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }] })
  });
  
  if (!response.ok) {
    throw new Error(`OpenRouter HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

// ============================================
// LOCAL MODEL FALLBACK (Hermes)
// ============================================

async function callLocalModel(prompt, model) {
  logger.info(`🔍 Trying local: ${model} at localhost:1234`);
  
  const response = await fetch(`${process.env.PRIMARY_MODEL_PROVIDER || 'http://localhost:1234'}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }] })
  }).catch(e => {
    logger.warn('Local Hermes not responding');
    return null;
  });
  
  if (!response) throw new Error('Hermes unavailable');
  
  const data = await response.json();
  return data.choices[0].message.content;
}

// ============================================
// MODEL FAILOVER STRATEGY
// ============================================

async function generateContentWithFailover(prompt) {
  try {
    // Try OpenRouter first (reliable, free tier available)
    const content = await callOpenRouter(prompt);
    
    if (!content || content.length < minWordCount) {
      throw new Error(`Response too short: ${content?.length || 0} words`);
    }
    
    logger.success('✅ OpenRouter successful!');
    return { success: true, content };
    
  } catch (error) {
    logger.warn(`OpenRouter failed (${error.message}), trying local Hermes...`);
    
    try {
      const localContent = await callLocalModel(prompt, process.env.PRIMARY_MODEL || 'qwen/qwen3.5-9b');
      
      if (localContent && localContent.length >= minWordCount) {
        logger.success('✅ Local Hermes fallback successful!');
        return { success: true, content: localContent };
      } else {
        throw new Error(`Local response too short`);
      }
    } catch (localError) {
      logger.error(`All models failed (${error.message}, ${localError.message})`);
      throw new Error('Both OpenRouter and Hermes failed');
    }
  }
}

// ============================================
// TRENDING TOPIC DETECTION
// ============================================

function getSkillCategories() {
  try {
    const content = fs.readFileSync(blogPostFile, 'utf8');
    
    const categories = [];
    const blockMatch = content.match(/export const SKILLS[\s\S]*?^];/m);
    
    if (blockMatch) {
      const skillsBlock = blockMatch[0];
      
      // Extract categories and items
      const categoryMatches = [...new Set(
        skillsBlock.matchAll(/category:\s*"([^"]+)"/g)
      )].map(m => m[1]);
      
      categoryMatches.forEach(category => {
        const blockMatch = skillsBlock.match(
          new RegExp(`${category}\\s*\\n.*?items:\\s*\\[(.*?)\\]\\n\\},`, 's')
        );
        
        if (blockMatch) {
          try {
            const itemsStr = blockMatch[1]
              .replace(/["'\[\]]/g, '')
              .split(',')
              .map(s => s.trim())
              .filter(Boolean);
            
            categories.push({ category, items });
          } catch (e) {}
        }
      });
    }
    
    return categories;
  } catch (error) {
    logger.warn('Could not read skills:', error.message);
    return [];
  }
}

function identifyTrendingTopics() {
  const hotTopics = [
    { category: 'AI & ML', keywords: ['AI', 'LLM', 'Agent'] },
    { category: 'Mobile Dev', keywords: ['Flutter', 'Kotlin'] },
    { category: 'Cloud-Native', keywords: ['AWS', 'Serverless'] },
    { category: 'Architecture', keywords: ['Clean Architecture'] }
  ];
  
  const trending = [];
  hotTopics.forEach(hot => {
    trending.push({
      topic: hot.category + ' Development Trends',
      score: Math.random() * 0.4 + 0.5
    });
  });
  
  // Your specific high-priority topics (based on skills)
  trending.unshift(
    { topic: 'AI-Augmented Development Workflows', score: 0.95 },
    { topic: 'Enterprise Flutter App Architecture', score: 0.92 },
    { topic: 'Mobile-First Clean Architecture Patterns', score: 0.88 }
  );
  
  return trending.sort((a, b) => b.score - a.score);
}

// ============================================
// NEWS FETCHING (Mock if API key missing)
// ============================================

async function fetchNews(topic) {
  try {
    const apiKey = process.env.NEWS_API_KEY || 'demo';
    
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(`${topic} development trends`)}` +
        `&sortBy=publishedAt&language=en&apiKey=${apiKey}&maxResults=3`
    );
    
    if (!response.ok) {
      return [{ title: 'Recent technology insights', relevance: 'medium' }];
    }
    
    const data = await response.json();
    return data.articles.slice(0, 5) || [];
  } catch (error) {
    logger.warn(`News API failed or not configured`, error.message);
    return [
      { title: `${topic} Industry Insights`, relevance: 'high' },
      { title: 'Latest Best Practices', relevance: 'medium' }
    ];
  }
}

// ============================================
// BLOG CONTENT GENERATION
// ============================================

function createGenerationPrompt(topic, news) {
  const newsText = news.length 
    ? '\n\nRELEVANT NEWS:\n' + news.map(n => `- ${n.title}`).join('\n')
    : '\n\nNo recent news available - write based on general knowledge.';
  
  return `You are Govind Tank, a Senior Lead Architect expert in AI/ML, mobile development (Flutter/Kotlin), cloud-native architectures.

Write a comprehensive technical blog post about: "${topic}"${newsText}

Requirements:
- Title: Catchy, max 12 words, must include key terms
- Introduction: 150-200 words, hook with real-world context  
- Main Content: 800-1500 words, minimum 3 H2 subsections
- Include practical code examples where relevant
- Add architecture diagrams (ASCII) or conceptual models
- Conclusion: 100-150 words summary + future outlook

Use proper Markdown with headings, code blocks, lists. Tone: Professional yet accessible for senior developers.

Return ONLY the blog content in Markdown format.`;
}

async function generateBlogContent(topic, newsArticles) {
  const prompt = createGenerationPrompt(topic, newsArticles);
  
  logger.info(`📝 Generating blog: "${topic}"`);
  
  const response = await generateContentWithFailover(prompt);
  
  if (!response.success) throw new Error('Content generation failed');
  
  // Clean up
  let content = response.content;
  content = content.replace(/^```(?:\w+)?\n/, '').replace(/\n```$/, '');
  
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  logger.info(`📊 Word count: ${wordCount}`);
  
  if (wordCount < minWordCount) {
    throw new Error(`Content too short: ${wordCount} words`);
  }
  
  const title = content.match(/^#\s+(.+?)(?:\n|$)/m)?.[1]?.trim() || topic;
  
  return { title, content, newsArticles, topic, date: new Date() };
}

// ============================================
// BLOG ENTRY CREATION
// ============================================

function createBlogEntry(topic, title, content) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  
  const dateObj = new Date();
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
  
  // Extract excerpt (first paragraph after title)
  let excerpt = 'A deep dive into this topic with practical examples and architectural insights.';
  try {
    const lines = content.split('\n');
    let excerptLines = [];
    let inContent = false;
    
    for (let i = 0; i < Math.min(15, lines.length); i++) {
      const line = lines[i].trim();
      if (!line.startsWith('#')) {
        excerptLines.push(line);
      } else if (inContent) break;
    }
    
    excerpt = excerptLines.join(' ').trim().substring(0, 250);
  } catch (e) {}
  
  return {
    title,
    excerpt,
    date: formattedDate,
    tag: determineTag(topic),
    slug,
    content
  };
}

function determineTag(topic) {
  const t = topic.toLowerCase();
  if (t.includes('ai') || t.includes('llm')) return 'AI';
  if (t.includes('flutter') || t.includes('mobile')) return 'Mobile';
  if (t.includes('architecture')) return 'Architecture';
  if (t.includes('api') || t.includes('backend')) return 'Backend';
  return ['DevOps', 'Cloud', 'Security'][Math.floor(Math.random() * 3)];
}

// ============================================
// FILE UPDATES
// ============================================

function updateConstants(blogEntry) {
  const filePath = blogPostFile;
  let content = fs.readFileSync(filePath, 'utf8');
  
  const blogPostsStart = content.indexOf('export const BLOG_POSTS: BlogPost[] = [');
  if (blogPostsStart === -1) throw new Error('BLOG_POSTS not found');
  
  const postsSection = content.substring(blogPostsStart);
  const closingIndex = postsSection.indexOf('];');
  const existing = postsSection.substring(0, closingIndex + 2);
  
  const newEntry = `  ${JSON.stringify(blogEntry, null, 2)},`;
  const updated = newEntry + '\n' + existing.replace(/^\]/, '];');
  
  content = content.substring(0, blogPostsStart) + updated;
  fs.writeFileSync(filePath, content, 'utf8');
  
  logger.success('✓ Updated constants.ts with new blog post');
}

// ============================================
// GIT COMMIT & PUSH
// ============================================

async function setupGitHubRemote() {
  if (githubToken) {
    const httpsUrl = `https://${githubToken}@github.com/govindtank/govindtank.github.io`;
    
    fs.writeFileSync(
      '.git/config',
      fs.readFileSync('.git/config', 'utf8').replace(
        /remote\.origin\.url\s*=\s*[\w\.\-]+/,
        `remote.origin.url = ${httpsUrl}`
      ),
      'utf8'
    );
    
    logger.info('✓ Configured HTTPS remote for GitHub token auth');
  }
}

async function runGitCommand(command, description) {
  const child = require('child_process').spawnSync('sh', ['-c', command], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: repoRoot,
    env: { ...process.env, GIT_USER_NAME: gitUser, GIT_USER_EMAIL: gitEmail }
  });
  
  if (child.status !== 0) {
    throw new Error(`${description} failed`);
  }
  
  logger.info(`✓ ${description}`);
}

async function commitAndPush() {
  setupGitHubRemote();
  
  const commands = [
    `git config --global user.name "${gitUser}"`,
    `git config --global user.email "${gitEmail}"`,
    'git add src/constants.ts data/blogs-history/blog_history.json',
    'git commit -m "chore: auto-publish blog post" --no-gpg-sign',
    'git push origin main'
  ];
  
  for (const cmd of commands) {
    await runGitCommand(cmd, cmd.replace('git ', ''));
  }
}

// ============================================
// TELEGRAM NOTIFICATIONS
// ============================================

async function sendTelegramNotification(blogEntry) {
  if (!telegramEnabled || !process.env.TELEGRAM_BOT_TOKEN) return;
  
  const message = `📰 *✨ New Blog Published!* ✨\n\n` +
    `👤 **Author:** Govind Tank<br>` +
    `📅 **Date:** ${blogEntry.date}<br>` +
    `🏷️ **Category:** ${blogEntry.tag}<br>` +
    `📝 **Topic:** ${blogEntry.title}<br>` +
    `<br><i>${blogEntry.excerpt || 'Read more...'}</i><br>` +
    `<br>🔗 *<a href="https://govindtank.github.io/#blog">View Blog</a>*`;
  
  try {
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });
    
    logger.success('✓ Telegram notification sent');
  } catch (error) {
    logger.error(`Telegram failed:`, error.message);
  }
}

async function sendStatusUpdate(status, message = '') {
  if (!telegramEnabled || !process.env.TELEGRAM_BOT_TOKEN) return;
  
  const emoji = status === 'success' ? '✅' : status === 'limit_reached' ? '🔴' : '❌';
  const text = `🤖 *Hermes Blog Automation Status*<br><br>` +
    `<b>Job:</b> Auto Blog Creation<br>` +
    `<b>Status:</b> ${status}<br><br>${emoji} <i>Current: ${message}</i><br>`;
  
  try {
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'HTML'
      })
    });
  } catch (e) {}
}

// ============================================
// MAIN AUTOMATION FUNCTION
// ============================================

async function runAutomation() {
  logger.info('╔════════════════════════════════════════╗');
  logger.info('║   HERMES BLOG AUTOMATION SYSTEM v2.1   ║');
  logger.info('╚════════════════════════════════════════╝\n');
  
  // Check daily limit
  const todayCount = getTodayCount();
  if (todayCount >= maxBlogCountPerDay) {
    logger.warn(`🔴 Daily limit reached (${todayCount}/${maxBlogCountPerDay}). Skipping.`);
    await sendStatusUpdate('limit_reached');
    return;
  }
  
  try {
    // Step 1: Identify trending topics
    logger.info('🔍 Step 1/4: Analyzing trending topics from skills...');
    const trendingTopics = identifyTrendingTopics();
    
    // Step 2: Select best topic
    logger.info('🎯 Step 2/4: Selecting highest-priority topic...');
    const selectedTopic = trendingTopics[0];
    logger.info(`   ✅ Selected: "${selectedTopic.topic}"`);
    
    // Step 3: Fetch news
    logger.info('📰 Step 3/4: Fetching latest news articles...');
    const newsArticles = await fetchNews(selectedTopic.topic);
    logger.info(`   📄 Found ${newsArticles.length} articles`);
    
    // Step 4: Generate and publish
    logger.info('\n✍️ Step 4/4: Generating detailed blog post...');
    
    const { title, content } = await generateBlogContent(selectedTopic.topic, newsArticles);
    const blogEntry = createBlogEntry(selectedTopic.topic, title, content);
    
    updateConstants(blogEntry);
    
    saveHistory({
      todayCount: todayCount + 1,
      blogs: { [title]: { topic: selectedTopic.topic, status: 'published' } }
    });
    
    await commitAndPush();
    await sendTelegramNotification(blogEntry);
    
    logger.success('\n╔═══════════════════════════════════════╗');
    logger.success('║           ✅ AUTOMATION SUCCESS!        ║');
    logger.success('╚═══════════════════════════════════════╝');
    logger.info(`📊 Blogs published today: ${todayCount + 1}/${maxBlogCountPerDay}`);
    logger.info(`🔗 View at: https://govindtank.github.io/#blog`);
    
  } catch (error) {
    logger.error('\n❌ Automation failed:', error.message);
    await sendStatusUpdate('error', error.message);
    process.exitCode = 1;
  }
}

// Run!
runAutomation();
