<script lang="ts">
  import type {CharacterContext} from "$lib/types";
  import type {RulesState} from "$lib/rules/store";
  import {getSkillId} from "$lib/rules/sheet";
  import {getContext} from "svelte";
  import type {Readable} from "svelte/store";

  const {senses} = getContext<CharacterContext>('character')
  const rules = getContext<Readable<RulesState>>('rules')

  const resolved = $derived.by(() =>
    $senses.map((sense) => {
      const derivedSense = $rules.resolved?.senses.find((entry) => entry.id === getSkillId(sense.title))
      if (!derivedSense) return sense
      return {...sense, score: derivedSense.value}
    })
  )
</script>


<div class="root primary-border">
    <div class="senses">
        {#each resolved as sense}
            <div class="sense primary-border">
                <button class="value primary-border">{sense.score}</button>
                <span class="title">{sense.title}</span>
            </div>
        {/each}
    </div>
    <span>Senses</span>
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

    .senses {
        position: relative;
        display: flex;
        align-items: center;
        flex-direction: column;
        gap: 8px;
        width: 100%;
        height: auto;
    }

    .sense {
        position: relative;
        display: flex;
        align-items: center;
        flex-direction: row;
        width: 100%;
        height: auto;
    }

    .title {
        position: relative;
        padding-left: 16px;
    }

    .value {
        position: relative;
        width: min-content;
        height: calc(100% + 8px);
        display: flex;
        justify-content: center;
        align-items: center;
        color: var(--color-content-text);
        background: var(--color-content-main);
        padding: 4px;
        min-width: 64px;
        cursor: pointer;
        margin: -4px;
        border-radius: 16px;
    }
</style>