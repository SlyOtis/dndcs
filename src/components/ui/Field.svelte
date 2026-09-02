<script lang="ts">
  import type { Snippet } from 'svelte'

  const {
    label,
    help,
    error,
    valid = false,
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
    /** Marks the field as accepted and lights the rim green. */
    valid?: boolean
    /** Adds the required marker after the label. */
    required?: boolean
    /** Id of the control this label points at. */
    id: string
    /** The control itself. */
    children?: Snippet
  } = $props()
</script>

<div
  class="dnd-field"
  class:dnd-field-invalid={Boolean(error)}
  class:dnd-field-valid={valid && !error}
>
  <label class="dnd-field-label" for={id}>
    {label}
    {#if required}<span class="dnd-field-required" aria-hidden="true">*</span>{/if}
  </label>

  <div class="dnd-field-well">
    {@render children?.()}
    <span class="dnd-field-mark" aria-hidden="true"></span>
  </div>

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
    gap: var(--space-2);
    --field-rim: var(--metal-dim);
    --field-light: transparent;
  }

  .dnd-field-label {
    font-family: var(--font-display);
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
    color: var(--metal);
  }

  .dnd-field-required {
    color: var(--state-bad);
    margin-inline-start: var(--space-1);
  }

  .dnd-field-well {
    position: relative;
    display: flex;
  }

  .dnd-field-mark {
    position: absolute;
    top: 50%;
    right: var(--space-3);
    width: 10px;
    height: 10px;
    transform: translateY(-50%) rotate(45deg);
    background: var(--field-light);
    box-shadow: 0 0 8px var(--field-light);
    pointer-events: none;
    transition: background 0.15s ease;
  }

  .dnd-field-message {
    margin: 0;
    font-size: var(--text-xs);
    color: var(--ink-faint);
  }

  .dnd-field-error {
    color: var(--state-bad);
  }

  .dnd-field-valid {
    --field-rim: var(--state-good);
    --field-light: var(--state-good);
  }

  .dnd-field-invalid {
    --field-rim: var(--state-bad);
    --field-light: var(--state-bad);
  }

  .dnd-field :global(input),
  .dnd-field :global(textarea),
  .dnd-field :global(select) {
    width: 100%;
    padding: var(--space-3) var(--space-4);
    background: linear-gradient(180deg, var(--ground-deep) 0%, var(--ground) 100%);
    border: var(--border-hair) solid var(--field-rim);
    border-radius: var(--radius-sm);
    box-shadow: inset 0 2px 6px var(--shade-hard);
    color: var(--ink);
    font-family: var(--font-body);
    font-size: var(--text-sm);
    letter-spacing: var(--tracking-wide);
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .dnd-field :global(textarea) {
    resize: vertical;
    min-height: 96px;
  }

  .dnd-field :global(input::placeholder),
  .dnd-field :global(textarea::placeholder) {
    color: var(--ink-faint);
  }

  .dnd-field :global(input:hover),
  .dnd-field :global(textarea:hover),
  .dnd-field :global(select:hover) {
    border-color: var(--metal);
  }

  .dnd-field :global(input:focus),
  .dnd-field :global(textarea:focus),
  .dnd-field :global(select:focus) {
    outline: none;
    border-color: var(--metal-bright);
    box-shadow: inset 0 2px 6px var(--shade-hard), var(--glow-metal);
  }
</style>
