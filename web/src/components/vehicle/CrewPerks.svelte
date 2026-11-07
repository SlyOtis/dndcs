<script lang="ts">
  import { getPerkBlock, getPerkIssues, getPerkLevel, getPerkLimit, getPerkSummary, getRepeatLabel } from '$lib/rules/vehicle'
  import type { Crewman, CrewPerk, Perk, Rulings, VehicleSystem } from '$lib/rules/vehicle.types'
  import Button from '$components/ui/Button.svelte'
  import Field from '$components/ui/Field.svelte'
  import Fold from '$components/ui/Fold.svelte'
  import IconBtn from '$components/ui/IconBtn.svelte'
  import Glyph from '$components/ui/Glyph.svelte'

  const {
    system,
    crewman,
    rulings,
    editable = false,
    onsave
  }: {
    /** The vehicle system whose perks are taken. */
    system: VehicleSystem
    /** The character as crew: abilities, proficiency, crew level and perks. */
    crewman: Crewman
    /** The table's rulings, which move some perk limits. */
    rulings: Rulings
    /** Lets the reader change the crew level and the perks. */
    editable?: boolean
    /** Writes the crew level and the perks to the character. */
    onsave?: (level: number, perks: CrewPerk[]) => Promise<void>
  } = $props()

  let busy = $state(false)
  let error = $state<string | null>(null)
  let open = $state<string[]>([])
  let search = $state('')

  const taken = $derived(
    crewman.perks.flatMap((entry) => {
      const perk = system.perks.find((candidate) => candidate.id === entry.id)
      return perk ? [{ perk, count: entry.count }] : []
    })
  )
  const used = $derived(crewman.perks.reduce((sum, entry) => sum + entry.count, 0))
  const issues = $derived(getPerkIssues(system, crewman, rulings))
  const trees = $derived(
    system.perkTrees.map((tree) => ({
      tree,
      perks: system.perks.filter(
        (perk) => perk.tree === tree.key && (!search || `${perk.name} ${perk.description}`.toLowerCase().includes(search.toLowerCase()))
      )
    }))
  )

  async function write(level: number, perks: CrewPerk[]) {
    if (!onsave) return
    busy = true
    error = null
    try {
      await onsave(level, perks)
    } catch (reason) {
      error = reason instanceof Error ? reason.message : String(reason)
    } finally {
      busy = false
    }
  }

  function add(perk: Perk) {
    const next = crewman.perks.some((entry) => entry.id === perk.id)
      ? crewman.perks.map((entry) => (entry.id === perk.id ? { ...entry, count: entry.count + 1 } : entry))
      : [...crewman.perks, { id: perk.id, count: 1 }]
    void write(crewman.crewLevel, next)
  }

  function drop(id: string) {
    const next = crewman.perks.flatMap((entry) => (entry.id !== id ? [entry] : entry.count > 1 ? [{ ...entry, count: entry.count - 1 }] : []))
    void write(crewman.crewLevel, next)
  }

  function level(value: number) {
    if (!Number.isFinite(value)) return
    void write(Math.max(0, Math.min(20, Math.round(value))), crewman.perks)
  }

  function toggle(key: string) {
    open = open.includes(key) ? open.filter((entry) => entry !== key) : [...open, key]
  }

  const fieldId = $derived(`crew-level-${crewman.id}`)
</script>

<section class="cp" aria-label="{system.crew.perks} of {crewman.name}">
  <div class="cp-head">
    {#if editable}
      <Field id={fieldId} label={system.crew.level} help="One perk per {system.crew.level}">
        <input id={fieldId} type="number" min="0" max="20" value={crewman.crewLevel} disabled={busy} onchange={(event) => level(event.currentTarget.valueAsNumber)} />
      </Field>
    {:else}
      <p class="cp-level"><span class="dnd-label">{system.crew.level}</span> <strong>{crewman.crewLevel}</strong></p>
    {/if}
    <p class="cp-budget">{used} of {crewman.crewLevel} perks taken · PB +{crewman.proficiency}</p>
  </div>

  {#if error}
    <p class="cp-bad" role="alert">{error}</p>
  {/if}
  {#each issues as issue (issue.message)}
    <p class="cp-bad">{issue.message}</p>
  {/each}

  {#if taken.length === 0}
    <p class="cp-note">No {system.crew.perks} taken yet.</p>
  {:else}
    <ul class="cp-taken">
      {#each taken as { perk, count } (perk.id)}
        <li class="cp-perk">
          <div class="cp-perk-line">
            <span class="cp-perk-name">{perk.name}{count > 1 ? ` ×${count}` : ''}</span>
            {#if editable}
              <IconBtn title="Take {perk.name} out once" disabled={busy} onclick={() => drop(perk.id)}>
                <Glyph name="minus" size="sm" />
              </IconBtn>
            {/if}
          </div>
          <p class="cp-summary">{getPerkSummary(perk, count, crewman)}</p>
        </li>
      {/each}
    </ul>
  {/if}

  {#if editable}
    <Field id="cp-search" label="Find a perk">
      <input id="cp-search" type="search" placeholder="Artillery, repair, helm…" bind:value={search} />
    </Field>
    {#each trees as { tree, perks } (tree.key)}
      <Fold title={tree.name} count={perks.length} variant="row" open={open.includes(tree.key) || Boolean(search)} ontoggle={() => toggle(tree.key)}>
        <p class="cp-note">{tree.blurb} {tree.abilities}.</p>
        <ul class="cp-list">
          {#each perks as perk (perk.id)}
            {@const blocked = getPerkBlock(system, crewman, perk, rulings)}
            <li class="cp-perk">
              <div class="cp-perk-line">
                <span class="cp-perk-name">{perk.name}</span>
                <span class="cp-perk-meta">Lv {getPerkLevel(system, perk, rulings)} · {getRepeatLabel(perk)} ({getPerkLimit(system, perk, crewman.proficiency, rulings)}) · {perk.actionType}</span>
              </div>
              <p class="cp-text">{perk.description}</p>
              {#if perk.additional}<p class="cp-note">{perk.additional}</p>{/if}
              <div class="cp-perk-line">
                <span class="cp-why">{blocked ?? ''}</span>
                <Button variant="secondary" size="sm" disabled={busy || Boolean(blocked)} title={blocked ?? `Take ${perk.name}`} onclick={() => add(perk)}>Take</Button>
              </div>
            </li>
          {/each}
        </ul>
      </Fold>
    {/each}
  {/if}
</section>

<style>
  .cp {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    min-width: 0;
  }

  .cp-head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .cp-level {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
    margin: 0;
  }

  .cp-level strong {
    font-family: var(--font-figures);
    font-size: var(--text-xl);
  }

  .cp-budget {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--ink-dim);
  }

  .cp-taken,
  .cp-list {
    display: grid;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .cp-perk {
    display: grid;
    gap: var(--space-1);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-sm);
    background: var(--texture-noise), linear-gradient(180deg, var(--ground-raised), var(--ground-deep));
    box-shadow: var(--rim-thin);
  }

  .cp-perk-line {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    min-block-size: var(--space-5);
  }

  .cp-perk-name {
    font-family: var(--font-display);
    letter-spacing: var(--tracking-wide);
    color: var(--metal-bright);
  }

  .cp-perk-meta {
    font-size: var(--text-xs);
    color: var(--ink-faint);
    text-align: end;
  }

  .cp-summary {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--ember-core);
  }

  .cp-text {
    margin: 0;
    font-size: var(--text-sm);
  }

  .cp-note {
    margin: 0;
    font-size: var(--text-sm);
    font-style: italic;
    color: var(--ink-faint);
  }

  .cp-why {
    font-size: var(--text-xs);
    color: var(--state-warn);
  }

  .cp-bad {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--state-bad);
  }
</style>
