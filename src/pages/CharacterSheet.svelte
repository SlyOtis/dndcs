<script lang="ts">

  import Senses from "../components/Senses.svelte";
  import Features from "../components/Features.svelte";
  import PlainBox from "../components/PlainBox.svelte";
  import Skills from "../components/Skills.svelte";
  import MainTabs from "../components/MainTabs.svelte";
  import DefensesNConditions from "../components/DefensesNConditions.svelte";
  import Initiative from "../components/Initiative.svelte";
  import Inventory from "../components/Inventory.svelte";
  import Inspiration from "../components/Inspiration.svelte";
  import SavingThrows from "../components/SavingThrows.svelte";
  import Abilities from "../components/Abilities.svelte";
  import Proficiencies from "../components/Proficiencies.svelte";
  import HitPoints from "../components/HitPoints.svelte";
  import Background from "../components/Background.svelte";
  import ActionsTab from "../components/ActionsTab.svelte";
  import {getContext} from "svelte";
  import type {CharacterContext} from "../lib/types";

  const {info} = getContext<CharacterContext>('character');

</script>

<div class="root">
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
            <MainTabs initialTab="actionsTab">
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