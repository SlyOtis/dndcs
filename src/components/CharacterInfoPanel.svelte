<script lang="ts">
  import { getContext } from "svelte";
  import type { CharacterContext } from "../lib/types";
  import { postUIAction } from "../lib/chat";
  import { navigationActions } from "../lib/navigation";

  const { info } = getContext<CharacterContext>('character');

  let { isOpen = $bindable(false) }: { isOpen: boolean } = $props();

  // Character image logic
  let imageUrl = $derived.by(() => {
    if ($info.state?.image?.overlay === false) {
      return $info.state.image.url!!
    }

    for (let condition of $info.conditions) {
      if (condition?.image?.overlay === false) {
        return condition.image.url!!
      }
    }

    return $info.imageUrl
  })

  // Panel actions
  function exportCharacter() {
    postUIAction('exportCharacter');
  }

  function levelUp() {
    postUIAction('openLevelUpDialog');
  }

  function openThemes() {
    postUIAction('openThemeDialog');
  }

  function openSources() {
    postUIAction('openSourceImport');
  }

  function openSoundboard() {
    navigationActions.toggleMusicPanel();
  }
</script>

<!-- Character Info Panel -->
<div class="panel" class:open={isOpen}>
  <div class="panel-content">
    <!-- Character Profile -->
    <div class="character-profile">
      <div class="profile-picture">
        <img src={imageUrl} alt={$info.name}/>
      </div>
      <div class="character-details">
        <h2 class="character-name">{$info.name}</h2>
        <div class="character-meta">
          <span class="race-class">{$info.gender} {$info.race.name} {$info.class.name}</span>
          <span class="level">Level {$info.level}</span>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="actions">
      <button class="action-btn" onclick={openSoundboard}>
        <span class="btn-icon">🔊</span>
        Soundboard
      </button>
      
      <button class="action-btn" onclick={exportCharacter}>
        <span class="btn-icon">📄</span>
        Export
      </button>
      
      <button class="action-btn" onclick={levelUp}>
        <span class="btn-icon">⬆️</span>
        Level Up
      </button>
      
      <button class="action-btn" onclick={openSources}>
        <span class="btn-icon">📚</span>
        Sources
      </button>
      
      <button class="action-btn" onclick={openThemes}>
        <span class="btn-icon">🎨</span>
        Themes
      </button>
    </div>
  </div>
</div>

<!-- Overlay -->
{#if isOpen}
  <button type="button" class="overlay" aria-label="Close panel" onclick={() => isOpen = false}></button>
{/if}

<style>
  .panel {
    position: fixed;
    top: 0;
    left: -350px;
    width: 350px;
    height: 100vh;
    background: linear-gradient(135deg, 
      var(--color-content-main) 0%, 
      color-mix(in srgb, var(--color-content-main) 95%, var(--color-primary-main)) 100%);
    border-right: 2px solid var(--color-primary-main);
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
    transition: left 0.3s ease;
    z-index: 1001;
    overflow-y: auto;
  }

  .panel.open {
    left: 0;
  }

  .panel-content {
    padding: 20px;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .character-profile {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    background: linear-gradient(135deg, 
      color-mix(in srgb, var(--color-content-main) 95%, var(--color-primary-main)) 0%, 
      var(--color-content-main) 100%);
    border: 2px solid var(--color-primary-main);
    border-radius: 12px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  .profile-picture img {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 3px solid var(--color-primary-main);
    object-fit: cover;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .character-details {
    flex: 1;
  }

  .character-name {
    margin: 0 0 8px 0;
    color: var(--color-primary-text);
    font-family: 'Cinzel', serif;
    font-size: 1.4rem;
    font-weight: 700;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  .character-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .race-class {
    color: var(--color-primary-text);
    font-size: 0.9rem;
    opacity: 0.9;
  }

  .level {
    color: var(--color-secondary-main);
    font-weight: 600;
    font-size: 0.9rem;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: linear-gradient(145deg, 
      var(--color-accent), 
      color-mix(in srgb, var(--color-accent) 85%, black));
    color: var(--color-primary-text);
    border: 2px solid color-mix(in srgb, var(--color-primary-main) 60%, transparent);
    border-radius: 8px;
    cursor: pointer;
    font-family: 'Cinzel', serif;
    font-weight: 600;
    font-size: 0.9rem;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    box-shadow: 
      0 2px 6px rgba(0, 0, 0, 0.2),
      inset 0 1px 3px rgba(255, 255, 255, 0.1);
    transition: all 0.2s ease;
  }

  .action-btn:hover {
    background: linear-gradient(145deg, 
      var(--color-secondary-main), 
      color-mix(in srgb, var(--color-secondary-main) 85%, black));
    border-color: var(--color-secondary-main);
    box-shadow: 
      0 4px 8px rgba(0, 0, 0, 0.3),
      inset 0 1px 3px rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }

  .action-btn:active {
    transform: translateY(0);
    box-shadow: 
      0 1px 3px rgba(0, 0, 0, 0.2),
      inset 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .btn-icon {
    font-size: 1.2rem;
  }

  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .panel {
      width: 300px;
      left: -300px;
    }

    .character-name {
      font-size: 1.2rem;
    }

    .race-class, .level {
      font-size: 0.8rem;
    }

    .action-btn {
      font-size: 0.85rem;
      padding: 10px 14px;
    }

    .profile-picture img {
      width: 60px;
      height: 60px;
    }
  }
</style>