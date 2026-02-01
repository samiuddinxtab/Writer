<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let isOpen: boolean = false;
  
  function toggleSidebar() {
    dispatch('toggle');
  }
</script>

<button 
  class="sidebar-toggle" 
  on:click={toggleSidebar}
  aria-label={isOpen ? 'Sidebar بند کریں' : 'Sidebar کھولیں'}
  aria-expanded={isOpen}
>
  <svg 
    class="hamburger-icon" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    stroke-width="2" 
    stroke-linecap="round" 
    stroke-linejoin="round"
  >
    {#if isOpen}
      <!-- Close icon -->
      <path d="M18 6L6 18M6 6l12 12"/>
    {:else}
      <!-- Hamburger icon -->
      <path d="M3 6h18M3 12h18M3 18h18"/>
    {/if}
  </svg>
</button>

<style>
  .sidebar-toggle {
    background: none;
    border: none;
    padding: 0.5rem;
    cursor: pointer;
    border-radius: 0.375rem;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    min-height: 44px;
  }
  
  .sidebar-toggle:hover {
    background: var(--color-bg-secondary);
  }
  
  .sidebar-toggle:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
  
  .hamburger-icon {
    width: 24px;
    height: 24px;
    stroke: var(--color-text);
    transition: all 0.2s ease;
  }
  
  .sidebar-toggle:hover .hamburger-icon {
    stroke: var(--color-primary);
  }
  
  /* Mobile-only visibility */
  @media (min-width: 769px) {
    .sidebar-toggle {
      display: none;
    }
  }
</style>