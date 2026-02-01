<script lang="ts">
  import { authStore } from '../stores/authStore';
  export let onLogout: () => void = () => {};
  function handleLogout() {
    authStore.logout();
    onLogout();
  }
</script>

<header class="admin-header" dir="ltr">
  <div class="header-left">
    <span class="header-title">Admin: Writer</span>
  </div>
  <div class="header-right">
    <button class="logout-button" on:click={handleLogout}>
      <span class="logout-text">Logout</span>
      <svg class="logout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
    </button>
  </div>
</header>

<style>
  .admin-header {
    height: 60px;
    background: var(--color-bg);
    border-bottom: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1.5rem;
    position: sticky;
    top: 0;
    z-index: 100;
    backdrop-filter: blur(10px);
    background: rgba(254, 254, 254, 0.95);
  }
  .header-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--color-text);
  }
  .logout-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: 0.375rem;
    color: var(--color-text-secondary);
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .logout-button:hover {
    background: var(--color-bg-secondary);
    color: var(--color-error);
    border-color: var(--color-error);
  }
  .logout-icon {
    width: 18px;
    height: 18px;
  }
  @media (max-width: 768px) {
    .admin-header {
      padding: 0 1rem;
    }
    .logout-text {
      display: none;
    }
    .logout-button {
      padding: 0.5rem;
    }
    .logout-icon {
      width: 20px;
      height: 20px;
    }
  }
</style>
