<script lang="ts">
  import type { Snippet } from 'svelte'

  const {
    variant = 'primary',
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
  class="dnd-button dnd-button-{variant}"
  class:dnd-button-fill={fill}
  class:dnd-button-loading={loading}
  disabled={disabled || loading}
  {onclick}
>
  {#if loading}
    <span class="dnd-button-spinner" aria-hidden="true"></span>
  {/if}
  {@render children?.()}
</button>

<style>
  .dnd-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-md);
    border: var(--border-width) solid transparent;
    font-family: inherit;
    font-size: var(--text-sm);
    font-weight: 600;
    line-height: 1.2;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
  }

  .dnd-button:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  .dnd-button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .dnd-button-fill {
    width: 100%;
  }

  .dnd-button-primary {
    background: var(--color-primary-main);
    border-color: var(--color-primary-main);
    color: var(--color-content-dark);
  }

  .dnd-button-primary:hover:not(:disabled) {
    background: var(--color-primary-light);
  }

  .dnd-button-secondary {
    background: var(--color-content-main);
    border-color: var(--color-primary-main);
    color: var(--color-content-text);
  }

  .dnd-button-secondary:hover:not(:disabled) {
    background: var(--color-content-light);
  }

  .dnd-button-ghost {
    background: transparent;
    border-color: transparent;
    color: var(--color-content-text);
  }

  .dnd-button-ghost:hover:not(:disabled) {
    background: var(--color-content-light);
  }

  .dnd-button-danger {
    background: var(--color-danger);
    border-color: var(--color-danger);
    color: var(--color-primary-text);
  }

  .dnd-button-danger:hover:not(:disabled) {
    filter: brightness(1.1);
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
