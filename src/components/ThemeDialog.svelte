<script lang="ts">
  import { onMount } from 'svelte';
  import BaseDialog from './BaseDialog.svelte';
  import { availableThemes, getTheme, setTheme } from '$lib/dialogs/theme';

  let { isOpen = $bindable(false) } = $props();

  let currentTheme = $state(getTheme());

  const themes = availableThemes;

  onMount(() => {
    applyTheme(getTheme());
  });

  function applyTheme(themeId: string) {
    setTheme(themeId);
    currentTheme = getTheme();
  }
</script>

<BaseDialog bind:isOpen title="Choose Your Realm" width="600px" zIndex={9999}>
  <div class="content">
    <p class="description">Select a mystical theme for your character sheet</p>
    
    <div class="theme-grid">
      {#each themes as theme}
        <button 
          class="theme-card" 
          class:selected={currentTheme === theme.id}
          onclick={() => applyTheme(theme.id)}
        >
          <div class="theme-preview">
            {#each theme.colors as color}
              <div class="color-swatch" style="background-color: {color}"></div>
            {/each}
          </div>
          <div class="theme-info">
            <h3>{theme.name}</h3>
            <p>{theme.description}</p>
          </div>
          {#if currentTheme === theme.id}
            <div class="selected-indicator">✓</div>
          {/if}
        </button>
      {/each}
    </div>
  </div>
</BaseDialog>

<style>
  .content {
    padding: 2rem;
  }

  .description {
    text-align: center;
    color: var(--ink-dim);
    margin: 0 0 2rem 0;
    font-style: italic;
    font-size: 1.1rem;
  }

  .theme-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }

  .theme-card {
    position: relative;
    background: linear-gradient(145deg, var(--ground-lift), var(--ground-raised));
    border: 2px solid var(--sheen-soft);
    border-radius: 15px;
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: left;
    overflow: hidden;
  }

  .theme-card:hover {
    border-color: var(--metal);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px var(--shade-soft);
  }

  .theme-card.selected {
    border-color: var(--metal);
    background: linear-gradient(145deg, color-mix(in srgb, var(--metal) 12%, transparent), color-mix(in srgb, var(--metal) 6%, transparent));
    box-shadow: 0 0 20px color-mix(in srgb, var(--metal) 32%, transparent);
  }

  .theme-preview {
    display: flex;
    gap: 8px;
    margin-bottom: 1rem;
  }

  .color-swatch {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 2px solid var(--sheen-strong);
    box-shadow: 0 2px 8px var(--shade-soft);
  }

  .theme-info h3 {
    margin: 0 0 0.5rem 0;
    color: var(--ink);
    font-size: 1.3rem;
    font-weight: 600;
  }

  .theme-info p {
    margin: 0;
    color: var(--ink-faint);
    font-size: 0.9rem;
    line-height: 1.4;
  }

  .selected-indicator {
    position: absolute;
    top: 15px;
    right: 15px;
    background: var(--metal);
    color: black;
    width: 25px;
    height: 25px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 0.9rem;
  }

  @media (max-width: 640px) {
    .content {
      padding: 1rem;
    }
    
    .theme-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
