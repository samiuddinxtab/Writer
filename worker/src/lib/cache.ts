import type { Env } from './auth';

export interface PurgeCacheResult {
  success: boolean;
  error?: string;
}

export async function purgeCache(urls: string[], env: Env): Promise<PurgeCacheResult> {
  if (!env.CF_ZONE_ID || !env.CF_API_TOKEN) {
    console.log('Cache purge skipped: CF_ZONE_ID or CF_API_TOKEN not configured');
    return { success: false, error: 'Cache purge not configured' };
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
      console.error('Cache purge failed:', errorData);
      return { success: false, error: 'Cache purge API call failed' };
    }

    console.log('Cache cleared for:', urls);
    return { success: true };
  } catch (error) {
    console.error('Cache purge error:', error);
    return { success: false, error: String(error) };
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
