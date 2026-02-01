import { writable } from 'svelte/store';

const STORAGE_KEY = 'admin_token';

function createAuthStore() {
  const { subscribe, set, update } = writable<string | null>(null);

  return {
    subscribe,
    init: () => {
      if (typeof sessionStorage !== 'undefined') {
        const token = sessionStorage.getItem(STORAGE_KEY);
        if (token) {
          set(token);
        }
      }
    },
    login: (token: string) => {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(STORAGE_KEY, token);
      }
      set(token);
    },
    logout: () => {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(STORAGE_KEY);
      }
      set(null);
    },
    getToken: () => {
      if (typeof sessionStorage !== 'undefined') {
        return sessionStorage.getItem(STORAGE_KEY);
      }
      return null;
    }
  };
}

export const authStore = createAuthStore();
