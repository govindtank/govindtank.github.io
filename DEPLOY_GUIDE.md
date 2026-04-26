# Deployment Guide: GitHub Pages

To deploy this portfolio to GitHub Pages (`govindtank.github.io`), follow these steps:

## Option 1: Automatic Deployment (Recommended)
The easiest way is to use a GitHub Action.

1.  **Create a Repository**: Push this code to a new repository on GitHub (e.g., `portfolio`).
2.  **Add a Workflow**: Create a file at `.github/workflows/deploy.yml` with the following content:

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

3.  **Configure GitHub Pages**:
    - Go to your repository **Settings** > **Pages**.
    - In **Build and deployment** > **Source**, select **GitHub Actions**.

---

## Option 2: Manual Deployment
If you prefer to deploy manually from your machine:

1.  **Install gh-pages**:
    `npm install --save-dev gh-pages`

2.  **Update package.json**:
    Add these scripts:
    ```json
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
    ```

3.  **Update vite.config.ts**:
    Ensure the `base` property matches your repository name:
    ```typescript
    export default defineConfig({
      base: '/YOUR_REPO_NAME/', // Use '/' for govindtank.github.io
      // ...rest of config
    })
    ```

4.  **Run Deploy**:
    `npm run deploy`

---

## Final Check
For your specific domain `govindtank.github.io`, ensure your repository name is exactly `govindtank.github.io` and the `base` in `vite.config.ts` is set to `/`.
