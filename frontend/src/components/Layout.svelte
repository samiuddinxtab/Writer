<script lang="ts">
  import { onMount } from 'svelte';
  import Header from './Header.svelte';
  import Sidebar from './Sidebar.svelte';
  import ArticlePage from './ArticlePage.svelte';
  import type { Article, Section } from '../data/mockData';
  import { articles, sections as allSections } from '../data/mockData';
  
  export let sections: Section[] = allSections;
  
  let currentArticleId: string | null = null;
  let sidebarOpen = false;
  let currentArticle: Article | null = null;
  
  // Default to the first article
  onMount(() => {
    if (articles.length > 0) {
      currentArticleId = articles[0].id;
      currentArticle = articles[0];
    }
  });
  
  // Update current article when ID changes
  $: if (currentArticleId) {
    currentArticle = articles.find(article => article.id === currentArticleId) || null;
  }
  
  function handleArticleSelect(event: CustomEvent<{ articleId: string }>) {
    currentArticleId = event.detail.articleId;
    // Close sidebar on mobile after selection
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
  
  // Handle window resize
  function handleResize() {
    if (window.innerWidth > 768) {
      sidebarOpen = false;
    }
  }
  
  onMount(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });
</script>

<div class="app-layout" class:sidebar-open={sidebarOpen}>
  <Header 
    title="مضامین کی کتاب" 
    showToggle={true}
    on:toggle={handleToggleSidebar}
  />
  
  <div class="main-layout">
    <main class="content-area">
      {#if currentArticle}
        <ArticlePage 
          article={currentArticle} 
          {sections}
        />
      {:else}
        <div class="loading-state" dir="rtl">
          <p>مضامین لوڈ ہو رہے ہیں...</p>
        </div>
      {/if}
    </main>
    
    <Sidebar 
      {sections}
      {currentArticleId}
      isOpen={sidebarOpen}
      on:articleSelect={handleArticleSelect}
      on:overlayClick={handleOverlayClick}
    />
  </div>
  
  <!-- Mobile Overlay -->
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
  
  /* Mobile Responsive */
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
  
  /* Desktop layout */
  @media (min-width: 769px) {
    .content-area {
      margin-right: 0;
    }
  }
  
  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .loading-state {
      color: black;
    }
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .content-area {
      transition: none;
    }
  }
</style>