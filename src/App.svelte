<script lang="ts">
  import CharacterInfo from "./components/CharacterInfo.svelte";
  import Abilities from "./components/Abilities.svelte";
  import SavingThrows from "./components/SavingThrows.svelte";
  import Skills from "./components/Skills.svelte";
  import ActionsTab from "./components/ActionsTab.svelte";
  import Senses from "./components/Senses.svelte";
  import Proficiencies from "./components/Proficiencies.svelte";
  import type {CharacterContext} from "./lib/types";
  import Initiative from "./components/Initiative.svelte";
  import HitPoints from "./components/HitPoints.svelte";
  import PlainBox from "./components/PlainBox.svelte";
  import {getCharacterStore} from "./lib/engine";
  import MainTabs from "./components/MainTabs.svelte";
  import Inventory from "./components/Inventory.svelte";
  import Inspiration from "./components/Inspiration.svelte";
  import DefensesNConditions from "./components/DefensesNConditions.svelte";
  import {onDestroy, setContext} from "svelte";
  import Features from "./components/Features.svelte";
  import Background from "./components/Background.svelte";

  const {unsubscribe, ...chStore} = getCharacterStore()

  setContext<CharacterContext>('character', chStore);

  onDestroy(() => unsubscribe())

  const {info} = chStore

</script>

<header>
    <CharacterInfo/>
</header>

<main>
    <div class="scroll">
        <div class="grid start">
            <Abilities/>
            <SavingThrows/>
            <Skills/>
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
                <Inspiration bind:inspiration={$info.inspiration}/>
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
            <MainTabs initialTab="inventoryTab">
                {#snippet actionsTab()}
                    <ActionsTab/>
                {/snippet}
                {#snippet inventoryTab()}
                    <Inventory/>
                {/snippet}
                {#snippet featsTab()}
                    <Features/>
                {/snippet}
                {#snippet backgroundTab()}
                    <Background/>
                {/snippet}
            </MainTabs>
        </div>
    </div>
</main>

<style>
    header {
        position: relative;
        width: 100%;
        height: 100px;
        display: flex;
        border-bottom: 1px solid var(--color-secondary-main);
    }

    main {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: start;
        overflow-y: auto;
    }

    .scroll {
        position: relative;
        height: auto;
        width: auto;
        overflow: hidden;
        padding: 16px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
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

    @media screen and (max-width: 1024px) {
        .scroll {

        }
    }
</style>
