<script lang="ts">
  import { onMount } from 'svelte'
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
  import Background from '$components/Background.svelte'
  import Button from '$components/ui/Button.svelte'
  import CampaignMaps from '$components/campaign/CampaignMaps.svelte'
  import CampaignStory from '$components/campaign/CampaignStory.svelte'
  import CampaignCast from '$components/campaign/CampaignCast.svelte'
  import CampaignPlaces from '$components/campaign/CampaignPlaces.svelte'

  const { route }: { route?: { params?: Record<string, string> } } = $props()

  let campaign = $state<Campaign | null>(null)
  let characters = $state<CharacterDocument[]>([])
  let maps = $state<CampaignMap[]>([])
  let sessions = $state<CampaignSession[]>([])
  let quests = $state<CampaignQuest[]>([])
  let npcs = $state<CampaignNpc[]>([])
  let places = $state<CampaignLocation[]>([])
  let loading = $state(true)
  let error = $state<string | null>(null)
  let tab = $state<'overview' | 'story' | 'cast' | 'places' | 'party' | 'maps'>('overview')

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
  })

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

<Background />

<main class="dnd-campaign">
  {#if loading}
    <p class="dnd-campaign-note">Loading the campaign...</p>
  {:else if error}
    <p class="dnd-campaign-error">{error}</p>
    <Button onclick={() => navigate('/main')}>Back to the table</Button>
  {:else if campaign}
    <header class="dnd-campaign-header primary-border">
      <h1>{campaign.name}</h1>
      <p>{campaign.description}</p>
      <div class="dnd-campaign-meta">
        <span>{campaign.player_ids.length} players</span>
        <span>{characters.length} characters</span>
        <span>{campaign.settings.experience_mode} experience</span>
        <span>{campaign.is_active ? 'Active' : 'Closed'}</span>
        {#if isDm}<span class="dnd-campaign-dm">You are the DM</span>{/if}
      </div>
    </header>

    <nav class="dnd-campaign-tabs">
      <Button variant={tab === 'overview' ? 'primary' : 'secondary'} onclick={() => (tab = 'overview')}>Overview</Button>
      <Button variant={tab === 'story' ? 'primary' : 'secondary'} onclick={() => (tab = 'story')}>Story</Button>
      <Button variant={tab === 'cast' ? 'primary' : 'secondary'} onclick={() => (tab = 'cast')}>Cast</Button>
      <Button variant={tab === 'places' ? 'primary' : 'secondary'} onclick={() => (tab = 'places')}>Places</Button>
      <Button variant={tab === 'party' ? 'primary' : 'secondary'} onclick={() => (tab = 'party')}>Party</Button>
      <Button variant={tab === 'maps' ? 'primary' : 'secondary'} onclick={() => (tab = 'maps')}>Maps</Button>
    </nav>

    {#if tab === 'overview'}
      <div class="dnd-campaign-outline">
        <section class="dnd-campaign-panel primary-border">
          <h2>The party</h2>
          {#if characters.length === 0}
            <p class="dnd-campaign-note">No character has joined yet.</p>
          {:else}
            <ul class="dnd-campaign-tally">
              {#each characters.slice(0, 5) as entry (entry.id)}
                <li><span>{entry.metadata.name}</span><span>{entry.metadata.class} {entry.metadata.level}</span></li>
              {/each}
            </ul>
            <p class="dnd-campaign-note">Average level {averageLevel}.</p>
          {/if}
        </section>

        <section class="dnd-campaign-panel primary-border">
          <h2>The world</h2>
          {#if maps.length === 0}
            <p class="dnd-campaign-note">No map has been drawn yet.</p>
          {:else}
            <ul class="dnd-campaign-tally">
              {#each maps.slice(0, 5) as entry (entry.id)}
                <li><span>{entry.title}</span><span>{entry.markers.length} pins</span></li>
              {/each}
            </ul>
            <p class="dnd-campaign-note">{revealed} of {maps.length} shared with the party.</p>
          {/if}
        </section>

        <section class="dnd-campaign-panel primary-border">
          <h2>The story</h2>
          {#if sessions.length === 0 && openQuests.length === 0}
            <p class="dnd-campaign-note">Nothing has been written down yet.</p>
          {:else}
            {#if latest}
              <p class="dnd-campaign-lead">{latest.number}. {latest.title}</p>
              <p class="dnd-campaign-summary">{latest.summary || 'Nothing was written down.'}</p>
            {/if}
            <ul class="dnd-campaign-tally">
              {#each openQuests.slice(0, 4) as quest (quest.id)}
                <li><span>{quest.title}</span><span>{quest.state}</span></li>
              {/each}
            </ul>
            <p class="dnd-campaign-note">{sessions.length} sessions played, {openQuests.length} quests open.</p>
          {/if}
        </section>

        <section class="dnd-campaign-panel primary-border">
          <h2>Met along the way</h2>
          {#if knownNpcs.length === 0}
            <p class="dnd-campaign-note">Nobody has been met yet.</p>
          {:else}
            <ul class="dnd-campaign-tally">
              {#each knownNpcs.slice(0, 5) as npc (npc.id)}
                <li><span>{npc.name}</span><span>{npc.role || npc.disposition}</span></li>
              {/each}
            </ul>
            <p class="dnd-campaign-note">{knownNpcs.length} of {npcs.length} known, {knownPlaces.length} places found.</p>
          {/if}
        </section>

        <section class="dnd-campaign-panel primary-border">
          <h2>House rules</h2>
          <dl class="dnd-campaign-facts">
            <dt>Experience</dt>
            <dd>{campaign.settings.experience_mode}</dd>
            <dt>Character editing</dt>
            <dd>{campaign.settings.allow_character_editing ? 'Players may edit' : 'Locked to the DM'}</dd>
            <dt>Sheet sharing</dt>
            <dd>{campaign.settings.share_character_sheets ? 'Shared with the party' : 'Private'}</dd>
            <dt>Private notes</dt>
            <dd>{campaign.settings.private_notes ? 'On' : 'Off'}</dd>
          </dl>
        </section>

        <section class="dnd-campaign-panel primary-border">
          <h2>At the table</h2>
          <dl class="dnd-campaign-facts">
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
        </section>
      </div>
    {:else if tab === 'story'}
      <CampaignStory {campaignId} {isDm} {sessions} {quests} {npcs} {characters} onChange={reload} />
    {:else if tab === 'cast'}
      <CampaignCast {campaignId} {isDm} {npcs} locations={places} onChange={reload} />
    {:else if tab === 'places'}
      <CampaignPlaces {campaignId} {isDm} locations={places} {npcs} {maps} onChange={reload} />
    {:else if tab === 'party'}
      <section class="dnd-campaign-panel primary-border">
        <h2>Party</h2>
        {#if characters.length === 0}
          <p class="dnd-campaign-note">No character has joined this campaign yet.</p>
        {:else}
          <ul class="dnd-campaign-party">
            {#each characters as entry (entry.id)}
              <li>
                <Button variant="secondary" fill onclick={() => navigate(`/character/${entry.id}`)}>
                  {entry.metadata.name} — level {entry.metadata.level} {entry.metadata.class}
                </Button>
              </li>
            {/each}
          </ul>
        {/if}
      </section>
    {:else}
      <section class="dnd-campaign-panel primary-border">
        <h2>Maps</h2>
        <CampaignMaps {campaignId} {isDm} locations={places} {npcs} {quests} />
      </section>
    {/if}
  {/if}
</main>

<style>
  .dnd-campaign {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    width: 100%;
    max-width: 1100px;
    margin: 0 auto;
    padding: var(--space-5);
    overflow-y: auto;
  }

  .dnd-campaign-header,
  .dnd-campaign-panel {
    padding: var(--space-4);
    border-radius: var(--radius-lg);
    background: var(--color-content-dark);
  }

  .dnd-campaign-header h1 {
    margin: 0 0 var(--space-2);
    color: var(--color-primary-main);
  }

  .dnd-campaign-header p {
    margin: 0 0 var(--space-3);
    color: var(--color-content-text);
  }

  .dnd-campaign-meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    font-size: var(--text-sm);
    color: var(--color-secondary-text);
  }

  .dnd-campaign-dm {
    color: var(--color-primary-main);
  }

  .dnd-campaign-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .dnd-campaign-panel h2 {
    margin: 0 0 var(--space-3);
    font-size: var(--text-lg);
    color: var(--color-primary-main);
  }

  .dnd-campaign-facts {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--space-2) var(--space-4);
    margin: 0;
    font-size: var(--text-sm);
    color: var(--color-content-text);
  }

  .dnd-campaign-facts dt {
    color: var(--color-secondary-text);
  }

  .dnd-campaign-facts dd {
    margin: 0;
  }

  .dnd-campaign-outline {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: var(--space-4);
  }

  .dnd-campaign-tally {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin: 0 0 var(--space-2);
    padding: 0;
    list-style: none;
    font-size: var(--text-sm);
    color: var(--color-content-text);
  }

  .dnd-campaign-tally li {
    display: flex;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .dnd-campaign-tally li span:last-child {
    color: var(--color-secondary-text);
  }

  .dnd-campaign-lead {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--color-primary-main);
  }

  .dnd-campaign-summary {
    margin: 0 0 var(--space-2);
    font-size: var(--text-sm);
    color: var(--color-content-text);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .dnd-campaign-party {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .dnd-campaign-note,
  .dnd-campaign-error {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--color-secondary-text);
  }

  .dnd-campaign-error {
    padding: var(--space-3);
    border-radius: var(--radius-md);
    background: color-mix(in srgb, var(--color-danger) 20%, transparent);
    color: var(--color-content-text);
  }
</style>
