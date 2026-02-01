<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { editorStore } from '../stores/editorStore';
  import { handlePaste } from '../lib/pasteHandler';
  import { triggerAutosave, clearAutosaveTimers, resetAutosave, loadDraft } from '../lib/autosave';
  import { createNewDraft, type DraftArticle } from '../lib/storage';
  import { fetchArticleBySlug } from '../lib/api';
  import Toast from './Toast.svelte';
  export let articleId: number | null = null;
  export let onBack: () => void = () => {};
  let textareaElement: HTMLTextAreaElement;
  let toastMessage: string | null = null;
  let statusText = 'Ready';
  let statusClass = 'status-ready';
  $: title = $editorStore.title;
  $: content = $editorStore.content;
  $: isLoading = $editorStore.isLoading;
  $: isSaving = $editorStore.isSaving;
  $: saveError = $editorStore.saveError;
  $: lastLocalSave = $editorStore.lastLocalSave;
  $: lastRemoteSave = $editorStore.lastRemoteSave;
  $: {
    if (isSaving) {
      statusText = 'Saving...';
      statusClass = 'status-saving';
    } else if (saveError) {
      statusText = 'Error';
      statusClass = 'status-error';
    } else if (lastRemoteSave) {
      statusText = 'Saved';
      statusClass = 'status-saved';
    } else {
      statusText = 'Ready';
      statusClass = 'status-ready';
    }
  }
  onMount(() => {
    void loadArticle();
    return () => { clearAutosaveTimers(); };
  });
  onDestroy(() => { resetAutosave(); });
  async function loadArticle() {
    editorStore.setLoading(true);
    try {
      let draft: DraftArticle | null = null;
      if (articleId) {
        draft = await loadDraft(String(articleId));
        if (!draft) {
          try {
            const article = await fetchArticleBySlug(String(articleId));
            draft = {
              id: String(article.id),
              title: article.title,
              content: article.content,
              section_id: article.section_id,
              updated_at: article.updated_at,
              articleSlug: article.slug
            };
          } catch {
            draft = createNewDraft(String(articleId));
          }
        }
      } else {
        draft = await loadDraft('new-draft');
        if (!draft) {
          draft = createNewDraft();
        }
      }
      editorStore.setTitle(draft.title);
      editorStore.setContent(draft.content);
    } catch (error) {
      console.error('Failed to load article:', error);
      const draft = createNewDraft(articleId ? String(articleId) : undefined);
      editorStore.setTitle(draft.title);
      editorStore.setContent(draft.content);
    } finally {
      editorStore.setLoading(false);
    }
  }
  function getCurrentDraft(): DraftArticle {
    return {
      id: articleId ? String(articleId) : 'new-draft',
      title: $editorStore.title,
      content: $editorStore.content,
      section_id: 1,
      updated_at: new Date().toISOString()
    };
  }
  function handleTitleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    editorStore.setTitle(target.value);
    triggerAutosave(getCurrentDraft());
  }
  function handleContentInput() {
    if (textareaElement) {
      editorStore.setContent(textareaElement.value);
      triggerAutosave(getCurrentDraft());
    }
  }
  function handlePasteEvent(event: ClipboardEvent) {
    if (!textareaElement) return;
    const result = handlePaste(event, textareaElement);
    if (result.hasImages && result.message) {
      toastMessage = result.message;
    }
    editorStore.setContent(textareaElement.value);
    triggerAutosave(getCurrentDraft());
  }
  function handleToastDismiss() {
    toastMessage = null;
  }
  let statusTimer: ReturnType<typeof setTimeout>;
  $: {
    if (statusText === 'Saved' || statusText === 'Error') {
      if (statusTimer) clearTimeout(statusTimer);
      statusTimer = setTimeout(() => {
        statusText = 'Ready';
        statusClass = 'status-ready';
      }, 2000);
    }
  }
</script>

<div class="editor-container" dir="ltr">
  {#if isLoading}
    <div class="loading-state">
      <p>Loading...</p>
    </div>
  {:else}
    <div class="editor-header">
      <button class="back-button" on:click={onBack}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        <span>Back</span>
      </button>
      <div class="title-input-wrapper">
        <label for="title-input" class="title-label">Title</label>
        <input
          id="title-input"
          type="text"
          class="title-input"
          value={title}
          on:input={handleTitleInput}
          placeholder="Enter article title..."
        />
      </div>
    </div>
    <div class="editor-body">
      <textarea
        bind:this={textareaElement}
        class="content-textarea"
        value={content}
        on:input={handleContentInput}
        on:paste={handlePasteEvent}
        placeholder="Paste or type Urdu text here..."
        dir="rtl"
        lang="ur"
        spellcheck="false"
      ></textarea>
    </div>
    <div class="editor-footer">
      <div class="footer-left">
        <span class="status-badge {statusClass}">{statusText}</span>
        {#if lastLocalSave}
          <span class="save-info">Local: {lastLocalSave.toLocaleTimeString()}</span>
        {/if}
      </div>
      <div class="footer-right">
        <span class="helper-text">Autosave active. Draft saved locally.</span>
      </div>
    </div>
  {/if}
</div>

{#if toastMessage}
  <Toast message={toastMessage} onDismiss={handleToastDismiss} />
{/if}

<style>
  .editor-container {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 60px);
    background: var(--color-bg);
  }
  .loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--color-text-muted);
    font-size: 1.1rem;
  }
  .editor-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg);
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .back-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 0.375rem;
    color: var(--color-text);
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }
  .back-button:hover {
    background: var(--color-bg-tertiary);
  }
  .back-button svg {
    width: 18px;
    height: 18px;
  }
  .title-input-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .title-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .title-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: 0.375rem;
    font-size: 1rem;
    font-family: inherit;
    background: var(--color-bg);
    color: var(--color-text);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }
  .title-input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
  }
  .editor-body {
    flex: 1;
    overflow: hidden;
    position: relative;
  }
  .content-textarea {
    width: 100%;
    height: 100%;
    padding: 1.5rem;
    border: none;
    outline: none;
    resize: none;
    font-family: 'Noto Nastaliq Urdu', 'Amiri', serif;
    font-size: 19px;
    line-height: 2;
    background: var(--color-bg);
    color: var(--color-text);
    overflow-y: auto;
  }
  .content-textarea::placeholder {
    color: var(--color-text-muted);
    opacity: 0.6;
  }
  .editor-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1.5rem;
    border-top: 1px solid var(--color-border);
    background: var(--color-bg-secondary);
    position: sticky;
    bottom: 0;
  }
  .footer-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .status-badge {
    padding: 0.25rem 0.625rem;
    border-radius: 0.25rem;
    font-size: 0.8rem;
    font-weight: 500;
    transition: all 0.3s ease;
  }
  .status-ready {
    background: var(--color-bg-tertiary);
    color: var(--color-text-muted);
  }
  .status-saving {
    background: var(--color-highlight);
    color: var(--color-primary-dark);
  }
  .status-saved {
    background: #c6f6d5;
    color: #22543d;
  }
  .status-error {
    background: #fed7d7;
    color: #c53030;
  }
  .save-info {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }
  .footer-right {
    display: flex;
    align-items: center;
  }
  .helper-text {
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }
  @media (max-width: 768px) {
    .editor-container {
      height: calc(100vh - 60px);
    }
    .editor-header {
      padding: 0.75rem 1rem;
      flex-direction: column;
      align-items: stretch;
      gap: 0.75rem;
    }
    .back-button {
      align-self: flex-start;
    }
    .content-textarea {
      padding: 1rem;
      font-size: 18px;
      line-height: 1.9;
    }
    .editor-footer {
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
    }
    .footer-left {
      width: 100%;
      justify-content: space-between;
    }
    .helper-text {
      font-size: 0.75rem;
    }
    .save-info {
      display: none;
    }
  }
  @media (prefers-contrast: high) {
    .content-textarea {
      border: 1px solid;
    }
  }
</style>
