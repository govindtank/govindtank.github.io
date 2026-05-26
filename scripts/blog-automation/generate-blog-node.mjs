import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// OpenRouter configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "sk-test-key-for-validation";
const MODEL = "mistralai/mistral-7b-instruct-v01";
const TIMEOUT_MS = 300000; // 5 minutes

const PROMPT = `You are a senior software architect and ML engineer writing for govindtank's technical blog. Write a comprehensive, production-quality blog post about Clean Architecture & Design Patterns in AI Systems.

Requirements:
- Title format: "Clean Architecture & Design Patterns in Modern AI Systems: [key phrase]"
- Word count: 700-900 words
- Style: Technical, professional, authoritative but accessible to senior developers
- Include practical code examples (TypeScript or Python)
- Cover key topics: dependency injection, separation of concerns, layer independence, AI/ML-specific patterns
- Include a real-world example (e.g., ML pipeline architecture)
- Use 3-4 H2 sections with clear headings
- Write in first person occasionally but mostly third person professional tone

Start the article immediately with the title as an H1 heading. Do not include any introductory text, markdown code blocks, or other meta-content. Just start writing the blog post content.`;

async function callOpenRouter(prompt) {
  const body = JSON.stringify({
    model: MODEL,
    messages: [
      { role: "user", content: prompt }
    ],
    max_tokens: 1200,
    temperature: 0.7
  });

  console.log(`Calling OpenRouter API for model: ${MODEL}`);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000'
      },
      body: body,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenRouter API error: ${response.status}`, errorText);
      throw new Error(`API error ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Request timed out after 5 minutes');
      throw new Error('Generation timeout - falling back to local or retrying');
    }
    throw error;
  }
}

async function generateBlog() {
  const startTime = Date.now();
  console.log(`Starting blog generation at ${new Date().toISOString()}`);
  
  try {
    const content = await callOpenRouter(PROMPT);
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`✅ Blog generated in ${duration.toFixed(0)} seconds`);
    console.log('\n=== Generated Content Preview ===');
    console.log(content.substring(0, 500));
    
    return { success: true, content, duration };
  } catch (error) {
    console.error('❌ Generation failed:', error.message);
    
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      console.log('Would retry or fall back to alternative strategy...');
    }
    
    throw error;
  }
}

// Run generation
if (!fs.existsSync(path.join(process.cwd(), 'scripts/blog-automation/blog-output.json'))) {
  generateBlog().then(result => {
    fs.writeFileSync(
      path.join(process.cwd(), 'scripts/blog-automation/blog-output.json'),
      JSON.stringify({ timestamp: new Date().toISOString(), ...result }, null, 2)
    );
    console.log('\nBlog output saved to blog-output.json');
    process.exit(0);
  }).catch(err => {
    console.error('Generation script failed:', err.message);
    fs.writeFileSync(
      path.join(process.cwd(), 'scripts/blog-automation/error-log.txt'),
      `Error: ${err.message}\n${new Date().toISOString()}\n`
    );
    process.exit(1);
  });
} else {
  console.log('Blog already exists, skipping generation');
}
