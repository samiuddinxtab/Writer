<script lang="ts">
  import { onMount } from 'svelte';
  import Header from './Header.svelte';
  import Sidebar from './Sidebar.svelte';
  import ArticlePage from './ArticlePage.svelte';
  import type { Article, Section } from '../lib/types';
  import { fetchArticleBySlug, fetchSectionArticles, fetchSections } from '../lib/api';

  type SidebarArticle = {
    id: number;
    title: string;
    slug: string;
    published_at: string;
    is_pinned: boolean;
  };

  let sections: Section[] = [];
  let currentSectionSlug: string | null = null;
  let currentArticleId: number | null = null;
  let currentArticle: Article | null = null;

  let pinnedArticles: SidebarArticle[] = [];
  let articlesBySectionSlug: Record<string, SidebarArticle[]> = {};

  let sidebarOpen = false;

  let loading = true;
  let error: string | null = null;

  async function loadSections() {
    sections = await fetchSections();
    currentSectionSlug = sections[0]?.slug ?? null;
  }

  async function loadArticlesForSection(sectionSlug: string) {
    const list = await fetchSectionArticles(sectionSlug);
    const normalized = list.map(a => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      published_at: a.published_at,
      is_pinned: Boolean(a.is_pinned)
    }));

    articlesBySectionSlug = { ...articlesBySectionSlug, [sectionSlug]: normalized };

    pinnedArticles = Object.values(articlesBySectionSlug)
      .flat()
      .filter(a => a.is_pinned)
      .sort((a, b) => {
        const ad = new Date(a.published_at).getTime();
        const bd = new Date(b.published_at).getTime();
        return bd - ad;
      });

    if (!currentArticleId && normalized.length > 0) {
      currentArticleId = normalized[0].id;
      currentArticle = await fetchArticleBySlug(normalized[0].slug);
    }
  }

  async function loadCurrentArticleById(articleId: number) {
    const all = Object.values(articlesBySectionSlug).flat();
    const item = all.find(a => a.id === articleId);
    if (!item) {
      return;
    }
    currentArticle = await fetchArticleBySlug(item.slug);
  }

  async function init() {
    loading = true;
    error = null;

    try {
      await loadSections();
      if (currentSectionSlug) {
        await loadArticlesForSection(currentSectionSlug);
      }
    } catch {
      error = 'Unable to load content. Try again.';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    void init();

    function handleResize() {
      if (window.innerWidth > 768) {
        sidebarOpen = false;
      }
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  async function handleArticleSelect(event: CustomEvent<{ articleId: number }>) {
    const articleId = event.detail.articleId;
    currentArticleId = articleId;

    try {
      await loadCurrentArticleById(articleId);
      error = null;
    } catch {
      error = 'Unable to load content. Try again.';
    }

    if (window.innerWidth <= 768) {
      sidebarOpen = false;
    }
  }

  function handleToggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }

  function handleOverlayClick() {
    sidebarOpen = false;
  }
</script>

<div class="app-layout" class:sidebar-open={sidebarOpen}>
  <Header
    title="مضامین کی کتاب"
    showToggle={true}
    on:toggle={handleToggleSidebar}
  />

  <div class="main-layout">
    <main class="content-area">
      {#if loading}
        <div class="loading-state" dir="rtl">
          <p>مضامین لوڈ ہو رہے ہیں...</p>
        </div>
      {:else if error}
        <div class="loading-state" dir="rtl">
          <p>{error}</p>
        </div>
      {:else if currentArticle}
        <ArticlePage
          article={currentArticle}
          {sections}
        />
      {:else}
        <div class="loading-state" dir="rtl">
          <p>Unable to load content. Try again.</p>
        </div>
      {/if}
    </main>

    <Sidebar
      {sections}
      {currentArticleId}
      {pinnedArticles}
      {articlesBySectionSlug}
      isOpen={sidebarOpen}
      on:articleSelect={handleArticleSelect}
      on:overlayClick={handleOverlayClick}
    />
  </div>

  {#if sidebarOpen}
    <div
      class="mobile-overlay"
      on:click={handleOverlayClick}
      on:keydown={(e) => e.key === 'Escape' && handleOverlayClick()}
      role="button"
      tabindex="0"
      aria-label="Sidebar بند کریں"
    ></div>
  {/if}
</div>

<style>
  .app-layout {
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .main-layout {
    display: flex;
    height: calc(100vh - 60px);
    position: relative;
    overflow: hidden;
  }

  .content-area {
    flex: 1;
    overflow-y: auto;
    background: var(--color-bg);
    transition: margin-right 0.3s ease-in-out;
  }

  .loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 400px;
    text-align: center;
    color: var(--color-text-muted);
    font-size: 1.1rem;
  }

  .mobile-overlay {
    display: none;
    position: fixed;
    top: 60px;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 200;
  }

  @media (max-width: 768px) {
    .main-layout {
      position: relative;
    }

    .content-area {
      margin-right: 0;
      transition: none;
    }

    .mobile-overlay {
      display: block;
    }

    .sidebar-open .content-area {
      /* Optional: dim content when sidebar is open */
    }
  }

  @media (min-width: 769px) {
    .content-area {
      margin-right: 0;
    }
  }

  @media (prefers-contrast: high) {
    .loading-state {
      color: black;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .content-area {
      transition: none;
    }
  }
</style>
