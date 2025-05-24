<script lang="ts">
  import type {CharacterContext} from "$lib/types";
  import {getContext} from "svelte";

  const {proficients} = getContext<CharacterContext>('character')

</script>

<div class="root primary-border">
    <div class="proficients">
        {#each $proficients as proficiency}
            <span class="title">
                {proficiency.title}
            </span>
            <span class="proficiency">{proficiency.value.join(', ')}</span>
        {/each}
    </div>
    <span>Proficients</span>
</div>

<style>
    .root {
        position: relative;
        gap: 16px;
        display: flex;
        height: 100%;
        width: auto;
        min-height: 100%;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        padding: 4px 8px;
        grid-column: 1;
        grid-row: span 2;
        background-color: var(--color-content-dark);
    }

    .proficients {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        flex-direction: column;
        gap: 8px;
        width: 100%;
        height: 100%;
    }

    .title {
        position: relative;
        font-weight: 800;
    }


</style>