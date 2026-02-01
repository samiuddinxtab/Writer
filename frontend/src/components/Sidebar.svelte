<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Section } from '../lib/types';

  type SidebarArticle = {
    id: number;
    title: string;
    slug: string;
    published_at: string;
    is_pinned: boolean;
    excerpt?: string;
  };

  const dispatch = createEventDispatcher();

  export let sections: Section[] = [];
  export let currentArticleId: number | null = null;
  export let isOpen: boolean = false;

  export let pinnedArticles: SidebarArticle[] = [];
  export let articlesBySectionSlug: Record<string, SidebarArticle[]> = {};

  function selectArticle(articleId: number) {
    dispatch('articleSelect', { articleId });
  }
  
  function formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ur-PK', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }
</script>

<aside 
  class="sidebar" 
  class:sidebar-open={isOpen}
  dir="rtl"
  role="navigation"
  aria-label="Articles navigation"
>
  <div class="sidebar-content">
    <!-- Pinned Articles Section -->
    {#if pinnedArticles.length > 0}
      <section class="sidebar-section">
        <h2 class="pinned-articles-title">مضامین کی فہرست</h2>
        <ul class="pinned-articles-list">
          {#each pinnedArticles as article}
            <li class="pinned-article-item">
              <button
                class="pinned-article-link"
                class:active={article.id === currentArticleId}
                on:click={() => selectArticle(article.id)}
                aria-current={article.id === currentArticleId ? 'page' : undefined}
              >
                <div class="pinned-article-title">{article.title}</div>
                <div class="pinned-article-date">{formatDate(article.published_at)}</div>
              </button>
            </li>
          {/each}
        </ul>
      </section>
    {/if}
    
    <!-- Sections and Articles -->
    {#each sections as section}
      <section class="sidebar-section">
        <div class="section-group">
          <header class="section-header">
            <h3 class="section-name">{section.name}</h3>
          </header>
          
          {#if articlesBySectionSlug[section.slug] && articlesBySectionSlug[section.slug].length > 0}
            <ul class="section-articles">
              {#each articlesBySectionSlug[section.slug] as article}
                <li class="section-article-item">
                  <button
                    class="section-article-link"
                    class:active={article.id === currentArticleId}
                    on:click={() => selectArticle(article.id)}
                    aria-current={article.id === currentArticleId ? 'page' : undefined}
                  >
                    <div class="section-article-title">{article.title}</div>
                    <div class="section-article-date">{formatDate(article.published_at)}</div>
                  </button>
                </li>
              {/each}
            </ul>
          {:else}
            <p class="no-articles">اس سیکشن میں کوئی مضامین نہیں ہیں</p>
          {/if}
        </div>
      </section>
    {/each}
  </div>
</aside>

<!-- Mobile Overlay -->
{#if isOpen}
  <div 
    class="sidebar-overlay" 
    on:click={() => dispatch('overlayClick')}
    on:keydown={(e) => e.key === 'Escape' && dispatch('overlayClick')}
    role="button" 
    tabindex="0"
    aria-label="Sidebar بند کریں"
  ></div>
{/if}

<style>
  .sidebar {
    width: 320px;
    height: 100%;
    background: var(--color-bg);
    border-left: 1px solid var(--color-border);
    overflow-y: auto;
    position: relative;
    padding: 1.5rem;
    box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  }
  
  .sidebar-content {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  .sidebar-section {
    margin-bottom: 0;
  }
  
  .pinned-articles-title {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--color-primary);
    margin-bottom: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    text-align: center;
    padding: 0.75rem;
    background: var(--color-bg-secondary);
    border-radius: 0.375rem;
    border: 1px solid var(--color-primary);
  }
  
  .pinned-articles-list,
  .section-articles {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  
  .pinned-article-item,
  .section-article-item {
    margin-bottom: 0.5rem;
  }
  
  .pinned-article-link,
  .section-article-link {
    width: 100%;
    text-align: right;
    background: none;
    border: none;
    padding: 1rem;
    cursor: pointer;
    border-radius: 0.375rem;
    transition: all 0.2s ease;
    font-size: 0.95rem;
    line-height: 1.6;
    color: var(--color-text);
    display: block;
    position: relative;
  }
  
  .pinned-article-link:hover,
  .section-article-link:hover {
    background: var(--color-bg-secondary);
    transform: translateX(-2px);
  }
  
  .pinned-article-link.active,
  .section-article-link.active {
    background: var(--color-highlight);
    color: var(--color-text);
    font-weight: 500;
    border-right: 3px solid var(--color-primary);
  }
  
  .pinned-article-title,
  .section-article-title {
    font-size: 0.9rem;
    line-height: 1.5;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }
  
  .pinned-article-excerpt,
  .section-article-excerpt {
    font-size: 0.8rem;
    color: var(--color-text-muted);
    line-height: 1.4;
    margin-bottom: 0.5rem;
  }
  
  .pinned-article-date,
  .section-article-date {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
  }
  
  .section-group {
    margin-bottom: 1.5rem;
  }
  
  .section-header {
    padding: 0.75rem 1rem;
    background: var(--color-bg-secondary);
    border-radius: 0.375rem;
    margin-bottom: 0.75rem;
    border: 1px solid var(--color-border);
  }
  
  .section-name {
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--color-text);
    margin: 0;
    text-align: center;
  }
  
  .no-articles {
    text-align: center;
    color: var(--color-text-muted);
    font-size: 0.9rem;
    padding: 1rem;
    font-style: italic;
  }
  
  .sidebar-overlay {
    display: none;
    position: fixed;
    top: 60px;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 200;
  }
  
  /* Mobile Responsive */
  @media (max-width: 768px) {
    .sidebar {
      position: fixed;
      top: 60px;
      right: -320px;
      width: 320px;
      height: calc(100vh - 60px);
      z-index: 300;
      transition: right 0.3s ease-in-out;
    }
    
    .sidebar-open {
      right: 0;
    }
    
    .sidebar-open ~ .sidebar-overlay {
      display: block;
    }
    
    .sidebar-overlay {
      display: none;
    }
    
    .sidebar-content {
      gap: 1.5rem;
    }
    
    .pinned-article-link,
    .section-article-link {
      min-height: 44px;
      padding: 1rem;
    }
  }
  
  /* Touch target sizing */
  @media (max-width: 768px) {
    .pinned-article-link,
    .section-article-link {
      min-height: 44px;
      padding: 1rem;
    }
  }
  
  /* Smooth animations */
  @media (prefers-reduced-motion: reduce) {
    .pinned-article-link,
    .section-article-link {
      transition: none;
    }
  }
</style>