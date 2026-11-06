<script lang="ts">
  import { rollAttack } from '$lib/engine'
  import { rollFormula } from '$lib/chat'
  import { getPenalty, getPerkSummary, getSigned, getWeaponModes } from '$lib/rules/vehicle'
  import type { Crewman, VehicleContext } from '$lib/rules/vehicle.types'
  import Button from '$components/ui/Button.svelte'
  import Fold from '$components/ui/Fold.svelte'

  const {
    ctx,
    crewman,
    selected = null,
    onselect,
    onperks
  }: {
    /** The vessel whose attacks and actions are listed. */
    ctx: VehicleContext
    /** The character the reader sails as, whose abilities and perks fill the sheet. */
    crewman: Crewman | null
    /** The component chosen on the deck. */
    selected?: string | null
    /** Runs with a component the reader picked from the sheet. */
    onselect?: (id: string) => void
    /** Opens the place where the perks are taken. */
    onperks?: () => void
  } = $props()

  const ABILITIES = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']

  let open = $state<string[]>([])

  const attacks = $derived(
    ctx.components
      .map((component) => {
        const cond = getPenalty(ctx, component)
        const modes = getWeaponModes(ctx, component, crewman, cond)
        const actions = (component.def.stats.actions ?? []).map((action) => {
          const hit = action.text.match(/Hit: \d+ \(([^)]+)\) (\w+)/)
          const bonus = component.def.stats.attackBonus ?? null
          return {
            key: action.name,
            name: action.name,
            toHit: bonus != null ? getSigned(bonus) : null,
            bonus,
            damageShort: hit ? `${hit[1]} ${hit[2]}` : '',
            damageDice: hit ? hit[1].replace(/\s+/g, '') : null,
            ranges: [] as { label: string; value: string }[],
            unavailable: cond === 'broken'
          }
        })
        return { component, cond, modes: [...modes, ...actions] }
      })
      .filter((entry) => entry.modes.length > 0)
  )

  const perks = $derived(
    (crewman?.perks ?? []).flatMap((entry) => {
      const perk = ctx.system.perks.find((candidate) => candidate.id === entry.id)
      return perk ? [{ perk, count: entry.count, tree: ctx.system.perkTrees.findIndex((tree) => tree.key === perk.tree) }] : []
    })
  )
  const used = $derived((crewman?.perks ?? []).reduce((sum, entry) => sum + entry.count, 0))

  function toggle(id: string) {
    open = open.includes(id) ? open.filter((entry) => entry !== id) : [...open, id]
  }
</script>

<div class="ds">
  <dl class="ds-abilities" aria-label="Ability modifiers">
    {#each ABILITIES as ability (ability)}
      <div class="ds-ability">
        <dt>{ability.slice(0, 3).toUpperCase()}</dt>
        <dd>{crewman ? getSigned(crewman.modifiers[ability] ?? 0) : '—'}</dd>
      </div>
    {/each}
  </dl>


  <section class="ds-part" aria-label={ctx.system.crew.perks}>
    <div class="ds-line">
      <h3 class="dnd-label ds-head">{ctx.system.crew.perks}{crewman ? ` ${used}/${crewman.crewLevel}` : ''}</h3>
      {#if onperks}
        <Button variant="secondary" size="sm" onclick={onperks}>Perks</Button>
      {/if}
    </div>
    {#if !crewman}
      <p class="ds-quiet">Choose who you sail as to see their perks.</p>
    {:else}
      {#each perks as { perk, count, tree } (perk.id)}
        <Fold title="{perk.name}{count > 1 ? ` ×${count}` : ''}" variant="row" open={open.includes(perk.id)} ontoggle={() => toggle(perk.id)}>
          <div class="ds-perk-body">
            <p class="ds-perk-meta"><span class="ds-tree ds-tree-{tree % 4}"></span>{ctx.system.perkTrees[tree]?.name ?? perk.tree} · {perk.actionType}{perk.range ? ` · ${perk.range}` : ''}{perk.duration ? ` · ${perk.duration}` : ''}</p>
            <p class="ds-text">{perk.description}</p>
            {#if perk.additional}<p class="ds-quiet">{perk.additional}</p>{/if}
          </div>
        </Fold>
        {#if !open.includes(perk.id)}
          <p class="ds-summary"><span class="ds-tree ds-tree-{tree % 4}"></span>{perk.actionType} · {getPerkSummary(perk, count, crewman)}</p>
        {/if}
      {:else}
        <p class="ds-quiet">No perks taken yet.</p>
      {/each}
    {/if}
  </section>

  <section class="ds-part" aria-label="Attacks and actions">
    <h3 class="dnd-label ds-head">Attacks and actions</h3>
    {#each attacks as { component, cond, modes } (component.id)}
      {@const shown = component.id === selected || open.includes(component.id)}
      <div class="ds-weapon" class:ds-weapon-on={component.id === selected} class:ds-weapon-off={cond === 'broken'}>
        <button
          type="button"
          class="ds-weapon-name"
          aria-expanded={shown}
          onclick={() => {
            toggle(component.id)
            onselect?.(component.id)
          }}
        >
          <span>{component.label ?? component.def.name}</span>
          <small class="ds-cond-{cond}">{component.slot ?? ''}{cond !== 'functional' ? ` · ${cond}` : ''}</small>
        </button>
        {#if !shown}
          <p class="ds-brief">
            {modes.map((mode) => `${mode.name.replace(/ Shot$/, '')} ${mode.unavailable ? '—' : (mode.toHit ?? '')}`).join(' · ')}
          </p>
        {:else}
          {#each modes as mode (mode.key)}
            <div class="ds-mode">
              <span class="ds-mode-name">{mode.name}</span>
              <span class="ds-mode-hit">{mode.unavailable ? '—' : (mode.toHit ?? '')}</span>
              <span class="ds-mode-damage">{mode.damageShort}{mode.ranges.some((range) => range.value !== '—') ? ` · ${mode.ranges.map((range) => range.value).join('/')} ft` : ''}</span>
              {#if !mode.unavailable}
                <span class="ds-mode-acts">
                  {#if mode.bonus != null}
                    <Button variant="ghost" size="sm" title="Roll {mode.name} to hit" onclick={() => void rollAttack(`${component.label ?? component.def.name} ${mode.name}`, mode.bonus ?? 0)}>Hit</Button>
                  {/if}
                  {#if mode.damageDice}
                    <Button variant="ghost" size="sm" title="Roll {mode.name} damage" onclick={() => void rollFormula(mode.damageDice ?? '')}>Dmg</Button>
                  {/if}
                </span>
              {/if}
            </div>
          {/each}
        {/if}
      </div>
    {:else}
      <p class="ds-quiet">No weapon is installed.</p>
    {/each}
  </section>
</div>

<style>
  .ds {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    min-width: 0;
  }

  .ds-abilities {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: var(--space-1);
    margin: 0;
  }

  .ds-ability {
    display: grid;
    justify-items: center;
    padding: var(--space-1) 0;
    border-radius: var(--radius-sm);
    background: var(--ground-deep);
    box-shadow: var(--rim-thin);
  }

  .ds-ability dt {
    font-family: var(--font-display);
    font-size: var(--text-xs);
    letter-spacing: normal;
    color: var(--metal);
  }

  .ds-ability dd {
    margin: 0;
    font-family: var(--font-figures);
    font-weight: 700;
    color: var(--ink);
  }

  .ds-part {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .ds-head {
    margin: 0;
    color: var(--metal-bright);
  }

  .ds-line {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    block-size: var(--space-6);
  }

  .ds-weapon {
    display: grid;
    gap: var(--space-1);
    padding: var(--space-2);
    border-radius: var(--radius-sm);
    background: var(--texture-noise), linear-gradient(180deg, var(--ground-raised), var(--ground-deep));
    box-shadow: var(--rim-thin);
  }

  .ds-weapon-on {
    box-shadow: var(--rim-thin), 0 0 10px var(--ember-glow);
  }

  .ds-weapon-off {
    opacity: 0.55;
  }

  .ds-weapon-name {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-2);
    padding: 0;
    border: none;
    background: none;
    font-family: var(--font-display);
    letter-spacing: var(--tracking-wide);
    color: var(--metal-bright);
    text-align: start;
    cursor: pointer;
  }

  .ds-weapon-name:hover,
  .ds-weapon-name:focus-visible {
    text-shadow: var(--glow-text);
    outline: none;
  }

  .ds-weapon-name small {
    font-family: var(--font-body);
    font-size: var(--text-xs);
    letter-spacing: normal;
    color: var(--ink-faint);
  }

  .ds-brief {
    margin: 0;
    font-family: var(--font-figures);
    font-size: var(--text-xs);
    color: var(--ink-dim);
  }

  .ds-mode {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0 var(--space-2);
    font-size: var(--text-sm);
  }

  .ds-mode-name {
    color: var(--ink);
  }

  .ds-mode-hit {
    font-family: var(--font-figures);
    font-weight: 700;
    color: var(--ink);
    text-align: end;
  }

  .ds-mode-damage {
    font-size: var(--text-xs);
    color: var(--ember-core);
  }

  .ds-mode-acts {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-1);
    block-size: var(--space-5);
  }

  .ds-cond-impaired {
    color: var(--state-warn);
  }

  .ds-cond-broken {
    color: var(--state-bad);
  }

  .ds-perk-body {
    display: grid;
    gap: var(--space-1);
    padding-block: var(--space-2);
  }

  .ds-perk-meta,
  .ds-summary {
    display: flex;
    align-items: baseline;
    gap: var(--space-1);
    margin: 0;
    font-size: var(--text-xs);
    color: var(--ink-dim);
  }

  .ds-summary {
    margin-block-start: calc(var(--space-1) * -1);
    padding-inline-start: var(--space-2);
  }

  .ds-tree {
    flex: none;
    inline-size: var(--space-2);
    block-size: var(--space-2);
    border-radius: var(--radius-pill);
    background: var(--metal);
  }

  .ds-tree-0 {
    background: var(--ember);
  }

  .ds-tree-1 {
    background: var(--state-good);
  }

  .ds-tree-2 {
    background: var(--metal);
  }

  .ds-tree-3 {
    background: var(--verdigris);
  }

  .ds-text {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--ink);
  }

  .ds-quiet {
    margin: 0;
    font-size: var(--text-sm);
    font-style: italic;
    color: var(--ink-faint);
  }
</style>
