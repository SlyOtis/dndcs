<script lang="ts">
  import { navigate } from "sly-svelte-location-router";
  import { characterService } from "../lib/firestore.service";
  import { aiService } from "../lib/ai";
  import type { Character } from "../lib/character.types";
  import Background from "$components/Background.svelte";
  import * as pdfjsLib from 'pdfjs-dist';
  
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

  interface CharacterCreationData {
    name: string;
    level: number;
    backgroundUrl?: string;
    abilityScores: {
      strength: number;
      dexterity: number;
      constitution: number;
      intelligence: number;
      wisdom: number;
      charisma: number;
    };
    sources: string[];
    imageUrl?: string;
    aiAnalysis?: any;
  }

  let creationData = $state<CharacterCreationData>({
    name: '',
    level: 1,
    abilityScores: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10
    },
    sources: []
  });
  let isProcessing = $state(false);
  let error = $state<string | null>(null);
  let dragActive = $state(false);
  let imagePreview = $state<string | null>(null);
  let imageUrl = $state('');
  let backgroundDragActive = $state(false);

  let canContinue = $derived(
    creationData.name.trim().length > 0
  );

  function handleImageUrlChange() {
    if (imageUrl.trim()) {
      imagePreview = imageUrl;
      creationData.imageUrl = imageUrl;
    }
  }

  function handleBackgroundDragOver(event: DragEvent) {
    event.preventDefault();
    backgroundDragActive = true;
  }

  function handleBackgroundDragLeave() {
    backgroundDragActive = false;
  }

  async function handleBackgroundDrop(event: DragEvent) {
    event.preventDefault();
    backgroundDragActive = false;
    
    const files = event.dataTransfer?.files;
    if (files) {
      await processBackgroundFiles(Array.from(files));
    }
  }

  async function handleBackgroundFileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      await processBackgroundFiles(Array.from(input.files));
    }
  }

  async function processBackgroundFiles(files: File[]) {
    for (const file of files) {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        creationData.backgroundUrl = url;
        break;
      }
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    dragActive = true;
  }

  function handleDragLeave() {
    dragActive = false;
  }

  async function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragActive = false;
    
    const files = event.dataTransfer?.files;
    if (files) {
      await processFiles(Array.from(files));
    }
  }

  async function handleFileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      await processFiles(Array.from(input.files));
    }
  }

  async function processFiles(files: File[]) {
    isProcessing = true;
    error = null;

    try {
      for (const file of files) {
        if (file.type === 'application/pdf') {
          const text = await extractTextFromPDF(file);
          creationData.sources.push(text);
        } else if (file.type.startsWith('image/')) {
          const url = URL.createObjectURL(file);
          imagePreview = url;
          creationData.imageUrl = url;
          imageUrl = '';
        }
      }
    } catch (err) {
      error = 'Failed to process files';
    } finally {
      isProcessing = false;
    }
  }

  async function extractTextFromPDF(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  }

  function removeSource(index: number) {
    creationData.sources.splice(index, 1);
  }

  async function analyzeAndContinue() {
    if (!canContinue) {
      error = 'Please provide character name';
      return;
    }

    isProcessing = true;
    error = null;

    try {
      sessionStorage.setItem('characterCreationData', JSON.stringify(creationData));
      navigate('/main/create/character/class');
    } catch (err) {
      error = 'Failed to continue character creation';
      isProcessing = false;
    }
  }

  async function createCharacter() {
    if (!creationData.aiAnalysis) {
      error = 'No character analysis available';
      return;
    }

    try {
      const character: Partial<Character> = {
        ...creationData.aiAnalysis.character,
        abilityScores: creationData.abilityScores,
        imageUrl: creationData.imageUrl,
        sources: creationData.sources
      };

      const characterId = await characterService.createCharacter(character as Character, {
        name: character.info?.name || creationData.name,
        level: 1,
        class: character.info?.class?.name || "Unknown",
        race: character.info?.race?.name || "Unknown",
        tags: ["ai-generated", "sources-uploaded"]
      });

      navigate(`/character/${characterId}`);
    } catch (err) {
      error = 'Failed to create character';
    } finally {
      isProcessing = false;
    }
  }
</script>

<Background />

<div class="page-wrapper">
<div class="create-character">
  <button class="back-btn" onclick={() => navigate('/main')}>
    ← Back
  </button>
  
  <div class="header">
    <h1>Create New Character</h1>
  </div>

  <div class="form-content">
    <div class="top-section">
      <div class="image-section">
        <div class="image-upload-area {dragActive ? 'drag-active' : ''}"
             role="region"
             aria-label="Character image drop zone"
             ondragover={handleDragOver}
             ondragleave={handleDragLeave}
             ondrop={handleDrop}>
          {#if imagePreview}
            <img src={imagePreview} alt="Character" class="character-image-preview" />
            <div class="image-overlay">
              <span>Drop image to change</span>
            </div>
          {:else}
            <div class="image-placeholder">
              <div class="upload-icon">🖼️</div>
              <p>Drop image here or click to upload character image</p>
            </div>
          {/if}
          <input
            type="file"
            accept="image/*"
            onchange={handleFileInput}
            class="file-input"
          />
        </div>
      </div>

      <div class="info-section">
        <div class="form-group">
          <label for="character-name">Character Name</label>
          <input
            type="text"
            id="character-name"
            bind:value={creationData.name}
            placeholder="Enter character name"
            class="text-input"
          />
        </div>

        <div class="form-group">
          <label for="level">Starting Level</label>
          <input
            type="number"
            id="level"
            bind:value={creationData.level}
            min="1"
            max="20"
            placeholder="1"
            class="text-input"
          />
        </div>
      </div>
    </div>

    <div class="background-section">
      <h3>Character Background</h3>
      <div class="background-upload-box {backgroundDragActive ? 'drag-active' : ''}"
           role="region"
           aria-label="Background image drop zone"
           ondragover={handleBackgroundDragOver}
           ondragleave={handleBackgroundDragLeave}
           ondrop={handleBackgroundDrop}>
        <input
          type="url"
          bind:value={creationData.backgroundUrl}
          placeholder="Enter image or video URL for character page background"
          class="background-url-input"
        />
        <button class="background-upload-btn" onclick={() => document.getElementById('background-file-input')?.click()}>
          Upload Image
        </button>
        <input
          id="background-file-input"
          type="file"
          accept="image/*,video/*"
          onchange={handleBackgroundFileInput}
          class="file-input"
        />
      </div>
    </div>

    <div class="ability-scores">
      <h3>Ability Scores</h3>
      <div class="scores-container">
        <div class="score-box">
          <div class="score-label">STR</div>
          <input type="number" bind:value={creationData.abilityScores.strength} min="1" max="20" class="score-value" />
          <div class="score-modifier">{Math.floor((creationData.abilityScores.strength - 10) / 2) >= 0 ? '+' : ''}{Math.floor((creationData.abilityScores.strength - 10) / 2)}</div>
        </div>
        <div class="score-box">
          <div class="score-label">DEX</div>
          <input type="number" bind:value={creationData.abilityScores.dexterity} min="1" max="20" class="score-value" />
          <div class="score-modifier">{Math.floor((creationData.abilityScores.dexterity - 10) / 2) >= 0 ? '+' : ''}{Math.floor((creationData.abilityScores.dexterity - 10) / 2)}</div>
        </div>
        <div class="score-box">
          <div class="score-label">CON</div>
          <input type="number" bind:value={creationData.abilityScores.constitution} min="1" max="20" class="score-value" />
          <div class="score-modifier">{Math.floor((creationData.abilityScores.constitution - 10) / 2) >= 0 ? '+' : ''}{Math.floor((creationData.abilityScores.constitution - 10) / 2)}</div>
        </div>
        <div class="score-box">
          <div class="score-label">INT</div>
          <input type="number" bind:value={creationData.abilityScores.intelligence} min="1" max="20" class="score-value" />
          <div class="score-modifier">{Math.floor((creationData.abilityScores.intelligence - 10) / 2) >= 0 ? '+' : ''}{Math.floor((creationData.abilityScores.intelligence - 10) / 2)}</div>
        </div>
        <div class="score-box">
          <div class="score-label">WIS</div>
          <input type="number" bind:value={creationData.abilityScores.wisdom} min="1" max="20" class="score-value" />
          <div class="score-modifier">{Math.floor((creationData.abilityScores.wisdom - 10) / 2) >= 0 ? '+' : ''}{Math.floor((creationData.abilityScores.wisdom - 10) / 2)}</div>
        </div>
        <div class="score-box">
          <div class="score-label">CHA</div>
          <input type="number" bind:value={creationData.abilityScores.charisma} min="1" max="20" class="score-value" />
          <div class="score-modifier">{Math.floor((creationData.abilityScores.charisma - 10) / 2) >= 0 ? '+' : ''}{Math.floor((creationData.abilityScores.charisma - 10) / 2)}</div>
        </div>
      </div>
    </div>

    <div class="source-upload">
      <h3>Source Materials</h3>
      <div 
        class="upload-area {dragActive ? 'drag-active' : ''}"
        role="region"
        aria-label="Source material drop zone"
        ondragover={handleDragOver}
        ondragleave={handleDragLeave}
        ondrop={handleDrop}
      >
        <div class="upload-content">
          <div class="upload-icon">📄</div>
          <h4>Drop PDFs here or click to select</h4>
          <p>Upload character sheets, class guides, or source materials</p>
          <input
            type="file"
            multiple
            accept=".pdf"
            onchange={handleFileInput}
            class="file-input"
          />
        </div>
      </div>

      {#if creationData.sources.length > 0}
        <div class="sources-list">
          <h4>Uploaded Sources:</h4>
          {#each creationData.sources as source, index}
            <div class="source-item">
              <span class="source-preview">{source.substring(0, 100)}...</span>
              <button class="remove-btn" onclick={() => removeSource(index)}>×</button>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    {#if error}
      <div class="error">{error}</div>
    {/if}

    <div class="form-actions">
      <button class="btn-secondary" onclick={() => navigate('/main')}>Cancel</button>
      <button class="btn-primary" onclick={analyzeAndContinue} disabled={!canContinue || isProcessing}>
        {#if isProcessing}
          <span class="spinner"></span>
          Continuing...
        {:else}
          Continue
        {/if}
      </button>
    </div>
  </div>
</div>
</div>

<style>
  .page-wrapper {
    min-height: 100vh;
    width: 100%;
    overflow-y: auto;
  }

  .create-character {
    padding: 4rem 2rem 4rem 2rem;
    width: 100%;
    position: relative;
    z-index: 1;
  }

  .back-btn {
    position: fixed;
    top: 2rem;
    left: 2rem;
    padding: 0.5rem 1rem;
    background: var(--color-content-dark);
    border: 1px solid var(--color-primary-main);
    border-radius: 6px;
    color: var(--color-primary-text);
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.2s ease;
    z-index: 100;
  }

  .back-btn:hover {
    background: var(--color-primary-main);
    transform: translateX(-2px);
  }

  .header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .header h1 {
    margin: 0;
    color: var(--color-primary-main);
    font-size: 2.5rem;
  }

  .form-content {
    background: var(--color-content-dark);
    border: 2px solid var(--color-primary-main);
    border-radius: 12px;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    max-width: 1024px;
    margin: 0 auto;
  }

  .top-section {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 2rem;
    align-items: start;
  }

  .image-section {
    position: relative;
  }

  .image-upload-area {
    width: 200px;
    height: 200px;
    border: 2px dashed var(--color-primary-main);
    border-radius: 12px;
    position: relative;
    cursor: pointer;
    transition: all 0.3s ease;
    overflow: hidden;
    flex-shrink: 0;
  }

  .image-upload-area.drag-active {
    border-color: var(--color-primary-light);
    background: rgba(255, 215, 0, 0.1);
  }

  .character-image-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .image-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
    color: var(--color-primary-text);
  }

  .image-upload-area:hover .image-overlay {
    opacity: 1;
  }

  .image-placeholder {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 1rem;
  }

  .image-placeholder .upload-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .image-placeholder p {
    margin: 0;
    color: var(--color-secondary-text);
  }

  .info-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 1;
  }

  .form-group label {
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: var(--color-primary-text);
  }

  .background-section {
    position: relative;
    z-index: 1;
  }

  .background-section h3 {
    margin: 0 0 1rem 0;
    color: var(--color-primary-main);
    font-size: 1.5rem;
  }

  .background-upload-box {
    border: 2px dashed var(--color-primary-main);
    border-radius: 8px;
    padding: 1rem;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    position: relative;
  }

  .background-upload-box.drag-active {
    border-color: var(--color-primary-light);
    background: rgba(255, 215, 0, 0.1);
  }

  .background-url-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--color-primary-main);
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.3);
    color: var(--color-primary-text);
    font-size: 1rem;
    position: relative;
    z-index: 2;
  }

  .background-url-input:focus {
    outline: none;
    border-color: var(--color-primary-light);
    box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
  }

  .background-upload-btn {
    width: 100%;
    padding: 0.75rem;
    background: var(--color-content-dark);
    border: 1px solid var(--color-primary-main);
    border-radius: 6px;
    color: var(--color-primary-text);
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.2s ease;
  }

  .background-upload-btn:hover {
    background: var(--color-primary-main);
    transform: translateY(-1px);
  }


  .ability-scores {
    position: relative;
    z-index: 1;
  }

  .ability-scores h3 {
    margin: 0 0 1rem 0;
    color: var(--color-primary-main);
    font-size: 1.5rem;
  }

  .scores-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  @media (min-width: 768px) {
    .scores-container {
      grid-template-columns: repeat(6, 1fr);
    }
  }

  .score-box {
    background: rgba(0, 0, 0, 0.4);
    border: 2px solid var(--color-primary-main);
    border-radius: 12px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    position: relative;
  }

  .score-box:hover {
    border-color: var(--color-primary-light);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
  }

  .score-label {
    font-weight: bold;
    color: var(--color-primary-main);
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .score-value {
    width: 50px;
    height: 50px;
    padding: 0;
    text-align: center;
    border: none;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--color-primary-main), var(--color-primary-light));
    color: var(--color-primary-text);
    font-size: 1.5rem;
    font-weight: bold;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .score-value:focus {
    outline: none;
    box-shadow: 0 0 12px rgba(255, 215, 0, 0.6);
  }

  .score-modifier {
    background: rgba(255, 255, 255, 0.1);
    color: var(--color-secondary-text);
    font-size: 0.8rem;
    font-weight: bold;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    min-width: 30px;
    text-align: center;
  }

  .source-upload h3 {
    margin: 0 0 1rem 0;
    color: var(--color-primary-main);
    font-size: 1.5rem;
  }

  .upload-area {
    border: 2px dashed var(--color-primary-main);
    border-radius: 12px;
    padding: 3rem 2rem;
    text-align: center;
    margin-bottom: 2rem;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
  }

  .upload-area.drag-active {
    border-color: var(--color-primary-light);
    background: rgba(255, 215, 0, 0.1);
  }

  .upload-content p {
    margin: 0;
    color: var(--color-secondary-text);
  }

  .upload-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .file-input {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }

  .sources-list {
    margin-bottom: 2rem;
  }

  .sources-list h4 {
    margin: 0 0 1rem 0;
    color: var(--color-primary-text);
  }

  .source-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 215, 0, 0.2);
    border-radius: 6px;
    padding: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .source-preview {
    color: var(--color-primary-text);
    font-size: 0.9rem;
    flex: 1;
  }

  .remove-btn {
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    cursor: pointer;
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .error {
    background: rgba(220, 53, 69, 0.2);
    border: 1px solid #dc3545;
    border-radius: 6px;
    padding: 1rem;
    margin-bottom: 1rem;
    color: #ff6b6b;
    text-align: center;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: space-between;
    margin-top: 1rem;
  }

  .btn-primary, .btn-secondary {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn-primary {
    background: var(--color-primary-main);
    color: var(--color-primary-text);
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--color-primary-light);
    transform: translateY(-1px);
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: var(--color-content-dark);
    color: var(--color-primary-text);
    border: 1px solid var(--color-primary-main);
  }

  .btn-secondary:hover {
    background: var(--color-content-light);
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .create-character {
      padding: 1rem;
    }

    .top-section {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .image-upload-area {
      width: 100%;
      height: 250px;
    }

    .form-actions {
      flex-direction: column;
    }

    .scores-container {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>