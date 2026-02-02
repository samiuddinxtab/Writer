import type { Env } from './auth';

export interface PurgeCacheResult {
  success: boolean;
  error?: string;
  warning?: string; // Indicates publish succeeded but cache may be stale
}

export async function purgeCache(urls: string[], env: Env, requestId?: string): Promise<PurgeCacheResult> {
  const prefix = requestId ? `[${requestId}]` : '';

  if (!env.CF_ZONE_ID || !env.CF_API_TOKEN) {
    const msg = 'Cache purge not configured (CF_ZONE_ID or CF_API_TOKEN missing)';
    console.warn(`${prefix} ${msg}`);
    return {
      success: false,
      error: msg,
      warning: 'Cache may be stale for up to 1 hour. Consider setting CF_API_TOKEN and CF_ZONE_ID.',
    };
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${env.CF_ZONE_ID}/purge_cache`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.CF_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files: urls }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = `Cache purge API failed: ${response.status}`;
      console.error(`${prefix} ${msg}`, errorData);
      return {
        success: false,
        error: msg,
        warning: 'Article published, but cache purge failed. Cache may be stale for up to 1 hour.',
      };
    }

    const data = await response.json() as Record<string, unknown>;
    console.log(`${prefix} Cache purge successful for ${urls.length} URL(s):`, urls, data);
    return { success: true };
  } catch (error) {
    const msg = `Cache purge error: ${String(error)}`;
    console.error(`${prefix} ${msg}`);
    return {
      success: false,
      error: msg,
      warning: 'Article published, but cache purge failed. Cache may be stale for up to 1 hour.',
    };
  }
}

export function getArticleCacheUrls(
  baseUrl: string,
  articleSlug: string,
  sectionSlug?: string
): string[] {
  const urls: string[] = [
    `${baseUrl}/api/articles/${encodeURIComponent(articleSlug)}`,
    `${baseUrl}/`, // homepage/sidebar
  ];
  
  if (sectionSlug) {
    urls.push(`${baseUrl}/api/sections/${encodeURIComponent(sectionSlug)}/articles`);
  }
  
  return urls;
}
