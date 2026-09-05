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
  <span class="dnd-slot-frame"></span>
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
    --slot-edge: 2px;
    --slot-inlay: 4px;
    --slot-cut: 18%;
    --slot-cusp: calc(var(--slot-d) * 0.1);
    --slot-line: var(--metal-edge);
    --slot-point: var(--metal);
    --slot-shape: polygon(
      var(--slot-cut) 0,
      calc(100% - var(--slot-cut)) 0,
      100% var(--slot-cut),
      100% calc(100% - var(--slot-cut)),
      calc(100% - var(--slot-cut)) 100%,
      var(--slot-cut) 100%,
      0 calc(100% - var(--slot-cut)),
      0 var(--slot-cut)
    );
    width: var(--slot-d);
    height: var(--slot-d);
    background: none;
    border: none;
    transition: filter 0.15s ease, transform 0.15s ease;
  }

  .dnd-slot-sm {
    --slot-d: 40px;
    --slot-edge: 2px;
    --slot-inlay: 3px;
  }

  .dnd-slot-md {
    --slot-d: 56px;
    --slot-edge: 2px;
    --slot-inlay: 4px;
  }

  .dnd-slot-lg {
    --slot-d: 76px;
    --slot-edge: 3px;
    --slot-inlay: 5px;
  }

  .dnd-slot-ember {
    --slot-light: var(--ember);
  }

  .dnd-slot-verdigris {
    --slot-light: var(--verdigris);
  }

  .dnd-slot-frame {
    position: absolute;
    inset: 0;
    z-index: 1;
    background: linear-gradient(145deg, var(--metal) 0%, var(--metal-dim) 48%, var(--metal) 100%);
    clip-path: var(--slot-shape);
    pointer-events: none;
  }

  .dnd-slot::before,
  .dnd-slot::after {
    content: '';
    position: absolute;
    z-index: 0;
    width: var(--slot-cusp);
    height: var(--slot-cusp);
    background: var(--slot-point);
    transform: rotate(45deg);
    transition: background 0.15s ease;
  }

  .dnd-slot::before {
    top: calc(var(--slot-cut) / 2 - var(--slot-cusp) / 2);
    left: calc(var(--slot-cut) / 2 - var(--slot-cusp) / 2);
  }

  .dnd-slot::after {
    right: calc(var(--slot-cut) / 2 - var(--slot-cusp) / 2);
    bottom: calc(var(--slot-cut) / 2 - var(--slot-cusp) / 2);
  }

  .dnd-slot-face {
    position: absolute;
    inset: var(--slot-edge);
    z-index: 2;
    background: radial-gradient(circle at 40% 26%, var(--ground-raised) 0%, var(--ground-deep) 84%);
    box-shadow:
      inset 0 2px 8px var(--shade-hard),
      inset 0 0 0 var(--slot-inlay) var(--ground-deep),
      inset 0 0 0 calc(var(--slot-inlay) + var(--border-hair)) var(--slot-line);
    clip-path: var(--slot-shape);
    pointer-events: none;
  }

  .dnd-slot-content {
    position: relative;
    z-index: 3;
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
    top: calc(var(--slot-edge) + var(--slot-inlay));
    left: calc(var(--slot-cut) + var(--space-1));
    z-index: 4;
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    line-height: 1;
    letter-spacing: var(--tracking-wide);
    color: var(--ink-faint);
  }

  .dnd-slot-filled {
    --slot-line: var(--slot-light);
    --slot-point: var(--slot-light);
  }

  .dnd-slot-filled .dnd-slot-face {
    box-shadow:
      inset 0 0 12px color-mix(in srgb, var(--slot-light) 55%, transparent),
      inset 0 2px 8px var(--shade-hard),
      inset 0 0 0 var(--slot-inlay) color-mix(in srgb, var(--slot-light) 12%, var(--ground-deep)),
      inset 0 0 0 calc(var(--slot-inlay) + var(--border-hair)) var(--slot-line);
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

  .dnd-slot:focus-visible .dnd-slot-face {
    box-shadow:
      inset 0 2px 8px var(--shade-hard),
      inset 0 0 0 var(--slot-inlay) var(--ground-deep),
      inset 0 0 0 calc(var(--slot-inlay) + var(--border-width)) var(--metal-bright);
  }
</style>
