<script lang="ts">
  import SidebarToggle from './SidebarToggle.svelte';
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let title: string = 'مضامین کی کتاب';
  export let showToggle: boolean = true;
  
  function handleToggle() {
    dispatch('toggle');
  }
</script>

<header class="header" dir="rtl">
  <div class="header-content">
    <a href="/" class="header-logo">
      <span class="logo-text">{title}</span>
    </a>
    
    {#if showToggle}
      <SidebarToggle on:toggle={handleToggle} />
    {/if}
  </div>
</header>

<style>
  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }
  
  .logo-text {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text);
  }
  
  .header-logo {
    display: flex;
    align-items: center;
    text-decoration: none;
    color: inherit;
  }
  
  .header-logo:hover .logo-text {
    color: var(--color-primary);
  }
</style>