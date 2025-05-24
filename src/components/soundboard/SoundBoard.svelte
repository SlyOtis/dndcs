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
    border-color: var(--color-secondary-main);
    background: color-mix(in srgb, var(--color-secondary-main) 10%, transparent);
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
    -webkit-box-orient: vertical;
  }

  .add-button {
    border-style: dashed;
    background: color-mix(in srgb, var(--color-accent) 50%, transparent);
  }

  .add-button:hover:not(:disabled) {
    background: color-mix(in srgb, var(--color-secondary-main) 50%, transparent);
  }

  .clip-button.playing {
    background: var(--color-secondary-main);
    transform: scale(0.95);
    box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.3);
  }

  .remove-btn {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #dc3545;
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
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .remove-btn:hover {
    background: #c82333;
    transform: scale(1.15);
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.4);
  }


  .medieval-button {
    position: relative;
    cursor: pointer;
    background: linear-gradient(145deg, var(--color-accent), var(--color-content-main));
    border: 2px solid var(--color-primary-main);
    border-radius: 8px;
    padding: 8px 12px;
    min-height: 40px;
    transition: all 0.15s ease;
    box-shadow: 
      inset 1px 1px 3px color-mix(in srgb, var(--color-primary-main) 30%, transparent),
      inset -1px -1px 3px rgba(0, 0, 0, 0.4),
      0 2px 4px rgba(0, 0, 0, 0.3);
    font-family: 'Cinzel', serif;
    font-weight: 600;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
    color: var(--color-primary-text);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .medieval-button:hover:not(:disabled) {
    background: linear-gradient(145deg, var(--color-secondary-main), var(--color-accent));
    border-color: var(--color-primary-main);
    box-shadow: 
      inset 1px 1px 4px color-mix(in srgb, var(--color-primary-main) 40%, transparent),
      inset -1px -1px 4px rgba(0, 0, 0, 0.5),
      0 3px 6px rgba(0, 0, 0, 0.4);
    transform: translateY(-1px);
    filter: brightness(1.1);
  }
  
  .medieval-button:active:not(:disabled) {
    background: linear-gradient(145deg, var(--color-content-dark), var(--color-content-main));
    border-color: color-mix(in srgb, var(--color-primary-main) 70%, transparent);
    box-shadow: 
      inset 2px 2px 6px rgba(0, 0, 0, 0.6),
      inset -1px -1px 3px color-mix(in srgb, var(--color-primary-main) 20%, transparent),
      0 1px 2px rgba(0, 0, 0, 0.2);
    transform: translateY(1px);
  }

  .medieval-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
</style>