export interface Env {
  DB: D1Database;
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method !== 'GET') {
      return jsonError(405, 'Method Not Allowed');
    }

    try {
      if (url.pathname === '/api/sections') {
        const result = await env.DB.prepare(
          'SELECT id, name, slug, order_index FROM sections ORDER BY order_index ASC'
        ).all();

        return jsonResponse((result.results ?? []) as unknown[], { status: 200, cacheSeconds: 3600 });
      }

      const sectionArticlesMatch = url.pathname.match(
        /^\/api\/sections\/([^/]+)\/articles\/?$/
      );
      if (sectionArticlesMatch) {
        const sectionSlug = decodeURIComponent(sectionArticlesMatch[1]);

        const section = await env.DB.prepare(
          'SELECT id, name, slug FROM sections WHERE slug = ?1 LIMIT 1'
        )
          .bind(sectionSlug)
          .first<{ id: number; name: string; slug: string }>();

        if (!section) {
          return jsonError(404, 'Section not found');
        }

        const articles = await env.DB.prepare(
          `SELECT id, title, slug, published_at, is_pinned
           FROM articles
           WHERE section_id = ?1
           ORDER BY is_pinned DESC, published_at DESC`
        )
          .bind(section.id)
          .all();

        return jsonResponse((articles.results ?? []) as unknown[], { status: 200, cacheSeconds: 3600 });
      }

      const articleMatch = url.pathname.match(/^\/api\/articles\/([^/]+)\/?$/);
      if (articleMatch) {
        const articleSlug = decodeURIComponent(articleMatch[1]);

        const article = await env.DB.prepare(
          `SELECT a.id, a.title, a.slug, a.excerpt, a.content, a.section_id,
                  s.name as section_name, s.slug as section_slug,
                  a.published_at, a.updated_at, a.is_pinned
           FROM articles a
           JOIN sections s ON s.id = a.section_id
           WHERE a.slug = ?1
           LIMIT 1`
        )
          .bind(articleSlug)
          .first<{
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
          section: {
            name: article.section_name,
            slug: article.section_slug
          },
          published_at: article.published_at,
          updated_at: article.updated_at,
          is_pinned: Boolean(article.is_pinned)
        };

        return jsonResponse(payload as Record<string, unknown>, { status: 200, cacheSeconds: 3600 });
      }

      return jsonError(404, 'Not Found');
    } catch {
      if (url.pathname === '/api/sections') {
        return jsonError(500, 'Failed to fetch sections');
      }
      return jsonError(500, 'Internal Server Error');
    }
  }
};
