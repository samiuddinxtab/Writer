<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '../stores/authStore';
  import { editorStore } from '../stores/editorStore';
  import AdminLogin from './AdminLogin.svelte';
  import AdminHeader from './AdminHeader.svelte';
  import AdminArticleList from './AdminArticleList.svelte';
  import AdminEditor from './AdminEditor.svelte';
  type View = 'login' | 'list' | 'editor';
  let currentView: View = 'login';
  let selectedArticleId: number | null = null;
  onMount(() => {
    authStore.init();
    const token = authStore.getToken();
    if (token) {
      currentView = 'list';
    }
  });
  function handleLogin() {
    currentView = 'list';
  }
  function handleLogout() {
    editorStore.reset();
    currentView = 'login';
  }
  function handleNewArticle() {
    selectedArticleId = null;
    editorStore.reset();
    currentView = 'editor';
  }
  function handleEditArticle(articleId: number) {
    selectedArticleId = articleId;
    editorStore.reset();
    currentView = 'editor';
  }
  function handleBackToList() {
    editorStore.reset();
    currentView = 'list';
    selectedArticleId = null;
  }
</script>

<div class="admin-layout">
  {#if currentView === 'login'}
    <AdminLogin onLogin={handleLogin} />
  {:else}
    <AdminHeader onLogout={handleLogout} />
    {#if currentView === 'list'}
      <AdminArticleList onNewArticle={handleNewArticle} onEditArticle={handleEditArticle} />
    {:else if currentView === 'editor'}
      <AdminEditor articleId={selectedArticleId} onBack={handleBackToList} />
    {/if}
  {/if}
</div>

<style>
  .admin-layout {
    min-height: 100vh;
    background: var(--color-bg);
  }
</style>
