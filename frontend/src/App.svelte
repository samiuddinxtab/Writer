<script lang="ts">
  import Layout from './components/Layout.svelte';
</script>

<main>
  <Layout />
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
