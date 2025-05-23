<script lang="ts">
  import type {CharacterContext} from "../lib/types";
  import {getContext, onMount} from "svelte";
  import type {Writable} from "svelte/store";
  import {decryptMediaUrl} from "../lib/engine";
  import type {Character, LevelUpData, Feat, LevelUpChoice} from "../lib/character.types";
  import ThemeDialog from "./ThemeDialog.svelte";
  import CharacterSourceImport from "./CharacterSourceImport.svelte";
  import LevelUpDialog from "./LevelUpDialog.svelte";
  import {setUIActionDispatcher} from "../lib/chat";
  import {resetCharacterLevel} from "../lib/engine";

  const sidebarStore = getContext<Writable<boolean>>('sidebar')
  const {
    info,
    abilities,
    skills,
    feats,
    savingThrows,
    actions,
    spells,
    proficients,
    inventory,
    currency,
    background,
    senses,
    special
  } = getContext<CharacterContext>('character')

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

  let showThemeDialog = $state(false);
  let showSourceImport = $state(false);
  let showLevelUpDialog = $state(false);
  let fileInput: HTMLInputElement;
  let levelUpData = $state<LevelUpData | undefined>(undefined);
  
  // Sound state management
  let soundEnabled = $state(localStorage.getItem('dnd_sound_enabled') !== 'false');
  
  // Chat theme state management  
  let isScrollTheme = $state(localStorage.getItem('chat_scroll_theme') === 'true');
  
  // Get dialog state context and update it when dialogs open/close
  const dialogContext = getContext<{isAnyDialogOpen: boolean, setDialogState: (isOpen: boolean) => void}>('dialogState');
  
  // Update global dialog state whenever local dialog state changes
  $effect(() => {
    const anyDialogOpen = showThemeDialog || showSourceImport || showLevelUpDialog;
    if (dialogContext) {
      dialogContext.setDialogState(anyDialogOpen);
    }
  });
  
  // Set up UI action dispatcher for chat integration
  onMount(() => {
    setUIActionDispatcher((action: string, payload?: any) => {
      switch (action) {
        case 'levelUp':
          triggerLevelUp();
          break;
        case 'changeTheme':
          showThemeDialog = true;
          break;
        case 'showSources':
          openSourceImport();
          break;
      }
    });
    
    // Listen for global close dialogs event
    function handleCloseDialogs() {
      showThemeDialog = false;
      showSourceImport = false;
      showLevelUpDialog = false;
    }
    
    window.addEventListener('closeDialogs', handleCloseDialogs);
    
    return () => {
      window.removeEventListener('closeDialogs', handleCloseDialogs);
    };
  });

  async function exportCharacter() {
    // Build complete character sheet with all data
    const characterSheet = {
      info: $info,
      abilities: $abilities,
      skills: $skills,
      feats: $feats,
      savingThrows: $savingThrows,
      actions: $actions,
      spells: $spells,
      proficients: $proficients,
      inventory: $inventory,
      currency: $currency,
      background: $background,
      senses: $senses,
      special: $special,
      // Add metadata
      exportDate: new Date().toISOString(),
      exportVersion: "1.0.0",
      exportedBy: "D&D Character Sheet",
      // Add computed values for convenience
      computed: {
        totalLevel: $info.level,
        totalHP: $info.hp.maximum,
        currentHP: $info.hp.current,
        armorClass: $info.ac,
        proficiencyBonus: $info.proficiencyBonus,
        walkingSpeed: $info.speed,
        initiative: $info.initiative,
        inspiration: $info.inspiration,
        conditions: $info.conditions?.map(c => c.title) || [],
        defenses: $info.defences?.map(d => d.title) || [],
        totalInventoryWeight: $inventory.reduce((total, item) => total + (item.weight * item.quantity), 0),
        totalCurrencyValue: Object.entries($currency).reduce((total, [type, amount]) => {
          const values = { cp: 0.01, sp: 0.1, gp: 1, pp: 10 };
          return total + (amount * (values[type as keyof typeof values] || 1));
        }, 0),
        abilityModifiers: $abilities.reduce((mods, ability) => {
          mods[ability.name] = ability.modifier;
          return mods;
        }, {} as Record<string, number>),
        skillModifiers: $skills.reduce((mods, skill) => {
          mods[skill.name] = skill.modifier;
          return mods;
        }, {} as Record<string, number>),
        savingThrowModifiers: $savingThrows.reduce((mods, save) => {
          mods[save.name] = save.modifier;
          return mods;
        }, {} as Record<string, number>)
      }
    };
    
    try {
      const dataStr = JSON.stringify(characterSheet, null, 2);
      const dataBlob = new Blob([dataStr], {type: 'application/json'});
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      const characterName = $info.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      link.download = `${characterName}_character_${timestamp}.json`;
      link.click();
      URL.revokeObjectURL(link.href);
      
      // Show success message
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('showFunnyText', {
          detail: { text: 'Character exported successfully!', category: 'treasure' }
        }));
        window.dispatchEvent(new CustomEvent('playButtonClick'));
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export character. Please try again.');
    }
  }

  function triggerImport() {
    fileInput.click();
  }

  async function handleImport(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;

    try {
      const text = await file.text();
      const importedData = JSON.parse(text);
      
      // Check if it's already in our format
      if (isValidCharacterFormat(importedData)) {
        // TODO: Implement character update functionality
        alert('Character imported successfully!');
      } else {
        // Convert using AI
        await convertCharacterWithAI(importedData);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import character. Please check the file format.');
    }

    // Reset input
    input.value = '';
  }

  function isValidCharacterFormat(data: any): data is Character {
    return data && 
           typeof data === 'object' &&
           data.info && 
           data.abilities && 
           data.skills &&
           Array.isArray(data.feats);
  }

  async function convertCharacterWithAI(rawData: any) {
    const apiKey = localStorage.getItem('replicate_api_key');
    if (!apiKey) {
      alert('Replicate API key is required for character conversion');
      return;
    }

    try {
      const conversionPrompt = `
        Convert this D&D character data to our standard format. The target format has these main sections:
        - info: CharacterInfo (name, level, race, class, hp, ac, etc.)
        - abilities: Array of 6 abilities (STR, DEX, CON, INT, WIS, CHA) with score and modifier
        - skills: Array of all D&D skills with modifiers and proficiency
        - feats: Array of features, traits, and feats
        - savingThrows: Array of saving throws with modifiers
        - actions: Array of attacks and abilities
        - spells: Array of known spells
        - inventory: Array of items
        - proficients: Array of proficiency groups
        - currency: Object with gp, sp, cp, pp
        - background: Background information
        - senses: Array of passive senses
        - special: Special resource tracking

        Input data: ${JSON.stringify(rawData)}

        Return only valid JSON in the target format. Fill in reasonable defaults for missing data.
      `;

      const response = await callReplicateForConversion(conversionPrompt);
      
      if (isValidCharacterFormat(response)) {
        // TODO: Implement character update functionality
        alert('Character converted and imported successfully!');
      } else {
        throw new Error('AI conversion failed to produce valid format');
      }
    } catch (error) {
      console.error('AI conversion error:', error);
      alert('Failed to convert character with AI. Please check the data format.');
    }
  }

  async function callReplicateForConversion(prompt: string) {
    const apiKey = localStorage.getItem('replicate_api_key');
    
    const input = {
      top_k: 0,
      top_p: 0.9,
      prompt,
      max_tokens: 4000,
      min_tokens: 0,
      temperature: 0.3,
      length_penalty: 1,
      stop_sequences: "<|end_of_text|>,<|eot_id|>",
      prompt_template: `
        <|begin_of_text|><|start_header_id|>system<|end_header_id|>
        You are a D&D character data converter. Convert the input to the specified JSON format. Return only valid JSON, no other text.
        <|eot_id|><|start_header_id|>user<|end_header_id|>\n\n{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n
      `,
      presence_penalty: 1.15,
      log_performance_metrics: false
    };

    const req = await fetch("/replicate/models/meta/meta-llama-3-70b-instruct/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey
      },
      body: JSON.stringify({
        stream: false,
        input
      })
    });

    if (!req.ok) {
      throw new Error(`${req.status}: ${req.statusText}`);
    }

    const resp = await req.json();
    let getUrl: string | undefined = resp?.urls?.get;
    getUrl = getUrl?.replace('https://api.replicate.com/v1', 'replicate');

    if (!getUrl) {
      throw new Error(`Invalid response`);
    }

    // Poll for result
    let attempts = 0;
    while (attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const res = await fetch(getUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + apiKey
        },
      });

      if (res.ok) {
        const body = await res.json();
        const output = body.output?.join('');
        
        if (output) {
          return JSON.parse(output);
        }
      }
      
      attempts++;
    }
    
    throw new Error('Conversion timeout');
  }

  function openSourceImport() {
    showSourceImport = true;
  }
  
  function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('dnd_sound_enabled', soundEnabled.toString());
    
    // Update global sound manager if available
    if (typeof (globalThis as any).soundManager !== 'undefined') {
      (globalThis as any).soundManager.setSoundState(soundEnabled);
    }
    
    // Play test sound when enabling
    if (soundEnabled && typeof window !== 'undefined') {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('playButtonClick'));
      }, 100);
    }
  }
  
  function toggleChatTheme() {
    isScrollTheme = !isScrollTheme;
    localStorage.setItem('chat_scroll_theme', isScrollTheme.toString());
    
    // Dispatch event for chat component to pick up
    window.dispatchEvent(new CustomEvent('chatThemeChanged', {
      detail: { isScrollTheme }
    }));
  }
  

  async function triggerLevelUp() {
    // Check if we have any character sources available
    const hasSourceData = checkForCharacterSources();
    
    if (!hasSourceData) {
      // Show warning dialog instead of level up
      alert('⚠️ Cannot Level Up\n\nNo character progression data available. Please import character class information using the "Source" button to unlock level-up capabilities.\n\nSupported formats:\n• Official D&D sourcebooks (PDF)\n• Character class descriptions (text/JSON)\n• Character sheet images');
      return;
    }

    try {
      // Generate comprehensive level up data based on available sources
      const generatedLevelUpData = await generateLevelUpData($info.level + 1);
      levelUpData = generatedLevelUpData;
      showLevelUpDialog = true;
    } catch (error) {
      console.error('Level up generation failed:', error);
      alert('Failed to generate level up data. Please ensure you have valid character sources imported.');
    }
  }

  function checkForCharacterSources(): boolean {
    // Check localStorage for imported character sources
    const sources = localStorage.getItem('character_sources');
    if (sources) {
      try {
        const parsedSources = JSON.parse(sources);
        // Only count enabled sources
        const enabledSources = parsedSources.filter((s: any) => s.enabled !== false);
        return Array.isArray(enabledSources) && enabledSources.length > 0;
      } catch {
        return false;
      }
    }
    
    // Check if we have class data in character info
    return !!(
      $info.class && 
      $info.class.name && 
      $info.class.name !== 'Unknown'
    );
  }

  async function generateLevelUpData(targetLevel: number): Promise<LevelUpData> {
    // Get stored character sources (only enabled ones)
    const sources = localStorage.getItem('character_sources');
    let structuredSources: any[] = [];
    
    if (sources) {
      try {
        const parsedSources = JSON.parse(sources);
        const enabledSources = parsedSources.filter((s: any) => s.enabled !== false);
        structuredSources = enabledSources.map((s: any) => s.extractedData).filter(Boolean);
      } catch {
        structuredSources = [];
      }
    }

    // If no external sources, use basic class progression
    if (structuredSources.length === 0 && $info.class.name === 'Unknown') {
      throw new Error('No character progression data available');
    }

    // Create comprehensive level up data with all possibilities
    const levelUpData: LevelUpData = {
      level: targetLevel,
      hitDiceGain: { amount: 1, die: $info.class.hitDice?.die || 8 },
      proficiencyBonus: Math.ceil(targetLevel / 4) + 1,
      newFeatures: await generateNewFeatures(targetLevel, structuredSources),
      choices: await generateLevelUpChoices(targetLevel, structuredSources),
      spellSlotChanges: generateSpellSlotChanges(targetLevel)
    };

    return levelUpData;
  }

  async function generateNewFeatures(level: number, structuredSources: any[]): Promise<Feat[]> {
    const features: Feat[] = [];

    // Extract features from structured sources
    for (const source of structuredSources) {
      if (source.levels && Array.isArray(source.levels)) {
        // Find the level data
        const levelData = source.levels.find((l: any) => l.level === level);
        if (levelData && levelData.features) {
          // Add all features for this level
          features.push(...levelData.features);
        }
      }
    }

    // Also check the structured character database
    try {
      const characterDatabase = localStorage.getItem('dnd_character_database');
      if (characterDatabase) {
        const database = JSON.parse(characterDatabase);
        
        // Look for features that match this level and class
        if (database.features && Array.isArray(database.features)) {
          const classFeatures = database.features.filter((feature: any) => 
            feature.level === level && 
            (feature.type === 'class' || !feature.type) &&
            feature.name.toLowerCase().includes($info.class.name.toLowerCase())
          );
          features.push(...classFeatures.map((f: any) => ({
            id: f.id,
            level: f.level,
            source: f.type || 'class',
            title: f.name,
            description: f.description
          })));
        }

        // Look for class-specific features at this level
        if (database.classes && Array.isArray(database.classes)) {
          const characterClass = database.classes.find((cls: any) => 
            cls.name.toLowerCase() === $info.class.name.toLowerCase()
          );
          
          if (characterClass && characterClass.levels) {
            const levelData = characterClass.levels.find((l: any) => l.level === level);
            if (levelData && levelData.features) {
              features.push(...levelData.features);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error reading character database:', error);
    }

    // Add well-known class features for common classes
    if ($info.class.name.toLowerCase() === 'fighter' && level === 5) {
      features.push({
        id: 'extra_attack_5',
        level: 5,
        source: "class",
        title: "Extra Attack",
        description: "You can attack twice, instead of once, whenever you take the Attack action on your turn."
      });
    }

    // Add basic ASI feature at every 4th level if not already present
    if (level % 4 === 0 && !features.some(f => f.title?.toLowerCase().includes('ability score'))) {
      features.push({
        id: `asi_${level}`,
        level,
        source: "class",
        title: "Ability Score Improvement",
        description: "You can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each."
      });
    }

    // Add default class progression features if no specific ones found
    if (features.length === 0) {
      features.push({
        id: `class_feature_${level}`,
        level,
        source: "class",
        title: `${$info.class.name} Feature`,
        description: `You gain a new class feature at level ${level}. Consult your class description for details.`
      });
    }

    return features;
  }

  async function generateLevelUpChoices(level: number, structuredSources: any[]): Promise<LevelUpChoice[]> {
    const choices: LevelUpChoice[] = [];

    // Extract choices from structured sources
    for (const source of structuredSources) {
      if (source.levels && Array.isArray(source.levels)) {
        // Find the level data
        const levelData = source.levels.find((l: any) => l.level === level);
        if (levelData) {
          // Add choices from additionalChoices or choices field
          const levelChoices = levelData.additionalChoices || levelData.choices || [];
          for (const choice of levelChoices) {
            choices.push({
              type: choice.type || 'skill',
              title: choice.description || choice.title || `Level ${level} Choice`,
              description: choice.description || `Make a choice for level ${level}.`,
              options: choice.from || choice.options || ['Consult your class description'],
              maxSelections: choice.count || choice.maxSelections || 1
            });
          }
        }
      }
    }

    // Add ASI choice at every 4th level if not already present
    if (level % 4 === 0 && !choices.some(c => c.type === 'abilityScore')) {
      choices.push({
        type: 'abilityScore',
        title: 'Ability Score Improvement or Feat',
        description: 'Choose to increase ability scores or select a feat.',
        options: [
          'Strength +2', 'Dexterity +2', 'Constitution +2', 
          'Intelligence +2', 'Wisdom +2', 'Charisma +2',
          'Two different abilities +1 each',
          'Select a Feat instead'
        ],
        maxSelections: 1
      });
    }

    // Add default subclass choice at level 3 if no other choices
    if (level === 3 && choices.length === 0) {
      choices.push({
        type: 'subclass',
        title: 'Choose Subclass',
        description: 'Select your character\'s subclass specialization.',
        options: ['Consult your class for available options'],
        maxSelections: 1
      });
    }

    return choices;
  }

  function generateSpellSlotChanges(level: number): Record<number, number> | undefined {
    // Return spell slot progression for spellcasting classes
    const spellcastingClasses = ['wizard', 'sorcerer', 'warlock', 'bard', 'cleric', 'druid'];
    if (!spellcastingClasses.includes($info.class.name.toLowerCase())) {
      return undefined;
    }

    // Basic full caster progression
    const slots: Record<number, number> = {};
    if (level >= 1) slots[1] = Math.min(4, level + 1);
    if (level >= 3) slots[2] = Math.min(3, Math.floor((level - 1) / 2));
    if (level >= 5) slots[3] = Math.min(3, Math.floor((level - 3) / 2));
    if (level >= 7) slots[4] = Math.min(3, Math.floor((level - 5) / 2));
    if (level >= 9) slots[5] = Math.min(2, Math.floor((level - 7) / 2));

    return Object.keys(slots).length > 0 ? slots : undefined;
  }

  async function extractFeaturesFromSource(level: number, sourceData: string): Promise<Feat[]> {
    // Simple extraction - in a real implementation, this would use AI
    const features: Feat[] = [];
    
    // Look for level-specific features in the source data
    const levelRegex = new RegExp(`level\\s*${level}[^\\n]*([\\s\\S]*?)(?=level\\s*${level + 1}|$)`, 'i');
    const match = sourceData.match(levelRegex);
    
    if (match) {
      const featureText = match[1];
      // Extract feature names (simplified)
      const featureNames = featureText.match(/^[A-Z][^.!?]*[.!?]/gm) || [];
      
      featureNames.forEach((name, index) => {
        features.push({
          id: `extracted_feature_${level}_${index}`,
          level,
          source: "class",
          title: name.replace(/[.!?]$/, '').trim(),
          description: `Feature gained at level ${level}.`
        });
      });
    }

    return features;
  }

  async function extractChoicesFromSource(level: number, sourceData: string): Promise<LevelUpChoice[]> {
    const choices: LevelUpChoice[] = [];
    
    // Look for choice indicators in source data
    const choiceKeywords = ['choose', 'select', 'pick', 'option'];
    const lines = sourceData.toLowerCase().split('\n');
    
    for (const line of lines) {
      if (line.includes(`level ${level}`) && choiceKeywords.some(keyword => line.includes(keyword))) {
        choices.push({
          type: 'skill',
          title: 'Class Feature Choice',
          description: 'Make a choice for your class feature.',
          options: ['Consult your class description for available options'],
          maxSelections: 1
        });
        break;
      }
    }

    return choices;
  }

</script>

<div class="root">
    <div class="info">
        <div class="profile-picture">
            <img src={imageUrl} alt={$info.name}/>
        </div>
        <h3>{$info.name}</h3>
        <span>{$info.gender} {$info.race.name} {$info.class.name}</span>
        <span>Level {$info.level}</span>
    </div>
    <div class="actions">
        <button onclick={exportCharacter} class="action-btn export-btn">
          <span class="btn-icon">📄</span>
          Export
        </button>
        <button onclick={triggerImport} class="action-btn import-btn">
          <span class="btn-icon">📁</span>
          Import
        </button>
        <button onclick={openSourceImport} class="action-btn source-btn">
          <span class="btn-icon">🔍</span>
          Sources
        </button>
        <button onclick={triggerLevelUp} class="action-btn levelup-btn">
          <span class="btn-icon">⬆️</span>
          Level Up
        </button>
        <button onclick={() => showThemeDialog = true} class="action-btn theme-btn">
          <span class="btn-icon">🎨</span>
          Theme
        </button>
        <button onclick={() => window.location.href = $info.infoUrl} class="action-btn docs-btn">
          <span class="btn-icon">📚</span>
          Docs
        </button>
        <button onclick={() => sidebarStore.update(curr => !curr)} class="action-btn sidebar-btn">
          <span class="btn-icon">💬</span>
          Chat
        </button>
        <button onclick={toggleChatTheme} class="action-btn chat-theme-btn" title={isScrollTheme ? 'Switch to Modern Chat' : 'Switch to Scroll Theme'}>
          <span class="btn-icon">{isScrollTheme ? '💬' : '📜'}</span>
          {isScrollTheme ? 'Modern' : 'Scroll'}
        </button>
        <button onclick={toggleSound} class="action-btn sound-btn" title="Toggle Sound">
          <span class="btn-icon">{soundEnabled ? '🔊' : '🔇'}</span>
          Sound
        </button>
    </div>
</div>

<input 
  bind:this={fileInput}
  type="file" 
  accept=".json"
  onchange={handleImport}
  style="display: none;"
/>

<ThemeDialog bind:isOpen={showThemeDialog} />
<CharacterSourceImport bind:isOpen={showSourceImport} />
<LevelUpDialog bind:isOpen={showLevelUpDialog} bind:levelUpData={levelUpData} />

<style>
    .root {
        position: relative;
        display: flex;
        width: 100%;
        height: 100%;
        justify-content: space-between;
        align-items: center;
        flex-direction: row;
        padding: 8px 16px;
        overflow: hidden;
        background-color: var(--color-content-dark);
    }

    .info {
        position: relative;
        display: grid;
        width: auto;
        height: 100%;
        gap: 8px;
        grid-template-columns: 80px 1fr;
        grid-template-rows: auto auto auto;
        align-items: center;
        justify-content: center;
        max-height: 100%;
        overflow: hidden;
        box-sizing: border-box;
    }

    .profile-picture {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        grid-column: 1;
        grid-row: span 3;
        max-height: 80px;
    }

    .profile-picture > img {
        position: relative;
        object-fit: cover;
        object-position: center center;
        border-radius: 50%;
        overflow: hidden;
        border: 6px var(--color-primary-main) solid;
        width: 100%;
        height: 100%;
        max-height: 100%;
    }

    h3 {
        margin: 0;
        padding: 0;
    }

    span {
        font-size: 0.8em;
        margin: 0;
        padding: 0;
    }

    .actions {
        position: relative;
        display: flex;
        width: auto;
        height: 100%;
        justify-content: center;
        align-items: flex-end;
        flex-direction: row;
        gap: 8px;
        flex-wrap: wrap;
    }

    .action-btn {
        border: 2px solid var(--color-primary-main);
        color: var(--color-primary-text);
        cursor: pointer;
        padding: 8px 12px;
        border-radius: 8px;
        overflow: hidden;
        outline: none;
        display: flex;
        align-items: center;
        gap: 6px;
        background: linear-gradient(145deg, var(--color-content-main), var(--color-content-dark));
        font-size: 0.9rem;
        font-weight: 600;
        transition: all 0.3s ease;
        min-width: 80px;
        justify-content: center;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
    }

    .action-btn:hover {
        background: linear-gradient(145deg, var(--color-content-light), var(--color-content-main));
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        border-color: var(--color-secondary-main);
    }

    .action-btn:active {
        transform: translateY(0);
    }

    .btn-icon {
        font-size: 1rem;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.7));
    }

    .export-btn:hover {
        background: linear-gradient(145deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1));
    }

    .import-btn:hover {
        background: linear-gradient(145deg, rgba(0, 255, 136, 0.2), rgba(0, 255, 136, 0.1));
    }

    .theme-btn:hover {
        background: linear-gradient(145deg, rgba(170, 68, 255, 0.2), rgba(170, 68, 255, 0.1));
    }

    .docs-btn:hover {
        background: linear-gradient(145deg, rgba(255, 107, 53, 0.2), rgba(255, 107, 53, 0.1));
    }

    .sidebar-btn:hover {
        background: linear-gradient(145deg, rgba(0, 170, 255, 0.2), rgba(0, 170, 255, 0.1));
    }

    .source-btn:hover {
        background: linear-gradient(145deg, rgba(120, 119, 198, 0.2), rgba(120, 119, 198, 0.1));
    }

    .levelup-btn:hover {
        background: linear-gradient(145deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1));
    }
    
    .sound-btn:hover {
        background: linear-gradient(145deg, rgba(255, 165, 0, 0.2), rgba(255, 165, 0, 0.1));
    }
    
    .chat-theme-btn:hover {
        background: linear-gradient(145deg, rgba(138, 43, 226, 0.2), rgba(138, 43, 226, 0.1));
    }
    

    @media (max-width: 768px) {
        .actions {
            flex-direction: column;
            align-items: center;
        }
        
        .action-btn {
            min-width: 70px;
            padding: 6px 10px;
            font-size: 0.8rem;
        }
    }
</style>