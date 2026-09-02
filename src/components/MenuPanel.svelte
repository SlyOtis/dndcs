<script lang="ts">
  import { getContext } from "svelte";
  import type { CharacterContext } from "$lib/types";
  import MainMenu from "$components/MainMenu.svelte";
  import SoundBoardComponent from "$components/soundboard/SoundBoard.svelte";

  const chContext: CharacterContext = getContext('character');
  const { soundBoard: soundBoardStore } = chContext;

  let currentView = $state<'main' | 'soundboard'>('main');

  function navigateToSoundboard() {
    currentView = 'soundboard';
  }

  function navigateToMain() {
    currentView = 'main';
  }

  function handleSoundBoardChange(soundBoard: any) {
    soundBoardStore.set(soundBoard);
  }

  function toggleMenu() {
    const currentState = document.documentElement.style.getPropertyValue('--size-menu-curr');
    const newState = currentState === 'var(--size-menu-max)' ? '0' : 'var(--size-menu-max)';
    document.documentElement.style.setProperty('--size-menu-curr', newState);
  }
</script>

<div class="menu-panel">
  <button class="toggle-menu" onclick={toggleMenu} title="Character Menu" aria-label="Toggle character menu">
    <svg class="morphing-icon" viewBox="0 0 24 24" fill="currentColor">
      <path class="morph-path">
        <animate attributeName="d" 
          values="M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z;
                  M12,2C8.7,2 6,4.7 6,8C6,10.4 7.4,12.5 9.4,13.6L8,15L9.5,16.5L11,15C11.3,15 11.7,15 12,15C12.3,15 12.7,15 13,15L14.5,16.5L16,15L14.6,13.6C16.6,12.5 18,10.4 18,8C18,4.7 15.3,2 12,2M10,7C10.6,7 11,7.4 11,8S10.6,9 10,9S9,8.6 9,8S9.4,7 10,7M14,7C14.6,7 15,7.4 15,8S14.6,9 14,9S13,8.6 13,8S13.4,7 14,7M12,10.5C10.9,10.5 10,11.4 10,12.5H14C14,11.4 13.1,10.5 12,10.5Z;
                  M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z"
          dur="0.3s" 
          begin="hover" 
          fill="freeze" />
        <animate attributeName="d"
          values="M12,2C8.7,2 6,4.7 6,8C6,10.4 7.4,12.5 9.4,13.6L8,15L9.5,16.5L11,15C11.3,15 11.7,15 12,15C12.3,15 12.7,15 13,15L14.5,16.5L16,15L14.6,13.6C16.6,12.5 18,10.4 18,8C18,4.7 15.3,2 12,2M10,7C10.6,7 11,7.4 11,8S10.6,9 10,9S9,8.6 9,8S9.4,7 10,7M14,7C14.6,7 15,7.4 15,8S14.6,9 14,9S13,8.6 13,8S13.4,7 14,7M12,10.5C10.9,10.5 10,11.4 10,12.5H14C14,11.4 13.1,10.5 12,10.5Z;
                  M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z"
          dur="0.3s"
          begin="mouseout"
          fill="freeze" />
      </path>
      <path class="dragon-horns" d="M9,4L10,6L8,6L9,4M15,4L16,6L14,6L15,4" opacity="0">
        <animate attributeName="opacity" values="0;1;0" dur="0.3s" begin="hover" fill="freeze" />
        <animate attributeName="opacity" values="1;0" dur="0.3s" begin="mouseout" fill="freeze" />
      </path>
    </svg>
    <div class="fire-particles">
      <div class="fire-particle fire-1"></div>
      <div class="fire-particle fire-2"></div>
      <div class="fire-particle fire-3"></div>
      <div class="fire-particle fire-4"></div>
      <div class="fire-particle fire-5"></div>
    </div>
  </button>

  {#if currentView === 'main'}
    <MainMenu onNavigateToSoundboard={navigateToSoundboard} />
  {:else if currentView === 'soundboard'}
    <div class="soundboard-header">
      <button class="close-button" onclick={navigateToMain} title="Back to Main Menu" aria-label="Back to main menu">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" />
        </svg>
        Back
      </button>
    </div>
    <div class="soundboard-container">
      <SoundBoardComponent 
        soundBoard={$soundBoardStore}
        onSoundBoardChange={handleSoundBoardChange}
      />
    </div>
  {/if}
</div>

<style>
  .menu-panel {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  }

  .toggle-menu {
    position: absolute;
    top: 20px;
    left: -50px;
    z-index: 200;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 40px;
    height: 40px;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    color: var(--color-primary-text);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: visible;
  }

  .morphing-icon {
    width: 20px;
    height: 20px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
  }

  .toggle-menu:hover .morphing-icon {
    transform: scale(1.1);
    color: #ff6b35;
    filter: drop-shadow(0 0 8px rgba(255, 107, 53, 0.8)) drop-shadow(0 0 16px rgba(255, 165, 0, 0.4));
  }

  .toggle-menu:hover {
    transform: scale(1.1) rotate(5deg);
  }

  .toggle-menu:active .morphing-icon {
    transform: scale(1.3) rotate(10deg);
    color: #ff4500;
    filter: drop-shadow(0 0 12px #ff4500) drop-shadow(0 0 24px #ff6b35);
  }

  .fire-particles {
    position: absolute;
    pointer-events: none;
    top: 50%;
    left: 60px;
    transform: translateY(-50%);
  }

  .fire-particle {
    position: absolute;
    width: 4px;
    height: 4px;
    background: radial-gradient(circle, #ff6b35 0%, #ff4500 50%, transparent 100%);
    border-radius: 50%;
    opacity: 0;
    transform: translateY(-50%);
  }

  .toggle-menu:active .fire-particle {
    animation: fire-burst 0.6s ease-out;
  }

  .fire-1 { top: 0px; left: 0px; animation-delay: 0s; }
  .fire-2 { top: -8px; left: 0px; animation-delay: 0.1s; }
  .fire-3 { top: 8px; left: 0px; animation-delay: 0.05s; }
  .fire-4 { top: -4px; left: 0px; animation-delay: 0.15s; }
  .fire-5 { top: 4px; left: 0px; animation-delay: 0.08s; }

  .toggle-menu:active {
    transform: scale(0.95) rotate(-5deg);
  }

  @keyframes fire-burst {
    0% {
      opacity: 0;
      transform: translateY(-50%) scale(0.2);
    }
    20% {
      opacity: 1;
      transform: translateY(-50%) scale(1) translateX(0px);
    }
    100% {
      opacity: 0;
      transform: translateY(-50%) scale(0.5) translateX(30px);
    }
  }

  .soundboard-header {
    padding: 1rem;
    border-bottom: 1px solid var(--color-primary-main);
    background: var(--color-content-main);
  }

  .close-button {
    background: var(--color-content-dark);
    border: 1px solid var(--color-primary-main);
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
    color: var(--color-primary-text);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
  }

  .close-button:hover {
    background: var(--color-primary-main);
    transform: scale(1.05);
  }

  .close-button svg {
    width: 16px;
    height: 16px;
  }

  .soundboard-container {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }
</style>