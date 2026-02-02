import { requireAuth, type Env } from './lib/auth';
import { purgeCache, getArticleCacheUrls } from './lib/cache';
import { checkRateLimit } from './lib/rateLimit';

export type { Env };

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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    try {
      // Admin endpoints
      if (pathname.startsWith('/api/admin/')) {
        // Rate limiting for admin endpoints
        if (!checkRateLimit(request, 'admin')) {
          return jsonError(429, 'Too Many Requests');
        }

        // GET /api/admin/articles - list all articles
        if (pathname === '/api/admin/articles' && request.method === 'GET') {
          const auth = requireAuth(request, env, jsonError);
          if (!auth.success) return auth.response!;

          const result = await env.DB.prepare(`
            SELECT a.id, a.title, a.slug, a.updated_at, a.published_at,
                   s.id as section_id, s.name as section_name
            FROM articles a
            JOIN sections s ON s.id = a.section_id
            ORDER BY a.updated_at DESC
          `).all();

          const articles = (result.results ?? []).map((row: Record<string, unknown>) => ({
            id: row.id,
            title: row.title,
            slug: row.slug,
            updated_at: row.updated_at,
            published_at: row.published_at,
            section: {
              id: row.section_id,
              name: row.section_name,
            },
          }));

          return jsonResponse(articles, { status: 200 });
        }

        // POST /api/admin/articles - create new article
        if (pathname === '/api/admin/articles' && request.method === 'POST') {
          const auth = requireAuth(request, env, jsonError);
          if (!auth.success) return auth.response!;

          const body = await request.json() as { title?: string; content?: string; section_id?: number };
          const { title, content, section_id } = body;

          if (!title || !content || !section_id) {
            return jsonError(400, 'Missing required fields: title, content, section_id');
          }

          const slug = generateSlug(title);
          const now = new Date().toISOString();

          const result = await env.DB.prepare(`
            INSERT INTO articles (title, slug, content, section_id, created_at, updated_at)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6)
          `).bind(title, slug, content, section_id, now, now).run();

          return jsonResponse({
            id: result.meta.last_row_id,
            slug,
            createdAt: now,
            updatedAt: now,
          }, { status: 201 });
        }

        // PUT /api/admin/articles/:id - update article
        const articleUpdateMatch = pathname.match(/^\/api\/admin\/articles\/(\d+)\/?$/);
        if (articleUpdateMatch && request.method === 'PUT') {
          const auth = requireAuth(request, env, jsonError);
          if (!auth.success) return auth.response!;

          const articleId = parseInt(articleUpdateMatch[1], 10);
          const body = await request.json() as { title?: string; content?: string; section_id?: number };
          const { title, content, section_id } = body;

          // Check if article exists
          const existing = await env.DB.prepare('SELECT id FROM articles WHERE id = ?1')
            .bind(articleId)
            .first();
          if (!existing) {
            return jsonError(404, 'Article not found');
          }

          const updates: string[] = [];
          const values: (string | number)[] = [];
          let paramIndex = 1;

          if (title !== undefined) {
            updates.push(`title = ?${paramIndex}`);
            values.push(title);
            paramIndex++;
          }
          if (content !== undefined) {
            updates.push(`content = ?${paramIndex}`);
            values.push(content);
            paramIndex++;
          }
          if (section_id !== undefined) {
            updates.push(`section_id = ?${paramIndex}`);
            values.push(section_id);
            paramIndex++;
          }

          const now = new Date().toISOString();
          updates.push(`updated_at = ?${paramIndex}`);
          values.push(now);
          paramIndex++;

          values.push(articleId);

          await env.DB.prepare(
            `UPDATE articles SET ${updates.join(', ')} WHERE id = ?${paramIndex}`
          ).bind(...values).run();

          return jsonResponse({ id: articleId, updatedAt: now }, { status: 200 });
        }

        // POST /api/admin/articles/:id/publish - publish article
        const publishMatch = pathname.match(/^\/api\/admin\/articles\/(\d+)\/publish\/?$/);
        if (publishMatch && request.method === 'POST') {
          const auth = requireAuth(request, env, jsonError);
          if (!auth.success) return auth.response!;

          const articleId = parseInt(publishMatch[1], 10);

          // Get article with section info
          const article = await env.DB.prepare(`
            SELECT a.id, a.title, a.slug, a.published_at, s.slug as section_slug
            FROM articles a
            JOIN sections s ON s.id = a.section_id
            WHERE a.id = ?1
          `).bind(articleId).first<{
            id: number;
            title: string;
            slug: string;
            published_at: string | null;
            section_slug: string;
          }>();

          if (!article) {
            return jsonError(404, 'Article not found');
          }

          // Parse optional published_at from request body
          let publishedAt: string;
          try {
            const body = await request.json() as { published_at?: string };
            publishedAt = body.published_at || new Date().toISOString();
          } catch {
            publishedAt = new Date().toISOString();
          }

          const now = new Date().toISOString();

          // Update article - set published_at only if not already published
          if (!article.published_at) {
            await env.DB.prepare(`
              UPDATE articles
              SET published_at = ?1, updated_at = ?2
              WHERE id = ?3
            `).bind(publishedAt, now, articleId).run();
          } else {
            // Already published, just update updated_at
            await env.DB.prepare(`
              UPDATE articles SET updated_at = ?1 WHERE id = ?2
            `).bind(now, articleId).run();
          }

          // Trigger cache invalidation (async, don't block response)
          const baseUrl = url.origin;
          const cacheUrls = getArticleCacheUrls(baseUrl, article.slug, article.section_slug);
          
          // Fire and forget - don't block the response on cache purge
          void purgeCache(cacheUrls, env).catch((err) => {
            console.error('Cache purge failed:', err);
          });

          return jsonResponse({
            id: articleId,
            title: article.title,
            slug: article.slug,
            published_at: article.published_at || publishedAt,
            updated_at: now,
            status: 'published',
          }, { status: 200 });
        }

        return jsonError(404, 'Not Found');
      }

      // Public endpoints - only GET allowed
      if (request.method !== 'GET') {
        return jsonError(405, 'Method Not Allowed');
      }

      // Rate limiting for public endpoints
      if (!checkRateLimit(request, 'public')) {
        return jsonError(429, 'Too Many Requests');
      }

      // GET /api/sections
      if (pathname === '/api/sections') {
        const result = await env.DB.prepare(
          'SELECT id, name, slug, order_index FROM sections ORDER BY order_index ASC'
        ).all();
        return jsonResponse((result.results ?? []) as unknown[], { status: 200, cacheSeconds: 3600 });
      }

      // GET /api/sections/:slug/articles
      const sectionArticlesMatch = pathname.match(/^\/api\/sections\/([^/]+)\/articles\/?$/);
      if (sectionArticlesMatch) {
        const sectionSlug = decodeURIComponent(sectionArticlesMatch[1]);
        const section = await env.DB.prepare(
          'SELECT id, name, slug FROM sections WHERE slug = ?1 LIMIT 1'
        ).bind(sectionSlug).first<{ id: number; name: string; slug: string }>();

        if (!section) {
          return jsonError(404, 'Section not found');
        }

        const articles = await env.DB.prepare(`
          SELECT id, title, slug, published_at, is_pinned
          FROM articles
          WHERE section_id = ?1 AND published_at IS NOT NULL
          ORDER BY is_pinned DESC, published_at DESC
        `).bind(section.id).all();

        return jsonResponse((articles.results ?? []) as unknown[], { status: 200, cacheSeconds: 3600 });
      }

      // GET /api/articles/:slug
      const articleMatch = pathname.match(/^\/api\/articles\/([^/]+)\/?$/);
      if (articleMatch) {
        const articleSlug = decodeURIComponent(articleMatch[1]);
        const article = await env.DB.prepare(`
          SELECT a.id, a.title, a.slug, a.excerpt, a.content, a.section_id,
                 s.name as section_name, s.slug as section_slug,
                 a.published_at, a.updated_at, a.is_pinned
          FROM articles a
          JOIN sections s ON s.id = a.section_id
          WHERE a.slug = ?1 AND a.published_at IS NOT NULL
          LIMIT 1
        `).bind(articleSlug).first<{
          id: number;
          title: string;
          slug: string;
          excerpt: string | null;
          content: string;
          section_id: number;
          section_name: string;
          section_slug: string;
          published_at: string | null;
          updated_at: string | null;
          is_pinned: number | boolean;
        }>();

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
          is_pinned: Boolean(article.is_pinned),
        };

        return jsonResponse(payload as Record<string, unknown>, { status: 200, cacheSeconds: 3600 });
      }

      return jsonError(404, 'Not Found');
    } catch (error) {
      console.error('Worker error:', error);
      if (pathname === '/api/sections') {
        return jsonError(500, 'Failed to fetch sections');
      }
      return jsonError(500, 'Internal Server Error');
    }
  },
};

function generateSlug(title: string): string {
  const timestamp = Date.now().toString(36);
  const sanitized = title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);
  return `${sanitized}-${timestamp}`;
}
