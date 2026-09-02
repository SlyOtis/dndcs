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
      var(--ground-raised) 0%, 
      color-mix(in srgb, var(--ground-raised) 95%, var(--metal)) 100%);
    border-right: 2px solid var(--metal);
    box-shadow: 2px 0 8px var(--shade-soft);
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
      color-mix(in srgb, var(--ground-raised) 95%, var(--metal)) 0%, 
      var(--ground-raised) 100%);
    border: 2px solid var(--metal);
    border-radius: 12px;
    box-shadow: 0 4px 8px var(--shade-soft);
  }

  .profile-picture img {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 3px solid var(--metal);
    object-fit: cover;
    box-shadow: 0 2px 8px var(--shade-soft);
  }

  .character-details {
    flex: 1;
  }

  .character-name {
    margin: 0 0 8px 0;
    color: var(--ink);
    font-family: var(--font-display);
    font-size: 1.4rem;
    font-weight: 700;
    text-shadow: 0 1px 2px var(--shade-soft);
  }

  .character-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .race-class {
    color: var(--ink);
    font-size: 0.9rem;
    opacity: 0.9;
  }

  .level {
    color: var(--ember);
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
      var(--metal-dim), 
      color-mix(in srgb, var(--metal-dim) 85%, black));
    color: var(--ink);
    border: 2px solid color-mix(in srgb, var(--metal) 60%, transparent);
    border-radius: 8px;
    cursor: pointer;
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 0.9rem;
    text-shadow: 0 1px 2px var(--shade);
    box-shadow: 
      0 2px 6px var(--shade-soft),
      inset 0 1px 3px var(--sheen-soft);
    transition: all 0.2s ease;
  }

  .action-btn:hover {
    background: linear-gradient(145deg, 
      var(--ember), 
      color-mix(in srgb, var(--ember) 85%, black));
    border-color: var(--ember);
    box-shadow: 
      0 4px 8px var(--shade-soft),
      inset 0 1px 3px var(--sheen);
    transform: translateY(-1px);
  }

  .action-btn:active {
    transform: translateY(0);
    box-shadow: 
      0 1px 3px var(--shade-soft),
      inset 0 2px 4px var(--shade-soft);
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
    background: var(--shade);
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
