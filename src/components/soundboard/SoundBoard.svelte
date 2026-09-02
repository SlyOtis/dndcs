<script lang="ts">
  import { createSoundClip, playSoundClip, createDefaultSoundBoard, addClipToSoundBoard, removeClipFromSoundBoard } from '../../lib/soundboard';
  import type { SoundClip, SoundBoard } from '../../lib/character.types';
  
  let { soundBoard = $bindable(), onSoundBoardChange }: { 
    soundBoard: SoundBoard | null, 
    onSoundBoardChange: (soundBoard: SoundBoard) => void 
  } = $props();
  
  let fileInput: HTMLInputElement;
  let isUploading = $state(false);
  let draggedOver = $state(false);
  let playingClips = $state(new Set<string>());

  // Initialize sound board if it doesn't exist
  $effect(() => {
    if (!soundBoard) {
      const newSoundBoard = createDefaultSoundBoard();
      soundBoard = newSoundBoard;
      onSoundBoardChange(newSoundBoard);
    }
  });

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0 || !soundBoard) return;
    
    isUploading = true;
    
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('audio/')) {
          console.warn(`Skipping non-audio file: ${file.name}`);
          continue;
        }
        
        const clip = await createSoundClip('', file);
        const updatedSoundBoard = addClipToSoundBoard(soundBoard, clip);
        soundBoard = updatedSoundBoard;
        onSoundBoardChange(updatedSoundBoard);
      }
    } catch (error) {
      console.error('Error uploading sound files:', error);
    } finally {
      isUploading = false;
    }
  }

  async function playClip(clip: SoundClip) {
    if (playingClips.has(clip.id)) return;
    
    playingClips.add(clip.id);
    
    try {
      await playSoundClip(clip);
    } catch (error) {
      console.error('Error playing sound:', error);
    } finally {
      playingClips.delete(clip.id);
    }
  }

  function removeClip(clipId: string) {
    if (!soundBoard) return;
    
    const updatedSoundBoard = removeClipFromSoundBoard(soundBoard, clipId);
    soundBoard = updatedSoundBoard;
    onSoundBoardChange(updatedSoundBoard);
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    draggedOver = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    draggedOver = false;
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    draggedOver = false;
    handleFileUpload(event.dataTransfer?.files || null);
  }

  function openFileDialog() {
    fileInput?.click();
  }
</script>

<div 
  class="clips-grid" 
  class:dragged-over={draggedOver}
  role="region"
  aria-label="Sound clip drop zone"
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
>
  {#if soundBoard?.clips && soundBoard.clips.length > 0}
    {#each soundBoard.clips as clip (clip.id)}
      <div class="clip-tile">
        <button 
          class="clip-button medieval-button"
          class:playing={playingClips.has(clip.id)}
          onclick={() => playClip(clip)}
          disabled={playingClips.has(clip.id)}
        >
          <div class="clip-content">
            <div class="clip-icon">
              {playingClips.has(clip.id) ? '🔊' : '🎵'}
            </div>
            <div class="clip-name">{clip.name}</div>
          </div>
        </button>
        <button 
          class="remove-btn"
          onclick={() => removeClip(clip.id)}
          title="Remove sound"
        >
        </button>
      </div>
    {/each}
  {/if}
  
  <!-- Add new sound button -->
  <div class="clip-tile add-tile">
    <button 
      class="clip-button add-button medieval-button"
      onclick={openFileDialog}
      disabled={isUploading}
    >
      <div class="clip-content">
        <div class="clip-icon">
          {isUploading ? '⏳' : '+'}
        </div>
      </div>
    </button>
  </div>
</div>

<input 
  bind:this={fileInput}
  type="file" 
  accept="audio/*" 
  multiple
  style="display: none"
  onchange={(e) => handleFileUpload((e.target as HTMLInputElement)?.files)}
/>

<style>

  .clips-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 16px;
    padding: 8px;
    border: 2px dashed transparent;
    border-radius: 8px;
    transition: border-color 0.2s ease;
  }

  .clips-grid.dragged-over {
    border-color: var(--ember);
    background: color-mix(in srgb, var(--ember) 10%, transparent);
  }

  .clip-tile {
    position: relative;
    aspect-ratio: 1;
    min-height: 60px;
  }

  .clip-button {
    width: 100%;
    height: 100%;
    padding: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    border-radius: 12px;
  }

  .clip-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    text-align: center;
  }

  .clip-icon {
    font-size: 1.2em;
    line-height: 1;
  }

  .clip-name {
    font-size: 0.65em;
    font-weight: 600;
    line-height: 1.1;
    word-break: break-word;
    max-width: 100%;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .add-button {
    border-style: dashed;
    background: color-mix(in srgb, var(--metal-dim) 50%, transparent);
  }

  .add-button:hover:not(:disabled) {
    background: color-mix(in srgb, var(--ember) 50%, transparent);
  }

  .clip-button.playing {
    background: var(--ember);
    transform: scale(0.95);
    box-shadow: inset 0 0 10px var(--shade-soft);
  }

  .remove-btn {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--state-bad);
    color: white;
    border: 2px solid white;
    font-size: 14px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    line-height: 1;
    z-index: 10;
    box-shadow: 0 2px 4px var(--shade-soft);
  }

  .remove-btn:hover {
    background: var(--state-bad);
    transform: scale(1.15);
    box-shadow: 0 3px 6px var(--shade-soft);
  }


  .medieval-button {
    position: relative;
    cursor: pointer;
    background: linear-gradient(145deg, var(--metal-dim), var(--ground-raised));
    border: 2px solid var(--metal);
    border-radius: 8px;
    padding: 8px 12px;
    min-height: 40px;
    transition: all 0.15s ease;
    box-shadow: 
      inset 1px 1px 3px color-mix(in srgb, var(--metal) 30%, transparent),
      inset -1px -1px 3px var(--shade-soft),
      0 2px 4px var(--shade-soft);
    font-family: var(--font-display);
    font-weight: 600;
    text-shadow: 1px 1px 2px var(--shade-hard);
    color: var(--ink);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .medieval-button:hover:not(:disabled) {
    background: linear-gradient(145deg, var(--ember), var(--metal-dim));
    border-color: var(--metal);
    box-shadow: 
      inset 1px 1px 4px color-mix(in srgb, var(--metal) 40%, transparent),
      inset -1px -1px 4px var(--shade),
      0 3px 6px var(--shade-soft);
    transform: translateY(-1px);
    filter: brightness(1.1);
  }
  
  .medieval-button:active:not(:disabled) {
    background: linear-gradient(145deg, var(--ground), var(--ground-raised));
    border-color: color-mix(in srgb, var(--metal) 70%, transparent);
    box-shadow: 
      inset 2px 2px 6px var(--shade),
      inset -1px -1px 3px color-mix(in srgb, var(--metal) 20%, transparent),
      0 1px 2px var(--shade-soft);
    transform: translateY(1px);
  }

  .medieval-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
</style>
