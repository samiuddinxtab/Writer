import { writable } from 'svelte/store';
import type { Article } from '../lib/types';

export interface EditorState {
  currentArticle: Article | null;
  title: string;
  content: string;
  isLoading: boolean;
  isSaving: boolean;
  saveError: string | null;
  lastLocalSave: Date | null;
  lastRemoteSave: Date | null;
}

const initialState: EditorState = {
  currentArticle: null,
  title: '',
  content: '',
  isLoading: false,
  isSaving: false,
  saveError: null,
  lastLocalSave: null,
  lastRemoteSave: null
};

function createEditorStore() {
  const { subscribe, set, update } = writable<EditorState>(initialState);

  return {
    subscribe,
    set,
    update,
    reset: () => set(initialState),
    setArticle: (article: Article | null) => {
      update(state => ({
        ...state,
        currentArticle: article,
        title: article?.title ?? '',
        content: article?.content ?? ''
      }));
    },
    setTitle: (title: string) => {
      update(state => ({ ...state, title }));
    },
    setContent: (content: string) => {
      update(state => ({ ...state, content }));
    },
    setLoading: (isLoading: boolean) => {
      update(state => ({ ...state, isLoading }));
    },
    setSaving: (isSaving: boolean) => {
      update(state => ({ ...state, isSaving }));
    },
    setSaveError: (saveError: string | null) => {
      update(state => ({ ...state, saveError }));
    },
    setLastLocalSave: (date: Date) => {
      update(state => ({ ...state, lastLocalSave: date }));
    },
    setLastRemoteSave: (date: Date) => {
      update(state => ({ ...state, lastRemoteSave: date }));
    }
  };
}

export const editorStore = createEditorStore();
