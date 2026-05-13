# CRON JOB: Blog Automation Weekly Deployment
# Runs every Monday at 2:00 AM local time
# 
# Task: Generate new AI-powered blog posts using Local Hermes
# Model: qwen/qwen3.5-9b (runs locally, no external API calls)
# Output: New blog post saved to src/components/Blog.tsx
#        Deploys to GitHub Pages for public viewing
#
# Features:
# ✓ Trending topic detection from skills portfolio
# ✓ 800-2000 word content generation
# ✓ Auto-saves to blog history tracking
# ✓ Weekly automation on Mondays (2 AM)
# ✓ Uses local Hermes for privacy (no data leaves your machine!)
#
# Setup:
# 1. Ensure Local Hermes API is running: python3 -m uvicorn app:app --host 0.0.0.0 --port 1234
# 2. Install dependencies: npm install /Users/govind/hermes_projects/govindtank.github.io
# 3. Add cron job (Linux): crontab -e and add: 0 2 * * 1 /usr/local/bin/python3 automation.py
# 4. Or use existing cron job created in your Telegram chat
#
# GitHub Pages Deployment will automatically happen via GitHub Actions after push

@weekly
SHELL=/bin/bash
PATH=/usr/local/bin:/usr/bin:/bin

cd /Users/govind/hermes_projects/govindtank.github.io && \
  python3 scripts/blog-automation/automation.py && \
  git add -A && \
  git commit -m "chore: Weekly blog automation $(date +%Y-%m-%d)" -m "🤖 Local Hermes generated content" && \
  git push origin main
