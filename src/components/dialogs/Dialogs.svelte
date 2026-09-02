<script lang="ts">
  import { getContext } from "svelte";
  import type { CharacterContext } from "$lib/types";
  import { createLevelUpStore, levelUpLogic } from "$lib/dialogs/levelUp";
  import { createThemeStore } from "$lib/dialogs/theme";
  import { createSourceImportStore, sourceImportLogic } from "$lib/dialogs/sourceImport";
  import { setUIActionDispatcher } from "$lib/chat";
  import ThemeDialog from "../ThemeDialog.svelte";
  import CharacterSourceImport from "../CharacterSourceImport.svelte";
  import LevelUpDialog from "../LevelUpDialog.svelte";

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
    special,
    equipped,
    soundBoard
  } = getContext<CharacterContext>('character');

  // Create dialog stores
  const levelUpStore = createLevelUpStore();
  const themeStore = createThemeStore();
  const sourceImportStore = createSourceImportStore();

  let fileInput: HTMLInputElement;

  // UI action dispatcher setup
  setUIActionDispatcher((action: string, payload?: any) => {
    switch (action) {
      case 'openLevelUpDialog':
        handleLevelUp();
        break;
      case 'openThemeDialog':
        themeStore.open();
        break;
      case 'openSourceImport':
        sourceImportStore.open();
        break;
      case 'exportCharacter':
        exportCharacter();
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
  async function handleLevelUp() {
    const character = {
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
      equipped: $equipped,
      soundBoard: $soundBoard
    };

    if (!levelUpLogic.checkForCharacterSources(character)) {
      alert('Please import character sources (class data, features, etc.) before leveling up. Use the Sources button to import your character data.');
      return;
    }

    try {
      const generatedLevelUpData = await levelUpLogic.generateLevelUpData(character, $info.level + 1);
      levelUpStore.open(generatedLevelUpData);
    } catch (error) {
      console.error('Level up generation failed:', error);
      alert('Failed to generate level up data. Please ensure you have valid character sources imported.');
    }
  }

  // File import handling
  async function handleFileImport(file: File) {
    try {
      sourceImportStore.setProcessing(true);
      const sourceData = await sourceImportLogic.handleFileUpload(file);
      sourceImportStore.open(sourceData);
    } catch (error) {
      console.error('File import error:', error);
      sourceImportStore.setError('Failed to import file: ' + (error instanceof Error ? error.message : String(error)));
    }
  }
</script>

<!-- Dialog Components -->
{#if $themeStore.isOpen}
  <ThemeDialog bind:isOpen={$themeStore.isOpen} />
{/if}

{#if $sourceImportStore.isOpen}
  <CharacterSourceImport bind:isOpen={$sourceImportStore.isOpen} />
{/if}

{#if $levelUpStore.isOpen && $levelUpStore.data}
  <LevelUpDialog 
    bind:isOpen={$levelUpStore.isOpen} 
    levelUpData={$levelUpStore.data}
    onComplete={() => levelUpStore.close()}
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
      handleFileImport(file);
    }
  }}
/>

<style>
  /* No visual styles needed - this component only manages business logic and dialogs */
</style>