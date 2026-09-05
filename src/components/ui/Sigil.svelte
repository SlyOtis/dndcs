<script lang="ts">
  import type { Snippet } from 'svelte'

  const {
    tone = 'metal',
    size = 'md',
    frame = 'ring',
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
    /** Picks which traced surround the glyph sits in. */
    frame?: SigilFrame
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

<script lang="ts" module>
  export type SigilFrame = 'ring' | 'cusped' | 'lobed' | 'star' | 'plate'

  const TRACES: Record<SigilFrame, string> = {
    ring: 'M50 6a44 44 0 1 1 0 88 44 44 0 0 1 0-88Z',
    cusped:
      'M50 4 62 16h16v16l12 12-12 12v16H62L50 84 38 96H22V80L10 68l12-12V40h16L50 4Z',
    lobed:
      'M50 6c9 0 16 5 19 12 8-3 17-1 23 5s8 15 5 23c7 3 12 10 12 19s-5 16-12 19c3 8 1 17-5 23s-15 8-23 5c-3 7-10 12-19 12s-16-5-19-12c-8 3-17 1-23-5s-8-15-5-23C6 66 1 59 1 50s5-16 12-19C10 23 12 14 18 8s15-8 23-5C44 11 41 6 50 6Z',
    star:
      'M50 2 61 22l22-8-8 22 20 11-20 11 8 22-22-8-11 20-11-20-22 8 8-22L5 47l20-11-8-22 22 8L50 2Z',
    plate: 'M18 6h64l16 16v56L82 94H18L2 78V22L18 6Z'
  }
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
  <svg class="dnd-sigil-trace" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
    <path d={TRACES[frame]} class="dnd-sigil-fill" />
    <path d={TRACES[frame]} class="dnd-sigil-rim" />
    <path d={TRACES[frame]} class="dnd-sigil-key" />
  </svg>
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
    --sigil-edge: calc(var(--sigil-d) * 0.062);
    --sigil-cusp: calc(var(--sigil-d) * 0.15);
    --sigil-point: var(--metal-dim);
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
    z-index: 0;
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

  .dnd-sigil-ring::before,
  .dnd-sigil-ring::after,
  .dnd-sigil-face::before,
  .dnd-sigil-face::after {
    content: '';
    position: absolute;
    width: var(--sigil-cusp);
    height: var(--sigil-cusp);
    background: var(--sigil-point);
    transition: background 0.15s ease;
  }

  .dnd-sigil-ring::before {
    top: calc(var(--sigil-cusp) / -2);
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
  }

  .dnd-sigil-ring::after {
    bottom: calc(var(--sigil-cusp) / -2);
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
  }

  .dnd-sigil-face::before {
    top: 50%;
    left: calc(-1 * var(--sigil-edge) - var(--sigil-cusp) / 2);
    transform: translateY(-50%) rotate(45deg);
  }

  .dnd-sigil-face::after {
    top: 50%;
    right: calc(-1 * var(--sigil-edge) - var(--sigil-cusp) / 2);
    transform: translateY(-50%) rotate(45deg);
  }

  .dnd-sigil-trace {
    position: absolute;
    inset: 0;
    z-index: 1;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
  }

  .dnd-sigil-fill {
    fill: var(--ground-deep);
  }

  .dnd-sigil-rim {
    fill: none;
    stroke: var(--metal-dim);
    stroke-width: 5;
    vector-effect: non-scaling-stroke;
    stroke-linejoin: round;
  }

  .dnd-sigil-key {
    fill: none;
    stroke: var(--metal-edge);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
    transform: scale(0.82);
    transform-origin: center;
  }

  .dnd-sigil:hover:not(:disabled) .dnd-sigil-rim {
    stroke: var(--sigil-light);
  }

  .dnd-sigil-active .dnd-sigil-fill {
    fill: color-mix(in srgb, var(--sigil-light) 30%, var(--ground-deep));
  }

  .dnd-sigil-active .dnd-sigil-rim {
    stroke: var(--sigil-light);
  }

  .dnd-sigil-glyph {
    position: relative;
    z-index: 2;
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
    z-index: 3;
    min-width: 18px;
    padding: 0 var(--space-1);
    border-radius: var(--radius-sm);
    background: linear-gradient(180deg, var(--ground) 0%, var(--ground-deep) 100%);
    border: var(--border-hair) solid var(--metal);
    box-shadow: inset 0 0 0 var(--border-hair) var(--ground-deep), var(--shadow-sm);
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

  .dnd-sigil-active {
    --sigil-point: var(--sigil-light);
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
