<script lang="ts">
  import { navigate } from "sly-svelte-location-router";
  import { characterService } from "../lib/firestore.service";
  import type { Character } from "../lib/character.types";
  import Background from "$components/Background.svelte";
  
  interface CharacterConcept {
    name?: string;
    race?: string;
    class?: string;
    background?: string;
    personality?: string;
    backstory?: string;
    goals?: string;
    stats?: {
      strength?: number;
      dexterity?: number;
      constitution?: number;
      intelligence?: number;
      wisdom?: number;
      charisma?: number;
    };
  }

  let prompt = $state("");
  let isGenerating = $state(false);
  let generatedConcept: CharacterConcept | null = $state(null);
  let error: string | null = $state(null);
  let isCreating = $state(false);

  const examplePrompts = [
    "A brave human fighter who was a soldier before becoming an adventurer",
    "An elven wizard obsessed with ancient magical artifacts",
    "A halfling rogue with a criminal background who steals from the rich",
    "A dragonborn paladin devoted to justice and protecting the innocent",
    "A dwarven cleric of the forge domain who crafts magical weapons"
  ];

  function useExamplePrompt(example: string) {
    prompt = example;
  }

  async function generateCharacter() {
    if (!prompt.trim()) {
      error = "Please enter a character concept";
      return;
    }

    isGenerating = true;
    error = null;

    try {
      // Simulate AI generation for now
      // In a real implementation, this would call an AI service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock generated character concept
      generatedConcept = {
        name: "Generated Name",
        race: "Human",
        class: "Fighter",
        background: "Soldier",
        personality: "Brave and determined, always stands up for what's right",
        backstory: "A former soldier who left the army to become an adventurer",
        goals: "To protect the innocent and find purpose beyond war",
        stats: {
          strength: 16,
          dexterity: 13,
          constitution: 15,
          intelligence: 10,
          wisdom: 12,
          charisma: 14
        }
      };
    } catch (err) {
      error = "Failed to generate character. Please try again.";
      generatedConcept = null;
    } finally {
      isGenerating = false;
    }
  }

  async function createCharacter() {
    if (!generatedConcept) return;
    
    isCreating = true;
    error = null;
    
    try {
      // Convert CharacterConcept to Character format for Firebase
      const character: Partial<Character> = {
        name: generatedConcept.name || "Unnamed Character",
        level: 1,
        race: {
          name: generatedConcept.race || "Human",
          subrace: ""
        },
        class: {
          name: generatedConcept.class || "Fighter",
          level: 1,
          hitDie: 10,
          primaryAbility: ["Strength", "Dexterity"]
        },
        background: {
          name: generatedConcept.background || "Folk Hero",
          skillProficiencies: [],
          languages: [],
          equipment: []
        },
        abilities: {
          strength: generatedConcept.stats?.strength || 10,
          dexterity: generatedConcept.stats?.dexterity || 10,
          constitution: generatedConcept.stats?.constitution || 10,
          intelligence: generatedConcept.stats?.intelligence || 10,
          wisdom: generatedConcept.stats?.wisdom || 10,
          charisma: generatedConcept.stats?.charisma || 10
        },
        hitPoints: {
          current: 10,
          maximum: 10,
          temporary: 0
        },
        armorClass: 10,
        speed: 30,
        proficiencyBonus: 2,
        savingThrows: {
          strength: { proficient: false, value: 0 },
          dexterity: { proficient: false, value: 0 },
          constitution: { proficient: false, value: 0 },
          intelligence: { proficient: false, value: 0 },
          wisdom: { proficient: false, value: 0 },
          charisma: { proficient: false, value: 0 }
        },
        skills: {},
        features: [],
        spells: [],
        equipment: [],
        personality: {
          traits: generatedConcept.personality ? [generatedConcept.personality] : [],
          ideals: [],
          bonds: generatedConcept.backstory ? [generatedConcept.backstory] : [],
          flaws: [],
          goals: generatedConcept.goals ? [generatedConcept.goals] : []
        }
      };
      
      // Save character to Firebase
      const characterId = await characterService.createCharacter(character as Character, {
        name: character.name || "Unnamed Character",
        level: 1,
        class: character.class?.name || "Unknown",
        race: character.race?.name || "Unknown",
        tags: ["ai-generated"]
      });
      
      console.log("Character created successfully with ID:", characterId);
      
      // Navigate to character sheet with the new character ID
      navigate(`/main/character/${characterId}`);
    } catch (err) {
      console.error("Failed to create character:", err);
      error = "Failed to create character. Please try again.";
    } finally {
      isCreating = false;
    }
  }

  function regenerateCharacter() {
    generateCharacter();
  }

  function editPrompt() {
    generatedConcept = null;
    error = null;
  }
</script>

<Background />

<div class="create-character">
  <div class="header">
    <h1>Create New Character</h1>
    <p>Describe your character concept and let AI help you build it</p>
  </div>

  {#if !generatedConcept}
    <div class="input-section">
      <div class="prompt-input">
        <label for="character-prompt">Character Concept</label>
        <textarea
          id="character-prompt"
          bind:value={prompt}
          placeholder="Describe your character idea... (e.g., 'A brave knight seeking redemption' or 'A cunning rogue with a mysterious past')"
          rows="4"
          disabled={isGenerating}
        ></textarea>
      </div>

      <div class="examples">
        <h3>Need inspiration? Try these examples:</h3>
        <div class="example-grid">
          {#each examplePrompts as example}
            <button 
              class="example-btn" 
              onclick={() => useExamplePrompt(example)}
              disabled={isGenerating}
            >
              {example}
            </button>
          {/each}
        </div>
      </div>

      {#if error}
        <div class="error">{error}</div>
      {/if}

      <div class="actions">
        <button 
          class="btn-primary" 
          onclick={generateCharacter}
          disabled={isGenerating || !prompt.trim()}
        >
          {#if isGenerating}
            <span class="spinner"></span>
            Generating Character...
          {:else}
            Generate Character
          {/if}
        </button>
        <button class="btn-secondary" onclick={() => navigate('/main/character')}>
          Cancel
        </button>
      </div>
    </div>
  {:else}
    <div class="concept-display">
      <div class="concept-header">
        <h2>Generated Character Concept</h2>
        <div class="concept-actions">
          <button class="btn-secondary" onclick={editPrompt}>Edit Prompt</button>
          <button class="btn-secondary" onclick={regenerateCharacter} disabled={isGenerating}>
            {#if isGenerating}
              <span class="spinner"></span>
              Regenerating...
            {:else}
              Regenerate
            {/if}
          </button>
        </div>
      </div>

      <div class="concept-grid">
        <div class="concept-section">
          <h3>Basic Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>Name:</label>
              <span>{generatedConcept.name || "Not specified"}</span>
            </div>
            <div class="info-item">
              <label>Race:</label>
              <span>{generatedConcept.race || "Not specified"}</span>
            </div>
            <div class="info-item">
              <label>Class:</label>
              <span>{generatedConcept.class || "Not specified"}</span>
            </div>
            <div class="info-item">
              <label>Background:</label>
              <span>{generatedConcept.background || "Not specified"}</span>
            </div>
          </div>
        </div>

        <div class="concept-section">
          <h3>Character Traits</h3>
          <div class="trait-item">
            <label>Personality:</label>
            <p>{generatedConcept.personality || "Not specified"}</p>
          </div>
          <div class="trait-item">
            <label>Backstory:</label>
            <p>{generatedConcept.backstory || "Not specified"}</p>
          </div>
          <div class="trait-item">
            <label>Goals:</label>
            <p>{generatedConcept.goals || "Not specified"}</p>
          </div>
        </div>

        {#if generatedConcept.stats}
          <div class="concept-section">
            <h3>Ability Scores</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <label>STR</label>
                <span>{generatedConcept.stats.strength || 10}</span>
              </div>
              <div class="stat-item">
                <label>DEX</label>
                <span>{generatedConcept.stats.dexterity || 10}</span>
              </div>
              <div class="stat-item">
                <label>CON</label>
                <span>{generatedConcept.stats.constitution || 10}</span>
              </div>
              <div class="stat-item">
                <label>INT</label>
                <span>{generatedConcept.stats.intelligence || 10}</span>
              </div>
              <div class="stat-item">
                <label>WIS</label>
                <span>{generatedConcept.stats.wisdom || 10}</span>
              </div>
              <div class="stat-item">
                <label>CHA</label>
                <span>{generatedConcept.stats.charisma || 10}</span>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <div class="original-prompt">
        <h4>Original Prompt:</h4>
        <p>"{prompt}"</p>
      </div>

      <div class="final-actions">
        <button class="btn-primary" onclick={createCharacter} disabled={isCreating}>
          {#if isCreating}
            <span class="spinner"></span>
            Creating Character...
          {:else}
            Create This Character
          {/if}
        </button>
        <button class="btn-secondary" onclick={editPrompt} disabled={isCreating}>
          Start Over
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .create-character {
    height: 100%;
    overflow-y: auto;
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .header h1 {
    margin: 0 0 0.5rem 0;
    color: var(--color-primary-main);
    font-size: 2.5rem;
  }

  .header p {
    margin: 0;
    color: var(--color-secondary-text);
    font-size: 1.1rem;
  }

  .input-section {
    max-width: 800px;
    margin: 0 auto;
  }

  .prompt-input {
    margin-bottom: 2rem;
  }

  .prompt-input label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
    color: var(--color-primary-text);
  }

  .prompt-input textarea {
    width: 100%;
    padding: 1rem;
    border: 2px solid var(--color-primary-main);
    border-radius: 0.5rem;
    background: var(--color-content-main);
    color: var(--color-primary-text);
    font-size: 1rem;
    line-height: 1.5;
    resize: vertical;
    min-height: 120px;
  }

  .prompt-input textarea:focus {
    outline: none;
    border-color: var(--color-accent);
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
  }

  .prompt-input textarea:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .examples {
    margin-bottom: 2rem;
  }

  .examples h3 {
    margin: 0 0 1rem 0;
    color: var(--color-primary-text);
    font-size: 1.2rem;
  }

  .example-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 0.75rem;
  }

  .example-btn {
    padding: 0.75rem 1rem;
    background: var(--color-content-dark);
    border: 1px solid var(--color-primary-main);
    border-radius: 0.375rem;
    color: var(--color-primary-text);
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    font-size: 0.9rem;
    line-height: 1.4;
  }

  .example-btn:hover:not(:disabled) {
    background: var(--color-primary-main);
    transform: translateY(-1px);
  }

  .example-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .error {
    background: rgba(220, 53, 69, 0.1);
    border: 1px solid #dc3545;
    border-radius: 0.375rem;
    padding: 1rem;
    margin-bottom: 1rem;
    color: #dc3545;
    text-align: center;
  }

  .actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }

  .btn-primary, .btn-secondary {
    padding: 0.875rem 1.75rem;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
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
    transform: translateY(-2px);
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .btn-secondary {
    background: var(--color-content-dark);
    color: var(--color-primary-text);
    border: 1px solid var(--color-primary-main);
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--color-content-light);
    transform: translateY(-1px);
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
    to {
      transform: rotate(360deg);
    }
  }

  .concept-display {
    max-width: 1000px;
    margin: 0 auto;
  }

  .concept-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .concept-header h2 {
    margin: 0;
    color: var(--color-primary-main);
    font-size: 2rem;
  }

  .concept-actions {
    display: flex;
    gap: 0.75rem;
  }

  .concept-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-bottom: 2rem;
  }

  .concept-section {
    background: var(--color-content-main);
    border: 1px solid var(--color-primary-main);
    border-radius: 0.5rem;
    padding: 1.5rem;
  }

  .concept-section h3 {
    margin: 0 0 1rem 0;
    color: var(--color-primary-main);
    font-size: 1.3rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 0.5rem;
  }

  .info-grid {
    display: grid;
    gap: 0.75rem;
  }

  .info-item {
    display: flex;
    gap: 0.5rem;
  }

  .info-item label {
    font-weight: bold;
    color: var(--color-secondary-text);
    min-width: 80px;
  }

  .info-item span {
    color: var(--color-primary-text);
  }

  .trait-item {
    margin-bottom: 1rem;
  }

  .trait-item:last-child {
    margin-bottom: 0;
  }

  .trait-item label {
    display: block;
    font-weight: bold;
    color: var(--color-secondary-text);
    margin-bottom: 0.25rem;
  }

  .trait-item p {
    margin: 0;
    color: var(--color-primary-text);
    line-height: 1.5;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  .stat-item {
    text-align: center;
    background: var(--color-content-dark);
    border-radius: 0.375rem;
    padding: 0.75rem;
  }

  .stat-item label {
    display: block;
    font-weight: bold;
    color: var(--color-secondary-text);
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
  }

  .stat-item span {
    display: block;
    color: var(--color-primary-text);
    font-size: 1.25rem;
    font-weight: bold;
  }

  .original-prompt {
    background: var(--color-content-dark);
    border-radius: 0.5rem;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .original-prompt h4 {
    margin: 0 0 0.5rem 0;
    color: var(--color-secondary-text);
    font-size: 1rem;
  }

  .original-prompt p {
    margin: 0;
    color: var(--color-primary-text);
    font-style: italic;
    line-height: 1.5;
  }

  .final-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    padding-top: 1rem;
  }

  @media (max-width: 768px) {
    .create-character {
      padding: 1rem;
    }

    .header h1 {
      font-size: 2rem;
    }

    .concept-header {
      flex-direction: column;
      align-items: stretch;
    }

    .concept-actions {
      justify-content: center;
    }

    .actions, .final-actions {
      flex-direction: column;
    }

    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>