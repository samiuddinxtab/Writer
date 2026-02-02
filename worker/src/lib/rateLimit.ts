interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60 * 1000; // 60 seconds
const WRITE_LIMIT = 10; // 10 POST/PUT requests per minute
const READ_LIMIT = 100; // 100 GET requests per minute

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
  const limit = isWrite ? WRITE_LIMIT : READ_LIMIT;
  
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
  const limit = isWrite ? WRITE_LIMIT : READ_LIMIT;
  
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
