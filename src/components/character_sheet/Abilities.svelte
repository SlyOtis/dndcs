<script lang="ts">
  import type {CharacterContext} from "$lib/types";
  import type {RulesState} from "$lib/rules/store";
  import {getAttributeId} from "$lib/rules/sheet";
  import Ability from "./Ability.svelte";
  import {getContext} from "svelte";
  import type {Readable} from "svelte/store";

  const {abilities} = getContext<CharacterContext>('character')
  const rules = getContext<Readable<RulesState>>('rules')

  const resolved = $derived.by(() =>
    $abilities.map((ability) => {
      const derivedAbility = $rules.resolved?.attributes.find((entry) => entry.id === getAttributeId(ability.title))
      if (!derivedAbility) return ability
      return {...ability, modifier: derivedAbility.value, score: derivedAbility.score}
    })
  )
</script>

<div class="root">
    {#each resolved as ability}
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
        flex-wrap: wrap;
        gap: 16px;
        width: auto;
        height: auto;
        min-width: 0;
        grid-column: 1 / 3;
        grid-row: 1;
    }
</style>
