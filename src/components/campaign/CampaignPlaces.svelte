<script lang="ts">
  import { campaignService } from '$lib/firestore.service'
  import type { CampaignLocation, CampaignMap, CampaignNpc, MapMarkerKind } from '$lib/firestore.types'
  import Button from '$components/ui/Button.svelte'
  import Field from '$components/ui/Field.svelte'
  import MapIcon from './MapIcon.svelte'

  const {
    campaignId,
    isDm = false,
    locations = [],
    npcs = [],
    maps = [],
    onChange
  }: {
    /** Campaign the places belong to. */
    campaignId: string
    /** Grants writing. Players read the ones they have found. */
    isDm?: boolean
    /** Every place the campaign has recorded. */
    locations?: CampaignLocation[]
    /** Cast, used to show who is found here. */
    npcs?: CampaignNpc[]
    /** Maps, used to pin a place to one. */
    maps?: CampaignMap[]
    /** Runs after any write so the page reloads its records. */
    onChange?: () => void
  } = $props()

  const KINDS: MapMarkerKind[] = [
    'region', 'city', 'town', 'keep', 'dungeon', 'inn',
    'temple', 'npc', 'quest', 'danger', 'treasure', 'note'
  ]

  let error = $state<string | null>(null)

  const shown = $derived(isDm ? locations : locations.filter((place) => place.is_known))

  async function run(work: Promise<unknown>) {
    error = null
    try {
      await work
      onChange?.()
    } catch (reason) {
      error = reason instanceof Error ? reason.message : String(reason)
    }
  }

  function residents(placeId: string): CampaignNpc[] {
    return npcs.filter((npc) => npc.location_id === placeId && (isDm || npc.is_known))
  }

  function nameMap(id?: string): string {
    return maps.find((map) => map.id === id)?.title ?? 'No map'
  }
</script>

<section class="dnd-places primary-border">
  {#if error}<p class="dnd-places-error">{error}</p>{/if}

  <div class="dnd-places-head">
    <h2>Places</h2>
    {#if isDm}<Button onclick={() => run(campaignService.postLocation(campaignId, {}))}>Add a place</Button>{/if}
  </div>

  {#if shown.length === 0}
    <p class="dnd-places-note">Nowhere has been charted yet.</p>
  {:else}
    <ul class="dnd-places-list">
      {#each shown as place (place.id)}
        <li class="dnd-places-card">
          <span class="dnd-places-glyph"><MapIcon kind={place.kind} size={20} /></span>

          <div class="dnd-places-body">
            {#if isDm}
              <Field label="Name" id="place-name-{place.id}">
                <input id="place-name-{place.id}" value={place.name} onchange={(e) => run(campaignService.putLocation(campaignId, place.id, { name: e.currentTarget.value }))} />
              </Field>
              <Field label="What the party knows" id="place-body-{place.id}">
                <textarea id="place-body-{place.id}" rows="3" value={place.description} onchange={(e) => run(campaignService.putLocation(campaignId, place.id, { description: e.currentTarget.value }))}></textarea>
              </Field>
              <div class="dnd-places-row">
                <Field label="Kind" id="place-kind-{place.id}">
                  <select id="place-kind-{place.id}" value={place.kind} onchange={(e) => run(campaignService.putLocation(campaignId, place.id, { kind: e.currentTarget.value as MapMarkerKind }))}>
                    {#each KINDS as kind}<option value={kind}>{kind}</option>{/each}
                  </select>
                </Field>
                <Field label="On map" id="place-map-{place.id}" help="Pin it from the map tab to fix its position.">
                  <select id="place-map-{place.id}" value={place.map_id ?? ''} onchange={(e) => run(campaignService.putLocation(campaignId, place.id, { map_id: e.currentTarget.value || undefined }))}>
                    <option value="">No map</option>
                    {#each maps as map}<option value={map.id}>{map.title}</option>{/each}
                  </select>
                </Field>
              </div>
              <div class="dnd-places-row">
                <Button variant={place.is_known ? 'secondary' : 'primary'} onclick={() => run(campaignService.putLocation(campaignId, place.id, { is_known: !place.is_known }))}>
                  {place.is_known ? 'Found by the party' : 'Reveal to the party'}
                </Button>
                <Button variant="danger" onclick={() => run(campaignService.deleteLocation(campaignId, place.id))}>Remove</Button>
              </div>
            {:else}
              <h3>{place.name}</h3>
              <p class="dnd-places-note">{place.kind} · {nameMap(place.map_id)}</p>
              <p>{place.description}</p>
            {/if}

            {#if residents(place.id).length > 0}
              <p class="dnd-places-note">Found here: {residents(place.id).map((npc) => npc.name).join(', ')}</p>
            {/if}
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .dnd-places {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-4);
    border-radius: var(--radius-lg);
    background: var(--color-content-dark);
  }

  .dnd-places-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .dnd-places h2 {
    margin: 0;
    font-size: var(--text-lg);
    color: var(--color-primary-main);
  }

  .dnd-places-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .dnd-places-card {
    display: flex;
    gap: var(--space-3);
    padding: var(--space-3);
    border: var(--border-width) solid var(--color-content-light);
    border-radius: var(--radius-md);
  }

  .dnd-places-glyph {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    border: var(--border-width) solid var(--color-primary-main);
    color: var(--color-primary-main);
  }

  .dnd-places-body {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    flex: 1;
  }

  .dnd-places-body h3 {
    margin: 0;
    font-size: var(--text-md);
    color: var(--color-content-text);
  }

  .dnd-places-body p {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--color-content-text);
  }

  .dnd-places-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
  }

  .dnd-places-note {
    margin: 0;
    font-size: var(--text-xs);
    color: var(--color-secondary-text);
  }

  .dnd-places-error {
    margin: 0;
    padding: var(--space-3);
    border-radius: var(--radius-md);
    background: color-mix(in srgb, var(--color-danger) 20%, transparent);
    color: var(--color-content-text);
    font-size: var(--text-sm);
  }
</style>
