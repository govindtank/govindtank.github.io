/**
 * Hermes Blog Automation System v2.0 - Simplified & Fixed
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, 'env.cjs') });

// Configuration using environment variables directly
const repoRoot = process.cwd();
const scriptsDir = path.join(repoRoot, 'scripts/blog-automation');
const dataDir = path.join(repoRoot, 'data/blogs-history');
const historyFile = path.join(dataDir, 'blog_history.json');
const blogPostFile = path.join(repoRoot, 'src', 'constants.ts');

// Fallback: use defaults if env not set
const PRIMARY_MODEL = process.env.PRIMARY_MODEL || 'qwen/qwen3.5-9b';
const PRIMARY_URL = process.env.PRIMARY_MODEL_PROVIDER || 'http://localhost:1234';
const FALLOVER_MODELS = process.env.MODEL_FAILOVER_LIST?.split(';') || [
  'openai/gpt-4o-mini',
  'groq/llama3-8b-8192',
  'ollama/llama3.2',
  'anthropic/claude-sonnet-3.5@fast'
];

const telegramEnabled = !!process.env.TELEGRAM_BOT_TOKEN;
const githubToken = process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN.length > 10 ? process.env.GITHUB_TOKEN : undefined;
const maxBlogCountPerDay = parseInt(process.env.MAX_BLOG_COUNT) || 12;
const minWordCount = parseInt(process.env.CONTENT_MIN_LENGTH) || 500;
const maxWordCount = parseInt(process.env.CONTENT_MAX_LENGTH) || 3000;
const gitUser = process.env.GIT_USER_NAME || 'Govind Tank';
const gitEmail = process.env.GIT_USER_EMAIL || 'govindtank600@gmail.com';

// Global counters
let BLOG_COUNT_SESSION = 0;
let FAILED_ATTEMPTS = 0;
const MAX_FAILED_ATTEMPTS = parseInt(process.env.MAX_MODEL_ATTEMPTS) || 4;

// Logger
const logger = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString().slice(11, 23)} - ${msg}`),
  success: (msg) => console.log(`\n✅ [SUCCESS] ${msg}\n`),
  warn: (msg) => console.warn(`⚠️ [WARN] ${msg}`),
  error: (msg) => console.error(`❌ [ERROR] ${msg}`),
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function initHistory() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    logger.info('Created blogs-history directory');
  }
  
  let history = {};
  const historyExists = fs.existsSync(historyFile);
  
  if (!historyExists) {
    history = {
      version: '2.0',
      createdAt: new Date().toISOString(),
      totalCreated: 0,
      lastTopic: null,
      lastDate: null,
      todayCount: 0,
      blogs: {}
    };
    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
    logger.info('Initialized blog_history.json');
  } else {
    const content = fs.readFileSync(historyFile, 'utf8');
    history = JSON.parse(content);
  }
  
  return history;
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
// MODEL FAILOVER SYSTEM
// ============================================

async function fetchFromModel(url, prompt) {
  const timeout = setTimeout(() => {
    logger.warn('Request timed out');
  }, 60000);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.HERMES_API_KEY || ''}`,
        'HTTP-Referer': 'https://govindtank.github.io'
      },
      body: JSON.stringify({
        model: PRIMARY_MODEL,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
    
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

async function generateContentWithFailover(prompt) {
  logger.info(`🔍 Starting with primary: ${PRIMARY_MODEL}`);
  
  // Try local model first
  try {
    const response = await fetchFromModel(PRIMARY_URL, prompt);
    if (response && response.length > minWordCount) {
      logger.success('Local model responded successfully!');
      return { success: true, content: response };
    } else {
      throw new Error(`Response too short: ${response?.length || 0} words`);
    }
  } catch (error) {
    logger.warn(`Local model failed (${error.message}), trying fallback...`);
  }
  
  // Fallback to OpenRouter API
  try {
    const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://govindtank.github.io'
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct-v01',
        messages: [{ role: 'user', content: prompt }]
      })
    });
    
    if (!openrouterResponse.ok) {
      throw new Error(`OpenRouter error: ${openrouterResponse.status}`);
    }
    
    const openrouterData = await openrouterResponse.json();
    logger.success('✅ OpenRouter fallback successful!');
    
    return { 
      success: true, 
      content: openrouterData.choices[0].message.content 
    };
    
  } catch (error) {
    throw new Error(`All models exhausted: ${error.message}`);
  }
}

// ============================================
// TRENDING TOPIC DETECTION
// ============================================

function getSkillCategories() {
  try {
    const content = fs.readFileSync(blogPostFile, 'utf8');
    const categories = [];
    
    // Simple pattern matching for skill categories
    const categoryPattern = /category:\s*"([^"]+)"/g;
    const itemsPattern = /items:\s*\[(.*?)\]/s;
    
    let tempContent = content;
    while ((tempContent = tempContent.match(/export const SKILLS[\s\S]*?^];$/m))) {
      try {
        const skillsBlock = tempContent[0];
        
        const categoriesFound = [...new Set(
          skillsBlock.matchAll(/category:\s*"([^"]+)"/g)
        ).map(m => m[1])];
        
        categoriesFound.forEach(category => {
          const categoryMatch = skillsBlock.match(
            new RegExp(`${category}\\s*\\n.*?items:\\s*\\[(.*?)\\]\\n\\},`, 's')
          );
          
          if (categoryMatch) {
            try {
              const itemsStr = categoryMatch[1]
                .replace(/["'\[\]]/g, '')
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);
              
              categories.push({ category, items });
            } catch (e) {}
          }
        });
        
      } catch (e) {
        logger.warn('Error parsing skills:', e.message);
      }
      
      break;
    }
    
    return categories;
  } catch (error) {
    logger.error('Could not read skills:', error.message);
    return [];
  }
}

function identifyTrendingTopics() {
  const hotTopics = [
    { category: 'AI & ML', keywords: ['AI', 'LLM', 'Agent', 'Neural Network'] },
    { category: 'Mobile Dev', keywords: ['Flutter', 'Kotlin', 'React Native'] },
    { category: 'Cloud-Native', keywords: ['AWS', 'Cloud', 'Serverless'] },
    { category: 'Architecture', keywords: ['Clean Architecture', 'Design Patterns'] }
  ];
  
  const trending = [];
  hotTopics.forEach(hot => {
    trending.push({
      topic: hot.category + ' Development Trends',
      keywords: hot.keywords.join(', '),
      score: Math.random() * 0.5 + 0.5 // Random relevance for now
    });
  });
  
  // Add your known high-priority topics
  trending.unshift({
    topic: 'AI-Augmented Development Workflows',
    keywords: 'Cursor, OpenRouter API, LLM Integration',
    score: 0.95
  }, {
    topic: 'Enterprise Flutter App Architecture',
    keywords: 'Flutter Bloc, Clean Architecture, State Management',
    score: 0.92
  });
  
  return trending.sort((a, b) => b.score - a.score);
}

// ============================================
// NEWS FETCHING
// ============================================

async function fetchNews(topic) {
  try {
    const apiKey = process.env.NEWS_API_KEY || 'demo';
    const searchQuery = encodeURIComponent(`${topic} development trends best practices`);
    
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${searchQuery}&sortBy=publishedAt&language=en&apiKey=${apiKey}`
    );
    
    if (!response.ok) {
      return [{ title: 'Recent innovations in development', relevance: 'medium' }];
    }
    
    const data = await response.json();
    const qualityArticles = data.articles.filter(article => 
      article.title?.length > 20 && article.urlToImage
    ).slice(0, 5);
    
    return qualityArticles.length > 0 ? qualityArticles : [{ title: 'General news', relevance: 'low' }];
  } catch (error) {
    logger.warn(`News API failed:`, error.message);
    return [{ title: 'Latest industry insights', relevance: 'medium' }];
  }
}

// ============================================
// BLOG CONTENT GENERATION
// ============================================

function createGenerationPrompt(topic, news) {
  const excerptLimit = 250;
  
  return `You are Govind Tank, a Senior Lead Architect expert in AI/ML, mobile development (Flutter/Kotlin), cloud-native architectures, and clean code principles.
  
Write a comprehensive technical blog post about: "${topic}"

RELEVANT NEWS (${news.length} articles):
${news.map(n => `- ${n.title}`).join('\n') || 'No recent news available.'}

Requirements:
- Title: Catchy, max 12 words
- Introduction: 150-200 words, hook the reader
- Main Content: 800-1500 words with at least 3 subsections (H2 headers)
- Conclusion: 100-150 words summary
- Include code examples where relevant
- Use proper Markdown formatting
- Tone: Professional yet accessible

Return ONLY the blog content in Markdown format.`;
}

async function generateBlogContent(topic, newsArticles) {
  const prompt = createGenerationPrompt(topic, newsArticles);
  
  logger.info(`📝 Generating blog: "${topic}"`);
  
  const response = await generateContentWithFailover(prompt);
  
  if (!response.success) {
    throw new Error('Failed to generate content');
  }
  
  // Clean up response
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
  
  let excerpt = '';
  try {
    // Extract first paragraph after title
    const lines = content.split('\n');
    let inContent = false;
    
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i].trim();
      if (!line.startsWith('#')) {
        excerpt += (inContent || i > 0) ? line + ' ' : line;
      } else if (inContent) {
        break;
      }
    }
    
    excerpt = excerpt.trim().substring(0, 250);
  } catch (e) {
    excerpt = `A deep dive into ${topic}.`;
  }
  
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
  const topicLower = topic.toLowerCase();
  if (topicLower.includes('ai') || topicLower.includes('llm')) return 'AI';
  if (topicLower.includes('flutter') || topicLower.includes('mobile')) return 'Mobile';
  if (topicLower.includes('architecture')) return 'Architecture';
  if (topicLower.includes('api') || topicLower.includes('backend')) return 'Backend';
  return ['DevOps', 'Cloud', 'Security'][Math.floor(Math.random() * 3)];
}

// ============================================
// FILE UPDATES
// ============================================

function updateConstants(blogEntry) {
  const filePath = blogPostFile;
  let content = fs.readFileSync(filePath, 'utf8');
  
  const blogPostsStart = content.indexOf('export const BLOG_POSTS: BlogPost[] = [');
  if (blogPostsStart === -1) {
    throw new Error('BLOG_POSTS not found in constants.ts');
  }
  
  const postsSection = content.substring(blogPostsStart);
  const closingBracketIndex = postsSection.indexOf('];');
  const existingPosts = postsSection.substring(0, closingBracketIndex + 2);
  
  const newEntry = `  ${JSON.stringify(blogEntry, null, 2)},`;
  const newPostsStr = newEntry + '\n' + existingPosts.replace(/^\]/, '];');
  
  content = content.substring(0, blogPostsStart) + newPostsStr;
  
  fs.writeFileSync(filePath, content, 'utf8');
  logger.success('✓ Updated constants.ts with new blog post');
  
  return content;
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
  const child = spawn.sync('sh', ['-c', command], {
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
    logger.error(`Telegram failed: ${error.message}`);
  }
}

// ============================================
// MAIN AUTOMATION
// ============================================

async function runAutomation() {
  logger.info('╔════════════════════════════════════════╗');
  logger.info('║   HERMES BLOG AUTOMATION SYSTEM v2.0   ║');
  logger.info('╚════════════════════════════════════════╝\n');
  
  // Check daily limit
  const todayCount = getTodayCount();
  if (todayCount >= maxBlogCountPerDay) {
    logger.warn(`🔴 Daily limit reached (${todayCount}/${maxBlogCountPerDay}).`);
    await sendStatusUpdate('limit_reached');
    return;
  }
  
  try {
    // Step 1: Identify trending topics
    logger.info('🔍 Step 1/4: Analyzing trending topics...');
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
    logger.info('\n✍️ Step 4/4: Generating and publishing blog...');
    
    const { title, content } = await generateBlogContent(selectedTopic.topic, newsArticles);
    const blogEntry = createBlogEntry(selectedTopic.topic, title, content);
    
    updateConstants(blogEntry);
    
    saveHistory({
      todayCount: todayCount + 1,
      blogs: { [title]: { status: 'published' } }
    });
    
    await commitAndPush();
    await sendTelegramNotification(blogEntry);
    
    logger.success('\n╔═══════════════════════════════════════╗');
    logger.success('║           ✅ AUTOMATION SUCCESS!        ║');
    logger.success('╚═══════════════════════════════════════╝');
    logger.info(`📊 Blogs today: ${todayCount + 1}/${maxBlogCountPerDay}`);
    
  } catch (error) {
    logger.error('\n❌ Failed:', error.message);
    await sendStatusUpdate('error', error.message);
    process.exitCode = 1;
  }
}

async function sendStatusUpdate(status, message = '') {
  if (!telegramEnabled || !process.env.TELEGRAM_BOT_TOKEN) return;
  
  const emoji = status === 'success' ? '✅' : status === 'limit_reached' ? '🔴' : '❌';
  const text = `🤖 *Hermes Blog Status*<br><b>Status:</b> ${status}<br>`;
  
  try {
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: text + (message ? `<br>${message}` : ''),
        parse_mode: 'HTML'
      })
    });
  } catch (e) {}
}

// Run!
runAutomation();
