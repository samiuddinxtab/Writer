# Environment Variables & Secrets Setup

This document covers ALL required environment variables and database bindings for production deployment on Cloudflare FREE tier.

---

## Summary: What Must Be Configured Manually

Before deploying, **YOU (the maintainer) must set these in the Cloudflare Dashboard:**

1. ✅ **ADMIN_TOKEN** — Bearer token for admin endpoints (publish, edit articles)
2. ✅ **D1 Database Binding** — Connection to the articles database
3. ✅ **CF_API_TOKEN** — Optional; enables cache purge after publishing
4. ✅ **CF_ZONE_ID** — Optional; required if using cache purge

**⚠️ Important:** Without these, the Worker will fail or run in degraded mode.

---

## 1. ADMIN_TOKEN (Required)

### What It Is
A **bearer token** that authenticates all admin operations:
- Creating articles
- Updating articles
- Publishing articles
- Accessing the `/api/admin/*` endpoints

Without this, anyone could publish or delete your content.

### Where It's Used
Every admin request must include:
```
Authorization: Bearer <ADMIN_TOKEN>
```

### How to Generate It
Generate a **strong random token** locally. Options:

**Option A: Using Terminal (on your phone is harder, use a laptop first)**
```bash
openssl rand -hex 32
```
This produces something like: `a3f8d2e1b9c4f7a2e8d1c3b6f9e2a4d7f1c3b5e8a2d4f6c9e1b3a5d7f9c2e`

**Option B: Using a password generator**
- Use any password manager or online generator
- Create a 32+ character random string with letters, numbers, and symbols

### How to Set It in Cloudflare Dashboard

**Step 1: Open Cloudflare Dashboard**
- Go to: https://dash.cloudflare.com
- Log in with your Cloudflare account

**Step 2: Navigate to Workers**
- Left sidebar → **Workers & Pages**
- Click on your worker: **writer-api**

**Step 3: Add the Secret**
- In the worker page, click: **Settings** (tab)
- Scroll to: **Environment Variables** section
- Under **Production** environment:
  - Click: **Add variable** (or **Edit variables**)
  - Variable name: `ADMIN_TOKEN`
  - Value: Paste your token (e.g., `a3f8d2e1b9c4f7a2e8d1c3b6f9e2a4d7f1c3b5e8a2d4f6c9e1b3a5d7f9c2e`)
  - **Check the "Encrypt" checkbox** ✓ (turns it into a secret)
  - Click: **Save and Deploy**

**Step 4: Verify It Works**
After deploy, make a test request:
```bash
curl -X GET https://your-worker.pages.dev/api/admin/articles \
  -H "Authorization: Bearer a3f8d2e1b9c4f7a2e8d1c3b6f9e2a4d7f1c3b5e8a2d4f6c9e1b3a5d7f9c2e"
```

Expected: Either `200 OK` (if articles exist) or `[]` (empty list), NOT `401 Unauthorized`.

If you see `401 Unauthorized`, the token was not set correctly. Re-check step 3.

---

## 2. D1 Database Binding (Required)

### What It Is
D1 is Cloudflare's **SQLite database**. Your Worker needs a connection to it via a **binding**.

The binding name is: `DB`

### How to Create/Verify It

**Step 1: Create Database (if not already created)**
- Dashboard → **Workers & Pages** → **D1** (left sidebar)
- Click: **Create database**
- Name: `writer-db`
- Click: **Create**

**Step 2: Bind It to Your Worker**
- Go back to your **writer-api** worker
- Click: **Settings** (tab)
- Scroll to: **Bindings** section
- Under **Production**:
  - Click: **Add binding** (or **Edit bindings**)
  - Select: **D1 Database**
  - Variable name: `DB`
  - Database: Select `writer-db` from dropdown
  - Click: **Save and Deploy**

**Step 3: Run Migrations**
The database needs tables. Run the schema:

```bash
# From /workspaces/Writer directory (or locally after cloning)
wrangler d1 execute writer-db --file database/migrations/001_init.sql --env production
wrangler d1 execute writer-db --file database/migrations/002_seed_data.sql --env production
```

**Step 4: Verify the Binding**
- In Dashboard, go to **D1**
- Click **writer-db**
- Click **Console**
- Run: `SELECT COUNT(*) FROM sections;`
- Expected: Should show section count (e.g., `5` sections)

If the query fails, migrations didn't run correctly. Re-do Step 3.

---

## 3. CF_API_TOKEN (Optional but Recommended)

### What It Is
An **API token** for Cloudflare's own API, used to **purge cached pages after publishing**.

**Without this:**
- Articles publish successfully ✅
- Cache is NOT cleared
- Readers might see stale content for up to 3600 seconds (1 hour)

**With this:**
- Articles publish ✅
- Cache clears immediately
- Readers see new content instantly

### Why It's Optional
On FREE tier, it's not *required*, but **highly recommended** for your use case.

### How to Generate It

**Step 1: Create API Token**
- Dashboard → **My Profile** (top right menu)
- Click: **API Tokens** (left sidebar)
- Click: **Create Token**
- Choose template: **Edit zone cache** or start with **Custom token**
  - Permissions: `zone:cache_purge`
  - Zone resources: Select your zone (or "All zones" if using single zone)
  - TTL: 90 days or longer
- Click: **Create Token**
- **Copy the token immediately** (you won't see it again)

**Step 2: Set It in Cloudflare Dashboard**
- Go to **writer-api** worker → **Settings**
- Under **Environment Variables** (Production):
  - Add variable name: `CF_API_TOKEN`
  - Value: Paste your token
  - **Check "Encrypt"** ✓
  - Click: **Save and Deploy**

**Step 3: Verify It Works**
Make a test publish request:
```bash
curl -X POST https://your-worker.pages.dev/api/admin/articles/1/publish \
  -H "Authorization: Bearer <YOUR_ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Check the Worker logs:
- Dashboard → **writer-api** → **Logs**
- Look for: `"Cache cleared for: ["...]"` (success)
- Or: `"Cache purge failed"` (token issue)

---

## 4. CF_ZONE_ID (Optional, Required if Using Cache Purge)

### What It Is
Your **Cloudflare Zone ID** — a unique identifier for your domain.

**Only needed if:**
- You set `CF_API_TOKEN` above
- You want cache purging to work

### How to Find It

**Step 1: Get Your Zone ID**
- Dashboard → **Domains** (left sidebar)
- Click your domain (e.g., `example.com`)
- Right column under **API** section
- Copy: **Zone ID**

Example: `d41d8cd98f00b204e9800998ecf8427e`

**Step 2: Set It in Cloudflare Dashboard**
- Go to **writer-api** worker → **Settings**
- Under **Environment Variables** (Production):
  - Add variable name: `CF_ZONE_ID`
  - Value: Paste your Zone ID
  - **Check "Encrypt"** ✓
  - Click: **Save and Deploy**

**Step 3: Verify It Works**
Same as CF_API_TOKEN Step 3 — publish an article and check logs for `"Cache cleared for"`.

---

## 5. Database Schema & Migrations

The Worker expects these tables (created by migrations):

### `sections` table
```sql
CREATE TABLE sections (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  order_index INTEGER DEFAULT 0
);
```

### `articles` table
```sql
CREATE TABLE articles (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  section_id INTEGER NOT NULL,
  created_at TEXT,
  updated_at TEXT,
  published_at TEXT,
  is_pinned INTEGER DEFAULT 0,
  FOREIGN KEY (section_id) REFERENCES sections(id)
);
```

**Verify these exist:**
- Dashboard → **D1** → **writer-db** → **Console**
- Run: `.tables` to list all tables
- Expected output includes: `articles`, `sections`

---

## 6. Production vs. Development

### Development Environment
In `wrangler.toml`, there's a commented-out `[env.development]` section.

For local testing, create a `.env.local` file (git-ignored):
```
ADMIN_TOKEN=dev-token-for-testing-only
```

Then run:
```bash
wrangler dev --env development
```

### Production Environment
When you deploy via `wrangler deploy --env production`, it uses:
- Secrets from the **Dashboard** (ADMIN_TOKEN, CF_API_TOKEN, CF_ZONE_ID)
- **Production D1 binding** (writer-db)

---

## 7. Troubleshooting Checklist

| Problem | Solution |
|---------|----------|
| **401 Unauthorized on admin requests** | Check ADMIN_TOKEN is set and correct; test with curl |
| **Database query fails** | Check D1 binding exists and migrations ran; see "Verify" step |
| **Cache not clearing after publish** | Check CF_API_TOKEN and CF_ZONE_ID are set; check Worker logs |
| **Worker returns 500 error** | Check Worker logs in Dashboard; most common: missing D1 binding |

---

## 8. Free Tier Limits

Be aware of Cloudflare FREE tier quotas:

- **D1**: 3 GB per month
- **Workers**: 100K requests/day, 10ms CPU time per request
- **Pages**: Unlimited bandwidth
- **Cache**: Standard 24-hour TTL (configurable)

Your app is designed to stay well under these limits. 

---

## Deployment Checklist

Before deploying to production:

- [ ] ADMIN_TOKEN set and encrypted in Dashboard
- [ ] D1 database created and bound to worker
- [ ] Database migrations run successfully
- [ ] CF_API_TOKEN set (optional, recommended)
- [ ] CF_ZONE_ID set (if using cache purge)
- [ ] All environment variables verified with test requests
- [ ] Worker logs checked for errors
- [ ] Admin endpoints tested with token

See [03_deployment.md](03_deployment.md) for the full deployment process.
