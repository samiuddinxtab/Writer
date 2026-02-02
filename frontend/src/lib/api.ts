import type { Article, Section, AdminArticleListItem, AdminArticleInput, AdminArticleResponse } from './types';
import { authStore } from '../stores/authStore';

const API_BASE = 'https://writer.samiuddinxtab.workers.dev';

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

export async function fetchSectionArticles(sectionSlug: string): Promise<SectionArticleListItem[]> {
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

function getAuthHeaders(): Record<string, string> {
  const token = authStore.getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
}

export async function fetchAdminArticles(): Promise<AdminArticleListItem[]> {
  const res = await fetch('/api/admin/articles', {
    headers: getAuthHeaders()
  });
  if (res.status === 401) {
    throw new Error('Unauthorized. Please log in again.');
  }
  if (!res.ok) {
    const err = await parseJson<{ error?: string }>(res).catch(() => ({}));
    throw new Error(err.error || 'Failed to load articles.');
  }
  return parseJson<AdminArticleListItem[]>(res);
}

export async function createAdminArticle(input: AdminArticleInput): Promise<AdminArticleResponse> {
  const res = await fetch('/api/admin/articles', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(input)
  });
  if (res.status === 401) {
    throw new Error('Unauthorized. Please log in again.');
  }
  if (!res.ok) {
    const err = await parseJson<{ error?: string }>(res).catch(() => ({}));
    throw new Error(err.error || 'Failed to create article.');
  }
  return parseJson<AdminArticleResponse>(res);
}

export async function updateAdminArticle(id: number, input: AdminArticleInput): Promise<AdminArticleResponse> {
  const res = await fetch(`/api/admin/articles/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(input)
  });
  if (res.status === 401) {
    throw new Error('Unauthorized. Please log in again.');
  }
  if (!res.ok) {
    const err = await parseJson<{ error?: string }>(res).catch(() => ({}));
    throw new Error(err.error || 'Failed to update article.');
  }
  return parseJson<AdminArticleResponse>(res);
}
