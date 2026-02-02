interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Rate limiting configuration
// These limits are RELAXED for mobile maintainer (phone can disconnect/reconnect = new IP)
// Production: Consider implementing via Cloudflare Rate Limiting dashboard rules instead
const WINDOW_MS = 60 * 1000; // 60 seconds
const ADMIN_WRITE_LIMIT = 30; // 30 POST/PUT/DELETE per minute (admin publishing flow)
const ADMIN_READ_LIMIT = 100; // 100 GET requests per minute (listing articles)
const PUBLIC_READ_LIMIT = 200; // 200 GET requests per minute (public API)

/**
 * IMPORTANT: This in-memory rate limiter has limitations:
 * 1. Resets on Worker restart (may allow bursts after deploy)
 * 2. Cannot distinguish between mobile admin and bot (both same IP behind VPN/mobile)
 * 3. Free tier doesn't scale across edge locations
 *
 * Preferred approach (production):
 * Use Cloudflare Dashboard → Security → Rate Limiting
 * - Rule 1: /api/admin/* → 10 requests/min per IP (blocks bots, allows admin)
 * - Rule 2: /api/* → 100 requests/min per IP (public API protection)
 *
 * For now, in-memory limiter is kept RELAXED to prevent admin lockout.
 */

function cleanupOldEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now >= entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

export function checkRateLimit(request: Request, endpoint: string): boolean {
  const clientIp = request.headers.get('CF-Connecting-IP') || 
                   request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() || 
                   'unknown';
  
  const method = request.method.toUpperCase();
  const isWrite = method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH';
  
  let limit: number;
  if (endpoint === 'admin') {
    limit = isWrite ? ADMIN_WRITE_LIMIT : ADMIN_READ_LIMIT;
  } else {
    limit = PUBLIC_READ_LIMIT;
  }
  
  const key = `${clientIp}:${endpoint}:${isWrite ? 'write' : 'read'}`;
  const now = Date.now();
  
  // Cleanup old entries periodically (simple approach)
  if (Math.random() < 0.1) {
    cleanupOldEntries();
  }
  
  const entry = rateLimitMap.get(key);
  
  if (!entry || now >= entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + WINDOW_MS });
    return true;
  }
  
  if (entry.count >= limit) {
    console.log(`Rate limit exceeded for ${key}: ${entry.count}/${limit}`);
    return false;
  }
  
  entry.count++;
  return true;
}

export function getRateLimitInfo(request: Request, endpoint: string): { remaining: number; resetMs: number } {
  const clientIp = request.headers.get('CF-Connecting-IP') || 
                   request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() || 
                   'unknown';
  
  const method = request.method.toUpperCase();
  const isWrite = method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH';
  
  let limit: number;
  if (endpoint === 'admin') {
    limit = isWrite ? ADMIN_WRITE_LIMIT : ADMIN_READ_LIMIT;
  } else {
    limit = PUBLIC_READ_LIMIT;
  }
  
  const key = `${clientIp}:${endpoint}:${isWrite ? 'write' : 'read'}`;
  const now = Date.now();
  
  const entry = rateLimitMap.get(key);
  
  if (!entry || now >= entry.resetTime) {
    return { remaining: limit, resetMs: WINDOW_MS };
  }
  
  return {
    remaining: Math.max(0, limit - entry.count),
    resetMs: entry.resetTime - now,
  };
}
