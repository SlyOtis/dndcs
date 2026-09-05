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
    --field-brace: var(--metal);
    --field-light: transparent;
    --field-line: color-mix(in srgb, var(--metal-edge) 55%, transparent);
    --field-cusp: 11px;
  }

  .dnd-field-label {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    font-family: var(--font-display);
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
    color: var(--metal);
  }

  .dnd-field-label::before {
    content: '';
    flex: none;
    width: 5px;
    height: 5px;
    transform: rotate(45deg);
    border: var(--border-hair) solid var(--metal-dim);
    border-radius: 0 var(--radius-sm) 0 var(--radius-sm);
  }

  .dnd-field-required {
    color: var(--state-bad);
    margin-inline-start: var(--space-1);
  }

  .dnd-field-well {
    position: relative;
    display: flex;
  }

  .dnd-field-well::before,
  .dnd-field-well::after {
    content: '';
    position: absolute;
    width: var(--field-cusp);
    height: var(--field-cusp);
    border: var(--border-hair) solid var(--field-brace);
    pointer-events: none;
    transition: border-color 0.15s ease;
  }

  .dnd-field-well::before {
    top: 0;
    left: 0;
    border-right: none;
    border-bottom: none;
    border-top-left-radius: var(--radius-sm);
  }

  .dnd-field-well::after {
    right: 0;
    bottom: 0;
    border-left: none;
    border-top: none;
    border-bottom-right-radius: var(--radius-sm);
  }

  .dnd-field-well:focus-within::before,
  .dnd-field-well:focus-within::after {
    border-color: var(--metal-bright);
  }

  .dnd-field-mark {
    position: absolute;
    top: 50%;
    right: var(--space-3);
    width: 9px;
    height: 9px;
    transform: translateY(-50%) rotate(45deg);
    border: var(--border-hair) solid var(--field-light);
    border-radius: 0 var(--radius-sm) 0 var(--radius-sm);
    background: color-mix(in srgb, var(--field-light) 35%, transparent);
    box-shadow: 0 0 8px var(--field-light);
    pointer-events: none;
    transition: border-color 0.15s ease, background 0.15s ease;
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
    --field-brace: var(--state-good);
    --field-line: color-mix(in srgb, var(--state-good) 45%, transparent);
  }

  .dnd-field-invalid {
    --field-rim: var(--state-bad);
    --field-light: var(--state-bad);
    --field-brace: var(--state-bad);
    --field-line: color-mix(in srgb, var(--state-bad) 45%, transparent);
  }

  .dnd-field :global(input),
  .dnd-field :global(textarea),
  .dnd-field :global(select) {
    width: 100%;
    padding: var(--space-3) var(--space-4);
    background: linear-gradient(180deg, var(--ground-deep) 0%, var(--ground) 100%);
    border: var(--border-hair) solid var(--field-rim);
    border-radius: var(--radius-sm);
    box-shadow:
      inset 0 0 0 var(--border-hair) var(--ground-deep),
      inset 0 0 0 calc(var(--border-hair) * 2) var(--field-line),
      inset 0 3px 8px var(--shade-hard);
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
    box-shadow:
      inset 0 0 0 var(--border-hair) var(--ground-deep),
      inset 0 0 0 calc(var(--border-hair) * 2) var(--metal),
      inset 0 3px 8px var(--shade-hard),
      var(--glow-metal);
  }
</style>
