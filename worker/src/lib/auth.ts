export interface Env {
  DB: D1Database;
  ADMIN_TOKEN?: string;
  CF_ACCOUNT_ID?: string;
  CF_API_TOKEN?: string;
  CF_ZONE_ID?: string;
}

export function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function validateToken(request: Request, env: Env): boolean {
  const token = extractBearerToken(request);
  if (!token) return false;
  if (!env.ADMIN_TOKEN) return false;
  return constantTimeCompare(token, env.ADMIN_TOKEN);
}

export interface AuthResult {
  success: boolean;
  token?: string;
  response?: Response;
}

export function requireAuth(request: Request, env: Env, jsonError: (status: number, message: string) => Response): AuthResult {
  const token = extractBearerToken(request);
  if (!token) {
    return { success: false, response: jsonError(401, 'Unauthorized') };
  }
  if (!env.ADMIN_TOKEN || !constantTimeCompare(token, env.ADMIN_TOKEN)) {
    return { success: false, response: jsonError(401, 'Unauthorized') };
  }
  return { success: true, token };
}
