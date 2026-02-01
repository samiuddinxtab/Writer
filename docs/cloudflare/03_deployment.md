# Deployment Process — What Happens When You Publish

Understanding the deployment process helps you debug issues and know what to expect. This guide explains **exactly what happens** when you push code or publish articles.

## What Happens When You Push to Main Branch

### Automatic Deployment Trigger
When you push code to your `main` branch:

```
Your Code Push → GitHub → Cloudflare Pages → Automatic Build → Live Site
```

**Timeline:** 2-5 minutes from push to live

### Step-by-Step Process:

1. **GitHub Notification (instant)**
   - Cloudflare gets notified immediately when you push
   - Your commit appears in Cloudflare's deployment queue

2. **Build Start (0-1 minute)**
   - Cloudflare fetches your latest code
   - Build status shows "Building..." in dashboard
   - Build logs stream in real-time

3. **Build Process (1-3 minutes)**
   - Vite compiles your frontend code
   - JavaScript bundles are created
   - CSS is processed and optimized
   - Static assets are prepared

4. **Workers Deployment (parallel)**
   - API functions deploy to Cloudflare's global network
   - Routes are updated automatically
   - Functions become available immediately

5. **Site Goes Live (2-5 minutes)**
   - New version replaces old version atomically
   - URL remains the same
   - Cache gets updated automatically

## Pages Build Process Explained

### What Vite Does (Frontend Compilation)

**Think of Vite as a translator** — it takes your human-readable code and converts it into fast, optimized files that browsers understand.

**Step 1: Code Analysis**
- Scans all your `.js`, `.css`, and `.html` files
- Finds dependencies between files
- Creates an optimized file structure

**Step 2: Bundle Creation**
- Combines multiple files into fewer files (reduces HTTP requests)
- Removes comments and whitespace (smaller file sizes)
- Optimizes images and fonts

**Step 3: Output Preparation**
- Creates `index.html` (main page)
- Generates `assets/` folder with optimized files
- Prepares everything for fast loading

### What Gets Served

**Static Files:**
- `index.html` — Main page structure
- `assets/*.js` — Optimized JavaScript bundles
- `assets/*.css` — Compressed stylesheets
- `assets/fonts/*` — Urdu fonts (Noto Nastaliq)

**What readers see:**
- Instant loading from Cloudflare's edge network
- Cached static assets for speed
- Mobile-optimized responsive design

## Workers Function Routing

### How API Requests Work

When readers visit your site, here's what happens:

```
Reader Request → Cloudflare Edge → Workers Function → Response
```

**Routing Examples:**
- `yoursite.com/api/articles` → Workers handles article listing
- `yoursite.com/api/admin/publish` → Workers handles admin actions
- `yoursite.com/` → Static Pages content
- `yoursite.com/article/slug` → Workers fetches article data

### Route Priority

**Important:** Workers routes follow specific priority:

1. **Exact matches first** (`/api/admin/publish`)
2. **Pattern matches second** (`/api/articles/:slug`)
3. **Fallback to Pages** (static content)

**What this means:** API calls always work correctly, never conflict with static pages.

## D1 Migrations (Database Schema Changes)

### What Are Migrations?

**Think of migrations as version control for your database.** When you need to add a new table or column, you create a migration file.

### Migration Process:

1. **Create Migration File**
   - SQL commands to add/modify database structure
   - Example: `ALTER TABLE articles ADD COLUMN excerpt TEXT;`

2. **Run Migration**
   - Through Cloudflare dashboard or Wrangler CLI
   - Changes are applied safely
   - Previous data is preserved

3. **Application Updates**
   - Your code starts using the new structure
   - No downtime required
   - Backward compatibility maintained

### When You Need Migrations:

**Common scenarios:**
- Adding new article fields (tags, categories)
- Creating user management (if needed later)
- Performance optimization (new indexes)
- Data cleanup operations

**Migration safety:**
- Always backup before running
- Test on development database first
- Run during low-traffic periods

## Cache Invalidation (How New Articles Appear)

### Why Caching Matters

**Cache = Speed.** When a reader visits your site, Cloudflare stores (caches) the content. Next reader gets the same content instantly without hitting your database.

### Cache Invalidation Process

**When you publish an article:**

1. **Article saved to D1** (database)
2. **Cache purge triggered** (automatic)
3. **Next reader gets fresh content** (database query)
4. **Fresh content cached** (for subsequent readers)

### Cache Strategy by Endpoint

**Highly Cached (hours/days):**
- Article content (`/api/articles/:slug`)
- Section listings (`/api/sections`)
- Homepage content

**Minimally Cached (minutes):**
- Admin dashboard data
- Recent articles list
- Sidebar navigation

**Never Cached:**
- Admin login endpoints
- Publish actions
- Private data

### Cache Headers Explained

**How Cache Control Works:**

```
Cache-Control: public, max-age=3600
```

**Translation:**
- `public` = Can be cached by browsers and Cloudflare
- `max-age=3600` = Cache for 1 hour (3600 seconds)

**For Admin Endpoints:**
```
Cache-Control: no-cache, no-store
```

**Translation:**
- `no-cache` = Always check for updates
- `no-store` = Never store sensitive data

## Monitoring: Check If Deploy Succeeded

### In Cloudflare Dashboard

**Build Status (Pages):**
1. **Go to "Pages"** → **Your Project** → **Deployments**
2. **Check deployment status:**
   - ✅ **Success** = Green checkmark
   - ⚠️ **Warning** = Yellow triangle  
   - ❌ **Failed** = Red X
3. **Click deployment** for detailed logs

**Workers Status:**
1. **Go to "Workers & Pages"** → **Your Function**
2. **Check "Deployments" tab**
3. **Verify latest deployment is active**

**D1 Database Status:**
1. **Go to "D1"** → **Your Database**
2. **Check "Tables" tab** to verify schema
3. **Monitor "Usage" tab** for query counts

### Common Success Indicators

**Build Succeeded:**
- Deployment shows green checkmark
- Site loads at your URL
- No error messages in logs

**Workers Working:**
- API endpoints respond correctly
- Admin login works
- Articles publish successfully

**D1 Connected:**
- Articles save to database
- Published articles appear for readers
- No database error messages

### When Things Go Wrong

**Build Failed:**
- Click failed deployment for error logs
- Common issues: missing dependencies, syntax errors
- Fix code and push again (triggers new build)

**Workers Errors:**
- Check "Functions" tab for runtime errors
- Common issues: environment variables missing, syntax errors
- Fix code and redeploy

**Database Issues:**
- Verify environment variables are set
- Check D1 database exists and is linked
- Ensure migrations ran successfully

## Why Does This Matter?

**Understanding deployment helps you:**
- **Debug faster** when issues arise
- **Plan maintenance** around build times
- **Understand performance** characteristics
- **Communicate effectively** with developers
- **Know what to expect** during updates

**Most importantly:** You can confidently publish content knowing exactly what happens behind the scenes.

## Next Steps

**Ready to dive deeper?** 
- **Having issues?** Check [04_troubleshooting.md](04_troubleshooting.md)
- **Want to customize?** Phase 2 documentation covers code changes
- **Need monitoring setup?** Learn about Cloudflare Analytics in Phase 3

**Remember:** Cloudflare handles most complexity automatically. You focus on content; they handle the infrastructure.