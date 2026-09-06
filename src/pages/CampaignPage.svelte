<script lang="ts">
  import { onDestroy, onMount, setContext } from 'svelte'
  import { navigate } from 'sly-svelte-location-router'
  import { getTheme, setTheme } from '$lib/dialogs/theme'
  import { campaignService } from '$lib/firestore.service'
  import type {
    Campaign,
    CampaignLocation,
    CampaignMap,
    CampaignNpc,
    CampaignQuest,
    CampaignSession,
    CharacterDocument
  } from '$lib/firestore.types'
  import { user } from '$lib/stores/auth.store'
  import { anyDialogOpen, uiStore } from '$lib/stores/ui.store'
  import { joinSwarm } from '$lib/swarm'
  import Button from '$components/ui/Button.svelte'
  import Card from '$components/ui/Card.svelte'
  import CampaignMaps from '$components/campaign/CampaignMaps.svelte'
  import CampaignStory from '$components/campaign/CampaignStory.svelte'
  import CampaignCast from '$components/campaign/CampaignCast.svelte'
  import CampaignPlaces from '$components/campaign/CampaignPlaces.svelte'
  import Ornament from '$components/ui/Ornament.svelte'
  import Panel from '$components/ui/Panel.svelte'
  import Shell from '$components/ui/Shell.svelte'
  import MenuPanel from '$components/MenuPanel.svelte'
  import Chat from '$chat/Chat.svelte'

  const { route }: { route?: { params?: Record<string, string> } } = $props()

  setContext('dialogState', {
    get isAnyDialogOpen() {
      return $anyDialogOpen
    },
    setDialogState: uiStore.setDialogState
  })

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'story', label: 'Story' },
    { id: 'cast', label: 'Cast' },
    { id: 'places', label: 'Places' },
    { id: 'party', label: 'Party' },
    { id: 'maps', label: 'Maps' }
  ] as const

  let campaign = $state<Campaign | null>(null)
  let characters = $state<CharacterDocument[]>([])
  let maps = $state<CampaignMap[]>([])
  let sessions = $state<CampaignSession[]>([])
  let quests = $state<CampaignQuest[]>([])
  let npcs = $state<CampaignNpc[]>([])
  let places = $state<CampaignLocation[]>([])
  let loading = $state(true)
  let error = $state<string | null>(null)
  let tab = $state<(typeof TABS)[number]['id']>('overview')

  const campaignId = $derived(route?.params?.id ?? '')
  const isDm = $derived(Boolean(campaign && $user && campaign.dm_id === $user.uid))

  const averageLevel = $derived(
    characters.length === 0
      ? 0
      : Math.round(characters.reduce((sum, entry) => sum + entry.metadata.level, 0) / characters.length)
  )
  const pins = $derived(maps.reduce((sum, entry) => sum + entry.markers.length, 0))
  const revealed = $derived(maps.filter((entry) => entry.is_visible).length)
  const latest = $derived(sessions[0] ?? null)
  const openQuests = $derived(quests.filter((quest) => quest.state === 'active' && (isDm || quest.is_known)))
  const knownNpcs = $derived(npcs.filter((npc) => isDm || npc.is_known))
  const knownPlaces = $derived(places.filter((place) => isDm || place.is_known))

  let leaveSwarm: (() => void) | null = null

  onMount(async () => {
    setTheme(getTheme())

    if (!campaignId) {
      error = 'No campaign was named in the address.'
      loading = false
      return
    }

    try {
      campaign = await campaignService.getCampaign(campaignId)
      if (!campaign) {
        error = 'That campaign does not exist, or you are not part of it.'
        return
      }
      await reload()
    } catch (reason) {
      error = reason instanceof Error ? reason.message : String(reason)
    } finally {
      loading = false
    }

    try {
      leaveSwarm = joinSwarm(campaignId)
    } catch {
      leaveSwarm = null
    }
  })

  onDestroy(() => leaveSwarm?.())

  async function reload() {
    const [party, board, log, tasks, cast, world] = await Promise.all([
      campaignService.getCampaignCharacters(campaignId),
      campaignService.getMaps(campaignId),
      campaignService.getSessions(campaignId),
      campaignService.getQuests(campaignId),
      campaignService.getNpcs(campaignId),
      campaignService.getLocations(campaignId)
    ])

    characters = party
    maps = board
    sessions = log
    quests = tasks
    npcs = cast
    places = world
  }
</script>

<Shell title={campaign?.name ?? 'Campaign'} back={() => navigate('/main')}>
  {#snippet nav()}
    {#if campaign}
      {#each TABS as entry (entry.id)}
        <Button
          variant={tab === entry.id ? 'primary' : 'ghost'}
          size="sm"
          onclick={() => (tab = entry.id)}
        >
          {entry.label}
        </Button>
      {/each}
    {/if}
  {/snippet}

  {#snippet menu()}
    <MenuPanel />
  {/snippet}

  {#snippet chat()}
    <Chat />
  {/snippet}

  {#if loading}
    <div class="dnd-loading"><span class="dnd-spinner"></span></div>
  {:else if error}
    <div class="camp-alarm" role="alert">
      <p class="camp-alarm-text">{error}</p>
      <Button variant="secondary" size="sm" onclick={() => navigate('/main')}>Back to the table</Button>
    </div>
  {:else if campaign}
    <header class="camp-crown">
      <span class="camp-crest">
        <span class="camp-plate dnd-shield"></span>
        <Ornament name="crest" size="md" tone="metal" />
      </span>
      <h1 class="dnd-heading dnd-heading-hero camp-name">{campaign.name}</h1>
      <span class="camp-rule"><Ornament name="divider" tone="metal" /></span>
      <p class="camp-lede">{campaign.description}</p>
      <div class="camp-meta">
        <span>{campaign.player_ids.length} players</span>
        <span>{characters.length} characters</span>
        <span>{campaign.settings.experience_mode} experience</span>
        <span>{campaign.is_active ? 'Active' : 'Closed'}</span>
        {#if isDm}<span class="camp-meta-dm">You are the DM</span>{/if}
      </div>
    </header>

    {#if tab === 'overview'}
      <div class="camp-outline">
        <Panel title="The party">
          {#if characters.length === 0}
            <p class="camp-note">No character has joined yet.</p>
          {:else}
            <ul class="camp-tally">
              {#each characters.slice(0, 5) as entry (entry.id)}
                <li><span>{entry.metadata.name}</span><span>{entry.metadata.class} {entry.metadata.level}</span></li>
              {/each}
            </ul>
            <p class="camp-note">Average level {averageLevel}.</p>
          {/if}
        </Panel>

        <Panel title="The world">
          {#if maps.length === 0}
            <p class="camp-note">No map has been drawn yet.</p>
          {:else}
            <ul class="camp-tally">
              {#each maps.slice(0, 5) as entry (entry.id)}
                <li><span>{entry.title}</span><span>{entry.markers.length} pins</span></li>
              {/each}
            </ul>
            <p class="camp-note">{revealed} of {maps.length} shared with the party.</p>
          {/if}
        </Panel>

        <Panel title="The story">
          {#if sessions.length === 0 && openQuests.length === 0}
            <p class="camp-note">Nothing has been written down yet.</p>
          {:else}
            {#if latest}
              <p class="camp-lead">{latest.number}. {latest.title}</p>
              <p class="camp-summary">{latest.summary || 'Nothing was written down.'}</p>
            {/if}
            <ul class="camp-tally">
              {#each openQuests.slice(0, 4) as quest (quest.id)}
                <li><span>{quest.title}</span><span>{quest.state}</span></li>
              {/each}
            </ul>
            <p class="camp-note">{sessions.length} sessions played, {openQuests.length} quests open.</p>
          {/if}
        </Panel>

        <Panel title="Met along the way">
          {#if knownNpcs.length === 0}
            <p class="camp-note">Nobody has been met yet.</p>
          {:else}
            <ul class="camp-tally">
              {#each knownNpcs.slice(0, 5) as npc (npc.id)}
                <li><span>{npc.name}</span><span>{npc.role || npc.disposition}</span></li>
              {/each}
            </ul>
            <p class="camp-note">{knownNpcs.length} of {npcs.length} known, {knownPlaces.length} places found.</p>
          {/if}
        </Panel>

        <Panel title="House rules">
          <dl class="camp-facts">
            <dt>Experience</dt>
            <dd>{campaign.settings.experience_mode}</dd>
            <dt>Character editing</dt>
            <dd>{campaign.settings.allow_character_editing ? 'Players may edit' : 'Locked to the DM'}</dd>
            <dt>Sheet sharing</dt>
            <dd>{campaign.settings.share_character_sheets ? 'Shared with the party' : 'Private'}</dd>
            <dt>Private notes</dt>
            <dd>{campaign.settings.private_notes ? 'On' : 'Off'}</dd>
          </dl>
        </Panel>

        <Panel title="At the table">
          <dl class="camp-facts">
            <dt>Players</dt>
            <dd>{campaign.player_ids.length}</dd>
            <dt>Characters</dt>
            <dd>{characters.length}</dd>
            <dt>Maps</dt>
            <dd>{maps.length}</dd>
            <dt>Pins</dt>
            <dd>{pins}</dd>
            <dt>State</dt>
            <dd>{campaign.is_active ? 'Running' : 'Closed'}</dd>
          </dl>
        </Panel>
      </div>
    {:else if tab === 'story'}
      <CampaignStory {campaignId} {isDm} {sessions} {quests} {npcs} {characters} onChange={reload} />
    {:else if tab === 'cast'}
      <CampaignCast {campaignId} {isDm} {npcs} locations={places} onChange={reload} />
    {:else if tab === 'places'}
      <CampaignPlaces {campaignId} {isDm} locations={places} {npcs} {maps} onChange={reload} />
    {:else if tab === 'party'}
      <Panel title="Party">
        {#if characters.length === 0}
          <p class="camp-note">No character has joined this campaign yet.</p>
        {:else}
          <div class="camp-party">
            {#each characters as entry (entry.id)}
              <Card
                title={entry.metadata.name}
                sub="{entry.metadata.race} {entry.metadata.class}"
                image={entry.character?.info?.imageUrl}
                badge="Lv {entry.metadata.level}"
                onclick={() => navigate(`/character/${entry.id}`)}
              />
            {/each}
          </div>
        {/if}
      </Panel>
    {:else}
      <Panel title="Maps" pad="sm">
        <CampaignMaps {campaignId} {isDm} locations={places} {npcs} {quests} />
      </Panel>
    {/if}
  {/if}
</Shell>

<style>
  .camp-crown {
    --camp-rule-run: calc(var(--space-8) * 6);
    --camp-rule-share: 70%;
    --camp-crest-lift: drop-shadow(0 var(--space-1) var(--space-3) var(--shade-hard));
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
    text-align: center;
  }

  .camp-crest {
    position: relative;
    isolation: isolate;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-3) var(--space-6) var(--space-5);
    filter: var(--camp-crest-lift);
  }

  .camp-plate {
    position: absolute;
    inset: 0;
    z-index: -1;
    background: linear-gradient(180deg, var(--ground-lift) 0%, var(--ground-deep) 100%);
    box-shadow: inset 0 0 0 var(--border-hair) var(--metal-edge);
  }

  .camp-name {
    font-size: var(--text-2xl);
    overflow-wrap: anywhere;
  }

  .camp-rule {
    display: block;
    width: min(var(--camp-rule-run), var(--camp-rule-share));
  }

  .camp-lede {
    max-width: 70ch;
    margin: 0;
    color: var(--ink);
  }

  .camp-meta {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-4);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--ink-dim);
  }

  .camp-meta-dm {
    color: var(--metal);
  }

  .camp-outline {
    --camp-column: calc(var(--space-8) * 4);
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(var(--camp-column), 100%), 1fr));
    align-items: start;
    gap: var(--space-4);
    min-width: 0;
  }

  .camp-facts {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--space-2) var(--space-4);
    margin: 0;
    font-size: var(--text-sm);
    color: var(--ink);
  }

  .camp-facts dt {
    color: var(--ink-dim);
  }

  .camp-facts dd {
    margin: 0;
  }

  .camp-tally {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--text-sm);
    color: var(--ink);
  }

  .camp-tally li {
    display: flex;
    justify-content: space-between;
    gap: var(--space-3);
    padding-bottom: var(--space-2);
    border-bottom: var(--border-hair) solid var(--ground-lift);
  }

  .camp-tally li span:last-child {
    color: var(--ink-dim);
  }

  .camp-lead {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-sm);
    color: var(--metal);
  }

  .camp-summary {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--ink);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .camp-party {
    --camp-face: calc(var(--space-8) * 4);
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(var(--camp-face), 100%), 1fr));
    gap: var(--space-3);
    min-width: 0;
  }

  .camp-note {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--ink-dim);
  }

  .camp-alarm {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-4);
    border: var(--border-hair) solid color-mix(in srgb, var(--state-bad) 55%, transparent);
    border-radius: var(--radius-md);
    background: color-mix(in srgb, var(--state-bad) 18%, transparent);
  }

  .camp-alarm-text {
    flex: 1;
    min-width: 0;
    margin: 0;
    font-size: var(--text-sm);
    color: var(--ink);
  }
</style>
