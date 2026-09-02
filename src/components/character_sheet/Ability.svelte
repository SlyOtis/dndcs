<script lang="ts">
  import type {CharacterAbility} from "$lib/types";
  import {rollAbility} from "$lib/engine";
  import Stat from "$components/ui/Stat.svelte";

  let {ability = $bindable()}: { ability: CharacterAbility } = $props()

  const sign = $derived(ability.modifier >= 0 ? '+' : '')

  function roll() {
    window.dispatchEvent(new CustomEvent('playButtonClick'));
    rollAbility(ability.title, ability.modifier)
  }
</script>

<Stat
  label={ability.title}
  value="{sign}{ability.modifier}"
  score={ability.score}
  tone="ember"
  title="Roll {ability.title}"
  onclick={roll}
/>
