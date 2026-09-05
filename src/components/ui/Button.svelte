<script lang="ts">
  import type { Snippet } from 'svelte'

  const {
    variant = 'primary',
    size = 'md',
    type = 'button',
    disabled = false,
    fill = false,
    loading = false,
    title,
    onclick,
    children
  }: {
    /** Picks the tone of the button against the active theme. */
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    /** Sets the height and the label size of the button. */
    size?: 'sm' | 'md' | 'lg'
    /** Native button type. Submit inside a form, button everywhere else. */
    type?: 'button' | 'submit' | 'reset'
    /** Blocks interaction and dims the button. */
    disabled?: boolean
    /** Stretches the button to the width of its container. */
    fill?: boolean
    /** Shows a spinner in place of the label and blocks interaction. */
    loading?: boolean
    /** Native tooltip text. */
    title?: string
    /** Runs when the button is pressed. */
    onclick?: (event: MouseEvent) => void
    /** The label content. */
    children?: Snippet
  } = $props()
</script>

<button
  {type}
  {title}
  class="dnd-button dnd-button-{variant} dnd-button-{size}"
  class:dnd-button-fill={fill}
  class:dnd-button-loading={loading}
  disabled={disabled || loading}
  {onclick}
>
  <span class="dnd-button-frame"></span>
  <span class="dnd-button-face"></span>
  <span class="dnd-button-sheen"></span>
  <span class="dnd-button-inner">
    {#if loading}
      <span class="dnd-button-spinner" aria-hidden="true"></span>
    {/if}
    {@render children?.()}
  </span>
</button>

<style>
  .dnd-button {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    isolation: isolate;
    --button-h: 40px;
    --button-pad: var(--space-5);
    --button-text: var(--text-sm);
    --button-light: var(--ember);
    --button-cusp: 14px;
    --button-edge: 2px;
    --button-inlay: 4px;
    --button-tick: calc(var(--button-cusp) * 0.7);
    --button-rim: linear-gradient(180deg, var(--metal-bright) 0%, var(--metal) 44%, var(--metal-dim) 100%);
    --button-line: var(--metal-edge);
    --button-well: var(--ground-deep);
    --button-shape: polygon(
      var(--button-cusp) 0,
      calc(100% - var(--button-cusp)) 0,
      100% 50%,
      calc(100% - var(--button-cusp)) 100%,
      var(--button-cusp) 100%,
      0 50%
    );
    min-height: var(--button-h);
    transition: filter 0.15s ease, transform 0.12s ease;
  }

  .dnd-button-sm {
    --button-h: 30px;
    --button-pad: var(--space-4);
    --button-text: var(--text-xs);
    --button-cusp: 9px;
    --button-edge: 1px;
    --button-inlay: 3px;
  }

  .dnd-button-md {
    --button-h: 40px;
    --button-pad: var(--space-5);
    --button-text: var(--text-sm);
    --button-cusp: 14px;
    --button-edge: 2px;
    --button-inlay: 4px;
  }

  .dnd-button-lg {
    --button-h: 54px;
    --button-pad: var(--space-6);
    --button-text: var(--text-md);
    --button-cusp: 19px;
    --button-edge: 2px;
    --button-inlay: 5px;
  }

  .dnd-button-fill {
    width: 100%;
  }

  .dnd-button-frame {
    position: absolute;
    inset: 0;
    z-index: 0;
    background: var(--button-rim);
    clip-path: var(--button-shape);
    pointer-events: none;
  }

  .dnd-button-face {
    position: absolute;
    inset: var(--button-edge);
    z-index: 1;
    background: linear-gradient(180deg, var(--ground-lift) 0%, var(--ground-raised) 52%, var(--ground-deep) 100%);
    clip-path: var(--button-shape);
    box-shadow:
      inset 0 -12px 20px -14px var(--shade-hard),
      inset 0 0 0 var(--button-inlay) var(--button-well),
      inset 0 0 0 calc(var(--button-inlay) + var(--border-hair)) var(--button-line);
    pointer-events: none;
  }

  .dnd-button-face::before,
  .dnd-button-face::after {
    content: '';
    position: absolute;
    top: 30%;
    bottom: 30%;
    width: var(--border-hair);
    background: var(--button-line);
  }

  .dnd-button-face::before {
    left: var(--button-tick);
  }

  .dnd-button-face::after {
    right: var(--button-tick);
  }

  .dnd-button-sheen {
    position: absolute;
    inset: var(--button-edge);
    z-index: 2;
    background: linear-gradient(180deg, var(--sheen) 0%, transparent 46%);
    clip-path: var(--button-shape);
    pointer-events: none;
  }

  .dnd-button-inner {
    position: relative;
    z-index: 3;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: 0 var(--button-pad);
    min-height: var(--button-h);
    font-family: var(--font-display);
    font-size: var(--button-text);
    font-weight: 700;
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
    line-height: 1.1;
    color: var(--metal-bright);
    text-shadow: 0 1px 2px var(--shade-hard);
  }

  .dnd-button:hover:not(:disabled) {
    transform: translateY(-1px);
    filter: brightness(1.12) drop-shadow(0 0 10px var(--button-light));
  }

  .dnd-button:active:not(:disabled) {
    transform: translateY(1px);
    filter: brightness(0.94);
  }

  .dnd-button:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  .dnd-button:focus-visible .dnd-button-face {
    box-shadow:
      inset 0 0 0 var(--button-inlay) var(--button-well),
      inset 0 0 0 calc(var(--button-inlay) + var(--border-width)) var(--metal-bright);
  }

  .dnd-button:disabled {
    cursor: not-allowed;
    opacity: 0.45;
    filter: grayscale(0.6);
  }

  .dnd-button-primary {
    --button-rim: linear-gradient(180deg, var(--metal-bright) 0%, var(--metal) 40%, var(--metal-dim) 100%);
    --button-line: var(--ember-core);
    --button-well: color-mix(in srgb, var(--ember) 52%, black);
  }

  .dnd-button-primary .dnd-button-face {
    background: linear-gradient(180deg, var(--ember) 0%, color-mix(in srgb, var(--ember) 45%, black) 100%);
  }

  .dnd-button-primary .dnd-button-inner {
    color: var(--ground-deep);
    text-shadow: 0 1px 0 var(--ember-core);
  }

  .dnd-button-secondary {
    --button-light: var(--metal);
    --button-rim: linear-gradient(180deg, var(--metal) 0%, var(--metal-dim) 100%);
  }

  .dnd-button-ghost {
    --button-light: var(--metal);
    --button-rim: linear-gradient(180deg, var(--metal-dim) 0%, color-mix(in srgb, var(--metal-dim) 40%, transparent) 100%);
    --button-line: color-mix(in srgb, var(--metal-edge) 60%, transparent);
  }

  .dnd-button-ghost .dnd-button-face {
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--ground-lift) 72%, transparent) 0%,
      color-mix(in srgb, var(--ground-deep) 82%, transparent) 100%
    );
    box-shadow:
      inset 0 0 0 var(--border-hair) var(--button-line),
      inset 0 1px 0 color-mix(in srgb, var(--metal-edge) 55%, transparent);
  }

  .dnd-button-ghost .dnd-button-sheen {
    background: linear-gradient(180deg, var(--sheen-soft) 0%, transparent 42%);
  }

  .dnd-button-ghost .dnd-button-inner {
    color: var(--metal);
  }

  .dnd-button-ghost:hover:not(:disabled) {
    --button-rim: linear-gradient(180deg, var(--metal) 0%, var(--metal-dim) 100%);
  }

  .dnd-button-ghost:hover:not(:disabled) .dnd-button-inner {
    color: var(--metal-bright);
  }

  .dnd-button-danger {
    --button-light: var(--state-bad);
    --button-rim: linear-gradient(180deg, var(--state-bad) 0%, color-mix(in srgb, var(--state-bad) 35%, black) 100%);
    --button-line: color-mix(in srgb, var(--state-bad) 55%, var(--ink));
    --button-well: color-mix(in srgb, var(--state-bad) 28%, black);
  }

  .dnd-button-danger .dnd-button-face {
    background: linear-gradient(180deg, color-mix(in srgb, var(--state-bad) 70%, black) 0%, var(--ground-deep) 100%);
  }

  .dnd-button-danger .dnd-button-inner {
    color: var(--ink);
  }

  .dnd-button-spinner {
    width: 1em;
    height: 1em;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: var(--radius-pill);
    animation: dnd-button-spin 0.7s linear infinite;
  }

  @keyframes dnd-button-spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
