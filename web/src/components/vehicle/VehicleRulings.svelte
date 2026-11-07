<script lang="ts">
  import type { Rulings, VehicleSystem } from '$lib/rules/vehicle.types'

  const {
    system,
    rulings,
    editable = false,
    onrule
  }: {
    /** The vehicle system whose open questions are listed. */
    system: VehicleSystem
    /** The answers the table has given, by question id. */
    rulings: Rulings
    /** Lets the reader answer a question. */
    editable?: boolean
    /** Runs with the question and the chosen answer. */
    onrule?: (id: string, option: string) => void
  } = $props()

  const answered = $derived(system.rulings.filter((question) => rulings[question.id]).length)
</script>

<section class="vr" aria-label="Rulings">
  <p class="vr-lede">
    {system.title} {system.version} leaves {system.rulings.length} questions open. Until the table rules, the provisional answer is used and the value it
    touches is marked as pending. {answered} ruled.
  </p>
  <ul class="vr-list">
    {#each system.rulings as question (question.id)}
      {@const chosen = rulings[question.id] ?? question.provisionalOption}
      <li class="vr-entry">
        <div class="vr-line">
          <h3 class="vr-title">{question.title}</h3>
          <span class="vr-id">{question.id}</span>
        </div>
        <p class="vr-text">{question.description}</p>
        <p class="vr-note">Touches: {question.affects}</p>
        {#if editable}
          <label class="vr-pick">
            <span class="dnd-label">Ruling</span>
            <select value={chosen} onchange={(event) => onrule?.(question.id, event.currentTarget.value)}>
              {#each question.options as option (option.key)}
                <option value={option.key}>{option.label}{option.key === question.provisionalOption ? ' (provisional)' : ''}</option>
              {/each}
            </select>
          </label>
        {:else}
          <p class="vr-text">
            <strong>{question.options.find((option) => option.key === chosen)?.label}</strong>
            {rulings[question.id] ? '' : ' · provisional'}
          </p>
        {/if}
        {#if !rulings[question.id]}
          <p class="vr-pending">Not ruled yet</p>
        {/if}
      </li>
    {/each}
  </ul>
</section>

<style>
  .vr {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    max-width: 80ch;
  }

  .vr-lede {
    margin: 0;
    color: var(--ink-dim);
  }

  .vr-list {
    display: grid;
    gap: var(--space-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .vr-entry {
    display: grid;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-sm);
    background: var(--texture-noise), linear-gradient(180deg, var(--ground-raised), var(--ground-deep));
    box-shadow: var(--rim-thin), inset 0 0 16px 2px var(--shade-hard);
  }

  .vr-line {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .vr-title {
    margin: 0;
    font-size: var(--text-md);
  }

  .vr-id {
    flex: none;
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--ink-faint);
  }

  .vr-text {
    margin: 0;
    font-size: var(--text-sm);
  }

  .vr-note {
    margin: 0;
    font-size: var(--text-xs);
    color: var(--ink-faint);
  }

  .vr-pick {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
  }

  .vr-pick select {
    min-width: 0;
    padding: var(--space-1) var(--space-2);
    border: var(--border-hair) solid var(--metal-dim);
    border-radius: var(--radius-sm);
    background: var(--ground-deep);
    color: var(--ink);
    font: inherit;
    font-size: var(--text-sm);
  }

  .vr-pending {
    margin: 0;
    font-size: var(--text-xs);
    color: var(--state-warn);
  }
</style>
