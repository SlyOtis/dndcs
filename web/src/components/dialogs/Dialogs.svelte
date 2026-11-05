<script lang="ts">
  import { setContext } from "svelte";
  import { getCharacterStore } from "$lib/engine";
  import { getCatalogEntry } from "$lib/catalog";
  import { getSystemStack } from "$lib/rules/system";
  import { currentCharacterId } from "$lib/stores/character.store";
  import { uiStore } from "$lib/stores/ui.store";
  import { createLevelUpStore, getLevelUp } from "$lib/dialogs/levelUp";
  import { createThemeStore } from "$lib/dialogs/theme";
  import { createFrameStore } from "$lib/dialogs/frame";
  import { createSourceImportStore } from "$lib/dialogs/sourceImport";
  import { getCurrentCharacter, setUIActionDispatcher } from "$lib/chat";
  import ThemeDialog from "../ThemeDialog.svelte";
  import FrameDialog from "../FrameDialog.svelte";
  import CharacterSourceImport from "../CharacterSourceImport.svelte";
  import LevelUpDialog from "../LevelUpDialog.svelte";

  setContext('dialogState', { setDialogState: uiStore.setDialogState });

  const levelUpStore = createLevelUpStore();
  const themeStore = createThemeStore();
  const frameStore = createFrameStore();
  const sourceImportStore = createSourceImportStore();

  let frame = $state<string | undefined>();
  let portrait = $state({ src: '', alt: '' });

  $effect(() => {
    if ($currentCharacterId) return;
    levelUpStore.close();
    frameStore.close();
  });

  setUIActionDispatcher((action) => {
    switch (action) {
      case 'openLevelUpDialog':
        handleLevelUp();
        break;
      case 'openThemeDialog':
        themeStore.open();
        break;
      case 'openFrameDialog':
        openFrame();
        break;
      case 'openSourceImport':
        sourceImportStore.open();
        break;
      case 'exportCharacter':
        exportCharacter();
        break;
    }
  });

  function openFrame() {
    const character = getCurrentCharacter();
    if (!character) return;
    frame = character.info.imageFrame;
    portrait = { src: character.info.imageUrl, alt: character.info.name || 'Character' };
    frameStore.open();
  }

  function putFrame(value: string | undefined) {
    frame = value;
    getCharacterStore().info.update((info) => ({ ...info, imageFrame: value }));
  }

  function exportCharacter() {
    const character = getCurrentCharacter();
    if (!character) return;
    const { info, inventory } = character;

    const characterSheet = {
      meta: {
        exportDate: new Date().toISOString(),
        exportVersion: "1.0.0",
        exportedBy: "Quillborne",
        computed: {
          totalLevel: info.level,
          totalHP: info.hp.max,
          currentHP: info.hp.current,
          armorClass: info.ac,
          proficiencyBonus: info.proficiencyBonus,
          walkingSpeed: info.speed,
          initiative: info.initiative,
          inspiration: info.inspiration,
          conditions: info.conditions?.map(c => c.title) || [],
          defenses: info.defences?.map(d => d.title) || [],
          totalInventoryWeight: inventory.reduce((total, item) => total + (item.weight * item.quantity), 0),
        }
      },
      character
    };

    const dataBlob = new Blob([JSON.stringify(characterSheet, null, 2)], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    const characterName = info.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = new Date().toISOString().split('T')[0];
    link.download = `${characterName}_character_${timestamp}.json`;
    link.click();
    URL.revokeObjectURL(link.href);

    window.dispatchEvent(new CustomEvent('showFunnyText', {
      detail: { text: 'Character exported successfully!', category: 'treasure' }
    }));
  }

  async function handleLevelUp() {
    const character = getCurrentCharacter();
    if (!character) return;

    try {
      const system = await getSystemStack(character.systems, character.overlay ?? undefined);
      const className = character.info.class?.name?.trim().toLowerCase() ?? '';
      const entry = className && className !== 'unknown' ? await getCatalogEntry('classes', className) : null;
      levelUpStore.open(getLevelUp(character, system, entry));
    } catch (error) {
      alert(`Level up is not ready: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
</script>

{#if $themeStore.isOpen}
  <ThemeDialog bind:isOpen={$themeStore.isOpen} />
{/if}

{#if $frameStore.isOpen && $currentCharacterId}
  <FrameDialog
    bind:isOpen={$frameStore.isOpen}
    bind:frame={() => frame, putFrame}
    src={portrait.src}
    alt={portrait.alt}
  />
{/if}

{#if $sourceImportStore.isOpen}
  <CharacterSourceImport bind:isOpen={$sourceImportStore.isOpen} />
{/if}

{#if $levelUpStore.isOpen && $levelUpStore.data && $currentCharacterId}
  <LevelUpDialog
    bind:isOpen={$levelUpStore.isOpen}
    levelUpData={$levelUpStore.data}
    onComplete={() => levelUpStore.close()}
  />
{/if}
