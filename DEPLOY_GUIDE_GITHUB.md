

   # Deployment Guide: GitHub Pages

To deploy this React (Vite) portfolio to GitHub Pages, follow these steps:

## 1. Environment Setup
Ensure you have the following in `vite.config.ts`:
- Set the `base` property to your repository name: `base: '/your-repo-name/'` (if it's a project page) or `'/'` if it's a user page (username.github.io).

## 2. GitHub Actions Deployment (Recommended)

1. **Create a workflow file**: `.github/workflows/deploy.yml`
2. **Add this content**:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ["main"]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - name: Install dependencies
        run: npm install
      - name: Build
        run: npm run build
      - name: Setup Pages
        uses: actions/configure-pages@v4
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## 3. Manual Deployment (`gh-pages` package)

1. Install the package: `npm install --save-dev gh-pages`
2. Add these scripts to `package.json`:
   ```json
   "predeploy": "npm run build",
   "deploy": "gh-pages -d dist"
   ```
3. Run `npm run deploy`.

## 4. GitHub Repository Settings
- Go to **Settings > Pages**.
- Under **Build and deployment**, select **GitHub Actions** (if using the workflow) or **Deploy from a branch** (if using `gh-pages` package, select the `gh-pages` branch).

## 5. Technical Blog (Architectural Logs)
- **Adding Content**: Open `src/constants.ts` and add new entries to the `BLOG_POSTS` array.
- **Post Structure**: Each post requires a `title`, `excerpt`, `date`, `tag`, and a unique `slug`.
- **Styling**: The blog uses a high-tech "Architectural Log" theme with specialized UI elements (biometric scanlines, system stamps).
- **Expansion**: If you want to use Markdown files for blogs, you can install `react-markdown` and modify `src/components/BlogAndTestimonials.tsx` to fetch `.md` files from the `public/` directory.

## 6. Handling Assets
- Ensure your profile images are named **`profile_one.png`** and **`profile_two.png`**.
- Place them directly inside the **`public/`** folder.
- If deploying to a subpath (e.g., `username.github.io/portfolio/`), double-check the `base` property in `vite.config.ts`.
