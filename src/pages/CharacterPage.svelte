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
  import {getContext} from "svelte";
  import type {CharacterContext} from "$lib/types";
  import InventoryTab from "$character-sheet/main_tabs/InventoryTab.svelte";
  import FeaturesTab from "$character-sheet/main_tabs/FeaturesTab.svelte";
  import BackgroundTab from "$character-sheet/main_tabs/BackgroundTab.svelte";
  import MainTabs from "$character-sheet/main_tabs/MainTabs.svelte";
  import ActionsTab from "$character-sheet/main_tabs/ActionsTab.svelte";
  import Special from "$character-sheet/Special.svelte";
  import Background from "$components/Background.svelte";
  import { applyStateToCharacter, getCharacterStore, getSidebar } from "$lib/engine";
  import { characterService } from "$lib/firestore.service";
  import { getRulesStore } from "$lib/rules/store";
  import { setContext, onDestroy, onMount, untrack } from "svelte";
  import MenuPanel from "$components/MenuPanel.svelte";
  import Chat from "$chat/Chat.svelte";
  import Overlay from "$components/Overlay.svelte";
  import Search from "$components/search/Search.svelte";
  import Dialogs from "$dialogs/Dialogs.svelte";
  import SoundManager from "$components/SoundManager.svelte";
  import { sidebarStore } from "$lib/navigation";
  import { uiStore, isSearchDialogOpen, anyDialogOpen } from "$lib/stores/ui.store";
  import { initializeGlobalEvents } from "$lib/globalEvents";
  import Ornament from "$components/ui/Ornament.svelte";
  import Aura from "$components/ui/Aura.svelte";
  import Flame from "$components/ui/Flame.svelte";

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

  onMount(() => {
    setTheme(getTheme());

    if (route?.params?.id) {
      characterService.getCharacter(route.params.id)
        .then((document) => {
          if (document?.character) applyStateToCharacter(document.character);
        })
        .catch((error) => console.error('Character did not load:', error));
    }

    const cleanupGlobalEvents = initializeGlobalEvents({
      anyDialogOpen: $anyDialogOpen,
      setDialogState: uiStore.setDialogState,
      toggleChat: () => {},
      openSearchDialog: uiStore.openSearchDialog,
      isSearchDialogOpen: $isSearchDialogOpen,
      closeSearchDialog: uiStore.closeSearchDialog
    });
    
    return () => {
      cleanupGlobalEvents();
    };
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
<Search />
<Background />
<Aura variant="motes" tone="ember" density="sparse" />

<div class="root">
    <div class="scroll">
        <div class="character-profile">
            <span class="character-profile-corner character-profile-corner-start">
                <Ornament name="corner" size="sm" tone="metal" />
            </span>
            <span class="character-profile-corner character-profile-corner-end">
                <Ornament name="corner" size="sm" tone="metal" flip />
            </span>
            <div class="character-image">
                {#if imageUrl}
                    <img src={imageUrl} alt={$info.name || 'Character'} />
                {:else}
                    <div class="placeholder-image">
                        <span>{$info.name?.charAt(0)?.toUpperCase() || '?'}</span>
                    </div>
                {/if}
            </div>
            <div class="character-details">
                <h1 class="character-name">{$info.name || 'Unnamed Character'}</h1>
                <div class="character-meta">
                    <span class="level">Level {$info.level || 1}</span>
                    <span class="class-race">{$info.class?.name || 'Unknown'} {$info.race?.name || 'Unknown'}</span>
                </div>
            </div>
            <span class="character-profile-flame"><Flame size="sm" intensity="calm" /></span>
        </div>
        
        <div class="content-grid">
            <div class="grid start">
                <Abilities/>
                <SavingThrows/>
                <Skills/>
                <Special/>
                <Senses/>
                <Proficiencies/>
                <RulePanels skip={['abilities', 'defence', 'saves', 'senses']}/>
            </div>
            <span class="character-profile-flame"><Flame size="sm" intensity="calm" /></span>
            <div class="grid end">
            <div style:grid-column="1">
                <PlainBox value={$rules.resolved?.proficiency ?? $info.proficiencyBonus}
                          title="Proficiency"
                          subTitle="bonus"
                          prefix="+"
                />
            </div>
            <span class="character-profile-flame"><Flame size="sm" intensity="calm" /></span>
            <div style:grid-column="2">
                <PlainBox bind:value={$info.speed}
                          title="Walking"
                          subTitle="speed"
                />
            </div>
            <span class="character-profile-flame"><Flame size="sm" intensity="calm" /></span>
            <div style:grid-column="3">
                <Inspiration />
            </div>
            <span class="character-profile-flame"><Flame size="sm" intensity="calm" /></span>
            <HitPoints bind:hp={$info.hp}/>
            <div style:grid-column="1" style:grid-row="2">
                <Initiative bind:initiative={$info.initiative}/>
            </div>
            <span class="character-profile-flame"><Flame size="sm" intensity="calm" /></span>
            <div style:grid-column="2" style:grid-row="2">
                <PlainBox bind:value={$info.ac}
                          title="Armor"
                          subTitle="class"
                />
            </div>
            <span class="character-profile-flame"><Flame size="sm" intensity="calm" /></span>
            <DefensesNConditions
                    bind:conditions={$info.conditions}
                    bind:defences={$info.defences}
            />
            <div class="main-tabs-container">
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
            <span class="character-profile-flame"><Flame size="sm" intensity="calm" /></span>
            </div>
            <span class="character-profile-flame"><Flame size="sm" intensity="calm" /></span>
        </div>
    </div>
</div>

<style>
    .root {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: start;
        overflow-y: auto;
        z-index: 2;
    }

    .character-profile {
        position: relative;
        display: flex;
        align-items: center;
        gap: var(--space-5);
        padding: var(--space-4) var(--space-5);
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
        margin-bottom: var(--space-2);
    }

    .character-profile-corner {
        position: absolute;
        top: -3px;
        z-index: 2;
        opacity: 0.8;
        pointer-events: none;
    }

    .character-profile-corner-start {
        left: -3px;
    }

    .character-profile-corner-end {
        right: -3px;
    }

    .character-profile-flame {
        margin-inline-start: auto;
        padding-inline-end: var(--space-4);
    }

    .content-grid {
        display: grid;
        grid-template-columns: auto auto;
        gap: 16px;
        align-content: stretch;
        justify-content: stretch;
    }

    .character-image {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        overflow: hidden;
        flex-shrink: 0;
        position: relative;
        padding: 4px;
        background: conic-gradient(from 0deg, 
            var(--metal) 0%, 
            var(--metal-dim) 25%, 
            var(--ember) 50%, 
            var(--metal) 75%, 
            var(--metal-dim) 100%);
        animation: border-rotate 3s linear infinite;
        box-shadow: 
            0 0 20px color-mix(in srgb, var(--metal) 32%, transparent),
            inset 0 0 20px color-mix(in srgb, var(--metal) 12%, transparent);
    }

    .character-image::before {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        right: 2px;
        bottom: 2px;
        background: var(--ground);
        border-radius: 50%;
        z-index: 1;
    }

    .character-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
        position: relative;
        z-index: 2;
    }

    .placeholder-image {
        width: 100%;
        height: 100%;
        background: var(--metal);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--ground);
        font-size: 2rem;
        font-weight: bold;
        border-radius: 50%;
        position: relative;
        z-index: 2;
    }

    .character-details {
        flex: 1;
    }

    .character-name {
        font-size: 1.5rem;
        font-weight: bold;
        color: var(--ink);
        margin: 0 0 0.5rem 0;
    }

    .character-meta {
        display: flex;
        gap: 1rem;
        color: var(--ink-dim);
    }

    .level {
        font-weight: 600;
        color: var(--metal);
    }

    .class-race {
        font-style: italic;
    }

    .scroll {
        position: relative;
        height: auto;
        width: auto;
        overflow: hidden;
        padding: 8vh 16px 36px 16px;
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: auto 1fr;
        gap: 16px;

        align-content: stretch;
        justify-content: stretch;
    }

    .grid {
        position: relative;
        display: grid;

        align-items: stretch;
        justify-items: stretch;

        grid-auto-rows: min-content;
        grid-auto-columns: min-content;
        gap: 16px;
        width: 100%;
        height: 100%;
    }

    .grid.start {

        max-height: fit-content;
    }

    .grid.end {

        height: fit-content;
        max-height: 100%;
        align-content: start;
    }

    .main-tabs-container {
        grid-column: 1 / 6;
        grid-row: span 4;
        display: flex;
        flex-direction: column;
        align-self: stretch;
        justify-self: stretch;
        min-height: 0;
    }

    @keyframes border-rotate {
        0% {
            background: conic-gradient(from 0deg, 
                var(--metal) 0%, 
                var(--metal-dim) 25%, 
                var(--ember) 50%, 
                var(--metal) 75%, 
                var(--metal-dim) 100%);
        }
        100% {
            background: conic-gradient(from 360deg, 
                var(--metal) 0%, 
                var(--metal-dim) 25%, 
                var(--ember) 50%, 
                var(--metal) 75%, 
                var(--metal-dim) 100%);
        }
    }

</style>
