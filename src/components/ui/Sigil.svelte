<script lang="ts">
  import type { Snippet } from 'svelte'

  const {
    tone = 'metal',
    size = 'md',
    count,
    active = false,
    disabled = false,
    title,
    onclick,
    children
  }: {
    /** Colours the ring and the light behind the glyph. */
    tone?: 'metal' | 'ember' | 'verdigris' | 'arcane' | 'bane'
    /** Sets the diameter of the sigil. */
    size?: 'sm' | 'md' | 'lg'
    /** Draws a charge count in the lower right of the ring. */
    count?: number
    /** Lights the ring to mark the sigil as chosen. */
    active?: boolean
    /** Blocks interaction and dims the sigil. */
    disabled?: boolean
    /** Reads as the accessible name and the native tooltip. */
    title: string
    /** Runs when the sigil is pressed. */
    onclick?: (event: MouseEvent) => void
    /** The glyph inside the ring. */
    children?: Snippet
  } = $props()
</script>

<button
  type="button"
  class="dnd-sigil dnd-sigil-{tone} dnd-sigil-{size}"
  class:dnd-sigil-active={active}
  aria-pressed={active || undefined}
  aria-label={title}
  {title}
  {disabled}
  {onclick}
>
  <span class="dnd-sigil-ring"></span>
  <span class="dnd-sigil-face"></span>
  <span class="dnd-sigil-glyph">{@render children?.()}</span>
  {#if count !== undefined}
    <span class="dnd-sigil-count">{count}</span>
  {/if}
</button>

<style>
  .dnd-sigil {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    --sigil-d: 56px;
    --sigil-light: var(--metal);
    width: var(--sigil-d);
    height: var(--sigil-d);
    transition: transform 0.15s ease, filter 0.15s ease;
  }

  .dnd-sigil-sm {
    --sigil-d: 38px;
  }

  .dnd-sigil-md {
    --sigil-d: 56px;
  }

  .dnd-sigil-lg {
    --sigil-d: 78px;
  }

  .dnd-sigil-metal {
    --sigil-light: var(--metal);
  }

  .dnd-sigil-ember {
    --sigil-light: var(--ember);
  }

  .dnd-sigil-verdigris {
    --sigil-light: var(--verdigris);
  }

  .dnd-sigil-arcane {
    --sigil-light: var(--metal-bright);
  }

  .dnd-sigil-bane {
    --sigil-light: var(--state-bad);
  }

  .dnd-sigil-ring {
    position: absolute;
    inset: 0;
    border-radius: var(--radius-pill);
    background: conic-gradient(
      from 210deg,
      var(--metal-dim) 0deg,
      var(--metal-bright) 90deg,
      var(--metal-dim) 180deg,
      var(--metal) 280deg,
      var(--metal-dim) 360deg
    );
    box-shadow: var(--shadow-sm);
  }

  .dnd-sigil-face {
    position: absolute;
    inset: 4px;
    border-radius: var(--radius-pill);
    background: radial-gradient(circle at 38% 28%, var(--ground-lift) 0%, var(--ground-deep) 82%);
    box-shadow: inset 0 2px 8px var(--shade-hard);
  }

  .dnd-sigil-glyph {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-display);
    font-size: calc(var(--sigil-d) * 0.42);
    line-height: 1;
    color: var(--sigil-light);
    text-shadow: 0 0 10px var(--sigil-light);
  }

  .dnd-sigil-count {
    position: absolute;
    right: -2px;
    bottom: -2px;
    z-index: 2;
    min-width: 18px;
    padding: 0 4px;
    border-radius: var(--radius-pill);
    background: var(--ground-deep);
    border: var(--border-hair) solid var(--metal);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    line-height: 16px;
    color: var(--metal-bright);
  }

  .dnd-sigil:hover:not(:disabled) {
    transform: translateY(-2px);
    filter: drop-shadow(0 0 12px var(--sigil-light));
  }

  .dnd-sigil:active:not(:disabled) {
    transform: translateY(0) scale(0.97);
  }

  .dnd-sigil-active .dnd-sigil-face {
    background: radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--sigil-light) 35%, var(--ground-deep)) 0%, var(--ground-deep) 80%);
    box-shadow: inset 0 0 14px var(--sigil-light);
  }

  .dnd-sigil:disabled {
    cursor: not-allowed;
    opacity: 0.4;
    filter: grayscale(0.7);
  }

  .dnd-sigil:focus-visible {
    outline: none;
    border-radius: var(--radius-pill);
    box-shadow: var(--focus-ring);
  }
</style>
