<script lang="ts">

  import type {ConditionInfo, DefenceInfo} from "$lib/character.types";

  let {defences = $bindable(), conditions = $bindable()}: {
    defences: DefenceInfo[],
    conditions: ConditionInfo[],
  } = $props()

</script>

<div class="root dnd-panel dnd-keyline">
    <div class="box defences">
        <span class="title">Defences</span>
        {#if defences?.length}
            {#each defences as defence}
                <span>{defence.title}</span>
            {/each}
        {:else}
            <span>None</span>
        {/if}
    </div>
    <div class="divider"></div>
    <div class="box conditions">
        <span class="title">Conditions</span>
        {#if conditions?.length}
            {#each conditions as condition}
                <span>{condition.title}</span>
            {/each}
        {:else}
            <span>None</span>
        {/if}
    </div>
</div>

<style>
    .root {
        position: relative;
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
        min-width: 100%;
        min-height: 100%;
        gap: 6px;
        padding: 4px 8px;
        z-index: 1;
        color: var(--ink);


        align-self: stretch;
        justify-self: stretch;

        grid-column: 3 / 6;
        grid-row: 2;
    }

    .box {
        position: relative;
        display: flex;
        justify-content: start;
        align-items: start;
        flex-direction: column;
        width: 100%;
        height: 100%;
    }

    .divider {
        position: relative;
        width: 1px;
        min-width: 1px;
        background-color: var(--metal);
        min-height: 90%;
        height: 100%;
    }
</style>
