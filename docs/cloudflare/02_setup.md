# Setup Guide — Get Your Site Running

This guide walks you through setting up Cloudflare for the first time. **Everything works on your phone browser** — no desktop required.

## Before You Start

**What you need:**
- A GitHub account (free)
- Your GitHub repository with the project code
- 30 minutes of time
- A stable internet connection

**What you'll get:**
- A live website running on Cloudflare's global network
- Free hosting forever (no credit card required)
- Fast loading for readers worldwide

## Step 1: Create Your Cloudflare Account

### On Mobile Browser:
1. **Open your phone browser** and go to `cloudflare.com`
2. **Tap "Sign Up"** (usually top-right corner)
3. **Choose "Sign up with GitHub"** (faster than email)
4. **Authorize Cloudflare** to access your GitHub account
5. **Enter your details:**
   - Name (can be your real name or pen name)
   - Country (select from dropdown)
   - **No credit card required** for free tier

### On Desktop Browser:
1. Go to `cloudflare.com`
2. Click "Sign Up" (top-right)
3. Choose "Sign up with GitHub"
4. Complete authorization

**Why GitHub integration?** Makes connecting your repository easier. Cloudflare can automatically see your code and deploy it.

## Step 2: Connect Your GitHub Repository

### In Cloudflare Dashboard:
1. **Tap "Pages"** in the left sidebar
2. **Tap "Create a project"**
3. **Tap "Connect to Git"**
4. **Choose "GitHub"** (if not already selected)
5. **Tap "Begin authorization"** (if needed)
6. **Select your repository** from the list
   - Look for the repository with your project code
   - If you don't see it, check that it's public in GitHub

### Important Settings:
- **Project name:** This becomes your website URL
  - Example: `urdu-articles` becomes `urdu-articles.pages.dev`
- **Production branch:** Keep as `main`
- **Framework preset:** Select "None" (we'll configure manually)

## Step 3: Set Up Wrangler CLI (For Local Development)

**Wrangler is Cloudflare's command-line tool** — you only need this if you want to develop locally.

### Install Wrangler:
1. **Open your phone's terminal app** (or use GitHub Codespaces)
2. **Install Wrangler:**
   ```bash
   npm install -g wrangler
   ```

### Alternative: Use GitHub Codespaces (Easier)
If you prefer not to install anything:
1. **Go to your GitHub repository**
2. **Tap "Code"** → **"Codespaces"** → **"Create codespace"**
3. **Wait 2-3 minutes** for setup
4. **Open terminal in the browser** (already configured)

## Step 4: Create D1 Database

### In Cloudflare Dashboard:
1. **Tap "D1"** in the left sidebar
2. **Tap "Create database"**
3. **Enter database name:** `urdu-articles-db`
4. **Tap "Create"**
5. **Copy the database ID** (you'll need this later)

**Why D1?** This stores all your articles permanently. It's like a file cabinet that never loses anything.

## Step 5: Link GitHub Repository to Your Account

### Back in Cloudflare Pages:
1. **Go back to your Pages project**
2. **Tap "Settings"** tab
3. **Scroll to "Environment variables"**
4. **Add these variables:**
   - `DB_NAME`: Your database name
   - `DB_ID`: The database ID you copied
   - `ADMIN_TOKEN`: Generate a random string (use a password generator)

### Generate Admin Token:
**On your phone:** Use any password generator app to create a 32-character random string. Examples:
- `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
- Keep this safe — it's your admin login key

## Step 6: First Deploy

### Trigger Your First Build:
1. **Go to "Deployments"** tab in your Pages project
2. **Tap "Create deployment"**
3. **Select your main branch**
4. **Tap "Save and Deploy"**

**What happens next:**
- Cloudflare fetches your code from GitHub
- Vite compiles your frontend
- Workers functions are deployed
- Your site becomes live at `your-project.pages.dev`

**Time expected:** 2-5 minutes for first deploy

## Step 7: Verify Everything Works

### Test Your Site:
1. **Visit your new URL:** `your-project.pages.dev`
2. **Check that pages load** (may show "no articles yet" — that's normal)
3. **Test admin login:**
   - Go to `/admin` on your site
   - Enter your admin token
   - Should see the article creation interface

### If Something Goes Wrong:
- **Site doesn't load:** Check "Functions" tab in Cloudflare for errors
- **Admin login fails:** Verify your environment variables
- **Database errors:** Check D1 database is created and linked

## What Just Happened?

**Congratulations!** You've now:
- ✅ Created a Cloudflare account
- ✅ Connected your GitHub repository
- ✅ Set up a database
- ✅ Deployed your site to the global internet
- ✅ Configured admin access

**Your site is live and accessible worldwide** at your `pages.dev` URL.

## Why Does This Matter?

**Free tier limits you should know:**
- **100GB bandwidth per month** (more than enough for articles)
- **500 builds per month** (plenty for daily publishing)
- **100,000 database reads per day** (sufficient for moderate traffic)
- **100 writes per day** (perfect for single admin)

**These limits scale with your usage** — you won't hit them with normal article publishing.

## Next Steps

**Your site is live!** Now:
1. **Read [03_deployment.md](03_deployment.md)** to understand what happens when you publish
2. **Start writing articles** using your admin interface
3. **Customize your site** (Phase 2 documentation covers code changes)

**Need help?** Check [04_troubleshooting.md](04_troubleshooting.md) for common issues and solutions.