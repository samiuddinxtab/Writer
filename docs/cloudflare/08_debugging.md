# Debugging & Observability Guide

## For Mobile Maintainers: How to Debug Issues from Your Phone

This guide explains how to use request IDs, Worker logs, and Cloudflare Dashboard to debug issues from your phone.

---

## What Is a Request ID?

Every API request gets a unique **16-character ID** that traces through the system.

**Example:**
```
4f8a9x2y
```

This ID appears in:
- ✅ API responses (in `requestId` field)
- ✅ Worker logs
- ✅ Error messages

Use it to find logs for that specific request.

---

## Scenario 1: Publish Fails with Error

### Step 1: Check the Error
**On your phone, after clicking "Publish":**
- You see: `"error": "Unauthorized"`
- Or: `"error": "Too many requests"`
- Or: `"error": "Internal Server Error"`

### Step 2: Look for Request ID
Open your browser's **Developer Tools** (Network tab):

**On Android phone:**
- Open Chrome
- Tap ⋮ (menu) → **Settings** → Developer Tools
- Or: Press `F12` (if external keyboard)
- Go to **Network** tab
- Find the `POST /api/admin/articles/.../publish` request
- Click on it
- Go to **Response** tab
- Look for `"requestId": "xxxx...."`

**On iPhone:**
- Open Developer Tools (requires Mac, use USB to tether)
- Or: Use Safari → Develop menu (if enabled in Preferences)

**Example response:**
```json
{
  "error": "Unauthorized",
  "status": 401,
  "requestId": "4f8a9x2y"
}
```

### Step 3: Find Logs in Cloudflare Dashboard

1. Go to **https://dash.cloudflare.com**
2. Select **Workers & Pages** (left sidebar)
3. Click your worker: **writer-api**
4. Go to **Logs** tab
5. Search for your request ID: `4f8a9x2y`
6. You'll see:
   ```
   [4f8a9x2y] Unauthorized: token mismatch
   [4f8a9x2y] Worker error: null
   ```

### Step 4: Diagnose

| Error | Likely Cause | Fix |
|-------|--------------|-----|
| `Unauthorized` | Token wrong/expired | Check ADMIN_TOKEN in Dashboard Settings |
| `Too many requests` | Hit rate limit | Wait 60 seconds, retry |
| `Article not found` | Wrong article ID | Verify article exists in list |
| `Internal Server Error` | Database issue | Check D1 binding; see logs for details |
| `Request timeout` | Network too slow | Check connection, retry |

---

## Scenario 2: Article Published, But Content Not Updating on Reader Site

### Problem
- ✅ You published article
- ✅ Frontend shows "Published"
- ❌ Readers don't see it yet

### Possible Causes

**Cause 1: Cache Not Cleared (Most Common)**
- CF_API_TOKEN or CF_ZONE_ID not set
- Cache still has old version
- Readers will see new content in ~1 hour (or manual purge)

**Check:**
1. Look at publish response:
   ```json
   { "cacheWarning": "Article published, but cache purge failed..." }
   ```
2. If you see `cacheWarning` → Cause confirmed

**Fix:**
- Set CF_API_TOKEN and CF_ZONE_ID (see [05_env_and_secrets.md](05_env_and_secrets.md))
- Or manually purge cache (see below)

**Cause 2: Reader Browser Cached (Very Common)**
- Browser cached old version
- New version is on server, browser doesn't know

**Fix (for readers):**
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- On mobile: Restart browser app or clear app cache

**Cause 3: Propagation Delay**
- Article published successfully
- Cache purge succeeded
- But Cloudflare edge hasn't updated yet
- Typical delay: 5-10 seconds

**Fix:**
- Wait 15 seconds, refresh
- Most common in first minute after publish

### How to Check Logs

```
Request ID from publish: 4f8a9x2y
1. Go to Dashboard → Worker → Logs
2. Search: 4f8a9x2y
3. Look for:
   ✅ "Cache purge successful for 3 URL(s)" → Cache cleared
   ⚠️ "Cache purge not configured" → Missing credentials
   ❌ "Cache purge API failed" → Bad token/zone
```

---

## Scenario 3: Can't Log In (Admin)

### Step 1: Check Token

Go to **https://dash.cloudflare.com**:
1. **Workers & Pages** → **writer-api**
2. **Settings** (tab)
3. **Environment Variables** → **Production**
4. Look for: **ADMIN_TOKEN** (should show as encrypted `••••••`)
5. Is it there? ✅ Yes or ❌ No

### Step 2: Test Token with curl (If on Desktop)

If you can access a desktop temporarily:

```bash
curl -X GET https://your-worker.pages.dev/api/admin/articles \
  -H "Authorization: Bearer your_actual_token_here"
```

Expected responses:
- `200 OK` → Token works ✅
- `401 Unauthorized` → Token wrong ❌
- `500 Internal Server Error` → D1 database issue ❌

### Step 3: Check Logs

Same as Scenario 1 — search for request ID and look for `Unauthorized`.

### Step 4: Fix

| Problem | Fix |
|---------|-----|
| Token set but wrong | Re-generate new token (see docs) |
| Token not set | Go to Dashboard → Settings → add ADMIN_TOKEN |
| Request never reaches worker | Check URL is correct (worker domain, not Pages domain) |

---

## Monitoring: What to Check After Deployment

### Immediately After Deploy (First 5 Minutes)

**On Cloudflare Dashboard:**

1. Go to **Writer API** worker → **Logs**
2. Look for these patterns:
   - ✅ `Cache purge successful` (good — cache clearing works)
   - ✅ `Rate limit exceeded` (good — rate limiter working)
   - ❌ `Worker error:` (bad — investigate)
   - ❌ `Database error:` (bad — check D1 binding)

3. Expected log output for a publish:
   ```
   [4f8a9x2y] POST /api/admin/articles/1/publish
   [4f8a9x2y] Auth token validated
   [4f8a9x2y] Article updated in database
   [4f8a9x2y] Cache purge successful for 3 URL(s)
   ```

4. If you see errors, note the request ID and debug per Scenario 1

### First 24 Hours

- [ ] Publish at least 1 article
- [ ] Verify it appears on reader site within 1 minute
- [ ] Check Cloudflare Logs for errors
- [ ] Monitor cache hit ratio (should be high for reads)

### Weekly (Ongoing)

- [ ] Check **Analytics** → **Performance** in Dashboard
  - If slow (>500ms), check D1 query performance
- [ ] Check **Worker** → **Logs** for errors
  - Unexpected patterns = investigate
- [ ] Try publishing from different network (home WiFi, cellular)
  - Test mobile IP changes don't break rate limiting

---

## Request ID Format

### How It's Generated

```typescript
// 8 chars from timestamp + 8 chars random = 16 chars total
const timestamp = Date.now().toString(36).slice(-8);  // "4f8a"
const random = Math.random().toString(36).slice(2, 10); // "9x2y..."
return `${timestamp}${random}`;  // "4f8a9x2y"
```

### Why 16 Characters?

- ✅ Short enough to type/remember
- ✅ Low collision probability (~1 in 1 trillion)
- ✅ Time-sortable (debug tool can show latest first)
- ✅ Human-readable (hex-like characters)

---

## Logs: Where They Go

### Cloudflare Worker Logs

**Access:**
1. Dashboard → **Workers & Pages**
2. Select **writer-api**
3. Click **Logs** (real-time stream)

**Shows:**
- All Worker executions
- console.log() / console.error() output
- Request/response metadata
- Duration and status

**Retention:**
- FREE tier: 100 most recent logs
- Older logs: Dropped
- No long-term log storage without paid plan

### Manual Export (If Needed)

Cloudflare doesn't provide automated export on FREE tier. If you need historical logs:

**Option 1: Use Tail Command** (if you have dev machine)
```bash
wrangler tail --env production
# Streams logs in real-time while running
```

**Option 2: Manual Screenshots**
- Take screenshots of Dashboard Logs for your records
- Date/time + request ID = searchable archive

### Example Logs

**Successful Publish:**
```
2025-02-02T12:34:56.789Z [4f8a9x2y] POST /api/admin/articles/42/publish
2025-02-02T12:34:57.012Z [4f8a9x2y] Auth token validated
2025-02-02T12:34:57.034Z [4f8a9x2y] Cache purge successful for 3 URL(s)
2025-02-02T12:34:57.045Z [4f8a9x2y] Response: 200 OK
```

**Failed Publish (Rate Limited):**
```
2025-02-02T12:34:58.123Z [4f8a9x3z] POST /api/admin/articles/42/publish
2025-02-02T12:34:58.124Z [4f8a9x3z] Rate limit exceeded for 203.0.113.45:admin:write: 31/30
2025-02-02T12:34:58.125Z [4f8a9x3z] Response: 429 Too Many Requests
```

**Database Error:**
```
2025-02-02T12:34:59.456Z [4f8a9x4a] GET /api/admin/articles
2025-02-02T12:34:59.789Z [4f8a9x4a] Database error: SQLITE_CANTOPEN
2025-02-02T12:35:00.001Z [4f8a9x4a] Response: 500 Internal Server Error
```

---

## Performance Debugging

### Check Response Time

**In Network Tab (Browser DevTools):**
- Find request
- Look for **Duration** (total time)
- Look for **Wait** (time waiting for server)

**Expected times:**
- admin/articles GET: <100ms
- admin/articles POST/PUT: <200ms (includes database)
- public articles GET: <50ms (usually cached)

**If slow (>1000ms):**
1. Check dashboard network speed
2. Check D1 query performance
3. Check Worker CPU time in logs

### Check Cache Hit Ratio

**On Cloudflare Dashboard:**
1. Go to **Analytics** (or **Caching**)
2. Look for:
   - Cache Hit Ratio
   - Bytes Served (from cache)
   - Origin Requests

**Expected:**
- Public API: 80%+ cache hit
- Admin API: 0% cache (should be no-cache)

**If admin API showing cache hits:**
- ❌ BUG! Admin data is being cached!
- Check response headers: should have `Cache-Control: no-cache`
- See [Task 4: Admin Endpoint Cache Safety](../06_cache_strategy.md)

---

## Getting Help

### Quick Self-Diagnosis Flowchart

```
Publish fails?
├─ See "Unauthorized"?
│  └─ Check ADMIN_TOKEN set (Dashboard → Settings)
├─ See "Too many requests"?
│  └─ Wait 60 seconds, retry
├─ See "Article not found"?
│  └─ Verify article ID is correct
├─ See "Internal Server Error"?
│  └─ Get request ID → search logs
│  └─ Look for "Database error" or "Worker error"
└─ Published but readers don't see it?
   └─ Check if response has "cacheWarning"
   └─ If yes → Cache not cleared, wait 1 hour or manual purge
   └─ If no → Browser cache → hard refresh (Cmd+Shift+R)
```

### Information to Gather If Something Breaks

**Always collect:**
1. Request ID (from response or logs)
2. Error message (exact text)
3. What you did (clicked Publish? Refreshed?)
4. When it happened (date/time)
5. Your network (WiFi/cellular/VPN?)

**Example:**
> "Publish failed at 2025-02-02 12:34:56 UTC. Request ID: 4f8a9x2y. Error: 'Too many requests'. I'm on WiFi. I clicked Publish 5 times rapidly."

This info makes debugging 100x easier!

---

## Summary

| Task | How |
|------|-----|
| Find logs for a request | Use request ID in Dashboard → Logs |
| Check if cache cleared | Search logs for "Cache purge successful" |
| Debug 401 error | Check ADMIN_TOKEN set in Dashboard Settings |
| Debug 429 error | Wait 60 seconds, retry (rate limit reset) |
| Check response time | Use DevTools Network tab → Duration column |
| Manually purge cache | Dashboard → Caching → Purge by URL |
| Monitor health | Check Dashboard Logs regularly for errors |

**Pro tip:** Bookmark these pages:
- https://dash.cloudflare.com (for Logs, Settings, Cache)
- Your worker URL (for manual testing)
- This documentation (for reference)

Now you can debug from your phone like a pro! 🚀
