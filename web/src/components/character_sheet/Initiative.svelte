<script lang="ts">
  import {rollInitiative} from "$lib/engine";
  import Stat from "$components/ui/Stat.svelte";

  let {initiative = $bindable()}: {initiative: number} = $props()

  const sign = $derived(initiative >= 0 ? '+' : '')

  function roll() {
    window.dispatchEvent(new CustomEvent('playButtonClick'));
    rollInitiative(initiative)
  }
</script>

<Stat
  label="Initiative"
  value="{sign}{initiative}"
  tone="verdigris"
  title="Roll initiative"
  onclick={roll}
/>
