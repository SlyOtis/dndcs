<script lang="ts">
    import type {CharacterAbility} from "../lib/types";
    import Ability from "./Ability.svelte";

    let {abilities = $bindable()}: {abilities: CharacterAbility[]} = $props()

</script>

<div class="root">
    {#each abilities as ability}
        <Ability {ability} />
    {/each}
</div>

<style>
    .root {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: row;
        gap: 16px;
        width: auto;
        height: auto;
        grid-area: ab;
    }
</style>