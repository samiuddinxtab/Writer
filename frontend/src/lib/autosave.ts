import { authStore } from '../stores/authStore';
import { editorStore } from '../stores/editorStore';
import { saveDraftLocal, loadDraftLocal, deleteDraftLocal, type DraftArticle } from './storage';

const LOCAL_SAVE_DELAY = 3000;
const REMOTE_SAVE_DELAY = 10000;
const MAX_REMOTE_SAVE_DELAY = 15000;

interface AutosaveState {
  localTimer: ReturnType<typeof setTimeout> | null;
  remoteTimer: ReturnType<typeof setTimeout> | null;
  lastRemoteSaveAttempt: number;
  remoteRetryCount: number;
  isDirty: boolean;
}

const state: AutosaveState = {
  localTimer: null,
  remoteTimer: null,
  lastRemoteSaveAttempt: 0,
  remoteRetryCount: 0,
  isDirty: false
};

export function clearAutosaveTimers(): void {
  if (state.localTimer) {
    clearTimeout(state.localTimer);
    state.localTimer = null;
  }
  if (state.remoteTimer) {
    clearTimeout(state.remoteTimer);
    state.remoteTimer = null;
  }
}

export function resetAutosave(): void {
  clearAutosaveTimers();
  state.lastRemoteSaveAttempt = 0;
  state.remoteRetryCount = 0;
  state.isDirty = false;
}

function getApiUrl(): string {
  return '';
}

function getAuthHeaders(): Record<string, string> {
  const token = authStore.getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
}

async function performLocalSave(draft: DraftArticle): Promise<void> {
  try {
    await saveDraftLocal(draft);
    editorStore.setLastLocalSave(new Date());
    state.isDirty = true;
  } catch (error) {
    console.error('Local save failed:', error);
  }
}

async function performRemoteSave(draft: DraftArticle): Promise<boolean> {
  const token = authStore.getToken();
  if (!token) {
    editorStore.setSaveError('Not authenticated');
    return false;
  }
  editorStore.setSaving(true);
  editorStore.setSaveError(null);
  try {
    const isNewDraft = draft.id === 'new-draft';
    const url = isNewDraft
      ? `${getApiUrl()}/api/admin/articles`
      : `${getApiUrl()}/api/admin/articles/${draft.id}`;
    const method = isNewDraft ? 'POST' : 'PUT';
    const response = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify({
        title: draft.title,
        content: draft.content,
        section_id: draft.section_id ?? 1
      })
    });
    if (!response.ok) {
      if (response.status === 401) {
        editorStore.setSaveError('Authentication failed. Please log in again.');
        return false;
      }
      throw new Error(`Save failed: ${response.status}`);
    }
    const result = await response.json() as { id: number | string; updatedAt: string };
    if (isNewDraft && result.id) {
      await deleteDraftLocal('new-draft');
      draft.id = String(result.id);
      await saveDraftLocal(draft);
    }
    editorStore.setLastRemoteSave(new Date());
    state.remoteRetryCount = 0;
    state.isDirty = false;
    return true;
  } catch (error) {
    console.error('Remote save failed:', error);
    state.remoteRetryCount++;
    if (state.remoteRetryCount >= 3) {
      editorStore.setSaveError('Draft sync failed. Will try again.');
    }
    return false;
  } finally {
    editorStore.setSaving(false);
  }
}

function scheduleRemoteSave(draft: DraftArticle): void {
  if (state.remoteTimer) {
    clearTimeout(state.remoteTimer);
  }
  const timeSinceLastSave = Date.now() - state.lastRemoteSaveAttempt;
  const delay = Math.max(REMOTE_SAVE_DELAY - timeSinceLastSave, REMOTE_SAVE_DELAY);
  state.remoteTimer = setTimeout(() => {
    void (async () => {
      state.lastRemoteSaveAttempt = Date.now();
      const success = await performRemoteSave(draft);
      if (!success && state.remoteRetryCount < 3) {
        const retryDelay = Math.pow(2, state.remoteRetryCount) * 1000;
        setTimeout(() => { scheduleRemoteSave(draft); }, retryDelay);
      }
    })();
  }, Math.min(delay, MAX_REMOTE_SAVE_DELAY));
}

export function triggerAutosave(draft: DraftArticle): void {
  if (state.localTimer) {
    clearTimeout(state.localTimer);
  }
  state.localTimer = setTimeout(() => {
    void performLocalSave(draft);
  }, LOCAL_SAVE_DELAY);
  scheduleRemoteSave(draft);
}

export async function forceLocalSave(draft: DraftArticle): Promise<void> {
  if (state.localTimer) {
    clearTimeout(state.localTimer);
    state.localTimer = null;
  }
  await performLocalSave(draft);
}

export async function forceRemoteSave(draft: DraftArticle): Promise<boolean> {
  if (state.remoteTimer) {
    clearTimeout(state.remoteTimer);
    state.remoteTimer = null;
  }
  state.lastRemoteSaveAttempt = Date.now();
  return performRemoteSave(draft);
}

export async function loadDraft(id: string): Promise<DraftArticle | null> {
  return loadDraftLocal(id);
}

export async function deleteDraft(id: string): Promise<void> {
  return deleteDraftLocal(id);
}
