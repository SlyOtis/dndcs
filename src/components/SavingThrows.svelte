<script lang="ts">
  import type {CharacterSavingThrow} from "../lib/types"
  import SavingThrow from './SavingThrow.svelte'

  let {savingThrows = $bindable()}: {savingThrows: CharacterSavingThrow[]} = $props()


</script>


<div class="root primary-border">
    <div class="saves">
        {#each savingThrows as save}
            <SavingThrow {save}/>
        {/each}
    </div>
    <span>Saving Throws</span>
</div>

<style>
    .root {
        position: relative;
        gap: 16px;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        width: auto;
        height: auto;
        padding: 4px 8px;
        grid-area: st;
    }

    .saves {
        position: relative;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        width: auto;
        height: auto;
    }
</style>