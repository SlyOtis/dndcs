<script lang="ts">
  import { onDestroy, untrack } from 'svelte'
  import { campaignService } from '$lib/firestore.service'
  import type {
    CampaignLocation,
    CampaignMap,
    CampaignNpc,
    CampaignQuest,
    CampaignRecordKind,
    MapLayer,
    MapMarker,
    MapMarkerKind
  } from '$lib/firestore.types'
  import { postFile } from '$lib/storage.service'
  import Button from '$components/ui/Button.svelte'
  import Field from '$components/ui/Field.svelte'
  import MapCanvas from './MapCanvas.svelte'
  import MapIcon from './MapIcon.svelte'

  const {
    campaignId,
    isDm = false,
    locations = [],
    npcs = [],
    quests = []
  }: {
    /** Campaign the maps belong to. */
    campaignId: string
    /** Grants uploading, placing, revealing and deleting. Players get a read only view. */
    isDm?: boolean
    /** Places a pin can stand for. */
    locations?: CampaignLocation[]
    /** People a pin can stand for. */
    npcs?: CampaignNpc[]
    /** Quests a pin can stand for. */
    quests?: CampaignQuest[]
  } = $props()

  const KINDS: MapMarkerKind[] = [
    'region', 'city', 'town', 'keep', 'dungeon', 'inn',
    'temple', 'npc', 'quest', 'danger', 'treasure', 'note'
  ]

  let maps = $state<CampaignMap[]>([])
  let selectedId = $state<string | null>(null)
  let error = $state<string | null>(null)
  let busy = $state(false)
  let placing = $state<MapMarkerKind | null>(null)
  let editing = $state<string | null>(null)
  let title = $state('')

  const visible = $derived(isDm ? maps : maps.filter((map) => map.is_visible))
  const selected = $derived(visible.find((map) => map.id === selectedId) ?? visible[0] ?? null)
  const marker = $derived(selected?.markers.find((entry) => entry.id === editing) ?? null)

  const stop = campaignService.postMapsListener(untrack(() => campaignId), (loaded) => {
    maps = loaded.sort((a, b) => a.title.localeCompare(b.title))
  })

  onDestroy(stop)

  function report(reason: unknown) {
    error = reason instanceof Error ? reason.message : String(reason)
  }

  async function addMap(event: Event) {
    const input = event.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    busy = true
    error = null
    try {
      const url = await postFile(file, { kind: 'campaignMap', campaignId })
      selectedId = await campaignService.postMap(campaignId, {
        title: title.trim() || file.name.replace(/\.[^.]+$/, ''),
        image_url: url
      })
      title = ''
    } catch (reason) {
      report(reason)
    } finally {
      busy = false
      input.value = ''
    }
  }

  async function addLayer(event: Event) {
    const input = event.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    if (!file || !selected) return

    busy = true
    error = null
    try {
      const url = await postFile(file, { kind: 'campaignMap', campaignId })
      const previous = selected.layers[selected.layers.length - 1]
      const layer: MapLayer = {
        id: `${Date.now()}`,
        title: file.name.replace(/\.[^.]+$/, ''),
        image_url: url,
        min_zoom: previous ? Math.min(previous.max_zoom, selected.max_zoom) : Math.round(selected.max_zoom / 2),
        max_zoom: selected.max_zoom
      }
      await campaignService.putMap(campaignId, selected.id, { layers: [...selected.layers, layer] })
    } catch (reason) {
      report(reason)
    } finally {
      busy = false
      input.value = ''
    }
  }

  async function putLayer(layerId: string, updates: Partial<MapLayer>) {
    if (!selected) return
    const next = selected.layers.map((entry) => (entry.id === layerId ? { ...entry, ...updates } : entry))
    await campaignService.putMap(campaignId, selected.id, { layers: next }).catch(report)
  }

  async function deleteLayer(layerId: string) {
    if (!selected) return
    const next = selected.layers.filter((entry) => entry.id !== layerId)
    await campaignService.putMap(campaignId, selected.id, { layers: next }).catch(report)
  }

  async function place(x: number, y: number) {
    if (!selected || !placing) return

    const pin: MapMarker = {
      id: `${Date.now()}`,
      title: `New ${placing}`,
      kind: placing,
      x,
      y,
      is_visible: false,
      min_zoom: selected.min_zoom,
      max_zoom: selected.max_zoom
    }

    placing = null
    editing = pin.id
    await campaignService.putMap(campaignId, selected.id, { markers: [...selected.markers, pin] }).catch(report)
  }

  async function putMarker(markerId: string, updates: Partial<MapMarker>) {
    if (!selected) return
    const next = selected.markers.map((entry) => (entry.id === markerId ? { ...entry, ...updates } : entry))
    await campaignService.putMap(campaignId, selected.id, { markers: next }).catch(report)
  }

  async function deleteMarker(markerId: string) {
    if (!selected) return
    if (editing === markerId) editing = null
    const next = selected.markers.filter((entry) => entry.id !== markerId)
    await campaignService.putMap(campaignId, selected.id, { markers: next }).catch(report)
  }

  function follow(pin: MapMarker) {
    if (pin.link_map_id && visible.some((map) => map.id === pin.link_map_id)) {
      selectedId = pin.link_map_id
      editing = null
      return
    }
    if (isDm) editing = pin.id
  }
</script>

<section class="dnd-maps">
  {#if error}
    <p class="dnd-maps-error">{error}</p>
  {/if}

  {#if visible.length === 0}
    <p class="dnd-maps-note">No map has been shared yet.</p>
  {:else}
    <div class="dnd-maps-tabs">
      {#each visible as map (map.id)}
        <Button
          variant={map.id === selected?.id ? 'primary' : 'secondary'}
          onclick={() => { selectedId = map.id; editing = null }}
        >
          {map.title}{#if isDm && !map.is_visible}<span class="dnd-maps-flag"> hidden</span>{/if}
        </Button>
      {/each}
    </div>
  {/if}

  {#if selected}
    <MapCanvas
      map={selected}
      canEdit={isDm}
      {placing}
      onPlace={place}
      onSelect={follow}
    />

    {#if isDm}
      <div class="dnd-maps-kinds">
        {#each KINDS as kind}
          <button
            type="button"
            class="dnd-maps-kind"
            class:dnd-maps-kind-active={placing === kind}
            onclick={() => (placing = placing === kind ? null : kind)}
          >
            <MapIcon {kind} size={16} />
            {kind}
          </button>
        {/each}
      </div>

      {#if placing}
        <p class="dnd-maps-note">Click the map to drop a {placing} pin at the current zoom.</p>
      {/if}

      {#if marker}
        <div class="dnd-maps-editor dnd-panel dnd-keyline">
          <h4>{marker.title}</h4>
          <Field label="Title" id="pin-title">
            <input id="pin-title" value={marker.title} onchange={(e) => putMarker(marker.id, { title: e.currentTarget.value })} />
          </Field>
          <Field label="Description" id="pin-description">
            <textarea id="pin-description" rows="2" value={marker.description ?? ''} onchange={(e) => putMarker(marker.id, { description: e.currentTarget.value })}></textarea>
          </Field>
          <Field label="Icon" id="pin-kind">
            <select id="pin-kind" value={marker.kind} onchange={(e) => putMarker(marker.id, { kind: e.currentTarget.value as MapMarkerKind })}>
              {#each KINDS as kind}<option value={kind}>{kind}</option>{/each}
            </select>
          </Field>
          <div class="dnd-maps-pair">
            <Field label="Appears from zoom" id="pin-min">
              <input id="pin-min" type="number" step="0.1" min={selected.min_zoom} max={selected.max_zoom} value={marker.min_zoom} onchange={(e) => putMarker(marker.id, { min_zoom: Number(e.currentTarget.value) })} />
            </Field>
            <Field label="Disappears past zoom" id="pin-max">
              <input id="pin-max" type="number" step="0.1" min={selected.min_zoom} max={selected.max_zoom} value={marker.max_zoom} onchange={(e) => putMarker(marker.id, { max_zoom: Number(e.currentTarget.value) })} />
            </Field>
          </div>
          <Field label="Opens map" id="pin-link" help="Clicking the pin jumps to this map.">
            <select id="pin-link" value={marker.link_map_id ?? ''} onchange={(e) => putMarker(marker.id, { link_map_id: e.currentTarget.value || undefined })}>
              <option value="">None</option>
              {#each maps.filter((entry) => entry.id !== selected.id) as entry}<option value={entry.id}>{entry.title}</option>{/each}
            </select>
          </Field>
          <Field label="Stands for" id="pin-record" help="Points the pin at a place, a person or a quest so the text lives in one record.">
            <select
              id="pin-record"
              value={marker.record_kind && marker.record_id ? `${marker.record_kind}:${marker.record_id}` : ''}
              onchange={(e) => {
                const [kind, id] = e.currentTarget.value.split(':')
                putMarker(marker.id, {
                  record_kind: id ? (kind as CampaignRecordKind) : undefined,
                  record_id: id || undefined
                })
              }}
            >
              <option value="">Nothing</option>
              {#each locations as place}<option value="location:{place.id}">Place — {place.name}</option>{/each}
              {#each npcs as npc}<option value="npc:{npc.id}">Person — {npc.name}</option>{/each}
              {#each quests as quest}<option value="quest:{quest.id}">Quest — {quest.title}</option>{/each}
            </select>
          </Field>
          <div class="dnd-maps-row">
            <Button variant={marker.is_visible ? 'secondary' : 'primary'} onclick={() => putMarker(marker.id, { is_visible: !marker.is_visible })}>
              {marker.is_visible ? 'Revealed' : 'Reveal to players'}
            </Button>
            <Button variant="ghost" onclick={() => (editing = null)}>Close</Button>
            <Button variant="danger" onclick={() => deleteMarker(marker.id)}>Remove pin</Button>
          </div>
        </div>
      {/if}

      <div class="dnd-maps-panel dnd-panel dnd-keyline">
        <h4>Detail layers</h4>
        <p class="dnd-maps-note">A layer replaces the picture once the zoom passes its threshold.</p>
        {#each selected.layers as entry (entry.id)}
          <div class="dnd-maps-row">
            <input class="dnd-maps-input" value={entry.title} onchange={(e) => putLayer(entry.id, { title: e.currentTarget.value })} />
            <label class="dnd-maps-inline">from <input class="dnd-maps-number" type="number" step="0.1" value={entry.min_zoom} onchange={(e) => putLayer(entry.id, { min_zoom: Number(e.currentTarget.value) })} /></label>
            <label class="dnd-maps-inline">to <input class="dnd-maps-number" type="number" step="0.1" value={entry.max_zoom} onchange={(e) => putLayer(entry.id, { max_zoom: Number(e.currentTarget.value) })} /></label>
            <Button variant="danger" onclick={() => deleteLayer(entry.id)}>Remove</Button>
          </div>
        {/each}
        <label class="dnd-maps-upload">
          <span>Add a detail layer</span>
          <input type="file" accept="image/*" disabled={busy} onchange={addLayer} />
        </label>
      </div>

      <div class="dnd-maps-row">
        <Button
          variant={selected.is_visible ? 'secondary' : 'primary'}
          onclick={() => campaignService.putMap(campaignId, selected.id, { is_visible: !selected.is_visible }).catch(report)}
        >
          {selected.is_visible ? 'Hide map from players' : 'Reveal map to players'}
        </Button>
        <Button variant="danger" onclick={() => campaignService.deleteMap(campaignId, selected.id).catch(report)}>
          Delete map
        </Button>
      </div>
    {/if}
  {/if}

  {#if isDm}
    <div class="dnd-maps-panel dnd-panel dnd-keyline">
      <h4>Add a map</h4>
      <Field label="Title" id="map-title" help="Left blank, the file name is used.">
        <input id="map-title" bind:value={title} placeholder="The Sword Coast" />
      </Field>
      <label class="dnd-maps-upload">
        <span>{busy ? 'Uploading...' : 'Choose an image'}</span>
        <input type="file" accept="image/*" disabled={busy} onchange={addMap} />
      </label>
    </div>
  {/if}
</section>

<style>
  .dnd-maps {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .dnd-maps-tabs,
  .dnd-maps-kinds,
  .dnd-maps-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
  }

  .dnd-maps-kind {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-2);
    border: var(--border-width) solid var(--ground-lift);
    border-radius: var(--radius-md);
    background: var(--ground-raised);
    color: var(--ink);
    font-family: inherit;
    font-size: var(--text-xs);
    cursor: pointer;
  }

  .dnd-maps-kind-active {
    border-color: var(--metal);
    color: var(--metal);
  }

  .dnd-maps-kind:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  .dnd-maps-panel,
  .dnd-maps-editor {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-4);
    border-radius: var(--radius-lg);
    background: var(--ground);
  }

  .dnd-maps-panel h4,
  .dnd-maps-editor h4 {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--metal);
  }

  .dnd-maps-pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);
  }

  .dnd-maps-input,
  .dnd-maps-number {
    padding: var(--space-2);
    background: var(--ground-raised);
    border: var(--border-width) solid var(--ground-lift);
    border-radius: var(--radius-md);
    color: var(--ink);
    font-family: inherit;
    font-size: var(--text-sm);
  }

  .dnd-maps-input {
    flex: 1;
  }

  .dnd-maps-number {
    width: 72px;
  }

  .dnd-maps-inline {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--text-xs);
    color: var(--ink-dim);
  }

  .dnd-maps-upload {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--ink);
  }

  .dnd-maps-upload input {
    font-family: inherit;
    font-size: var(--text-sm);
    color: var(--ink-dim);
  }

  .dnd-maps-flag,
  .dnd-maps-note {
    font-size: var(--text-xs);
    color: var(--ink-dim);
  }

  .dnd-maps-note {
    margin: 0;
    font-size: var(--text-sm);
  }

  .dnd-maps-error {
    margin: 0;
    padding: var(--space-3);
    border-radius: var(--radius-md);
    background: color-mix(in srgb, var(--state-bad) 20%, transparent);
    color: var(--ink);
    font-size: var(--text-sm);
  }
</style>
