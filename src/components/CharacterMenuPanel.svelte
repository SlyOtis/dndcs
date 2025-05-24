<script lang="ts">
  import { getContext } from "svelte";
  import type { CharacterContext } from "$lib/types";
  import { setUIActionDispatcher } from "$lib/chat";
  import { navigationActions } from "$lib/navigation";

  let { isOpen = $bindable() }: { isOpen: boolean } = $props();

  const { info } = getContext<CharacterContext>('character');

  // Panel actions
  function exportCharacter() {
    setUIActionDispatcher('exportCharacter');
  }

  function levelUp() {
    setUIActionDispatcher('openLevelUpDialog');
  }

  function openThemes() {
    setUIActionDispatcher('openThemeDialog');
  }

  function openSources() {
    setUIActionDispatcher('openSourceImport');
  }

  function openSoundboard() {
    navigationActions.toggleMusicPanel();
  }
</script>

<div class="root">
  <div class="inner">
    <div class="panel-content">
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
</div>

<style>
  .root {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-right: 1px solid var(--color-primary-main);
    background: var(--color-content-dark);
    z-index: 100;
  }

  .inner {
    position: absolute;
    width: var(--size-character-max);
    min-width: var(--size-character-max);
    right: -2px;
    top: 0;
    bottom: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
  }

  .panel-content {
    padding: 20px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }


  .actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background: var(--color-surface-dark);
    color: var(--color-primary-text);
    border: 1px solid var(--color-primary-main);
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s ease;
  }

  .action-btn:hover {
    background: var(--color-primary-main);
    color: var(--color-surface-dark);
  }

  .btn-icon {
    font-size: 1rem;
  }
</style>