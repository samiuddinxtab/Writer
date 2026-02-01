# Troubleshooting Guide — Fix Common Problems

This guide helps you solve the most common issues when starting with Cloudflare. **Each solution works on your phone browser** and includes exact steps to follow.

## "Build Failed" — Fix Deployment Problems

### How to Check Build Status:

1. **Go to Cloudflare dashboard** → **Pages** → **Your Project**
2. **Tap "Deployments" tab**
3. **Look for red ❌ icon** next to failed builds
4. **Tap the failed deployment** to see error details

### Common Build Failures and Fixes:

**Error: "npm install failed"**
- **Cause:** Missing dependencies or version conflicts
- **Fix:** 
  - Check your `package.json` file
  - Ensure all required packages are listed
  - Push code again after fixing

**Error: "Vite build failed"**
- **Cause:** Code syntax errors or missing files
- **Fix:**
  - Look at the error message for specific file names
  - Check those files for missing brackets, semicolons, etc.
  - Common issues: unclosed `<div>` tags, missing exports

**Error: "Out of memory during build"**
- **Cause:** Build process needs more memory
- **Fix:**
  - This usually resolves itself on retry
  - Wait 5 minutes and push again
  - If persistent, check for infinite loops in code

### Quick Fix Steps:
1. **Read the error message carefully** (it's usually specific)
2. **Fix the issue in your code**
3. **Commit and push** the fix
4. **Wait 2-5 minutes** for new deployment
5. **Check status again**

## "Workers Script Not Running" — API Problems

### How to Check Workers Status:

1. **Go to Cloudflare dashboard** → **Workers & Pages**
2. **Find your Workers function**
3. **Tap the function name**
4. **Check "Deployments" tab** for active version

### Common Workers Issues:

**Error: "Module not found"**
- **Cause:** Missing or incorrect import paths
- **Fix:**
  - Check all `import` statements in your Workers code
  - Ensure file paths are correct
  - Verify package names match `package.json`

**Error: "Environment variable not set"**
- **Cause:** Missing configuration
- **Fix:**
  - Go to Workers function → **Settings** → **Variables**
  - Add missing environment variables:
    - `DB_NAME`: Your D1 database name
    - `DB_ID`: Your D1 database ID
    - `ADMIN_TOKEN`: Your admin authentication token

**Error: "Function timeout"**
- **Cause:** Code taking too long to respond
- **Fix:**
  - Check for infinite loops
  - Reduce complex database queries
  - Add proper error handling

### Testing Workers Locally:

**Using Wrangler CLI:**
1. **Open terminal** in your project folder
2. **Run:** `wrangler dev`
3. **Test endpoints** at `http://localhost:8787`
4. **Check console** for error messages

## "D1 Says Table Doesn't Exist" — Database Issues

### Check Database Status:

1. **Go to Cloudflare dashboard** → **D1** → **Your Database**
2. **Tap "Tables" tab**
3. **Verify your tables exist:**
   - `articles` table
   - `sections` table

### Common D1 Problems:

**Error: "Table 'articles' doesn't exist"**
- **Cause:** Migrations haven't run yet
- **Fix:**
  - Go to D1 → **Your Database** → **SQL** tab
  - Run your migration SQL commands
  - Or use Wrangler: `wrangler d1 migrations apply DB_NAME`

**Error: "Database connection failed"**
- **Cause:** Wrong database ID or name
- **Fix:**
  - Verify database ID in D1 dashboard
  - Check environment variables match exactly
  - Ensure database is in same Cloudflare account

**Error: "Permission denied"**
- **Cause:** Workers doesn't have database access
- **Fix:**
  - Go to Workers function → **Settings** → **Variables**
  - Ensure `DB_ID` is set correctly
  - Add D1 database binding in Workers settings

### Running Migrations Manually:

**Step-by-step:**
1. **Go to D1 dashboard** → **Your Database** → **SQL**
2. **Paste your migration SQL**
3. **Tap "Run query"**
4. **Verify success message**

**Example migration:**
```sql
CREATE TABLE articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  section_id INTEGER,
  is_pinned INTEGER DEFAULT 0,
  published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## "Cache Not Updated After Publish" — Content Not Showing

### Understanding Cache Behavior:

**Why caching matters:** Cloudflare caches content to make your site fast. Sometimes cached content doesn't update immediately.

### Force Cache Refresh:

**For Readers (Temporary Fix):**
1. **Clear browser cache** (settings → privacy → clear cache)
2. **Hard refresh:** Hold refresh button and select "Empty Cache and Hard Reload"
3. **Incognito/private mode** always gets fresh content

**For Administrators (Proper Fix):**
1. **Check cache headers** in your Workers response
2. **Ensure admin endpoints** have `Cache-Control: no-cache`
3. **Verify cache purge** happens after publish

### Cache Control Headers:

**Correct headers for publish actions:**
```
Cache-Control: no-cache, no-store, must-revalidate
```

**Why this matters:** Tells Cloudflare to always check for fresh content instead of serving cached version.

### Monitoring Cache Status:

1. **Go to Cloudflare dashboard** → **Your Domain** → **Caching**
2. **Check "Configuration" tab**
3. **Verify caching rules** are correct
4. **Monitor cache hit rate** in Analytics

## "Article Won't Load" — API Debugging Checklist

### Step-by-Step Debugging:

**1. Test API Endpoint Directly:**
1. **Open browser** and go to: `yoursite.com/api/articles`
2. **Check response:** Should show JSON data or empty array
3. **If 404:** Workers function isn't deployed
4. **If 500:** Database or code error

**2. Check Browser Console:**
1. **Press F12** (or tap browser menu → Developer Tools)
2. **Go to "Console" tab**
3. **Look for error messages** in red
4. **Common errors:** CORS issues, network failures, JavaScript errors

**3. Verify Database Connection:**
1. **Go to D1 dashboard** → **SQL** tab
2. **Run test query:** `SELECT COUNT(*) FROM articles;`
3. **Should show number** (0 is fine for new sites)
4. **If error:** Database connection problem

**4. Check Environment Variables:**
1. **Go to Workers** → **Your Function** → **Settings** → **Variables**
2. **Verify these are set:**
   - `DB_NAME`: Exact database name
   - `DB_ID`: Database UUID
   - `ADMIN_TOKEN`: Your admin password

### Common API Issues:

**"CORS error"**
- **Cause:** Cross-origin request blocked
- **Fix:** Ensure your frontend domain is allowed in Workers CORS settings

**"Network error"**
- **Cause:** Workers function not responding
- **Fix:** Check Workers deployment status and logs

**"JSON parse error"**
- **Cause:** API returning invalid JSON
- **Fix:** Check Workers code for syntax errors

## "I Can't Access Admin Editor" — Authentication Problems

### Admin Access Checklist:

**1. Verify Admin Token:**
1. **Go to admin page:** `yoursite.com/admin`
2. **Enter your admin token** (32-character random string)
3. **Token should be exact match** with environment variable

**2. Check Token Environment Variable:**
1. **Go to Workers** → **Your Function** → **Settings** → **Variables**
2. **Find `ADMIN_TOKEN`**
3. **Verify it matches** the token you're entering

**3. Test Token Validation:**
1. **Open browser console** (F12)
2. **Go to admin page**
3. **Look for authentication errors** in network tab

### Common Auth Issues:

**"Invalid token" error**
- **Cause:** Token mismatch or typo
- **Fix:** 
  - Double-check token in Workers environment
  - Ensure no extra spaces when entering
  - Regenerate token if needed

**"Token expired" message**
- **Cause:** Using old token or system clock issue
- **Fix:** 
  - Generate new token
  - Update in Workers environment variable
  - Clear browser cache

**"Login page won't load"**
- **Cause:** Frontend deployment issue
- **Fix:**
  - Check Pages deployment status
  - Verify build succeeded
  - Check for JavaScript errors

### Generating New Admin Token:

**On your phone:**
1. **Use any password generator app**
2. **Create 32-character random string**
3. **Copy the token**
4. **Update in Cloudflare:**
   - Workers → Your Function → Settings → Variables
   - Update `ADMIN_TOKEN` value
   - Save changes

## Emergency Recovery Steps

### If Everything Breaks:

**Step 1: Check Cloudflare Status**
1. **Go to** `cloudflare.com/status`
2. **Check if services are operational**
3. **Wait if there's a known outage**

**Step 2: Rollback Deployment**
1. **Pages** → **Your Project** → **Deployments**
2. **Find last working deployment**
3. **Click "Rollback to this deployment"**

**Step 3: Contact Support**
1. **Go to** `support.cloudflare.com`
2. **Use live chat** (available 24/7)
3. **Describe your issue** with specific error messages

### Getting Help Quickly:

**Before asking for help, gather:**
- ✅ Exact error message
- ✅ Steps you took before error
- ✅ Screenshots of error
- ✅ Your deployment URL

**Useful resources:**
- **Cloudflare Documentation:** `developers.cloudflare.com`
- **Community Forum:** `community.cloudflare.com`
- **Discord:** Active developer community
- **Stack Overflow:** Tag questions with `cloudflare-workers`

## Why Does This Matter?

**Troubleshooting skills help you:**
- **Fix problems faster** without waiting for help
- **Understand your system** better
- **Build confidence** in managing your site
- **Avoid common pitfalls** in future projects

**Remember:** Most issues are simple configuration problems. Take a deep breath, follow the steps, and you'll usually find the solution within 10-15 minutes.

**Still stuck?** The Cloudflare community is incredibly helpful — don't hesitate to ask for assistance!