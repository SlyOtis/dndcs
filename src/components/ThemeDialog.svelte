<script lang="ts">
  import { onMount } from 'svelte';
  import BaseDialog from './BaseDialog.svelte';

  let { isOpen = $bindable(false) } = $props();

  let currentTheme = $state('medieval');

  const themes = [
    { id: 'medieval', name: 'Fantasy Medieval', description: 'Gold and bronze mystical realm', colors: ['#ffd700', '#ff6b35', '#8b5a2b'] },
    { id: 'forest', name: 'Mystic Forest', description: 'Enchanted woodland greens', colors: ['#00ff88', '#66d9aa', '#2d5a3d'] },
    { id: 'fire', name: 'Dragon Fire', description: 'Burning crimson flames', colors: ['#ff4444', '#ffaa22', '#8b0000'] },
    { id: 'arcane', name: 'Arcane Magic', description: 'Purple mystical energies', colors: ['#aa44ff', '#6644ff', '#2d1b69'] },
    { id: 'ocean', name: 'Ocean Depths', description: 'Deep blue mysteries', colors: ['#00aaff', '#00ffdd', '#1e3a8a'] }
  ];

  onMount(() => {
    const savedTheme = localStorage.getItem('dnd_theme') || 'medieval';
    applyTheme(savedTheme);
  });

  function applyTheme(themeId: string) {
    currentTheme = themeId;
    document.documentElement.setAttribute('data-theme', themeId);
    localStorage.setItem('dnd_theme', themeId);
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
    color: #b8b5b2;
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
    background: linear-gradient(145deg, rgba(40, 40, 60, 0.6), rgba(30, 30, 45, 0.8));
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 15px;
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: left;
    overflow: hidden;
  }

  .theme-card:hover {
    border-color: var(--color-primary-main);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
  }

  .theme-card.selected {
    border-color: var(--color-primary-main);
    background: linear-gradient(145deg, rgba(255, 215, 0, 0.1), rgba(255, 215, 0, 0.05));
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
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
    border: 2px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .theme-info h3 {
    margin: 0 0 0.5rem 0;
    color: var(--color-primary-text);
    font-size: 1.3rem;
    font-weight: 600;
  }

  .theme-info p {
    margin: 0;
    color: #888;
    font-size: 0.9rem;
    line-height: 1.4;
  }

  .selected-indicator {
    position: absolute;
    top: 15px;
    right: 15px;
    background: var(--color-primary-main);
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