<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '../stores/authStore';
  let token = '';
  let error = '';
  let isSubmitting = false;
  export let onLogin: () => void = () => {};
  onMount(() => {
    authStore.init();
    const existingToken = authStore.getToken();
    if (existingToken) {
      onLogin();
    }
  });
  function handleSubmit() {
    error = '';
    if (!token.trim()) {
      error = 'Please enter a token';
      return;
    }
    isSubmitting = true;
    authStore.login(token.trim());
    isSubmitting = false;
    onLogin();
  }
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleSubmit();
    }
  }
</script>

<div class="login-container" dir="ltr">
  <div class="login-card">
    <h1 class="login-title">Admin Login</h1>
    <p class="login-subtitle">Enter your Bearer token to access the editor</p>
    <div class="form-group">
      <label for="token-input" class="form-label">Bearer Token</label>
      <input
        id="token-input"
        type="password"
        class="form-input"
        class:error={!!error}
        bind:value={token}
        on:keydown={handleKeyDown}
        placeholder="Enter your token..."
        autocomplete="off"
        disabled={isSubmitting}
      />
      {#if error}
        <span class="error-message">{error}</span>
      {/if}
    </div>
    <button class="login-button" on:click={handleSubmit} disabled={isSubmitting}>
      {isSubmitting ? 'Logging in...' : 'Login'}
    </button>
  </div>
</div>

<style>
  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: var(--color-bg-secondary);
  }
  .login-card {
    background: var(--color-bg);
    padding: 2rem;
    border-radius: 0.75rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 400px;
  }
  .login-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: 0.5rem;
    text-align: center;
  }
  .login-subtitle {
    font-size: 0.9rem;
    color: var(--color-text-muted);
    margin-bottom: 1.5rem;
    text-align: center;
  }
  .form-group {
    margin-bottom: 1.5rem;
  }
  .form-label {
    display: block;
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--color-text);
    margin-bottom: 0.5rem;
  }
  .form-input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid var(--color-border);
    border-radius: 0.375rem;
    font-size: 1rem;
    font-family: inherit;
    background: var(--color-bg);
    color: var(--color-text);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }
  .form-input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
  }
  .form-input.error {
    border-color: var(--color-error);
  }
  .form-input:disabled {
    background: var(--color-bg-secondary);
    cursor: not-allowed;
  }
  .error-message {
    display: block;
    font-size: 0.8rem;
    color: var(--color-error);
    margin-top: 0.5rem;
  }
  .login-button {
    width: 100%;
    padding: 0.75rem 1rem;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 0.375rem;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  .login-button:hover:not(:disabled) {
    background: var(--color-primary-dark);
  }
  .login-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  @media (max-width: 768px) {
    .login-card {
      padding: 1.5rem;
    }
    .login-title {
      font-size: 1.25rem;
    }
  }
</style>
