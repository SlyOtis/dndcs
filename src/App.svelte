<script lang="ts">
  import CharacterInfo from "./components/CharacterInfo.svelte";
  import Abilities from "./components/Abilities.svelte";
  import SavingThrows from "./components/SavingThrows.svelte";
  import Skills from "./components/Skills.svelte";
  import Actions from "./components/Actions.svelte";
  import Senses from "./components/Senses.svelte";
  import Proficiencies from "./components/Proficiencies.svelte";
  import type {CharacterStore} from "./lib/types";
  import Initiative from "./components/Initiative.svelte";
  import HitPoints from "./components/HitPoints.svelte";
  import PlainBox from "./components/PlainBox.svelte";
  import {getCharacter} from "./lib/engine";
  import MainTabs from "./components/MainTabs.svelte";
  import Inventory from "./components/Inventory.svelte";
  import Inspiration from "./components/Inspiration.svelte";

  let {info, abilities, savingThrows, skills, senses, proficients}: CharacterStore = getCharacter()

</script>

<header>
    <CharacterInfo bind:info={$info}/>
</header>

<main>
    <div class="scroll grid-template">
        <Abilities bind:abilities={$abilities}/>
        <div class="stats">
            <div style:grid-area="pb">
                <PlainBox bind:value={$info.proficiencyBonus}
                          title="Proficiency"
                          subTitle="bonus"
                          prefix="+"
                />
            </div>
            <div style:grid-area="ws">
                <PlainBox bind:value={$info.speed}
                          title="Walking"
                          subTitle="speed"
                />
            </div>
            <div style:grid-area="hp">
                <HitPoints bind:hp={$info.hp}/>
            </div>
            <div style:grid-area="it">
                <Initiative bind:initiative={$info.initiative}/>
            </div>
            <div style:grid-area="is">
                <Inspiration bind:inspiration={$info.inspiration}/>
            </div>
            <div style:grid-area="ac">
                <PlainBox bind:value={$info.ac}
                          title="Armor"
                          subTitle="class"
                />
            </div>
            <div style:grid-area="cd">
                <PlainBox bind:value={$info.ac}
                          title="Armor"
                          subTitle="class"
                />
            </div>
        </div>
        <SavingThrows bind:savingThrows={$savingThrows}/>
        <Skills bind:skills={$skills}/>
        <MainTabs initialTab="actions">
            {#snippet background()}
                <Actions/>
            {/snippet}
            {#snippet inventory()}
                <Inventory/>
            {/snippet}
            {#snippet actions()}
                <Actions/>
            {/snippet}
            {#snippet feats()}
                <Actions/>
            {/snippet}
        </MainTabs>
        <Senses bind:senses={$senses}/>
        <Proficiencies bind:proficients={$proficients}/>
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
    }

    .stats {
        position: relative;
        grid-area: s;
        display: grid;
        grid-gap: 20px;
        align-items: center;
        justify-items: center;
        grid-template:
            "pb ws is hp hp hp"
            "it ac cd cd cd cd";
    }

    .grid-template {
        grid-gap: 20px;
        align-items: stretch;
        justify-items: stretch;
        grid-template:
            "ab ab s s"
            "st sk s s"
            "st sk a a"
            "se sk a a"
            "se sk a a"
            "pt sk a a"
            "pt sk a a"
            "pt sk a a";
        grid-template-rows: repeat(8, auto);
        grid-template-columns: auto auto auto auto;
    }

    @media screen and (max-width: 1024px) {
        .scroll {

        }
    }
</style>
