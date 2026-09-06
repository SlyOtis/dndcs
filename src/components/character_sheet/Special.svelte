<script lang="ts">
  import type {CharacterContext} from "$lib/types";
  import {getContext} from "svelte";
  import Ornament from "$components/ui/Ornament.svelte";

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
      <button
        type="button"
        class="pool-pip"
        class:pool-pip-spent={index >= $special.current}
        onclick={() => togglePoint(index)}
        aria-label={`Toggle ${$special.name} point ${index + 1}`}
      >
        <Ornament name="quatrefoil" size="xs" tone={index >= $special.current ? 'ink' : 'ember'} />
      </button>
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

  .pool-pip {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    padding: 0;
    background: radial-gradient(circle at 50% 50%, var(--ground-lift) 0%, var(--ground-deep) 82%);
    border: var(--border-hair) solid var(--metal-dim);
    border-radius: var(--radius-pill);
    cursor: pointer;
    filter: drop-shadow(0 0 6px var(--ember-glow));
    transition: transform 0.15s ease, border-color 0.15s ease, filter 0.15s ease;
  }

  .pool-pip:hover {
    transform: scale(1.15);
  }

  .pool-pip:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  .pool-pip-spent {
    border-color: var(--ground-lift);
    filter: none;
    text-shadow: none;
    opacity: 0.55;
  }
</style>
