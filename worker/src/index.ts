export interface Env {
  DB: D1Database;
  ADMIN_TOKEN?: string;
}
type JsonValue = Record<string, unknown> | unknown[];
type JsonInit = ResponseInit & {
  headers?: HeadersInit;
  cacheSeconds?: number;
};
function jsonResponse(body: JsonValue, init: JsonInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (typeof init.cacheSeconds === 'number') {
    headers.set('Cache-Control', `public, max-age=${init.cacheSeconds}`);
  }
  const { cacheSeconds: _cacheSeconds, ...rest } = init;
  return new Response(JSON.stringify(body), { ...rest, headers });
}
function jsonError(status: number, message: string): Response {
  return jsonResponse({ error: message, status }, { status });
}
function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}
function isValidAdminToken(_token: string, _env: Env): boolean {
  return _token.length > 0;
}
function requireAuth(request: Request, env: Env): { success: boolean; token?: string; response?: Response } {
  const token = extractBearerToken(request);
  if (!token) {
    return { success: false, response: jsonError(401, 'Unauthorized: Bearer token required') };
  }
  if (!isValidAdminToken(token, env)) {
    return { success: false, response: jsonError(401, 'Unauthorized: Invalid token') };
  }
  return { success: true, token };
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    try {
      if (pathname.startsWith('/api/admin/')) {
        if (pathname === '/api/admin/articles' && request.method === 'GET') {
          const auth = requireAuth(request, env);
          if (!auth.success) return auth.response!;
          const mockArticles = [
            { id: 1, title: 'Sample Article 1', updated_at: new Date().toISOString(), section: { id: 1, name: 'Section 1' } },
            { id: 2, title: 'Sample Article 2', updated_at: new Date(Date.now() - 86400000).toISOString(), section: { id: 1, name: 'Section 1' } }
          ];
          return jsonResponse(mockArticles, { status: 200 });
        }
        if (pathname === '/api/admin/articles' && request.method === 'POST') {
          const auth = requireAuth(request, env);
          if (!auth.success) return auth.response!;
          const now = new Date().toISOString();
          return jsonResponse({ id: Math.floor(Math.random() * 1000000), createdAt: now, updatedAt: now }, { status: 201 });
        }
        const articleUpdateMatch = pathname.match(/^\/api\/admin\/articles\/(\d+)\/?$/);
        if (articleUpdateMatch && request.method === 'PUT') {
          const auth = requireAuth(request, env);
          if (!auth.success) return auth.response!;
          const articleId = parseInt(articleUpdateMatch[1], 10);
          return jsonResponse({ id: articleId, updatedAt: new Date().toISOString() }, { status: 200 });
        }
        return jsonError(404, 'Not Found');
      }
      if (request.method !== 'GET') {
        return jsonError(405, 'Method Not Allowed');
      }
      if (pathname === '/api/sections') {
        const result = await env.DB.prepare('SELECT id, name, slug, order_index FROM sections ORDER BY order_index ASC').all();
        return jsonResponse((result.results ?? []) as unknown[], { status: 200, cacheSeconds: 3600 });
      }
      const sectionArticlesMatch = pathname.match(/^\/api\/sections\/([^/]+)\/articles\/?$/);
      if (sectionArticlesMatch) {
        const sectionSlug = decodeURIComponent(sectionArticlesMatch[1]);
        const section = await env.DB.prepare('SELECT id, name, slug FROM sections WHERE slug = ?1 LIMIT 1')
          .bind(sectionSlug)
          .first<{ id: number; name: string; slug: string }>();
        if (!section) {
          return jsonError(404, 'Section not found');
        }
        const articles = await env.DB.prepare(`SELECT id, title, slug, published_at, is_pinned FROM articles WHERE section_id = ?1 ORDER BY is_pinned DESC, published_at DESC`)
          .bind(section.id)
          .all();
        return jsonResponse((articles.results ?? []) as unknown[], { status: 200, cacheSeconds: 3600 });
      }
      const articleMatch = pathname.match(/^\/api\/articles\/([^/]+)\/?$/);
      if (articleMatch) {
        const articleSlug = decodeURIComponent(articleMatch[1]);
        const article = await env.DB.prepare(`SELECT a.id, a.title, a.slug, a.excerpt, a.content, a.section_id, s.name as section_name, s.slug as section_slug, a.published_at, a.updated_at, a.is_pinned FROM articles a JOIN sections s ON s.id = a.section_id WHERE a.slug = ?1 LIMIT 1`)
          .bind(articleSlug)
          .first<{ id: number; title: string; slug: string; excerpt: string | null; content: string; section_id: number; section_name: string; section_slug: string; published_at: string | null; updated_at: string | null; is_pinned: number | boolean; }>();
        if (!article) {
          return jsonError(404, 'Article not found');
        }
        const payload = {
          id: article.id,
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt ?? undefined,
          content: article.content,
          section_id: article.section_id,
          section: { name: article.section_name, slug: article.section_slug },
          published_at: article.published_at,
          updated_at: article.updated_at,
          is_pinned: Boolean(article.is_pinned)
        };
        return jsonResponse(payload as Record<string, unknown>, { status: 200, cacheSeconds: 3600 });
      }
      return jsonError(404, 'Not Found');
    } catch {
      if (pathname === '/api/sections') {
        return jsonError(500, 'Failed to fetch sections');
      }
      return jsonError(500, 'Internal Server Error');
    }
  }
};
