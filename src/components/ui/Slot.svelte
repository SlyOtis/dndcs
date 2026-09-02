<script lang="ts">
  import type { Snippet } from 'svelte'

  const {
    index,
    filled = false,
    tone = 'metal',
    size = 'md',
    title,
    onclick,
    children
  }: {
    /** The hotkey number written in the corner of the slot. */
    index?: number
    /** Lights the slot to mark that it holds something. */
    filled?: boolean
    /** Colours the rim against the active theme. */
    tone?: 'metal' | 'ember' | 'verdigris'
    /** Sets the edge length of the slot. */
    size?: 'sm' | 'md' | 'lg'
    /** Reads as the accessible name and the native tooltip. */
    title: string
    /** Runs when the slot is pressed. */
    onclick?: (event: MouseEvent) => void
    /** The content held in the slot. */
    children?: Snippet
  } = $props()
</script>

<button
  type="button"
  class="dnd-slot dnd-slot-{tone} dnd-slot-{size}"
  class:dnd-slot-filled={filled}
  aria-label={title}
  {title}
  {onclick}
>
  <span class="dnd-slot-face"></span>
  <span class="dnd-slot-content">{@render children?.()}</span>
  {#if index !== undefined}
    <span class="dnd-slot-index">{index}</span>
  {/if}
</button>

<style>
  .dnd-slot {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    padding: 0;
    cursor: pointer;
    --slot-d: 56px;
    --slot-light: var(--metal);
    width: var(--slot-d);
    height: var(--slot-d);
    background: linear-gradient(135deg, var(--metal-dim) 0%, var(--ground-lift) 55%, var(--metal-dim) 100%);
    border: none;
    clip-path: polygon(
      9px 0,
      calc(100% - 9px) 0,
      100% 9px,
      100% calc(100% - 9px),
      calc(100% - 9px) 100%,
      9px 100%,
      0 calc(100% - 9px),
      0 9px
    );
    transition: filter 0.15s ease, transform 0.15s ease;
  }

  .dnd-slot-sm {
    --slot-d: 40px;
  }

  .dnd-slot-md {
    --slot-d: 56px;
  }

  .dnd-slot-lg {
    --slot-d: 76px;
  }

  .dnd-slot-ember {
    --slot-light: var(--ember);
  }

  .dnd-slot-verdigris {
    --slot-light: var(--verdigris);
  }

  .dnd-slot-face {
    position: absolute;
    inset: 3px;
    background: radial-gradient(circle at 40% 26%, var(--ground-raised) 0%, var(--ground-deep) 84%);
    box-shadow: inset 0 2px 8px var(--shade-hard);
    clip-path: inherit;
  }

  .dnd-slot-content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    font-size: calc(var(--slot-d) * 0.42);
    line-height: 1;
    color: var(--ink);
  }

  .dnd-slot-index {
    position: absolute;
    top: 2px;
    left: 5px;
    z-index: 2;
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--ink-faint);
  }

  .dnd-slot-filled .dnd-slot-face {
    box-shadow: inset 0 0 14px var(--slot-light), inset 0 2px 8px var(--shade-hard);
  }

  .dnd-slot:hover {
    transform: translateY(-2px);
    filter: drop-shadow(0 0 10px var(--slot-light));
  }

  .dnd-slot:active {
    transform: translateY(0) scale(0.97);
  }

  .dnd-slot:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
</style>
