<script lang="ts">
  import { renderContent } from '../lib/contentRenderer';
  import type { Article, Section } from '../data/mockData';
  import { sections as allSections } from '../data/mockData';
  
  export let article: Article;
  export let sections: Section[] = allSections;
  
  // Find the section for this article
  $: articleSection = sections.find(section => section.id === article.section_id);
  
  function formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ur-PK', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  }
  
  function formatPublishedDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ur-PK', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  }
</script>

<article class="article-page" dir="rtl" lang="ur">
  <header class="article-header">
    <h1 class="article-title">{article.title}</h1>
    
    <div class="article-meta">
      <div class="meta-item">
        <span class="meta-label">تاریخ:</span>
        <time class="meta-value" datetime={article.published_at}>
          {formatPublishedDate(article.published_at)}
        </time>
      </div>
      
      {#if articleSection}
        <div class="meta-item">
          <span class="meta-label">سیکشن:</span>
          <span class="meta-value section-name">{articleSection.name}</span>
        </div>
      {/if}
      
      {#if article.is_pinned}
        <div class="meta-item">
          <span class="meta-label pinned-badge">مقفل</span>
        </div>
      {/if}
    </div>
  </header>
  
  <div class="article-content">
    {@html renderContent(article.content)}
  </div>
  
  <footer class="article-footer">
    <div class="article-navigation">
      <p class="navigation-hint">
        مضمون کے اختتام پر آپ کی رائے اہم ہے۔
      </p>
    </div>
  </footer>
</article>

<style>
  .article-page {
    max-width: 70ch;
    margin: 0 auto;
    padding: 2rem 1rem;
    background: var(--color-bg);
    line-height: 1.8;
  }
  
  .article-header {
    margin-bottom: 2rem;
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 1.5rem;
  }
  
  .article-title {
    font-size: 2.5rem;
    font-weight: 400;
    color: var(--color-text);
    line-height: 1.4;
    margin-bottom: 1.5rem;
    text-align: right;
    font-family: 'Noto Nastaliq Urdu', 'Amiri', serif;
  }
  
  .article-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
    font-size: 0.9rem;
    color: var(--color-text-secondary);
  }
  
  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .meta-label {
    font-weight: 500;
    color: var(--color-text-muted);
  }
  
  .meta-value {
    color: var(--color-text);
  }
  
  .section-name {
    background: var(--color-bg-secondary);
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.85rem;
  }
  
  .pinned-badge {
    background: var(--color-primary);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.8rem;
    font-weight: 500;
  }
  
  .article-content {
    font-size: 1.125rem;
    line-height: 2;
    color: var(--color-text);
    font-family: 'Noto Nastaliq Urdu', 'Amiri', serif;
  }
  
  .article-content :global(h2) {
    font-size: 1.75rem;
    margin-top: 2.5rem;
    margin-bottom: 1.25rem;
    color: var(--color-text);
    border-bottom: 2px solid var(--color-primary);
    padding-bottom: 0.5rem;
    font-weight: 500;
  }
  
  .article-content :global(p) {
    margin-bottom: 1.75rem;
    text-align: justify;
  }
  
  .article-content :global(ul) {
    margin: 1.75rem 0;
    padding-right: 2rem;
  }
  
  .article-content :global(li) {
    margin-bottom: 0.75rem;
    line-height: 1.9;
    position: relative;
  }
  
  .article-content :global(li::before) {
    content: "•";
    color: var(--color-primary);
    font-weight: bold;
    position: absolute;
    right: -1.5rem;
  }
  
  .article-content :global(blockquote) {
    margin: 2.5rem 0;
    padding: 1.5rem 2rem;
    background: var(--color-bg-secondary);
    border-right: 4px solid var(--color-primary);
    border-radius: 0 0.5rem 0.5rem 0;
    font-style: italic;
    color: var(--color-text-secondary);
    position: relative;
  }
  
  .article-content :global(blockquote::before) {
    content: """;
    font-size: 3rem;
    color: var(--color-primary);
    position: absolute;
    top: -0.5rem;
    right: 1rem;
    opacity: 0.3;
  }
  
  .article-content :global(blockquote p) {
    margin-bottom: 0;
    font-size: 1.1rem;
    line-height: 1.8;
  }
  
  .article-footer {
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid var(--color-border);
  }
  
  .article-navigation {
    text-align: center;
  }
  
  .navigation-hint {
    color: var(--color-text-muted);
    font-size: 0.9rem;
    font-style: italic;
    margin: 0;
  }
  
  /* Mobile Responsive */
  @media (max-width: 768px) {
    .article-page {
      padding: 1.5rem 1rem;
    }
    
    .article-title {
      font-size: 2rem;
      margin-bottom: 1.25rem;
    }
    
    .article-meta {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }
    
    .article-content {
      font-size: 1rem;
      line-height: 1.9;
    }
    
    .article-content :global(h2) {
      font-size: 1.5rem;
      margin-top: 2rem;
      margin-bottom: 1rem;
    }
    
    .article-content :global(p) {
      margin-bottom: 1.5rem;
      text-align: right;
    }
    
    .article-content :global(ul) {
      padding-right: 1.5rem;
    }
    
    .article-content :global(blockquote) {
      margin: 2rem 0;
      padding: 1.25rem 1.5rem;
    }
  }
  
  /* Print Styles */
  @media print {
    .article-page {
      max-width: none;
      padding: 0;
      font-size: 12pt;
      line-height: 1.6;
    }
    
    .article-title {
      font-size: 18pt;
      color: black;
      page-break-after: avoid;
    }
    
    .article-meta {
      color: black;
      font-size: 10pt;
    }
    
    .article-content {
      font-size: 11pt;
      color: black;
    }
    
    .article-content :global(h2) {
      font-size: 14pt;
      color: black;
      page-break-after: avoid;
    }
    
    .article-content :global(p) {
      page-break-inside: avoid;
    }
    
    .article-footer {
      display: none;
    }
  }
  
  /* High Contrast Mode */
  @media (prefers-contrast: high) {
    .article-title,
    .article-content {
      color: black;
    }
    
    .article-meta {
      color: black;
    }
    
    .section-name {
      border: 1px solid black;
    }
    
    .pinned-badge {
      background: black;
      color: white;
    }
  }
</style>