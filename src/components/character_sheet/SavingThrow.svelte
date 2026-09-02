<script lang="ts">
  import type {CharacterSavingThrow} from "$lib/types";
  import {rollSave} from "$lib/engine";
  import Stat from "$components/ui/Stat.svelte";

  let {save = $bindable()}: { save: CharacterSavingThrow } = $props()

  const sign = $derived(save.modifier > 0 ? '+' : '')

  function roll() {
    window.dispatchEvent(new CustomEvent('playButtonClick'));
    rollSave(save.title, save.modifier, save.proficiency)
  }
</script>

<Stat
  label={save.title}
  value="{sign}{save.modifier}"
  tone={save.proficiency ? 'metal' : 'verdigris'}
  lit={Boolean(save.proficiency)}
  title="Roll {save.title} save"
  onclick={roll}
/>
