<script lang="ts">
  import { getContext } from 'svelte'
  import type { Readable } from 'svelte/store'
  import type { RulesState } from '$lib/rules/store'
  import type { PanelField, ResolvedCharacter } from '$lib/rules/spec.types'

  const {
    skip = []
  }: {
    /** Panel ids the bespoke sheet layout already renders. */
    skip?: string[]
  } = $props()

  const rules = getContext<Readable<RulesState>>('rules')

  const panels = $derived($rules.resolved?.panels.filter((panel) => !skip.includes(panel.id)) ?? [])

  function getEntry(resolved: ResolvedCharacter, field: PanelField) {
    if (field.source === 'attribute') {
      const entry = resolved.attributes.find((candidate) => candidate.id === field.id)
      return entry && { title: entry.title, value: entry.value, note: String(entry.score) }
    }
    if (field.source === 'skill') {
      const entry = resolved.skills.find((candidate) => candidate.id === field.id)
      return entry && { title: entry.title, value: entry.value, note: entry.tier }
    }
    if (field.source === 'save') {
      const entry = resolved.saves.find((candidate) => candidate.id === field.id)
      return entry && { title: entry.title, value: entry.value, note: entry.tier }
    }
    if (field.source === 'sense') {
      const entry = resolved.senses.find((candidate) => candidate.id === field.id)
      return entry && { title: entry.title, value: entry.value, note: entry.unit }
    }
    if (field.source === 'pool') {
      const entry = resolved.pools.find((candidate) => candidate.id === field.id)
      return entry && { title: entry.title, value: entry.remaining, note: `of ${entry.max}` }
    }
    const entry = resolved.derived.find((candidate) => candidate.id === field.id)
    return entry && { title: entry.title, value: entry.value, note: entry.unit }
  }
</script>

{#if $rules.error}
  <div class="dnd-rule-panels-error">{$rules.error}</div>
{:else if $rules.resolved}
  {#each panels as panel (panel.id)}
    <section class="dnd-rule-panel primary-border">
      <h3 class="dnd-rule-panel-title">{panel.title}</h3>
      <div class="dnd-rule-panel-body dnd-rule-panel-{panel.layout}">
        {#each panel.fields as field (field.source + field.id)}
          {@const entry = getEntry($rules.resolved, field)}
          {#if entry}
            <div class="dnd-rule-panel-entry primary-border">
              <span class="dnd-rule-panel-value">{entry.value}</span>
              <span class="dnd-rule-panel-label">{entry.title}</span>
              {#if entry.note}<span class="dnd-rule-panel-note">{entry.note}</span>{/if}
            </div>
          {/if}
        {/each}
      </div>
    </section>
  {/each}
{/if}

<style>
  .dnd-rule-panel {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-3);
    background-color: var(--color-content-dark);
  }

  .dnd-rule-panel-title {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--color-primary-main);
  }

  .dnd-rule-panel-body {
    display: grid;
    gap: var(--space-2);
  }

  .dnd-rule-panel-grid {
    grid-template-columns: repeat(auto-fit, minmax(72px, 1fr));
  }

  .dnd-rule-panel-row {
    grid-auto-flow: column;
    grid-auto-columns: minmax(72px, 1fr);
  }

  .dnd-rule-panel-list {
    grid-template-columns: 1fr;
  }

  .dnd-rule-panel-entry {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-1);
    padding: var(--space-2);
    background-color: var(--color-content-main);
  }

  .dnd-rule-panel-value {
    font-size: var(--text-lg);
    font-weight: 700;
    color: var(--color-content-text);
  }

  .dnd-rule-panel-label {
    font-size: var(--text-xs);
    color: var(--color-content-text);
    text-align: center;
  }

  .dnd-rule-panel-note {
    font-size: var(--text-xs);
    color: var(--color-secondary-text);
  }

  .dnd-rule-panels-error {
    padding: var(--space-3);
    border-radius: var(--radius-md);
    background: color-mix(in srgb, var(--color-danger) 20%, transparent);
    color: var(--color-content-text);
    font-size: var(--text-sm);
  }
</style>
