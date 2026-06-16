# Blog Automation Strategy

This guide outlines how to automate daily technical logs (9:00 AM) to your portfolio and LinkedIn using GitHub Actions and LLMs (OpenRouter/Gemini).

## 1. The Strategy

We will use a **GitHub Action** to run a script every morning. This script will:
1.  **Generate Content**: Call OpenRouter/Gemini to write a technical blog post based on your persona.
2.  **Update Repository**: Inject the generated post into `src/constants.ts`.
3.  **Cross-Post**: Use a LinkedIn API integration to share the post.
4.  **Redeploy**: Commit the changes to trigger GitHub Pages.
   

---

## 2. GitHub Actions Workflow

Create a file at `.github/workflows/daily-log.yml`:

```yaml
name: Generate Daily Architecture Log

on:
  schedule:
    - cron: '0 9 * * *' # Every day at 9:00 AM UTC
  workflow_dispatch: # Allows manual trigger

jobs:
  generate-log:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Install dependencies
        run: npm install axios

      - name: Run Generation Script
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
          LINKEDIN_ACCESS_TOKEN: ${{ secrets.LINKEDIN_ACCESS_TOKEN }}
        run: node scripts/generate_log.js

      - name: Commit and Push
        run: |
          git config --global user.name "Govind Log Bot"
          git config --global user.email "bot@govindtank.com"
          git add src/constants.ts
          git commit -m "chore: auto-generate daily architectural log [skip ci]"
          git push origin main
```

---

## 3. The Generation Script (`scripts/generate_log.js`)

This script handles the API calls and file modification.

```javascript
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function generateLog() {
  const prompt = `You are Govind Tank, a Senior Lead Architect and Android Expert. 
  Write a short, high-level technical blog post (max 100 words) about a modern software architecture trend. 
  Format the output as a JSON object with: title, excerpt, tag (Architecture, Android, Cloud, AI), and slug.`;

  try {
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'mistralai/mistral-7b-instruct',
      messages: [{ role: 'user', content: prompt }]
    }, {
      headers: { Authorization: \`Bearer \${process.env.OPENROUTER_API_KEY}\` }
    });

    const postData = JSON.parse(response.data.choices[0].message.content);
    postData.date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    // Read constants.ts
    const filePath = path.join(__dirname, '../src/constants.ts');
    let content = fs.readFileSync(filePath, 'utf8');

    // Insert new post into the BLOG_POSTS array
    const insertTag = 'export const BLOG_POSTS: BlogPost[] = [';
    content = content.replace(insertTag, \`\${insertTag}\\n  \${JSON.stringify(postData, null, 2)},\`);

    fs.writeFileSync(filePath, content);
    console.log('Successfully updated constants.ts');

    // Optional: LinkedIn Posting Logic here...
    
  } catch (error) {
    console.error('Failed to generate log:', error);
    process.exit(1);
  }
}

generateLog();
```

---

## 4. Setup Instructions

1.  **API Keys**:
    - Get an API Key from [OpenRouter](https://openrouter.ai/).
    - (Optional) Get an Access Token from the [LinkedIn Developer Portal](https://developer.linkedin.com/).
2.  **GitHub Secrets**:
    - Go to your Repo > Settings > Secrets and variables > Actions.
    - Add `OPENROUTER_API_KEY` and `LINKEDIN_ACCESS_TOKEN`.
3.  **Local Development**:
    - For local testing, you can run the generation script directly from your machine and commit changes manually.

---

## 5. LinkedIn Integration Note

To post to LinkedIn, your script would need to use the `v2/ugcPosts` API endpoint. 
**Required Scope**: `w_member_social`.

```javascript
// Add this to your script
await axios.post('https://api.linkedin.com/v2/ugcPosts', {
  author: "urn:li:person:YOUR_PERSON_ID",
  lifecycleState: "PUBLISHED",
  specificContent: {
    "com.linkedin.ugc.ShareContent": {
      shareCommentary: { text: \`New log: \${postData.title} #Architecture #Tech\` },
      shareMediaCategory: "ARTICLE",
      media: [{
        status: "READY",
        originalUrl: "https://yourusername.github.io/portfolio/"
      }]
    }
  },
  visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" }
}, { headers: { Authorization: \`Bearer \${process.env.LINKEDIN_ACCESS_TOKEN}\` }});
```
