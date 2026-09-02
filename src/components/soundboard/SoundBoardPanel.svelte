<script lang="ts">
  import { onMount, onDestroy, getContext } from 'svelte';
  import type { CharacterContext } from '../../lib/types';
  import type { SoundBoard } from '../../lib/character.types';
  import SoundBoardComponent from './SoundBoard.svelte';

  let { isOpen = $bindable() }: { isOpen: boolean } = $props();

  const chContext: CharacterContext = getContext('character');
  const { soundBoard: soundBoardStore } = chContext;

  function handleSoundBoardChange(soundBoard: SoundBoard) {
    soundBoardStore.set(soundBoard);
  }
</script>

<div class="root">
  <div class="inner">
    <div class="soundboard-content">
      <SoundBoardComponent 
        soundBoard={$soundBoardStore}
        onSoundBoardChange={handleSoundBoardChange}
      />
    </div>
  </div>
</div>

<style>
  .root {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-right: 1px solid var(--metal);
    background: var(--ground);
    z-index: 100;
  }

  .inner {
    position: absolute;
    width: var(--size-music-max);
    min-width: var(--size-music-max);
    right: -2px;
    top: 0;
    bottom: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
  }



  .soundboard-content {
    position: relative;
    width: 100%;
    height: 100%;
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }


</style>
