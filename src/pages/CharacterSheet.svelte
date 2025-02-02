<script lang="ts">
  import Senses from "../components/Senses.svelte";
  import PlainBox from "../components/PlainBox.svelte";
  import Skills from "../components/Skills.svelte";
  import DefensesNConditions from "../components/DefensesNConditions.svelte";
  import Initiative from "../components/Initiative.svelte";
  import Inspiration from "../components/Inspiration.svelte";
  import SavingThrows from "../components/SavingThrows.svelte";
  import Abilities from "../components/Abilities.svelte";
  import Proficiencies from "../components/Proficiencies.svelte";
  import HitPoints from "../components/HitPoints.svelte";
  import {getContext} from "svelte";
  import type {CharacterContext} from "../lib/types";
  import InventoryTab from "../components/main_tabs/InventoryTab.svelte";
  import FeaturesTab from "../components/main_tabs/FeaturesTab.svelte";
  import BackgroundTab from "../components/main_tabs/BackgroundTab.svelte";
  import MainTabs from "../components/main_tabs/MainTabs.svelte";
  import ActionsTab from "../components/main_tabs/ActionsTab.svelte";

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

    .scroll {
        position: relative;
        height: auto;
        width: auto;
        overflow: hidden;
        padding: 16px;
        display: grid;
        grid-template-columns: auto auto;
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

    @media screen and (max-width: 1024px) {
        .scroll {

        }
    }
</style>