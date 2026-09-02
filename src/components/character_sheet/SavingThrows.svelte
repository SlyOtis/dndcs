<script lang="ts">
  import type {CharacterContext} from "$lib/types"
  import type {RulesState} from "$lib/rules/store";
  import {getAttributeId} from "$lib/rules/sheet";
  import SavingThrow from './SavingThrow.svelte'
  import {getContext} from "svelte";
  import type {Readable} from "svelte/store";

  const {savingThrows} = getContext<CharacterContext>('character')
  const rules = getContext<Readable<RulesState>>('rules')

  const resolved = $derived.by(() =>
    $savingThrows.map((save) => {
      const derivedSave = $rules.resolved?.saves.find((entry) => entry.id === getAttributeId(save.title))
      if (!derivedSave) return save
      return {...save, modifier: derivedSave.value}
    })
  )
</script>


<div class="root primary-border">
    <div class="saves">
        {#each resolved as save}
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
        grid-column: 1;
        background-color: var(--color-content-dark);
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