<script lang="ts">
  import type { Snippet } from 'svelte'

  const {
    label,
    help,
    error,
    required = false,
    id,
    children
  }: {
    /** Text shown above the control. */
    label: string
    /** Guidance shown under the control when there is no error. */
    help?: string
    /** Replaces the help line and marks the field as invalid. */
    error?: string
    /** Adds the required marker after the label. */
    required?: boolean
    /** Id of the control this label points at. */
    id: string
    /** The control itself. */
    children?: Snippet
  } = $props()
</script>

<div class="dnd-field" class:dnd-field-invalid={Boolean(error)}>
  <label class="dnd-field-label" for={id}>
    {label}
    {#if required}<span class="dnd-field-required" aria-hidden="true">*</span>{/if}
  </label>

  {@render children?.()}

  {#if error}
    <p class="dnd-field-message dnd-field-error">{error}</p>
  {:else if help}
    <p class="dnd-field-message">{help}</p>
  {/if}
</div>

<style>
  .dnd-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .dnd-field-label {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-primary-main);
  }

  .dnd-field-required {
    color: var(--color-danger);
    margin-inline-start: var(--space-1);
  }

  .dnd-field-message {
    margin: 0;
    font-size: var(--text-xs);
    color: var(--color-secondary-text);
  }

  .dnd-field-error {
    color: var(--color-danger);
  }

  .dnd-field :global(input),
  .dnd-field :global(textarea),
  .dnd-field :global(select) {
    width: 100%;
    padding: var(--space-2) var(--space-3);
    background: var(--color-content-dark);
    border: var(--border-width) solid var(--color-content-light);
    border-radius: var(--radius-md);
    color: var(--color-content-text);
    font-family: inherit;
    font-size: var(--text-sm);
  }

  .dnd-field :global(input:focus),
  .dnd-field :global(textarea:focus),
  .dnd-field :global(select:focus) {
    outline: none;
    border-color: var(--color-primary-main);
    box-shadow: var(--focus-ring);
  }

  .dnd-field-invalid :global(input),
  .dnd-field-invalid :global(textarea),
  .dnd-field-invalid :global(select) {
    border-color: var(--color-danger);
  }
</style>
