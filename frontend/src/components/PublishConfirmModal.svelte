<script lang="ts">
  export let isOpen = false;
  export let isPublishing = false;
  export let onConfirm: () => void = () => {};
  export let onCancel: () => void = () => {};

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget && !isPublishing) {
      onCancel();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && !isPublishing) {
      onCancel();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div 
    class="modal-backdrop" 
    on:click={handleBackdropClick}
    role="dialog"
    aria-modal="true"
    aria-labelledby="publish-modal-title"
  >
    <div class="modal-content">
      <h2 id="publish-modal-title" class="modal-title">Publish Article?</h2>
      <p class="modal-message">
        Are you sure? This will make the article public and visible to all readers.
      </p>
      <div class="modal-actions">
        <button 
          type="button" 
          class="btn btn-cancel" 
          on:click={onCancel}
          disabled={isPublishing}
        >
          Cancel
        </button>
        <button 
          type="button" 
          class="btn btn-publish" 
          on:click={onConfirm}
          disabled={isPublishing}
        >
          {#if isPublishing}
            Publishing...
          {:else}
            Publish
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal-content {
    background: var(--color-bg);
    border-radius: 0.5rem;
    padding: 1.5rem;
    max-width: 400px;
    width: 100%;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  }

  .modal-title {
    margin: 0 0 0.75rem;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .modal-message {
    margin: 0 0 1.5rem;
    font-size: 0.95rem;
    color: var(--color-text-muted);
    line-height: 1.5;
  }

  .modal-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
  }

  .btn {
    padding: 0.625rem 1.25rem;
    border-radius: 0.375rem;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-cancel {
    background: var(--color-bg-secondary);
    color: var(--color-text);
    border: 1px solid var(--color-border);
  }

  .btn-cancel:hover:not(:disabled) {
    background: var(--color-bg-tertiary);
  }

  .btn-publish {
    background: var(--color-primary);
    color: white;
  }

  .btn-publish:hover:not(:disabled) {
    background: var(--color-primary-dark);
  }

  @media (max-width: 480px) {
    .modal-actions {
      flex-direction: column-reverse;
    }

    .btn {
      width: 100%;
    }
  }
</style>
