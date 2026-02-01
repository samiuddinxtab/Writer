/**
 * IndexedDB storage for local draft autosave
 */

import type { Article } from './types';

export interface DraftArticle {
  id: string;
  title: string;
  content: string;
  section_id: number | null;
  updated_at: string;
  articleSlug?: string;
}

const DB_NAME = 'writer-drafts';
const DB_VERSION = 1;
const STORE_NAME = 'articles';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('updated_at', 'updated_at', { unique: false });
      }
    };
  });
}

export async function saveDraftLocal(article: DraftArticle): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const draft: DraftArticle = {
      ...article,
      updated_at: new Date().toISOString()
    };
    const request = store.put(draft);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
    transaction.oncomplete = () => db.close();
  });
}

export async function loadDraftLocal(id: string): Promise<DraftArticle | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const result = request.result as DraftArticle | undefined;
      resolve(result ?? null);
    };
    transaction.oncomplete = () => db.close();
  });
}

export async function deleteDraftLocal(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
    transaction.oncomplete = () => db.close();
  });
}

export async function loadAllDraftsLocal(): Promise<DraftArticle[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('updated_at');
    const request = index.openCursor(null, 'prev');
    const drafts: DraftArticle[] = [];
    request.onerror = () => reject(request.error);
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null;
      if (cursor) {
        drafts.push(cursor.value as DraftArticle);
        cursor.continue();
      } else {
        resolve(drafts);
      }
    };
    transaction.oncomplete = () => db.close();
  });
}

export function articleToDraft(article: Article): DraftArticle {
  return {
    id: String(article.id),
    title: article.title,
    content: article.content,
    section_id: article.section_id,
    updated_at: article.updated_at,
    articleSlug: article.slug
  };
}

export function createNewDraft(id?: string): DraftArticle {
  const now = new Date().toISOString();
  return {
    id: id ?? 'new-draft',
    title: '',
    content: '',
    section_id: null,
    updated_at: now
  };
}
