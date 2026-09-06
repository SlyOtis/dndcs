<script lang="ts">
  import type { Snippet } from 'svelte'
  import { navigate, currentRoute } from 'sly-svelte-location-router'
  import { campaignService } from '$lib/firestore.service'
  import type {
    Campaign,
    CampaignEncounter,
    CampaignLocation,
    CampaignMap,
    CampaignNpc,
    CampaignQuest,
    CharacterDocument,
    EncounterCombatant
  } from '$lib/firestore.types'
  import { user } from '$lib/stores/auth.store'
  import { userCampaigns } from '$lib/stores/campaign.store'
  import Ornament from '$components/ui/Ornament.svelte'

  const { onNavigateToSoundboard }: {
    /** Swaps the drawer over to the soundboard view. */
    onNavigateToSoundboard: () => void
  } = $props()

  let campaign = $state<Campaign | null>(null)
  let characters = $state<CharacterDocument[]>([])
  let quests = $state<CampaignQuest[]>([])
  let npcs = $state<CampaignNpc[]>([])
  let places = $state<CampaignLocation[]>([])
  let maps = $state<CampaignMap[]>([])
  let encounters = $state<CampaignEncounter[]>([])
  let loading = $state(false)
  let error = $state<string | null>(null)
  let open = $state('campaign')

  const campaignId = $derived(
    $currentRoute.path.startsWith('/campaign/')
      ? $currentRoute.params.id ?? ''
      : $userCampaigns[0]?.id ?? ''
  )

  const isDm = $derived(Boolean(campaign && $user && campaign.dm_id === $user.uid))
  const activeQuests = $derived(quests.filter((quest) => quest.state === 'active' && (isDm || quest.is_known)))
  const knownNpcs = $derived(npcs.filter((npc) => isDm || npc.is_known))
  const knownPlaces = $derived(places.filter((place) => isDm || place.is_known))
  const lore = $derived(knownNpcs.length + knownPlaces.length)
  const knownEncounters = $derived(
    encounters
      .filter((entry) => isDm || entry.is_known)
      .sort((a, b) => (b.created_at?.toMillis() ?? 0) - (a.created_at?.toMillis() ?? 0))
  )
  const encounter = $derived(knownEncounters.find((entry) => entry.is_active) ?? knownEncounters[0] ?? null)
  const combatants = $derived(encounter ? [...encounter.combatants].sort((a, b) => b.initiative - a.initiative) : [])
  const turn = $derived(encounter && combatants.length > 0 ? encounter.turn % combatants.length : -1)

  $effect(() => {
    const id = campaignId
    let live = true

    if (!id) {
      campaign = null
      characters = []
      quests = []
      npcs = []
      places = []
      maps = []
      encounters = []
      error = null
      loading = false
      return
    }

    loading = true
    const release = campaignService.postEncountersListener(id, (entries) => {
      if (live) encounters = entries
    })
    error = null

    void (async () => {
      try {
        const [record, party, errands, cast, sites, charts] = await Promise.all([
          campaignService.getCampaign(id),
          campaignService.getCampaignCharacters(id),
          campaignService.getQuests(id),
          campaignService.getNpcs(id),
          campaignService.getLocations(id),
          campaignService.getMaps(id)
        ])
        if (!live) return
        campaign = record
        characters = party
        quests = errands
        npcs = cast
        places = sites
        maps = charts
      } catch (reason) {
        if (!live) return
        error = reason instanceof Error ? reason.message : String(reason)
      } finally {
        if (live) loading = false
      }
    })()

    return () => {
      live = false
      release()
    }
  })

  function toggle(id: string) {
    open = open === id ? '' : id
  }

  function openCampaign() {
    if (campaign) navigate(`/campaign/${campaign.id}`)
  }

  function openCharacter(characterId: string) {
    navigate(`/character/${characterId}`)
  }

  function openCombatant(combatant: EncounterCombatant) {
    if (combatant.character_id) openCharacter(combatant.character_id)
    else openCampaign()
  }

  function hitPoints(combatant: EncounterCombatant) {
    return isDm || combatant.is_hit_points_known ? `${combatant.hit_points}/${combatant.max_hit_points}` : 'Hidden'
  }
</script>

<nav class="dnd-menu" aria-label="Campaign navigator">
  <header class="dnd-menu-head">
    <span class="dnd-menu-crest" aria-hidden="true"><Ornament name="tracery" size="xs" tone="metal" /></span>
    <p class="dnd-label dnd-menu-eyebrow">Navigator</p>
    {#if campaign}
      <button type="button" class="dnd-menu-name" onclick={openCampaign}>{campaign.name}</button>
    {:else}
      <p class="dnd-menu-name dnd-menu-name-void">No campaign in scope</p>
    {/if}
    <span class="dnd-menu-rule" aria-hidden="true"><Ornament name="divider" size="sm" tone="metal" /></span>
  </header>

  <div class="dnd-scroll dnd-menu-body">
    {#if error}
      <p class="dnd-menu-note" role="alert">{error}</p>
    {/if}

    {@render section('campaign', 'Campaign details', activeQuests.length, details)}
    {@render section('encounter', 'Encounter tracker', combatants.length, tracker)}
    {@render section('lore', 'Lore', lore, chronicle)}
    {@render section('resources', 'Resources', maps.length, resources)}
  </div>

  <footer class="dnd-menu-foot">
    {#if loading}
      <p class="dnd-menu-foot-line">Reading the archive</p>
    {:else if campaign}
      <p class="dnd-menu-foot-line">{isDm ? 'Dungeon Master. Unrevealed lore is shown.' : 'Player. Revealed lore only.'}</p>
    {:else}
      <p class="dnd-menu-foot-line">Open a campaign to fill the navigator.</p>
    {/if}
  </footer>
</nav>

{#snippet section(id: string, title: string, count: number, body: Snippet)}
  <section class="dnd-menu-section" class:dnd-menu-section-open={open === id}>
    <button type="button" class="dnd-menu-band" aria-expanded={open === id} onclick={() => toggle(id)}>
      <span class="dnd-menu-caret" aria-hidden="true">›</span>
      <span class="dnd-menu-band-title">{title}</span>
      <span class="dnd-menu-band-count">{count}</span>
    </button>

    {#if open === id}
      <div class="dnd-menu-section-body">{@render body()}</div>
    {/if}
  </section>
{/snippet}

{#snippet details()}
  {#if !campaign}
    <p class="dnd-menu-empty">No campaign is in scope.</p>
  {:else}
    <dl class="dnd-menu-facts">
      <div class="dnd-menu-fact">
        <dt>Players</dt>
        <dd>{campaign.player_ids.length}</dd>
      </div>
      <div class="dnd-menu-fact">
        <dt>Heroes</dt>
        <dd>{characters.length}</dd>
      </div>
      <div class="dnd-menu-fact">
        <dt>Quests</dt>
        <dd>{activeQuests.length}</dd>
      </div>
    </dl>

    {#if campaign.description}
      <p class="dnd-menu-lede">{campaign.description}</p>
    {/if}

    <p class="dnd-menu-title">Party</p>
    {#if characters.length === 0}
      <p class="dnd-menu-empty">No hero has joined yet.</p>
    {:else}
      <ul class="dnd-scroll dnd-menu-list">
        {#each characters as entry (entry.id)}
          <li class="dnd-menu-item">
            <button type="button" class="dnd-menu-row" onclick={() => openCharacter(entry.id)}>
              <span class="dnd-menu-row-mark" aria-hidden="true">◆</span>
              <span class="dnd-menu-row-name">{entry.metadata.name}</span>
              <span class="dnd-menu-row-meta">{entry.metadata.level} {entry.metadata.class}</span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}

    <p class="dnd-menu-title">Active quests</p>
    {#if activeQuests.length === 0}
      <p class="dnd-menu-empty">No quest is open.</p>
    {:else}
      <ul class="dnd-scroll dnd-menu-list">
        {#each activeQuests as quest (quest.id)}
          <li class="dnd-menu-item">
            <button type="button" class="dnd-menu-row" onclick={openCampaign}>
              <span class="dnd-menu-row-mark" aria-hidden="true">✦</span>
              <span class="dnd-menu-row-name">{quest.title}</span>
              <span class="dnd-menu-row-meta">{quest.level ? `Lv ${quest.level}` : 'Open'}</span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
{/snippet}

{#snippet tracker()}
  {#if !campaign}
    <p class="dnd-menu-empty">No campaign is in scope.</p>
  {:else if !encounter}
    <p class="dnd-menu-empty">No encounter is under way.</p>
  {:else}
    <dl class="dnd-menu-facts">
      <div class="dnd-menu-fact">
        <dt>Round</dt>
        <dd>{encounter.round}</dd>
      </div>
      <div class="dnd-menu-fact">
        <dt>Turn</dt>
        <dd>{turn + 1}</dd>
      </div>
      <div class="dnd-menu-fact">
        <dt>Foes</dt>
        <dd>{combatants.filter((entry) => entry.kind === 'npc').length}</dd>
      </div>
    </dl>

    <p class="dnd-menu-title">{encounter.title}</p>
    {#if combatants.length === 0}
      <p class="dnd-menu-empty">No combatant has rolled yet.</p>
    {:else}
      <ul class="dnd-scroll dnd-menu-list">
        {#each combatants as combatant, index (combatant.id)}
          <li class="dnd-menu-item">
            <button
              type="button"
              class="dnd-menu-row"
              class:dnd-menu-row-turn={index === turn}
              aria-current={index === turn ? 'true' : undefined}
              onclick={() => openCombatant(combatant)}
            >
              <span class="dnd-menu-row-mark" aria-hidden="true">{combatant.initiative}</span>
              <span class="dnd-menu-row-name">
                {combatant.name}
                {#if combatant.conditions.length > 0}
                  <em class="dnd-menu-row-state">{combatant.conditions.join(', ')}</em>
                {/if}
              </span>
              <span class="dnd-menu-row-meta">{hitPoints(combatant)}</span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
{/snippet}

{#snippet chronicle()}
  {#if !campaign}
    <p class="dnd-menu-empty">No campaign is in scope.</p>
  {:else}
    <p class="dnd-menu-title">Known faces</p>
    {#if knownNpcs.length === 0}
      <p class="dnd-menu-empty">No face has been revealed.</p>
    {:else}
      <ul class="dnd-scroll dnd-menu-list">
        {#each knownNpcs as npc (npc.id)}
          <li class="dnd-menu-item">
            <button type="button" class="dnd-menu-row" onclick={openCampaign}>
              <span class="dnd-menu-row-mark" aria-hidden="true">☗</span>
              <span class="dnd-menu-row-name">{npc.name}</span>
              <span class="dnd-menu-row-meta">{npc.role || npc.disposition}</span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}

    <p class="dnd-menu-title">Known places</p>
    {#if knownPlaces.length === 0}
      <p class="dnd-menu-empty">No place has been revealed.</p>
    {:else}
      <ul class="dnd-scroll dnd-menu-list">
        {#each knownPlaces as place (place.id)}
          <li class="dnd-menu-item">
            <button type="button" class="dnd-menu-row" onclick={openCampaign}>
              <span class="dnd-menu-row-mark" aria-hidden="true">⌂</span>
              <span class="dnd-menu-row-name">{place.name}</span>
              <span class="dnd-menu-row-meta">{place.kind}</span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
{/snippet}

{#snippet resources()}
  <p class="dnd-menu-title">Maps</p>
  {#if maps.length === 0}
    <p class="dnd-menu-empty">No map has been drawn.</p>
  {:else}
    <ul class="dnd-scroll dnd-menu-list">
      {#each maps as chart (chart.id)}
        <li class="dnd-menu-item">
          <button type="button" class="dnd-menu-row" onclick={openCampaign}>
            <span class="dnd-menu-row-mark" aria-hidden="true">✧</span>
            <span class="dnd-menu-row-name">{chart.title}</span>
            <span class="dnd-menu-row-meta">{chart.is_visible ? `${chart.markers.length} pins` : 'Hidden'}</span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}

  <p class="dnd-menu-title">Table</p>
  <ul class="dnd-menu-list">
    <li class="dnd-menu-item">
      <button type="button" class="dnd-menu-row" onclick={onNavigateToSoundboard}>
        <span class="dnd-menu-row-mark" aria-hidden="true">♪</span>
        <span class="dnd-menu-row-name">Soundboard</span>
        <span class="dnd-menu-row-meta">Open</span>
      </button>
    </li>
  </ul>
{/snippet}

<style>
  .dnd-menu {
    --menu-row: 2.6rem;
    --menu-rows: 5;
    --menu-gap: var(--space-3);
    --menu-pad: var(--space-4);
    --menu-cusp: 9px;
    --menu-line: var(--metal-dim);
    --menu-line-strong: var(--metal);
    --menu-surface: var(--ground-raised);
    --menu-surface-lift: var(--ground-lift);
    --menu-surface-sunk: var(--ground-deep);
    --menu-text: var(--ink);
    --menu-text-muted: var(--ink-dim);
    --menu-text-faint: var(--ink-faint);
    --menu-accent: var(--metal-bright);
    --menu-radius: var(--radius-md);

    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    height: 100%;
    gap: var(--menu-gap);
    padding: var(--menu-pad);
    overflow: hidden;
    color: var(--menu-text);
  }

  .dnd-menu-head {
    display: grid;
    justify-items: center;
    gap: var(--space-1);
    text-align: center;
  }

  .dnd-menu-crest {
    display: block;
    opacity: 0.8;
  }

  .dnd-menu-eyebrow {
    margin: 0;
  }

  .dnd-menu-name {
    display: block;
    width: 100%;
    margin: 0;
    padding: var(--space-1) var(--space-2);
    border: none;
    background: none;
    color: var(--menu-accent);
    font-family: var(--font-display);
    font-size: var(--text-lg);
    font-weight: 600;
    letter-spacing: var(--tracking-wide);
    line-height: 1.2;
    text-shadow: 0 1px 0 var(--shade-hard);
    cursor: pointer;
  }

  .dnd-menu-name:hover {
    filter: brightness(1.12);
    text-shadow: var(--glow-metal);
  }

  .dnd-menu-name-void {
    color: var(--menu-text-faint);
    cursor: default;
  }

  .dnd-menu-rule {
    display: block;
    width: 100%;
  }

  .dnd-menu-body {
    display: flex;
    flex-direction: column;
    gap: var(--menu-gap);
    min-height: 0;
    padding-inline-end: var(--space-1);
  }

  .dnd-menu-section {
    display: grid;
    gap: var(--space-2);
  }

  .dnd-menu-band {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--space-2);
    width: 100%;
    min-height: var(--menu-row);
    padding: 0 var(--space-3);
    background: linear-gradient(180deg, var(--menu-surface-lift) 0%, var(--menu-surface) 100%);
    border: var(--border-hair) solid var(--menu-line);
    border-radius: 0;
    clip-path: polygon(
      var(--menu-cusp) 0,
      calc(100% - var(--menu-cusp)) 0,
      100% 50%,
      calc(100% - var(--menu-cusp)) 100%,
      var(--menu-cusp) 100%,
      0 50%
    );
    color: var(--menu-accent);
    font-family: var(--font-display);
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
    text-align: start;
    cursor: pointer;
    transition: filter 0.15s ease;
  }

  .dnd-menu-band:hover {
    filter: brightness(1.15) drop-shadow(0 0 8px var(--ember-glow));
  }

  .dnd-menu-section-open .dnd-menu-band {
    border-color: var(--menu-line-strong);
    color: var(--menu-accent);
  }

  .dnd-menu-caret {
    display: inline-block;
    color: var(--menu-line-strong);
    transition: transform 0.15s ease;
  }

  .dnd-menu-section-open .dnd-menu-caret {
    transform: rotate(90deg);
  }

  .dnd-menu-band-title {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .dnd-menu-band-count {
    color: var(--menu-text-muted);
    font-size: var(--text-xs);
    font-weight: 400;
    letter-spacing: var(--tracking-wide);
  }

  .dnd-menu-section-body {
    display: grid;
    gap: var(--space-2);
    padding: var(--space-3);
    background: linear-gradient(180deg, var(--menu-surface) 0%, var(--menu-surface-sunk) 100%);
    border: var(--border-hair) solid var(--menu-line);
    border-radius: var(--menu-radius);
    box-shadow: inset 0 1px 0 var(--metal-edge);
  }

  .dnd-menu-facts {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-2);
    margin: 0;
  }

  .dnd-menu-fact {
    display: grid;
    justify-items: center;
    gap: var(--space-1);
    padding: var(--space-2) var(--space-1);
    background: linear-gradient(180deg, var(--menu-surface-lift) 0%, var(--menu-surface) 100%);
    border: var(--border-hair) solid var(--menu-line);
    border-radius: var(--radius-sm);
  }

  .dnd-menu-fact dt {
    color: var(--menu-text-muted);
    font-family: var(--font-display);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
  }

  .dnd-menu-fact dd {
    margin: 0;
    color: var(--menu-accent);
    font-family: var(--font-display);
    font-size: var(--text-md);
    font-weight: 700;
    line-height: 1;
  }

  .dnd-menu-lede {
    margin: 0;
    color: var(--menu-text-muted);
    font-size: var(--text-sm);
    line-height: 1.45;
  }

  .dnd-menu-title {
    margin: 0;
    color: var(--menu-line-strong);
    font-family: var(--font-display);
    font-size: var(--text-xs);
    font-weight: 600;
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
  }

  .dnd-menu-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    max-height: calc(var(--menu-row) * var(--menu-rows));
    margin: 0;
    padding: 0;
    overflow-y: auto;
    list-style: none;
    scroll-snap-type: y proximity;
  }

  .dnd-menu-item {
    display: flex;
    min-height: var(--menu-row);
    scroll-snap-align: start;
  }

  .dnd-menu-row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--space-3);
    flex: 1;
    min-height: var(--menu-row);
    padding: 0 var(--space-3);
    background: linear-gradient(90deg, var(--menu-surface-lift) 0%, var(--menu-surface) 100%);
    border: var(--border-hair) solid transparent;
    border-inline-start: var(--border-width) solid var(--menu-line);
    border-radius: var(--radius-sm);
    color: var(--menu-text);
    font-family: var(--font-body);
    font-size: var(--text-sm);
    text-align: start;
    cursor: pointer;
    transition: border-color 0.15s ease, filter 0.15s ease;
  }

  .dnd-menu-row:hover {
    border-color: var(--menu-line);
    border-inline-start-color: var(--menu-line-strong);
    filter: brightness(1.18);
  }

  .dnd-menu-row-mark {
    color: var(--menu-line-strong);
    font-size: var(--text-xs);
  }

  .dnd-menu-row-turn {
    border-color: var(--menu-line);
    border-inline-start-color: var(--menu-accent);
    box-shadow: inset 0 0 0 1px var(--metal-edge);
    filter: brightness(1.12);
  }

  .dnd-menu-row-turn .dnd-menu-row-mark {
    color: var(--menu-accent);
  }

  .dnd-menu-row-state {
    color: var(--menu-text-faint);
    font-size: var(--text-xs);
    font-style: italic;
  }

  .dnd-menu-row-name {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .dnd-menu-row-meta {
    color: var(--menu-text-muted);
    font-family: var(--font-display);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wide);
    white-space: nowrap;
  }

  .dnd-menu-empty {
    margin: 0;
    color: var(--menu-text-faint);
    font-size: var(--text-sm);
    font-style: italic;
  }

  .dnd-menu-note {
    margin: 0;
    padding: var(--space-3);
    background: linear-gradient(180deg, var(--menu-surface-sunk) 0%, var(--menu-surface) 100%);
    border-inline-start: var(--border-width) solid var(--menu-line);
    border-radius: var(--radius-sm);
    color: var(--menu-text-muted);
    font-size: var(--text-sm);
    line-height: 1.45;
  }

  .dnd-menu-foot {
    padding-top: var(--space-2);
    border-top: var(--border-hair) solid var(--menu-line);
  }

  .dnd-menu-foot-line {
    margin: 0;
    color: var(--menu-text-faint);
    font-family: var(--font-display);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wide);
    text-align: center;
  }
</style>
