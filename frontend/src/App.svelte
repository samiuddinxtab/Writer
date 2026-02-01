<script lang="ts">
  import { onMount } from 'svelte';
  import Layout from './components/Layout.svelte';
  import AdminLayout from './components/AdminLayout.svelte';
  let currentRoute: 'app' | 'admin' = 'app';
  function updateRoute() {
    const hash = window.location.hash;
    if (hash.startsWith('#/admin')) {
      currentRoute = 'admin';
    } else {
      currentRoute = 'app';
    }
  }
  onMount(() => {
    updateRoute();
    window.addEventListener('hashchange', updateRoute);
    return () => window.removeEventListener('hashchange', updateRoute);
  });
</script>

<main>
  {#if currentRoute === 'admin'}
    <AdminLayout />
  {:else}
    <Layout />
  {/if}
</main>

<style>
  :global(html) {
    font-family: 'Noto Nastaliq Urdu', 'Amiri', serif;
    direction: rtl;
  }
  :global(body) {
    margin: 0;
    padding: 0;
    min-height: 100vh;
    background: var(--color-bg);
    color: var(--color-text);
  }
  main {
    min-height: 100vh;
  }
</style>
