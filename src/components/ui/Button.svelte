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
    background: linear-gradient(180deg, var(--metal) 0%, var(--metal-dim) 100%);
    cursor: pointer;
    isolation: isolate;
    --button-h: 40px;
    --button-pad: var(--space-5);
    --button-text: var(--text-sm);
    --button-light: var(--ember);
    min-height: var(--button-h);
    clip-path: polygon(
      10px 0,
      calc(100% - 10px) 0,
      100% 10px,
      100% calc(100% - 10px),
      calc(100% - 10px) 100%,
      10px 100%,
      0 calc(100% - 10px),
      0 10px
    );
    transition: filter 0.15s ease, transform 0.12s ease;
  }

  .dnd-button-sm {
    --button-h: 30px;
    --button-pad: var(--space-3);
    --button-text: var(--text-xs);
  }

  .dnd-button-md {
    --button-h: 40px;
    --button-pad: var(--space-5);
    --button-text: var(--text-sm);
  }

  .dnd-button-lg {
    --button-h: 54px;
    --button-pad: var(--space-6);
    --button-text: var(--text-md);
  }

  .dnd-button-fill {
    width: 100%;
  }

  .dnd-button-face {
    position: absolute;
    inset: 2px;
    z-index: 0;
    background: linear-gradient(180deg, var(--ground-lift) 0%, var(--ground-raised) 52%, var(--ground-deep) 100%);
    clip-path: inherit;
    box-shadow: inset 0 1px 0 var(--metal-edge), inset 0 -10px 18px -12px var(--shade-hard);
  }

  .dnd-button-sheen {
    position: absolute;
    inset: 2px;
    z-index: 1;
    background: linear-gradient(180deg, var(--sheen) 0%, transparent 46%);
    clip-path: inherit;
    pointer-events: none;
  }

  .dnd-button-inner {
    position: relative;
    z-index: 2;
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

  .dnd-button:disabled {
    cursor: not-allowed;
    opacity: 0.45;
    filter: grayscale(0.6);
  }

  .dnd-button-primary {
    background: linear-gradient(180deg, var(--metal-bright) 0%, var(--metal-dim) 100%);
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
  }

  .dnd-button-ghost {
    background: transparent;
    --button-light: var(--metal);
  }

  .dnd-button-ghost .dnd-button-face {
    background: transparent;
    box-shadow: inset 0 0 0 var(--border-hair) var(--metal-dim);
  }

  .dnd-button-ghost .dnd-button-sheen {
    display: none;
  }

  .dnd-button-ghost .dnd-button-inner {
    color: var(--metal);
  }

  .dnd-button-ghost:hover:not(:disabled) .dnd-button-inner {
    color: var(--metal-bright);
  }

  .dnd-button-danger {
    background: linear-gradient(180deg, var(--state-bad) 0%, color-mix(in srgb, var(--state-bad) 35%, black) 100%);
    --button-light: var(--state-bad);
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
