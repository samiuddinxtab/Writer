# Cache Invalidation & CDN Behavior

## Overview

Your app uses Cloudflare's CDN to cache static content and API responses. This document explains how caching works and what happens when you publish an article.

---

## Caching Strategy

### Public API Responses (Cached)
- **GET /api/sections** — Cached for 1 hour (3600 seconds)
- **GET /api/sections/:slug/articles** — Cached for 1 hour
- **GET /api/articles/:slug** — Cached for 1 hour

**Why:** These endpoints change infrequently and benefit from edge caching for speed.

### Admin Endpoints (NOT Cached)
- **GET /api/admin/articles** — No cache (no-store, no-cache, must-revalidate)
- **POST /api/admin/articles** — No cache
- **PUT /api/admin/articles/:id** — No cache
- **POST /api/admin/articles/:id/publish** — No cache

**Why:** Admin endpoints must always return fresh data and be invisible to readers. Caching here could leak drafts or corrupted state.

---

## Publishing Flow

### Step 1: You Press "Publish"

```
Frontend (your phone) 
  → Sends POST /api/admin/articles/:id/publish
  → With Authorization header (Bearer token)
  → To Worker
```

### Step 2: Worker Updates Database

```
Worker
  → Verifies auth token
  → Updates articles table (sets published_at timestamp)
  → Returns 200 OK immediately
  → Does NOT wait for cache purge
```

### Step 3: Cache Purge (Async)

```
If CF_API_TOKEN + CF_ZONE_ID are set:
  → Worker purges these cached URLs:
    • /api/articles/{article-slug}
    • /api/sections/{section-slug}/articles
    • / (homepage/sidebar)
  → Purge completes in seconds
  → Readers see new content immediately

If CF_API_TOKEN or CF_ZONE_ID are NOT set:
  → Cache is NOT purged
  → Readers might see old version for up to 1 hour
  → Frontend shows: "Published, but cache may be stale"
  → You can manually purge in Cloudflare Dashboard
```

---

## Success Scenarios

### Scenario 1: Full Setup (Recommended)
- ✅ CF_API_TOKEN set
- ✅ CF_ZONE_ID set
- ✅ Publish succeeds
- ✅ Cache purges immediately
- ✅ Response includes: `"status": "published"` (no warning)

**What you see:**
```json
{
  "status": "published",
  "id": 42,
  "slug": "my-article-123abc",
  "published_at": "2025-02-02T12:34:56.000Z",
  "requestId": "4f8a9x2y" // for debugging
}
```

**Reader experience:** New article visible instantly.

### Scenario 2: No Cache Credentials (Degraded)
- ❌ CF_API_TOKEN not set
- ❌ CF_ZONE_ID not set
- ✅ Publish still succeeds
- ❌ Cache NOT purged
- ⚠️ Response includes warning

**What you see:**
```json
{
  "status": "published",
  "id": 42,
  "slug": "my-article-123abc",
  "cacheWarning": "Article published, but cache purge failed. Cache may be stale for up to 1 hour.",
  "requestId": "4f8a9x2y"
}
```

**Reader experience:** May see old version for up to 1 hour. Can refresh browser to force fresh load.

---

## Failure Scenarios

### Scenario 1: Auth Token Invalid
- ❌ Authorization header missing or wrong token
- **Response:** `401 Unauthorized`
- **No database changes**
- **You must:** Check token in admin interface, try again

### Scenario 2: Article Not Found
- ✅ Token valid
- ❌ Article ID doesn't exist
- **Response:** `404 Not Found`
- **No database changes**

### Scenario 3: Rate Limit Hit
- ❌ Too many requests from your IP in 1 minute
- **Response:** `429 Too Many Requests`
- **Database changes:** May or may not be applied (check)
- **Wait:** ~60 seconds, then retry

---

## Manual Cache Purge (Emergency)

If cache isn't purging automatically:

**Option 1: Via Cloudflare Dashboard**
1. Go to https://dash.cloudflare.com
2. Select your domain
3. **Caching** → **Purge Cache**
4. Choose:
   - **Purge Everything** (clears all URLs), or
   - **Purge by URL** (paste specific URLs)
5. Click **Purge**

**Option 2: Via CLI** (if you have dev machine)
```bash
wrangler pages deployment tail --env production
# Then manually purge via dashboard link shown
```

---

## Debugging Cache Issues

### Using Request ID

Every API response includes a `requestId` (16 chars). Use this to find logs:

**Example:**
```
Request succeeded with ID: 4f8a9x2y
```

**In Cloudflare Dashboard:**
1. Go to your worker → **Logs**
2. Search for the request ID: `4f8a9x2y`
3. Look for lines starting with `[4f8a9x2y]`
4. Common messages:
   - `Cache purge successful for 3 URL(s)` ✅
   - `Cache purge API failed: 401` ❌ (bad CF_API_TOKEN)
   - `Cache purge not configured` ⚠️ (missing env vars)

### Checking Cache Status

**Via Cloudflare Dashboard:**
1. Caching → **Cache Analytics**
2. Look for cache hit/miss ratio over time
3. Should see increased **cache hits** after publishing

**Via CLI:**
```bash
curl -I https://your-domain.com/api/articles/my-article-slug
# Look for headers:
#   Cache-Control: public, max-age=3600  ✅
#   X-Cache: HIT (or MISS)
#   Age: 0-3600 (seconds since cached)
```

---

## Free Tier Limits

Cloudflare FREE tier quotas to be aware of:

| Resource | Limit | Your Usage |
|----------|-------|-----------|
| Cache purges | Unlimited | ~1 per publish |
| Cache storage | ~30 MB/domain | Urdu articles (small) |
| API requests | 100K/day | << limit |
| Cache TTL | 24 hours default, configurable | 1 hour (3600s) |

**You are safe on FREE tier.** No concerns about hitting limits.

---

## Future Improvements (NOT for this deploy)

- [ ] Add X-Cache headers to responses for debugging
- [ ] Track cache hit/miss metrics
- [ ] Implement granular cache purge by slug (already done, but could improve)
- [ ] Add Cache-Status response header

---

## Summary

| Scenario | Result | User Sees |
|----------|--------|-----------|
| Publish with cache credentials | ✅ Success + cache clears | New content instantly |
| Publish without cache credentials | ✅ Success + cache NOT cleared | Old content for 1 hour (or manual purge) |
| Publish with invalid token | ❌ Fails | Error: "Unauthorized" |
| Public GET requests | ✅ Cached at edge | 1-hour stale data max |
| Admin GET requests | ✅ Never cached | Always fresh |

**Production-safe:** All errors are explicit and logged. Cache failures don't block publishes.
