<script lang="ts">
  import Senses from "$character-sheet/Senses.svelte";
  import PlainBox from "$character-sheet/PlainBox.svelte";
  import Skills from "$character-sheet/Skills.svelte";
  import DefensesNConditions from "$character-sheet/DefensesNConditions.svelte";
  import Initiative from "$character-sheet/Initiative.svelte";
  import Inspiration from "$character-sheet/Inspiration.svelte";
  import SavingThrows from "$character-sheet/SavingThrows.svelte";
  import Abilities from "$character-sheet/Abilities.svelte";
  import Proficiencies from "$character-sheet/Proficiencies.svelte";
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

  const {info} = getContext<CharacterContext>('character');

  // Character image logic
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

<Background />

<div class="root">
    <div class="scroll">
        <!-- Character Profile Header -->
        <div class="character-profile">
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
        </div>
        
        <!-- Character Sheet Content -->
        <div class="content-grid">
            <div class="grid start">
                <Abilities/>
                <SavingThrows/>
                <Skills/>
                <Special/>
                <Senses/>
                <Proficiencies/>
            </div>
            <div class="grid end">
            <div style:grid-column="1">
                <PlainBox bind:value={$info.proficiencyBonus}
                          title="Proficiency"
                          subTitle="bonus"
                          prefix="+"
                />
            </div>
            <div style:grid-column="2">
                <PlainBox bind:value={$info.speed}
                          title="Walking"
                          subTitle="speed"
                />
            </div>
            <div style:grid-column="3">
                <Inspiration />
            </div>
            <HitPoints bind:hp={$info.hp}/>
            <div style:grid-column="1" style:grid-row="2">
                <Initiative bind:initiative={$info.initiative}/>
            </div>
            <div style:grid-column="2" style:grid-row="2">
                <PlainBox bind:value={$info.ac}
                          title="Armor"
                          subTitle="class"
                />
            </div>
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
            </div>
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
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: var(--color-content-dark);
        border-radius: 12px;
        border: 2px solid var(--color-primary-main);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(8px);
        margin-bottom: 0.5rem;
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
            var(--color-primary-main) 0%, 
            var(--color-accent) 25%, 
            var(--color-secondary-main) 50%, 
            var(--color-primary-main) 75%, 
            var(--color-accent) 100%);
        animation: border-rotate 3s linear infinite;
        box-shadow: 
            0 0 20px rgba(255, 215, 0, 0.3),
            inset 0 0 20px rgba(255, 215, 0, 0.1);
    }

    .character-image::before {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        right: 2px;
        bottom: 2px;
        background: var(--color-content-dark);
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
        background: var(--color-primary-main);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-surface-dark);
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
        color: var(--color-primary-text);
        margin: 0 0 0.5rem 0;
    }

    .character-meta {
        display: flex;
        gap: 1rem;
        color: var(--color-secondary-text);
    }

    .level {
        font-weight: 600;
        color: var(--color-primary-main);
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
        /* Define height for the left grid */
        max-height: fit-content;
    }

    .grid.end {
        /* Constrain the right grid to match the left grid's height */
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
                var(--color-primary-main) 0%, 
                var(--color-accent) 25%, 
                var(--color-secondary-main) 50%, 
                var(--color-primary-main) 75%, 
                var(--color-accent) 100%);
        }
        100% {
            background: conic-gradient(from 360deg, 
                var(--color-primary-main) 0%, 
                var(--color-accent) 25%, 
                var(--color-secondary-main) 50%, 
                var(--color-primary-main) 75%, 
                var(--color-accent) 100%);
        }
    }

    @media screen and (max-width: 1024px) {
        .scroll {

        }
    }
</style>