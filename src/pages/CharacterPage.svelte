<script lang="ts">
  import { getTheme, setTheme } from "$lib/dialogs/theme";
  import Senses from "$character-sheet/Senses.svelte";
  import PlainBox from "$character-sheet/PlainBox.svelte";
  import Skills from "$character-sheet/Skills.svelte";
  import DefensesNConditions from "$character-sheet/DefensesNConditions.svelte";
  import Initiative from "$character-sheet/Initiative.svelte";
  import Inspiration from "$character-sheet/Inspiration.svelte";
  import SavingThrows from "$character-sheet/SavingThrows.svelte";
  import Abilities from "$character-sheet/Abilities.svelte";
  import Proficiencies from "$character-sheet/Proficiencies.svelte";
  import RulePanels from "$character-sheet/RulePanels.svelte";
  import HitPoints from "$character-sheet/HitPoints.svelte";
  import type {CharacterContext} from "$lib/types";
  import InventoryTab from "$character-sheet/main_tabs/InventoryTab.svelte";
  import FeaturesTab from "$character-sheet/main_tabs/FeaturesTab.svelte";
  import BackgroundTab from "$character-sheet/main_tabs/BackgroundTab.svelte";
  import MainTabs from "$character-sheet/main_tabs/MainTabs.svelte";
  import ActionsTab from "$character-sheet/main_tabs/ActionsTab.svelte";
  import Special from "$character-sheet/Special.svelte";
  import Background from "$components/Background.svelte";
  import { applyStateToCharacter, characterWriteError, getCharacterStore } from "$lib/engine";
  import { characterService } from "$lib/firestore.service";
  import { getRulesStore } from "$lib/rules/store";
  import { setContext, onDestroy, onMount, untrack } from "svelte";
  import MenuPanel from "$components/MenuPanel.svelte";
  import Chat from "$chat/Chat.svelte";
  import Overlay from "$components/Overlay.svelte";
  import Dialogs from "$dialogs/Dialogs.svelte";
  import SoundManager from "$components/SoundManager.svelte";
  import { sidebarStore } from "$lib/navigation";
  import { uiStore, anyDialogOpen } from "$lib/stores/ui.store";
  import { navigate } from "sly-svelte-location-router";
  import Shell from "$components/ui/Shell.svelte";
  import Button from "$components/ui/Button.svelte";
  import Portrait, { type PortraitFrame } from "$components/ui/Portrait.svelte";
  import Sigil from "$components/ui/Sigil.svelte";
  import Glyph from "$components/ui/Glyph.svelte";
  import { postUIAction } from "$lib/chat";

  const { route }: { route?: { params?: Record<string, string> } } = $props();
  const characterId = untrack(() => route?.params?.id) ?? "local";

  const {unsubscribe, ...chStore} = getCharacterStore(characterId)
  const unsubscribeSidebar = sidebarStore.subscribe(() => {});

  setContext<CharacterContext>('character', chStore);
  const rules = getRulesStore(chStore);
  setContext('rules', rules);
  setContext('sidebar', sidebarStore)
  setContext('dialogState', {
    get isAnyDialogOpen() {
      return $anyDialogOpen;
    },
    setDialogState: uiStore.setDialogState
  });

  const {info} = chStore;

  let loaded = $state(false);
  let missing = $state(false);

  onMount(() => {
    setTheme(getTheme());

    characterService.getCharacter(characterId)
      .then((document) => {
        if (document?.character) applyStateToCharacter(document.character, true);
        else missing = true;
      })
      .catch(() => (missing = true))
      .finally(() => (loaded = true));
  });

  onDestroy(() => {
    unsubscribe();
    unsubscribeSidebar();
  });

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
</script>

<SoundManager />
<Overlay />
<Dialogs />

{#snippet menu()}
  <MenuPanel />
{/snippet}

{#snippet chat()}
  <Chat />
{/snippet}

<Shell
  title={$info.name || 'Character'}
  width="full"
  back={() => navigate('/main')}
  menu={missing ? undefined : menu}
  chat={missing ? undefined : chat}
>
  {#snippet tools()}
    <Sigil title="Export this character" size="sm" onclick={() => postUIAction('exportCharacter')}>
      <Glyph name="export" size="sm" />
    </Sigil>
    <Sigil title="Level up" size="sm" onclick={() => postUIAction('openLevelUpDialog')}>
      <Glyph name="levelup" size="sm" />
    </Sigil>
    <Sigil title="Import sources" size="sm" onclick={() => postUIAction('openSourceImport')}>
      <Glyph name="sources" size="sm" />
    </Sigil>
    <Sigil title="Change theme" size="sm" onclick={() => postUIAction('openThemeDialog')}>
      <Glyph name="theme" size="sm" />
    </Sigil>
  {/snippet}

  {#snippet backdrop()}
    <Background />
  {/snippet}

  {#if missing}
    <div class="sheet-lost">
      <p class="sheet-lost-note">That character was not found, or it is not yours.</p>
      <Button variant="primary" onclick={() => navigate('/main')}>Back to the hearth</Button>
    </div>
  {:else if loaded}
    <header class="sheet-crown">
      <button
        type="button"
        class="sheet-face"
        title="Choose the portrait frame"
        onclick={() => postUIAction('openFrameDialog')}
      >
        <Portrait
          src={imageUrl}
          alt={$info.name || 'Character'}
          frame={($info.imageFrame as PortraitFrame) ?? 'lancet'}
          size="sm"
        />
      </button>

      <span class="sheet-lines">
        <h1 class="dnd-heading sheet-name">{$info.name || 'Unnamed Character'}</h1>
        <span class="sheet-meta">
          <span class="sheet-level">Level {$info.level || 1}</span>
          <span class="sheet-kin">{$info.class?.name || 'Unknown'} {$info.race?.name || 'Unknown'}</span>
        </span>
      </span>
    </header>

    {#if $characterWriteError}
      <p class="sheet-alarm" role="alert">{$characterWriteError}</p>
    {/if}

    <div class="sheet-grid">
      <div class="sheet-column">
        <Abilities/>
        <SavingThrows/>
        <Skills/>
        <Special/>
        <Senses/>
        <Proficiencies/>
        <RulePanels skip={['abilities', 'defence', 'saves', 'senses']}/>
      </div>

      <div class="sheet-board">
        <div class="sheet-stats">
          <PlainBox value={$rules.resolved?.proficiency ?? $info.proficiencyBonus}
                    title="Proficiency"
                    subTitle="bonus"
                    prefix="+"
          />
          <PlainBox bind:value={$info.speed}
                    title="Walking"
                    subTitle="speed"
          />
          <Inspiration />
          <HitPoints bind:hp={$info.hp}/>
          <Initiative bind:initiative={$info.initiative}/>
          <PlainBox bind:value={$info.ac}
                    title="Armor"
                    subTitle="class"
          />
          <DefensesNConditions
                  bind:conditions={$info.conditions}
                  bind:defences={$info.defences}
          />
        </div>

        <div class="sheet-tabs">
          <MainTabs initialTab="actionsTab">
            {#snippet actionsTab()}
              <ActionsTab/>
            {/snippet}
            {#snippet inventoryTab()}
              <InventoryTab/>
            {/snippet}
            {#snippet featsTab()}
              <FeaturesTab/>
            {/snippet}
            {#snippet backgroundTab()}
              <BackgroundTab />
            {/snippet}
          </MainTabs>
        </div>
      </div>
    </div>
  {/if}
</Shell>

<style>
  .sheet-lost {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-8) var(--space-5);
    text-align: center;
  }

  .sheet-lost-note {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--ink-dim);
  }

  .sheet-alarm {
    margin: 0;
    padding: var(--space-3) var(--space-4);
    border: var(--border-hair) solid color-mix(in srgb, var(--state-bad) 55%, transparent);
    border-radius: var(--radius-md);
    background: color-mix(in srgb, var(--state-bad) 18%, transparent);
    font-size: var(--text-sm);
    color: var(--ink);
  }

  .sheet-crown {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-2) var(--space-4);
    background:
      var(--texture-noise),
      linear-gradient(180deg, var(--ground-lift) 0%, var(--ground-raised) 55%, var(--ground-deep) 100%);
    background-blend-mode: overlay, normal;
    border: var(--border-hair) solid var(--metal-dim);
    border-radius: var(--radius-lg);
    box-shadow:
      var(--shadow-md),
      inset 0 0 0 var(--border-hair) var(--metal-edge),
      inset 0 0 40px -14px var(--ember-glow);
  }

  .sheet-face {
    display: flex;
    flex: none;
    padding: 0;
    border: none;
    border-radius: var(--radius-md);
    background: none;
    cursor: pointer;
    transition: transform 0.15s ease;
  }

  .sheet-face:hover {
    transform: translateY(-2px);
  }

  .sheet-face:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  .sheet-lines {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: var(--space-1);
    min-width: 0;
  }

  .sheet-name {
    margin: 0;
    font-size: var(--text-lg);
    line-height: 1.1;
  }

  .sheet-meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--ink-dim);
  }

  .sheet-level {
    color: var(--metal);
  }

  .sheet-kin {
    font-style: italic;
  }

  .sheet-grid {
    display: grid;
    grid-template-columns: minmax(0, max-content) minmax(0, 1fr);
    align-items: start;
    gap: var(--space-3);
    min-width: 0;
  }

  .sheet-column {
    display: grid;
    min-width: 0;
    grid-auto-rows: min-content;
    grid-auto-columns: minmax(0, min-content);
    align-items: stretch;
    justify-items: stretch;
    gap: var(--space-3);
  }

  .sheet-board {
    display: flex;
    flex-direction: column;
    min-width: 0;
    gap: var(--space-3);
  }

  .sheet-stats {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    grid-auto-rows: min-content;
    align-items: stretch;
    justify-items: stretch;
    gap: var(--space-3);
  }

  .sheet-tabs {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    contain: inline-size;
  }

  @media (max-width: 1400px) {
    .sheet-grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
