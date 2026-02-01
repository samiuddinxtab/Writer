<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  export let message: string;
  export let duration: number = 3000;
  export let onDismiss: () => void = () => {};
  let visible = true;
  let timer: ReturnType<typeof setTimeout>;
  onMount(() => {
    timer = setTimeout(() => {
      visible = false;
      setTimeout(onDismiss, 300);
    }, duration);
  });
  onDestroy(() => {
    if (timer) clearTimeout(timer);
  });
</script>

<div class="toast" class:visible role="status" aria-live="polite">
  <span class="toast-message">{message}</span>
</div>

<style>
  .toast {
    position: fixed;
    bottom: 80px;
    left: 1rem;
    background: var(--color-text);
    color: var(--color-bg);
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    font-size: 0.9rem;
    z-index: 1000;
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.3s ease, transform 0.3s ease;
    max-width: 90vw;
    word-wrap: break-word;
  }
  .toast.visible {
    opacity: 1;
    transform: translateY(0);
  }
  @media (min-width: 769px) {
    .toast {
      bottom: 1.5rem;
      left: 1.5rem;
      max-width: 400px;
    }
  }
</style>
