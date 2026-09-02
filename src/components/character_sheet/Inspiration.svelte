<script lang="ts">
  import {getContext} from "svelte";
  import type {CharacterContext} from "$lib/types";
  import Stat from "$components/ui/Stat.svelte";

  const {info} = getContext<CharacterContext>('character')

  function toggle() {
    const wasInspired = $info.inspiration;

    info.update(state => ({
      ...state,
      inspiration: !state.inspiration
    }))

    window.dispatchEvent(new CustomEvent('playButtonClick'));

    if (!wasInspired) {
      window.dispatchEvent(new CustomEvent('playInspiration'));
      window.dispatchEvent(new CustomEvent('showFunnyText', {
        detail: { text: 'MEGA INSPIRED!!!', category: 'inspiration' }
      }));
    }
  }
</script>

<Stat
  label="Inspiration"
  value={$info.inspiration ? '1' : '0'}
  tone="metal"
  lit={$info.inspiration}
  title="Toggle inspiration"
  onclick={toggle}
/>
