import type { Article, Section } from './types';

async function parseJson<T>(res: Response): Promise<T> {
  const data = (await res.json()) as T;
  return data;
}

export async function fetchSections(): Promise<Section[]> {
  const res = await fetch('/api/sections');
  if (!res.ok) {
    const err = await parseJson<{ error?: string }>(res).catch(() => ({}));
    throw new Error(err.error || 'Unable to load content. Try again.');
  }
  return parseJson<Section[]>(res);
}

export type SectionArticleListItem = {
  id: number;
  title: string;
  slug: string;
  published_at: string;
  is_pinned: boolean | number;
};

export async function fetchSectionArticles(
  sectionSlug: string
): Promise<SectionArticleListItem[]> {
  const res = await fetch(`/api/sections/${encodeURIComponent(sectionSlug)}/articles`);

  if (res.status === 404) {
    return [];
  }

  if (!res.ok) {
    const err = await parseJson<{ error?: string }>(res).catch(() => ({}));
    throw new Error(err.error || 'Unable to load content. Try again.');
  }

  return parseJson<SectionArticleListItem[]>(res);
}

export async function fetchArticleBySlug(articleSlug: string): Promise<Article> {
  const res = await fetch(`/api/articles/${encodeURIComponent(articleSlug)}`);

  if (res.status === 404) {
    throw new Error('Unable to load content. Try again.');
  }

  if (!res.ok) {
    const err = await parseJson<{ error?: string }>(res).catch(() => ({}));
    throw new Error(err.error || 'Unable to load content. Try again.');
  }

  return parseJson<Article>(res);
}
