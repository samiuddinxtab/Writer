import { authStore } from '../stores/authStore';

export interface PublishResult {
  id: number;
  title: string;
  slug: string;
  published_at: string;
  updated_at: string;
  status: string;
}

export interface PublishError {
  error: string;
  status: number;
}

function getAuthHeaders(): Record<string, string> {
  const token = authStore.getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
}

export async function publishArticle(
  articleId: number,
  publishedAt?: string
): Promise<PublishResult> {
  const body = publishedAt ? { published_at: publishedAt } : {};

  const res = await fetch(`/api/admin/articles/${articleId}/publish`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    throw new PublishErrorWithCode('Unauthorized. Please log in again.', 401);
  }

  if (res.status === 404) {
    throw new PublishErrorWithCode('Article not found.', 404);
  }

  if (res.status === 429) {
    throw new PublishErrorWithCode('Too many requests. Please wait a moment.', 429);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Publish failed. Try again.' })) as PublishError;
    throw new PublishErrorWithCode(err.error || 'Publish failed. Try again.', res.status);
  }

  return res.json() as Promise<PublishResult>;
}

export class PublishErrorWithCode extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'PublishErrorWithCode';
    this.status = status;
  }
}
