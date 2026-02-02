# Rate Limiting Strategy

## Overview

Rate limiting protects your API from:
- ✅ Bot spam
- ✅ DDoS attacks (basic)
- ✅ Accidental abuse (infinite loops in client)

This document explains the current setup and how to upgrade as your app scales.

---

## Current Setup: In-Memory Limiter

### Why In-Memory?
- ✅ Zero cost (no KV database needed)
- ✅ Works on FREE tier
- ✅ No external dependencies
- ❌ Resets on Worker restart
- ❌ Not shared across edge locations

### Current Limits

| Endpoint | Method | Limit | Window |
|----------|--------|-------|--------|
| `/api/admin/*` | POST/PUT/DELETE | 30/min | Per IP |
| `/api/admin/*` | GET | 100/min | Per IP |
| `/api/*` (public) | GET | 200/min | Per IP |

**For mobile maintainer:** Limits are RELAXED (30 writes/min) to account for:
- Mobile IP changes (reconnects = different IP)
- Multiple retry attempts on network issues
- Publishing workflow edge cases

---

## Scenarios: When You Might Hit Limits

### Scenario 1: Publishing Workflow (Normal)
```
1. You draft an article (GET /api/admin/articles)
2. You save it (PUT /api/admin/articles/:id) → 1 request
3. You preview (GET /api/admin/articles/:id) → 1 request
4. You publish (POST /api/admin/articles/:id/publish) → 1 request
Total: 3 requests in 5 seconds = ✅ Safe (30/min limit)
```

### Scenario 2: Network Reconnect (Normal)
```
Your phone switches from WiFi to cellular → New IP
Rate limit counter resets for new IP → ✅ No lockout
```

### Scenario 3: Rapid Retries (Rare)
```
You hit publish, then quickly hit it 25 times (network error anxiety)
25 POST requests in 60 seconds → ✅ Still safe (limit is 30/min)
```

### Scenario 4: Hitting the Limit
```
You publish 31 times in 60 seconds → ❌ 429 Too Many Requests
When: Almost never happens in real usage
What you see: Error message from frontend
How to fix: Wait ~30 seconds, retry
```

---

## How It Works (Technical)

### Per-Request Flow

```
1. Request arrives at Worker
2. Extract client IP from CF-Connecting-IP header
3. Create key: "{IP}:{endpoint}:{read|write}"
4. Check if key exists in in-memory Map
5. If exists and not expired:
   - Increment counter
   - If counter > limit → Return 429
6. If expired or doesn't exist:
   - Reset counter to 1
   - Allow request ✅
7. Log if limit exceeded
```

### Data Structure (simplified)
```typescript
rateLimitMap = {
  "203.0.113.45:admin:write": { count: 5, resetTime: 1704067260000 },
  "198.51.100.12:admin:read": { count: 45, resetTime: 1704067200000 },
  // ... one entry per IP per endpoint per method type
}
```

### Cleanup
- Every 10% of requests, old entries are cleaned up
- Prevents memory leak
- Happens automatically (you don't configure it)

---

## Limitations (Important!)

### 1. Resets on Restart
**Problem:** If your Worker restarts (e.g., after deploy), rate limit counters reset.

**Scenario:**
```
Time 12:00:00 - You publish 20 articles (counter = 20/30)
Time 12:00:15 - New version deployed → Worker restarts
Time 12:00:16 - Counter resets to 0
Time 12:00:20 - You publish 15 more (counter = 15/30)
Total: 35 publishes in 20 seconds, but never hit the 30/min limit!
```

**Risk:** Very low for mobile maintainer (you're not bulk publishing). Acceptable for FREE tier.

### 2. Per-IP Only
**Problem:** Cannot distinguish between:
- ✅ You (mobile admin)
- ❌ Bot attacking from same IP (behind VPN)

**Solution for future:** Use API token in rate limit key (see "Future Improvements" below).

### 3. No Edge Sharing
**Problem:** Each Cloudflare edge location has its own in-memory limiter.

**Scenario:**
```
Request from USA edge → Rate limit counter: 10/30
Request from EU edge (same IP) → Rate limit counter: 0/30 (separate memory)
Total: Same IP hit both edges, but limits don't sync
```

**Risk:** Very low for single mobile maintainer from single location.

---

## When You Get 429 (Rate Limited)

### What You See (Frontend)
```
Error message: "Too many requests. Please wait a moment."
```

### What Happened
```
POST /api/admin/articles/:id/publish
→ 429 Too Many Requests
→ Article was NOT published (request rejected before DB change)
→ You must wait and retry
```

### How Long to Wait
- **Reset window:** 60 seconds
- **Safe to retry after:** ~30 seconds (to be safe)
- **Exact time:** Visible in `resetMs` field if you inspect network tab

### Testing Rate Limit (Don't Do This in Prod!)
```bash
# This will hit the limit on request #31
for i in {1..35}; do
  curl -X POST https://your-worker.dev/api/admin/articles/1/publish \
    -H "Authorization: Bearer YOUR_TOKEN" &
  sleep 0.1
done
```

---

## Upgrading: Cloudflare Dashboard Rate Limiting

### When to Upgrade
- [ ] You have >100 articles
- [ ] You publish >20 articles/day
- [ ] You want enterprise-grade protection

### How to Upgrade (Future Task)

**Step 1: Set up in Cloudflare Dashboard**
1. Go to https://dash.cloudflare.com
2. Select your domain
3. **Security** → **Rate Limiting**
4. Click **Create Rate Limiting Rule**

**Step 2: Create Admin Rule**
- URL path: `/api/admin/articles/*/publish`
- Limit: 10 requests per minute
- Action: Block (429) or Challenge (CAPTCHA)
- Apply to: All regions

**Step 3: Create Public API Rule**
- URL path: `/api/*` (but NOT `/api/admin/*`)
- Limit: 100 requests per minute
- Action: Block

**Step 4: Remove In-Memory Limiter**
- Delete `rateLimit.ts` checks from Worker code
- Let Cloudflare Dashboard handle it

**Benefits:**
- ✅ Shared across all edge locations
- ✅ Applies to all Worker restarts
- ✅ Can use CAPTCHA challenge instead of hard block
- ✅ Better visibility in Dashboard analytics
- ❌ Requires paid or Enterprise plan (for advanced features)

### Dashboard Rate Limiting on FREE Tier
- ✅ Can create rules (limited to 3 rules)
- ✅ Basic rate limiting (10 rules per domain)
- ❌ CAPTCHA challenge not available
- ❌ No analytics/reporting

---

## Preventing Admin Lockout

### Multi-Layer Approach

**Layer 1: High Limits**
- Admin write limit: 30/min (very generous for mobile)
- Admin read limit: 100/min
- Unlikely to hit in normal usage

**Layer 2: IP Change = Reset**
- Mobile phone reconnects → New IP → Counter resets
- Most common way to unlock yourself

**Layer 3: Time-Based Reset**
- After 60 seconds, limit resets automatically
- Max wait time: ~90 seconds (60 limit window + 30 sec buffer)

**Layer 4: Worker Restart**
- New deploy → Counter resets
- If truly stuck, deployment can "unlock" you (not recommended for this reason!)

---

## Monitoring & Debugging

### Where to Check Rate Limits

**Cloudflare Worker Logs:**
```
Dashboard → Writer API → Logs
Look for: "Rate limit exceeded for {key}: {count}/{limit}"
```

**Example Log:**
```
Rate limit exceeded for 203.0.113.45:admin:write: 31/30
```

**Interpretation:**
- IP: 203.0.113.45 (your phone)
- Endpoint: admin
- Method: write (POST/PUT/DELETE)
- You exceeded 30-per-minute limit

### Testing Limits Locally

```bash
# Start worker in dev mode
wrangler dev --env production

# Make 31 requests to admin endpoint
for i in {1..31}; do
  curl -X POST http://localhost:8787/api/admin/articles/1/publish \
    -H "Authorization: Bearer test-token"
  echo "Request $i status: $?"
done

# You should see 429 on request #31+
```

---

## Summary Table

| Aspect | Current (Free Tier) | Future (Upgraded) |
|--------|-------------------|------------------|
| **Implementation** | In-memory Map | Cloudflare Dashboard |
| **Persistence** | Lost on restart | Persistent |
| **Scope** | Per-edge-location | Global |
| **Admin limit** | 30 writes/min | 10-20 writes/min (stricter) |
| **Cost** | $0 | $0-$200/month (advanced) |
| **Mobile-friendly** | ✅ Yes (relaxed) | ✅ Yes (with CAPTCHA) |

---

## Checklist for Production

- [x] In-memory limiter limits are RELAXED (30/min admin, not 10/min)
- [x] Admin lockout is unlikely (3x normal workflow)
- [x] Limits reset on IP change (mobile-friendly)
- [x] Rate limit failures are explicit (429 response)
- [x] Logs include rate limit hits (for debugging)
- [ ] Consider Dashboard rules after launch (for scale)
- [ ] Monitor real-world hit rates in first 2 weeks

---

## Quick Reference: Limits

```
Admin write (POST/PUT/DELETE):  30 per minute per IP
Admin read (GET):               100 per minute per IP
Public read (GET):              200 per minute per IP
```

Hitting these limits = Wait ~60 seconds and retry. Nearly impossible in normal usage.
