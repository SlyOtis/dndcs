<script lang="ts">
  import type {CharacterContext} from "../../lib/types";
  import Ability from "./Ability.svelte";
  import {getContext} from "svelte";

  const {abilities} = getContext<CharacterContext>('character')

</script>

<div class="root">
    {#each $abilities as ability}
        <Ability {ability}/>
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
        grid-column: 1 / 3;
        grid-row: 1;
    }
</style>