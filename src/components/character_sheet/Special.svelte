<script lang="ts">
  import type {CharacterContext} from "$lib/types";
  import {getContext} from "svelte";
  import Ornament from "$components/ui/Ornament.svelte";
  import Sigil from "$components/ui/Sigil.svelte";

  const {special} = getContext<CharacterContext>('character')

  function togglePoint(index: number) {
    special.update(curr => {
      const newCurrent = index < curr.current ? index : index + 1;
      return {
        ...curr,
        current: Math.max(0, Math.min(curr.max, newCurrent))
      };
    });
  }
</script>

<div class="pool">
  <header class="pool-head">
    <span class="pool-title">
      <span class="dnd-label">{$special.name}</span>
      <span class="pool-regain">{$special.regain}</span>
    </span>
    <span class="pool-count">{$special.current}<span class="pool-slash">/</span>{$special.max}</span>
  </header>

  <div class="pool-pips">
    {#each Array.from({ length: $special.max }, (_, i) => i) as index (index)}
      <Sigil
        size="sm"
        tone="ember"
        active={index < $special.current}
        title={`Toggle ${$special.name} point ${index + 1}`}
        onclick={() => togglePoint(index)}
      >
        <Ornament name="quatrefoil" size="xs" tone={index >= $special.current ? 'ink' : 'ember'} />
      </Sigil>
    {/each}
  </div>
</div>

<style>
  .pool {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    min-width: 0;
    background:
      var(--texture-noise),
      linear-gradient(180deg, var(--ground-raised) 0%, var(--ground-deep) 100%);
    background-blend-mode: overlay, normal;
    border: var(--border-hair) solid var(--metal-dim);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm), inset 0 1px 0 var(--metal-edge);
  }

  .pool-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-3);
  }

  .pool-title {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .pool-regain {
    font-size: var(--text-xs);
    font-style: italic;
    color: var(--ink-faint);
  }

  .pool-count {
    font-family: var(--font-display);
    font-size: var(--text-md);
    font-weight: 700;
    color: var(--metal-bright);
  }

  .pool-slash {
    color: var(--ink-faint);
    padding: 0 2px;
  }

  .pool-pips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-start;
    gap: var(--space-2);
    min-width: 0;
  }

</style>
