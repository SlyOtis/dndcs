<script lang="ts">
  import type { Snippet } from 'svelte'
  import { rollAttack } from '$lib/engine'
  import { rollFormula } from '$lib/chat'
  import {
    getComponentPanel,
    getConditionSet,
    getCore,
    getDamage,
    getHpSet,
    getRepair,
    getState
  } from '$lib/rules/vehicle'
  import type { ComponentState, Condition, Crewman, Placed, Tone, VehicleContext } from '$lib/rules/vehicle.types'
  import Button from '$components/ui/Button.svelte'
  import Field from '$components/ui/Field.svelte'
  import Fold from '$components/ui/Fold.svelte'

  const {
    ctx,
    component,
    crewman,
    editable = false,
    onstate,
    actions
  }: {
    /** The vessel the component is installed on, with its states and rulings. */
    ctx: VehicleContext
    /** The installed component being read. */
    component: Placed
    /** The character whose abilities and perks fill in to hit and damage, when one is aboard. */
    crewman: Crewman | null
    /** Lets the reader change hit points and the condition. */
    editable?: boolean
    /** Runs with the component's next state once a change has been applied. */
    onstate?: (id: string, state: ComponentState) => void
    /** Controls placed at the end of the header. */
    actions?: Snippet
  } = $props()

  const CONDITIONS: { id: Condition | 'destroyed'; label: string }[] = [
    { id: 'functional', label: 'Functional' },
    { id: 'impaired', label: 'Impaired' },
    { id: 'broken', label: 'Broken' },
    { id: 'destroyed', label: 'Destroyed' }
  ]

  let entry = $state('')
  let bypass = $state(false)
  let message = $state('')
  let details = $state(false)

  const panel = $derived(getComponentPanel(ctx, component, crewman))
  const held = $derived(getState(ctx, component))
  const max = $derived(getCore(ctx.system, component.def).hp)
  const condition = $derived<Condition | 'destroyed'>(held.destroyed ? 'destroyed' : held.condition)
  const tone = $derived<Tone>(condition === 'functional' ? 'good' : condition === 'impaired' ? 'warn' : 'bad')
  const core = $derived(panel.core.filter((row) => row.label !== 'HP' && row.label !== 'Condition'))
  const modes = $derived(panel.sections.flatMap((section) => (section.kind === 'modes' ? section.modes : [])))
  const fieldId = $derived(`hp-${component.id}`)

  let seen = ''

  $effect(() => {
    if (component.id === seen) return
    seen = component.id
    message = ''
    entry = ''
  })

  function apply() {
    const text = entry.trim()
    if (!text) return
    const amount = Number(text.replace(/^[+-]/, ''))
    if (!Number.isFinite(amount)) {
      message = 'Write a number: 35 sets, -15 deals damage, +10 repairs.'
      return
    }
    const { system, rulings } = ctx
    const result = text.startsWith('-')
      ? getDamage(system, component.def, held, amount, bypass)
      : text.startsWith('+')
        ? getRepair(system, component.def, held, amount, rulings)
        : getHpSet(system, component.def, held, amount, rulings)
    message = result.message
    entry = ''
    if (!result.ignored) onstate?.(component.id, result.state)
  }

  function setCondition(next: string) {
    const result = getConditionSet(held, next as Condition | 'destroyed')
    message = result.message
    onstate?.(component.id, result.state)
  }

  function rollHit(name: string, bonus: number) {
    void rollAttack(`${panel.title} ${name}`, bonus)
  }

  function rollDamage(dice: string) {
    void rollFormula(dice)
  }
</script>

<article class="vc" aria-label={panel.title}>
  <header class="vc-head">
    <div class="vc-names">
      <h2 class="dnd-heading vc-title">{panel.title}</h2>
      <p class="vc-sub">{panel.subtitle}</p>
    </div>
    {#if actions}
      <div class="vc-acts">{@render actions()}</div>
    {/if}
  </header>

  <section class="vc-life dnd-inset" aria-label="Hit points and condition">
    <div class="vc-hp">
      <span class="dnd-label">HP</span>
      <span class="vc-figure vc-tone-{tone}">{held.hp}</span>
      <span class="vc-of">/ {max}</span>
    </div>
    {#if editable}
      <select
        class="vc-condition vc-tone-{tone}"
        aria-label="Condition"
        value={condition}
        onchange={(event) => setCondition(event.currentTarget.value)}
      >
        {#each CONDITIONS as option (option.id)}
          <option value={option.id}>{option.label}</option>
        {/each}
      </select>
    {:else}
      <span class="vc-condition-read vc-tone-{tone}">{CONDITIONS.find((option) => option.id === condition)?.label}</span>
    {/if}
  </section>

  {#if editable}
    <div class="vc-entry">
      <Field id={fieldId} label="Hit points" help="35 sets · -15 deals damage · +10 repairs">
        <input
          id={fieldId}
          type="text"
          inputmode="numeric"
          autocomplete="off"
          placeholder="-15"
          bind:value={entry}
          onkeydown={(event) => event.key === 'Enter' && apply()}
        />
        {#snippet action()}
          <Button variant="secondary" size="sm" disabled={!entry.trim()} onclick={apply}>Apply</Button>
        {/snippet}
      </Field>
      <label class="vc-bypass">
        <input type="checkbox" bind:checked={bypass} />
        <span>Damage bypasses DT</span>
      </label>
    </div>
  {/if}

  {#if message}
    <p class="vc-message" role="status">{message}</p>
  {/if}

  {#if core.length}
    <dl class="vc-core">
      {#each core as row (row.label)}
        <div class="vc-core-cell">
          <dt class="dnd-label">{row.label}</dt>
          <dd class="vc-core-value">{row.value}</dd>
        </div>
      {/each}
    </dl>
  {/if}

  {#if panel.quick.length}
    <dl class="dnd-facts vc-quick">
      {#each panel.quick as row (row.label)}
        <dt class="vc-tone-{row.tone ?? 'default'}">{row.label}</dt>
        <dd>{row.value}</dd>
      {/each}
    </dl>
  {/if}

  {#if modes.length}
    <ul class="vc-modes">
      {#each modes as mode (mode.key)}
        <li class="vc-mode" class:vc-mode-off={mode.unavailable}>
          <div class="vc-mode-line">
            <span class="vc-mode-name">{mode.name}</span>
            {#if mode.unavailable}
              <span class="vc-tone-bad">Broken</span>
            {:else if mode.toHit}
              <span class="vc-mode-hit">{mode.toHit}{#if mode.ability && mode.kind !== 'melee'}<small>{mode.ability}</small>{/if}</span>
            {/if}
          </div>
          <div class="vc-mode-line vc-mode-small">
            <span class="vc-mode-damage">{mode.damageShort}</span>
            {#if mode.ranges.some((range) => range.value !== '—')}
              <span title="Close / normal / long range in feet">{mode.ranges.map((range) => range.value).join(' / ')} ft</span>
            {/if}
          </div>
          {#if mode.tags.length}
            <p class="vc-mode-tags">{mode.tags.join(' · ')}</p>
          {/if}
          {#if mode.pendingRuling}
            <p class="vc-pending">Ruling pending: {mode.pendingRuling}</p>
          {/if}
          {#if !mode.unavailable}
            <div class="vc-mode-acts">
              {#if mode.bonus != null}
                <Button variant="secondary" size="sm" onclick={() => rollHit(mode.name, mode.bonus ?? 0)}>Roll to hit</Button>
              {/if}
              {#if mode.damageDice}
                <Button variant="ghost" size="sm" onclick={() => rollDamage(mode.damageDice ?? '')}>Roll damage</Button>
              {/if}
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}

  {#each panel.warnings as warning (warning)}
    <p class="vc-warning">{warning}</p>
  {/each}

  <Fold title="Details and rules" variant="row" open={details} ontoggle={() => (details = !details)}>
    <div class="vc-details">
      {#each panel.sections as section (section.title)}
        <section class="vc-section" aria-label={section.title}>
          <h3 class="dnd-label vc-section-title">{section.title}</h3>
          {#if section.kind === 'stats'}
            <dl class="dnd-facts">
              {#each section.rows as row (row.label)}
                <dt>{row.label}</dt>
                <dd class="vc-tone-{row.tone ?? 'default'}">
                  {row.value}{#if row.detail}<span class="vc-detail"> · {row.detail}</span>{/if}{#if row.pendingRuling}<span class="vc-pending"> · ruling pending</span>{/if}
                </dd>
              {/each}
            </dl>
          {:else if section.kind === 'text'}
            {#each section.items as item, index (index)}
              <p class="vc-text vc-tone-{item.tone ?? 'default'}">
                {#if item.title}<strong>{item.title}.</strong>{/if}
                {item.body}
              </p>
            {/each}
          {:else if section.kind === 'perks'}
            {#each section.perks as perk (perk.name)}
              <p class="vc-text"><strong>{perk.name}{perk.count > 1 ? ` ×${perk.count}` : ''}.</strong> {perk.summary}</p>
            {/each}
          {:else if section.kind === 'modes'}
            {#each section.modes as mode (mode.key)}
              <div class="vc-formula">
                <p class="vc-text"><strong>{mode.name}.</strong> {mode.formula}</p>
                <p class="vc-text vc-detail">{mode.damage}</p>
                {#each [...mode.properties, ...mode.notes] as note (note)}
                  <p class="vc-text vc-detail">{note}</p>
                {/each}
              </div>
            {/each}
          {/if}
        </section>
      {/each}
    </div>
  </Fold>
</article>

<style>
  .vc {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    min-width: 0;
  }

  .vc-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
    min-width: 0;
  }

  .vc-names {
    min-width: 0;
  }

  .vc-title {
    margin: 0;
    font-size: var(--text-lg);
    overflow-wrap: anywhere;
  }

  .vc-sub {
    margin: var(--space-1) 0 0;
    font-size: var(--text-xs);
    color: var(--ink-dim);
  }

  .vc-acts {
    display: flex;
    flex: none;
    gap: var(--space-2);
    block-size: var(--space-6);
  }

  .vc-life {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
  }

  .vc-hp {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
  }

  .vc-figure {
    font-family: var(--font-figures);
    font-size: var(--text-xl);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .vc-of {
    font-family: var(--font-figures);
    color: var(--ink-dim);
  }

  .vc-condition {
    padding: var(--space-1) var(--space-2);
    border: var(--border-hair) solid var(--metal-dim);
    border-radius: var(--radius-sm);
    background: var(--ground-deep);
    font-family: var(--font-display);
    font-size: var(--text-sm);
    letter-spacing: var(--tracking-wide);
    cursor: pointer;
  }

  .vc-condition-read {
    font-family: var(--font-display);
    letter-spacing: var(--tracking-wide);
  }

  .vc-entry {
    display: grid;
    gap: var(--space-2);
  }

  .vc-bypass {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--ink-dim);
    cursor: pointer;
  }

  .vc-message {
    margin: 0;
    font-size: var(--text-sm);
    font-style: italic;
    color: var(--ink-dim);
  }

  .vc-core {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--space-2);
    margin: 0;
  }

  .vc-core-cell {
    display: grid;
    justify-items: center;
    gap: var(--space-1);
    padding: var(--space-2) var(--space-1);
    border-radius: var(--radius-sm);
    background: var(--texture-noise), linear-gradient(180deg, var(--ground-raised), var(--ground-deep));
    box-shadow: var(--rim-thin);
  }

  .vc-core-value {
    margin: 0;
    font-family: var(--font-figures);
    font-weight: 700;
    color: var(--ink);
  }

  .vc-quick {
    font-size: var(--text-sm);
  }

  .vc-modes {
    display: grid;
    gap: var(--space-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .vc-mode {
    display: grid;
    gap: var(--space-1);
    padding: var(--space-3);
    border-radius: var(--radius-md);
    background: var(--texture-noise), linear-gradient(180deg, var(--ground-raised), var(--ground-deep));
    box-shadow: var(--rim-thin), inset 0 0 16px 2px var(--shade-hard);
  }

  .vc-mode-off {
    opacity: 0.55;
  }

  .vc-mode-line {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-2);
  }

  .vc-mode-name {
    font-family: var(--font-display);
    letter-spacing: var(--tracking-wide);
    color: var(--metal-bright);
  }

  .vc-mode-hit {
    font-family: var(--font-figures);
    font-size: var(--text-lg);
    font-weight: 700;
    color: var(--ink);
    text-shadow: var(--glow-text);
  }

  .vc-mode-hit small {
    margin-inline-start: var(--space-1);
    font-family: var(--font-display);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-caps);
    color: var(--metal);
  }

  .vc-mode-small {
    font-size: var(--text-sm);
    color: var(--ink-dim);
  }

  .vc-mode-damage {
    color: var(--ember-core);
  }

  .vc-mode-tags {
    margin: 0;
    font-size: var(--text-xs);
    color: var(--ink-faint);
  }

  .vc-mode-acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-top: var(--space-1);
  }

  .vc-pending {
    margin: 0;
    font-size: var(--text-xs);
    color: var(--state-warn);
  }

  .vc-warning {
    margin: 0;
    padding: var(--space-2) var(--space-3);
    border-inline-start: var(--border-width) solid var(--state-warn);
    font-size: var(--text-sm);
    color: var(--ink-dim);
  }

  .vc-details {
    display: grid;
    gap: var(--space-4);
    padding-block: var(--space-3);
  }

  .vc-section {
    display: grid;
    gap: var(--space-2);
  }

  .vc-section-title {
    margin: 0;
    color: var(--metal-bright);
  }

  .vc-text {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--ink);
  }

  .vc-formula {
    display: grid;
    gap: var(--space-1);
  }

  .vc-detail {
    color: var(--ink-faint);
  }

  .vc-tone-good {
    color: var(--state-good);
  }

  .vc-tone-warn {
    color: var(--state-warn);
  }

  .vc-tone-bad {
    color: var(--state-bad);
  }
</style>
