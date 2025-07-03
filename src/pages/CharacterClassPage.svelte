<script lang="ts">
  import { onMount } from "svelte";
  import { navigate } from "sly-svelte-location-router";
  import { aiService } from "../lib/ai";
  import { characterService } from "../lib/firestore.service";
  import type { Character } from "../lib/character.types";
  import Background from "$components/Background.svelte";

  interface CharacterData {
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
  }

  interface ClassOption {
    name: string;
    description: string;
    hitDie: string;
    primaryAbility: string;
    savingThrows: string;
  }

  let characterData: CharacterData | null = null;
  let isAnalyzing = $state(true);
  let error = $state<string | null>(null);
  let aiAnalysis = $state<any>(null);
  let availableClasses = $state<ClassOption[]>([]);
  let selectedClass = $state<string>('');

  const standardClasses: ClassOption[] = [
    {
      name: "Artificer",
      description: "Masters of invention, artificers use ingenuity and magic to unlock extraordinary capabilities in objects.",
      hitDie: "d8",
      primaryAbility: "Intelligence",
      savingThrows: "Constitution, Intelligence"
    },
    {
      name: "Barbarian", 
      description: "A fierce warrior of primitive background who can enter a battle rage.",
      hitDie: "d12",
      primaryAbility: "Strength",
      savingThrows: "Strength, Constitution"
    },
    {
      name: "Bard",
      description: "A master of song, speech, and the magic they contain.",
      hitDie: "d8", 
      primaryAbility: "Charisma",
      savingThrows: "Dexterity, Charisma"
    },
    {
      name: "Cleric",
      description: "A priestly champion who wields divine magic in service of a higher power.",
      hitDie: "d8",
      primaryAbility: "Wisdom", 
      savingThrows: "Wisdom, Charisma"
    },
    {
      name: "Druid",
      description: "A priest of the Old Faith, wielding the elemental forces of nature and transforming into animal forms.",
      hitDie: "d8",
      primaryAbility: "Wisdom",
      savingThrows: "Intelligence, Wisdom"
    },
    {
      name: "Fighter",
      description: "A master of martial combat, skilled with a variety of weapons and armor.",
      hitDie: "d10",
      primaryAbility: "Strength or Dexterity", 
      savingThrows: "Strength, Constitution"
    },
    {
      name: "Monk",
      description: "A master of martial arts, harnessing the power of the body in pursuit of physical and spiritual perfection.",
      hitDie: "d8",
      primaryAbility: "Dexterity, Wisdom",
      savingThrows: "Strength, Dexterity"
    },
    {
      name: "Paladin",
      description: "A holy warrior bound to a sacred oath.",
      hitDie: "d10", 
      primaryAbility: "Strength, Charisma",
      savingThrows: "Wisdom, Charisma"
    },
    {
      name: "Ranger",
      description: "A warrior of the wilderness.",
      hitDie: "d10",
      primaryAbility: "Dexterity, Wisdom",
      savingThrows: "Strength, Dexterity"
    },
    {
      name: "Rogue",
      description: "A scoundrel who uses stealth and trickery to overcome obstacles.",
      hitDie: "d8",
      primaryAbility: "Dexterity", 
      savingThrows: "Dexterity, Intelligence"
    },
    {
      name: "Sorcerer",
      description: "A spellcaster who draws on inherent magic from a gift or bloodline.",
      hitDie: "d6",
      primaryAbility: "Charisma",
      savingThrows: "Constitution, Charisma"
    },
    {
      name: "Warlock",
      description: "A wielder of magic that is derived from a bargain with an extraplanar entity.",
      hitDie: "d8",
      primaryAbility: "Charisma",
      savingThrows: "Wisdom, Charisma"
    },
    {
      name: "Wizard",
      description: "A scholarly magic-user capable of manipulating the structures of reality.",
      hitDie: "d6",
      primaryAbility: "Intelligence",
      savingThrows: "Intelligence, Wisdom"
    }
  ];

  onMount(async () => {
    const savedData = sessionStorage.getItem('characterCreationData');
    if (!savedData) {
      navigate('/main/create/character');
      return;
    }

    characterData = JSON.parse(savedData);
    await analyzeCharacterSources();
  });

  async function analyzeCharacterSources() {
    if (!characterData) return;

    try {
      availableClasses = [...standardClasses];

      if (characterData.sources && characterData.sources.length > 0) {
        console.log('Analyzing character sources:', characterData.sources.length, 'sources');
        
        const analysis = await aiService.analyzeCharacterSources(
          characterData.sources,
          characterData.name,
          characterData.level,
          'manual-roll'
        );

        console.log('AI Analysis response:', analysis);

        try {
          aiAnalysis = JSON.parse(analysis);
          console.log('Parsed AI Analysis:', aiAnalysis);
          
          if (aiAnalysis.additionalClasses && Array.isArray(aiAnalysis.additionalClasses)) {
            availableClasses.push(...aiAnalysis.additionalClasses);
            console.log('Added additional classes:', aiAnalysis.additionalClasses);
          }
        } catch (parseError) {
          console.error('Failed to parse AI response as JSON:', parseError);
          console.error('Raw AI response:', analysis);
          // Continue without AI analysis
        }
      }

      isAnalyzing = false;
    } catch (err) {
      console.error('Character source analysis error:', err);
      error = `Failed to analyze character sources: ${err instanceof Error ? err.message : 'Unknown error'}`;
      isAnalyzing = false;
    }
  }

  function selectClass(className: string) {
    selectedClass = className;
  }

  async function continueToNext() {
    if (!selectedClass || !characterData) return;

    try {
      const character: Partial<Character> = {
        name: characterData.name,
        level: characterData.level,
        abilityScores: characterData.abilityScores,
        imageUrl: characterData.imageUrl,
        backgroundUrl: characterData.backgroundUrl,
        class: { name: selectedClass },
        race: { name: "Unknown" },
        background: { name: "Unknown" }
      };

      const characterId = await characterService.createCharacter(character as Character, {
        name: character.name || characterData.name,
        level: characterData.level,
        class: selectedClass,
        race: "Unknown",
        tags: characterData.sources.length > 0 ? ["ai-generated", "sources-uploaded"] : ["manually-created"]
      });

      if (characterData.sources && characterData.sources.length > 0) {
        await characterService.setCharacterSources(characterId, characterData.sources);
      }

      const details = {
        name: characterData.name,
        level: characterData.level,
        selectedClass,
        abilityScores: characterData.abilityScores,
        imageUrl: characterData.imageUrl,
        backgroundUrl: characterData.backgroundUrl,
        aiAnalysis: aiAnalysis || null,
        creationMethod: characterData.sources.length > 0 ? 'ai-assisted' : 'manual'
      };

      await characterService.setCharacterDetails(characterId, details);

      sessionStorage.removeItem('characterCreationData');
      navigate(`/character/${characterId}`);
    } catch (err) {
      error = 'Failed to create character';
      console.error('Character creation error:', err);
    }
  }
</script>

<Background />

<div class="page-wrapper">
  <div class="class-selection">
    <button class="back-btn" on:click={() => navigate('/main/create/character')}>
      ← Back
    </button>
    
    <div class="header">
      <h1>Choose Your Class</h1>
      {#if characterData}
        <p>Select a class for {characterData.name}</p>
      {/if}
    </div>

    {#if isAnalyzing}
      <div class="loading-container">
        <div class="spinner"></div>
        <h2>Preparing Character Classes</h2>
        <p>Loading available classes{characterData?.sources?.length ? ' and analyzing your uploaded materials' : ''}...</p>
      </div>
    {:else if error}
      <div class="error">{error}</div>
    {:else}
      <div class="class-grid">
        {#each availableClasses as classOption}
          <div class="class-card {selectedClass === classOption.name ? 'selected' : ''}" 
               on:click={() => selectClass(classOption.name)}>
            <h3>{classOption.name}</h3>
            <p class="class-description">{classOption.description}</p>
            <div class="class-details">
              <div class="detail">
                <span class="label">Hit Die:</span>
                <span class="value">{classOption.hitDie}</span>
              </div>
              <div class="detail">
                <span class="label">Primary:</span>
                <span class="value">{classOption.primaryAbility}</span>
              </div>
              <div class="detail">
                <span class="label">Saves:</span>
                <span class="value">{classOption.savingThrows}</span>
              </div>
            </div>
          </div>
        {/each}
      </div>

      {#if selectedClass}
        <div class="continue-section">
          <button class="btn-primary" on:click={continueToNext}>
            Continue with {selectedClass}
          </button>
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .page-wrapper {
    min-height: 100vh;
    width: 100%;
    overflow-y: auto;
  }

  .class-selection {
    padding: 4rem 2rem;
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
    margin-bottom: 3rem;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
  }

  .header h1 {
    margin: 0 0 1rem 0;
    color: var(--color-primary-main);
    font-size: 2.5rem;
  }

  .header p {
    margin: 0;
    color: var(--color-secondary-text);
    font-size: 1.2rem;
  }

  .loading-container {
    text-align: center;
    padding: 4rem 2rem;
    max-width: 600px;
    margin: 0 auto;
  }

  .spinner {
    width: 60px;
    height: 60px;
    border: 4px solid rgba(255, 215, 0, 0.3);
    border-top: 4px solid var(--color-primary-main);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 2rem auto;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .loading-container h2 {
    margin: 0 0 1rem 0;
    color: var(--color-primary-main);
    font-size: 1.8rem;
  }

  .loading-container p {
    margin: 0;
    color: var(--color-secondary-text);
    line-height: 1.5;
  }

  .error {
    background: rgba(220, 53, 69, 0.2);
    border: 1px solid #dc3545;
    border-radius: 6px;
    padding: 1rem;
    margin: 2rem auto;
    max-width: 600px;
    color: #ff6b6b;
    text-align: center;
  }

  .class-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 1.5rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .class-card {
    background: var(--color-content-dark);
    border: 2px solid rgba(255, 215, 0, 0.3);
    border-radius: 12px;
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
  }

  .class-card:hover {
    border-color: var(--color-primary-main);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
  }

  .class-card.selected {
    border-color: var(--color-primary-light);
    background: rgba(255, 215, 0, 0.1);
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
  }

  .class-card h3 {
    margin: 0 0 1rem 0;
    color: var(--color-primary-main);
    font-size: 1.5rem;
    font-weight: 700;
  }

  .class-description {
    margin: 0 0 1.5rem 0;
    color: var(--color-primary-text);
    line-height: 1.4;
    font-size: 0.95rem;
  }

  .class-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .detail {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .label {
    color: var(--color-secondary-text);
    font-size: 0.9rem;
  }

  .value {
    color: var(--color-primary-text);
    font-weight: 600;
    font-size: 0.9rem;
  }

  .continue-section {
    text-align: center;
    margin-top: 3rem;
  }

  .btn-primary {
    padding: 1rem 2rem;
    background: var(--color-primary-main);
    color: var(--color-primary-text);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1.1rem;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .btn-primary:hover {
    background: var(--color-primary-light);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
  }

  @media (max-width: 768px) {
    .class-selection {
      padding: 1rem;
    }

    .class-grid {
      grid-template-columns: 1fr;
    }

    .header h1 {
      font-size: 2rem;
    }
  }
</style>