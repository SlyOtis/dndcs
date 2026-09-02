<script lang="ts">
  import { getContext } from "svelte";
  import type { CharacterContext } from "$lib/types";
  import { createCharacterInfoStore, fileImportUtils } from "$lib/characterInfo";
  import { setUIActionDispatcher } from "$lib/chat";
  import { resetCharacterLevel } from "$lib/engine";
  import ThemeDialog from "./ThemeDialog.svelte";
  import CharacterSourceImport from "./CharacterSourceImport.svelte";
  import LevelUpDialog from "./LevelUpDialog.svelte";
  import type { Character, LevelUpData, Feat, LevelUpChoice } from "$lib/character.types";

  // Get character context
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
  } = getContext<CharacterContext>('character');

  // Create component state
  const store = createCharacterInfoStore();
  const {
    openLevelUpDialog,
    closeLevelUpDialog,
    openThemeDialog,
    closeThemeDialog,
    openSourceImportDialog,
    closeSourceImportDialog
  } = store;

  let fileInput: HTMLInputElement;

  // UI action dispatcher setup
  setUIActionDispatcher((action: string, payload?: any) => {
    switch (action) {
      case 'openLevelUpDialog':
        if (payload && payload.levelUpData) {
          openLevelUpDialog(payload.levelUpData);
        }
        break;
      case 'openThemeDialog':
        openThemeDialog();
        break;
      case 'openSourceImport':
        openSourceImportDialog();
        break;
    }
  });

  // Export character functionality
  async function exportCharacter() {
    const characterSheet = {
      meta: {
        exportDate: new Date().toISOString(),
        exportVersion: "1.0.0",
        exportedBy: "D&D Character Sheet",
        computed: {
          totalLevel: $info.level,
          totalHP: $info.hp.max,
          currentHP: $info.hp.current,
          armorClass: $info.ac,
          proficiencyBonus: $info.proficiencyBonus,
          walkingSpeed: $info.speed,
          initiative: $info.initiative,
          inspiration: $info.inspiration,
          conditions: $info.conditions?.map(c => c.title) || [],
          defenses: $info.defences?.map(d => d.title) || [],
          totalInventoryWeight: $inventory.reduce((total, item) => total + (item.weight * item.quantity), 0),
        }
      },
      character: {
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
        special: $special
      }
    };

    const dataStr = JSON.stringify(characterSheet, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    const characterName = $info.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = new Date().toISOString().split('T')[0];
    link.download = `${characterName}_character_${timestamp}.json`;
    link.click();
    URL.revokeObjectURL(link.href);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('showFunnyText', {
        detail: { text: 'Character exported successfully!', category: 'treasure' }
      }));
    }
  }

  // Level up functionality
  async function levelUp() {
    if (!checkForCharacterSources()) {
      alert('Please import character sources (class data, features, etc.) before leveling up. Use the Sources button to import your character data.');
      return;
    }

    try {
      const generatedLevelUpData = await generateLevelUpData($info.level + 1);
      openLevelUpDialog(generatedLevelUpData);
    } catch (error) {
      console.error('Level up generation failed:', error);
      alert('Failed to generate level up data. Please ensure you have valid character sources imported.');
    }
  }

  function checkForCharacterSources(): boolean {
    const sources = localStorage.getItem('character_sources');
    if (sources) {
      try {
        const parsedSources = JSON.parse(sources);
        if (Array.isArray(parsedSources) && parsedSources.some(source => source.enabled !== false)) {
          return true;
        }
      } catch (error) {
        console.error('Error parsing character sources:', error);
      }
    }

    return !!(
      $info.class &&
      $info.class.name &&
      $info.class.name !== 'Unknown'
    );
  }

  async function generateLevelUpData(targetLevel: number): Promise<LevelUpData> {
    // Implementation moved to characterInfo.ts for better organization
    // This is a simplified version - full implementation would be in the business logic file
    return {
      level: targetLevel,
      hitDiceGain: { amount: 1, die: $info.class.hitDice?.die || 8 },
      proficiencyBonus: Math.ceil(targetLevel / 4) + 1,
      newFeatures: [],
      choices: []
    };
  }
</script>

<!-- Dialogs only - no visual UI elements -->
{#if $store.showThemeDialog}
  <ThemeDialog bind:isOpen={$store.showThemeDialog} />
{/if}

{#if $store.showSourceImportDialog}
  <CharacterSourceImport bind:isOpen={$store.showSourceImportDialog} />
{/if}

{#if $store.showLevelUpDialog && $store.levelUpData}
  <LevelUpDialog 
    bind:isOpen={$store.showLevelUpDialog} 
    levelUpData={$store.levelUpData}
    onComplete={() => closeLevelUpDialog()}
  />
{/if}

<!-- Hidden file input for imports -->
<input
  bind:this={fileInput}
  type="file"
  accept=".json,.txt,.pdf,.png,.jpg,.jpeg"
  style="display: none;"
  onchange={(e) => {
    const file = e.currentTarget.files?.[0];
    if (file) {
      fileImportUtils.handleFileUpload(file).then(() => {
        openSourceImportDialog();
      }).catch(error => {
        console.error('File import error:', error);
        alert('Failed to import file: ' + error.message);
      });
    }
  }}
/>

<style>
  /* No visual styles needed - this component only manages business logic and dialogs */
</style>