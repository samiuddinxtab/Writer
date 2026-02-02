<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchAdminArticles } from '../lib/api';
  import type { AdminArticleListItem } from '../lib/types';

  export let onEditArticle: (articleId: number) => void = () => {};
  export let onNewArticle: () => void = () => {};

  let articles: AdminArticleListItem[] = [];
  let loading = true;
  let error: string | null = null;

  onMount(() => {
    void loadArticles();
  });

  async function loadArticles() {
    loading = true;
    error = null;
    try {
      articles = await fetchAdminArticles();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load articles';
    } finally {
      loading = false;
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function isPublished(article: AdminArticleListItem): boolean {
    return article.published_at !== null;
  }
</script>

<div class="article-list-container" dir="ltr">
  <div class="list-header">
    <h2 class="list-title">Articles</h2>
    <button class="new-article-button" on:click={onNewArticle}>
      <span class="button-icon">+</span>
      <span class="button-text">New Article</span>
    </button>
  </div>
  {#if loading}
    <div class="loading-state">
      <p>Loading articles...</p>
    </div>
  {:else if error}
    <div class="error-state">
      <p>{error}</p>
      <button class="retry-button" on:click={loadArticles}>Retry</button>
    </div>
  {:else if articles.length === 0}
    <div class="empty-state">
      <p>No articles yet.</p>
      <button class="retry-button" on:click={onNewArticle}>Create your first article</button>
    </div>
  {:else}
    <div class="articles-table">
      <div class="table-header">
        <span class="col-title">Title</span>
        <span class="col-section">Section</span>
        <span class="col-status">Status</span>
        <span class="col-date">Updated</span>
        <span class="col-action">Action</span>
      </div>
      <div class="table-body">
        {#each articles as article (article.id)}
          <div class="table-row" on:click={() => onEditArticle(article.id)} role="button" tabindex="0">
            <span class="col-title" title={article.title}>
              {article.title || '(Untitled)'}
            </span>
            <span class="col-section">{article.section.name}</span>
            <span class="col-status">
              {#if isPublished(article)}
                <span class="status-badge status-published">Published</span>
              {:else}
                <span class="status-badge status-draft">Draft</span>
              {/if}
            </span>
            <span class="col-date">{formatDate(article.updated_at)}</span>
            <span class="col-action">
              <button class="edit-button" on:click|stopPropagation={() => onEditArticle(article.id)}>
                Edit
              </button>
            </span>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .article-list-container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 1.5rem;
  }
  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  .list-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
  }
  .new-article-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  .new-article-button:hover {
    background: var(--color-primary-dark);
  }
  .button-icon {
    font-size: 1.1rem;
    line-height: 1;
  }
  .loading-state, .error-state, .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--color-text-muted);
  }
  .error-state p {
    color: var(--color-error);
    margin-bottom: 1rem;
  }
  .retry-button {
    padding: 0.5rem 1rem;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 0.375rem;
    color: var(--color-text);
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .retry-button:hover {
    background: var(--color-bg-tertiary);
  }
  .articles-table {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    overflow: hidden;
  }
  .table-header {
    display: grid;
    grid-template-columns: 2fr 1fr 100px 1fr 80px;
    gap: 1rem;
    padding: 0.75rem 1rem;
    background: var(--color-bg-secondary);
    border-bottom: 1px solid var(--color-border);
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .table-row {
    display: grid;
    grid-template-columns: 2fr 1fr 100px 1fr 80px;
    gap: 1rem;
    padding: 0.875rem 1rem;
    border-bottom: 1px solid var(--color-border);
    align-items: center;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }
  .table-row:last-child {
    border-bottom: none;
  }
  .table-row:hover {
    background: var(--color-bg-secondary);
  }
  .col-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--color-text);
    font-weight: 500;
  }
  .col-section {
    color: var(--color-text-secondary);
    font-size: 0.9rem;
  }
  .col-status {
    display: flex;
    align-items: center;
  }
  .status-badge {
    display: inline-block;
    padding: 0.2rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
  }
  .status-published {
    background: #c6f6d5;
    color: #22543d;
  }
  .status-draft {
    background: var(--color-bg-tertiary);
    color: var(--color-text-muted);
  }
  .col-date {
    color: var(--color-text-muted);
    font-size: 0.85rem;
  }
  .edit-button {
    padding: 0.375rem 0.75rem;
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: 0.25rem;
    color: var(--color-primary);
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .edit-button:hover {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }
  @media (max-width: 768px) {
    .article-list-container {
      padding: 1rem;
    }
    .list-header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }
    .list-title {
      font-size: 1.25rem;
    }
    .table-header {
      display: none;
    }
    .table-row {
      grid-template-columns: 1fr auto;
      gap: 0.5rem;
      padding: 1rem;
    }
    .col-title {
      grid-column: 1;
      font-size: 1rem;
      white-space: normal;
    }
    .col-status {
      grid-column: 2;
      grid-row: 1;
    }
    .col-section {
      grid-column: 1;
      grid-row: 2;
      font-size: 0.85rem;
    }
    .col-date {
      grid-column: 1;
      grid-row: 3;
      font-size: 0.8rem;
    }
    .col-action {
      grid-column: 2;
      grid-row: 2 / 4;
      display: flex;
      align-items: center;
    }
  }
</style>
