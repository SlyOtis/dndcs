<script lang="ts">
  import { getContext } from 'svelte'
  import type { CharacterContext } from '$lib/types'
  import type { SoundBoard } from '$lib/character.types'
  import MainMenu from '$components/MainMenu.svelte'
  import SoundBoardComponent from '$components/soundboard/SoundBoard.svelte'

  const chContext = getContext<CharacterContext | undefined>('character')
  const soundBoardStore = chContext?.soundBoard

  let view = $state<'menu' | 'soundboard'>('menu')

  function openSoundboard() {
    view = 'soundboard'
  }

  function openMenu() {
    view = 'menu'
  }

  function handleSoundBoardChange(soundBoard: SoundBoard) {
    soundBoardStore?.set(soundBoard)
  }
</script>

<div class="dnd-menupanel">
  {#if view === 'menu'}
    <MainMenu onNavigateToSoundboard={soundBoardStore ? openSoundboard : undefined} />
  {:else if soundBoardStore}
    <header class="dnd-menupanel-head">
      <button type="button" class="dnd-menupanel-back" onclick={openMenu} title="Back to the navigator">
        <span class="dnd-menupanel-back-mark" aria-hidden="true">‹</span>
        Navigator
      </button>
    </header>
    <div class="dnd-scroll dnd-menupanel-body">
      <SoundBoardComponent soundBoard={$soundBoardStore ?? null} onSoundBoardChange={handleSoundBoardChange} />
    </div>
  {/if}
</div>

<style>
  .dnd-menupanel {
    --menu-pad: var(--space-4);
    --menu-row: 2.6rem;
    --menu-line: var(--metal-dim);
    --menu-line-strong: var(--metal);
    --menu-surface: var(--ground-raised);
    --menu-surface-lift: var(--ground-lift);
    --menu-accent: var(--metal-bright);
    --menu-radius: var(--radius-md);

    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .dnd-menupanel-head {
    padding: var(--menu-pad);
    border-bottom: var(--border-hair) solid var(--menu-line);
    background: linear-gradient(180deg, var(--menu-surface-lift) 0%, var(--menu-surface) 100%);
  }

  .dnd-menupanel-back {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: var(--menu-row);
    padding: 0 var(--space-4);
    background: linear-gradient(180deg, var(--menu-surface-lift) 0%, var(--menu-surface) 100%);
    border: var(--border-hair) solid var(--menu-line);
    border-radius: var(--menu-radius);
    color: var(--menu-accent);
    font-family: var(--font-display);
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
    cursor: pointer;
    transition: border-color 0.15s ease, filter 0.15s ease;
  }

  .dnd-menupanel-back:hover {
    border-color: var(--menu-line-strong);
    filter: brightness(1.15);
  }

  .dnd-menupanel-back-mark {
    color: var(--menu-line-strong);
  }

  .dnd-menupanel-body {
    min-height: 0;
    padding: var(--menu-pad);
  }
</style>
