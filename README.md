# Govind Tank | Senior Lead Architect & Android Expert

A high-performance, aesthetically technical portfolio designed for a Senior Lead Architect and Android Expert. Built with a "Security-First" and "Architectural Manifesto" aesthetic, this site showcases technical leadership, system architecture, and deep-dive technical logs.

## 🚀 Key Features

- **System Manifest (Hero Section)**: A biometric-themed introduction with interactive HUD nodes representing system sync and architectural readiness.
- **Biometric Bio (About)**: A narrative-driven profile with scanline overlays, security clearance stamps, and restricted technical callouts.
- **Interactive Tech Stack (Skills)**: Categorized skill grid focusing on Android Core, Architecture, DevOps, and Creative Tech.
- **Enterprise Experience (Work)**: Detailed timeline of professional leadership and system-scale contributions.
- **Project Archives**: Filterable gallery of high-impact technical projects.
- **Architectural Logs (Blog)**: A technical feed for deep dives, migration strategies, and industry insights, featuring:
  - **Read-Sequence Mode**: Immersive modal reading experience.
  - **Terminal Breakouts**: Code snippets formatted as secure system logs.
  - **Metadata tracking**: Identity integrity and log timestamps.
- **Social Proof**: Integrated testimonials from enterprise-level collaborations.

## 🛠 Tech Stack

- **Framework**: React 18+ (Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (JIT)
- **Animations**: Motion (Framer Motion)
- **Icons**: Lucide React
- **Deployment**: Configured for GitHub Pages

## 🤖 Blog Automation Plan

This repository is designed to facilitate automated "Architectural Log" generation using LLMs and GitHub Actions.

### Automation Workflow
1. **Trigger**: Scheduled GitHub Action (CRON: `0 9 * * *`).
2. **Generation**: A Node.js script (using OpenRouter or Gemini API) generates a technical blog post based on current industry trends.
3. **Commit**: The script appends the new post to the `BLOG_POSTS` constant in `src/constants.ts`.
4. **Deploy**: GitHub Pages automatically redeploys with the new content.
5. **Syndication**: Optional integration with LinkedIn API to cross-post the update.

*See `AUTOMATION_PLAN.md` for implementation details.*

## 📦 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Development**:
   ```bash
   npm run dev
   ```
3. **Build**:
   ```bash
   npm run build
   ```
4. **Deploy**:
   ```bash
   npm run deploy
   ```

## 📄 License
Custom Portfolio Project for Govind Tank. All rights reserved.
