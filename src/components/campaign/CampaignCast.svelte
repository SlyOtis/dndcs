<script lang="ts">
  import { campaignService } from '$lib/firestore.service'
  import type { CampaignLocation, CampaignNpc, Disposition } from '$lib/firestore.types'
  import { postFile } from '$lib/storage.service'
  import Button from '$components/ui/Button.svelte'
  import Field from '$components/ui/Field.svelte'
  import StoredImage from '$components/ui/StoredImage.svelte'

  const {
    campaignId,
    isDm = false,
    npcs = [],
    locations = [],
    onChange
  }: {
    /** Campaign the cast belongs to. */
    campaignId: string
    /** Grants writing. Players read the ones they have met. */
    isDm?: boolean
    /** Everyone the campaign has recorded. */
    npcs?: CampaignNpc[]
    /** Places, used to say where an NPC is found. */
    locations?: CampaignLocation[]
    /** Runs after any write so the page reloads its records. */
    onChange?: () => void
  } = $props()

  const DISPOSITIONS: Disposition[] = ['friendly', 'neutral', 'hostile', 'unknown']

  let error = $state<string | null>(null)
  let busy = $state(false)

  const shown = $derived(isDm ? npcs : npcs.filter((npc) => npc.is_known))

  async function run(work: Promise<unknown>) {
    error = null
    try {
      await work
      onChange?.()
    } catch (reason) {
      error = reason instanceof Error ? reason.message : String(reason)
    }
  }

  async function putPortrait(event: Event, npcId: string) {
    const input = event.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    busy = true
    try {
      const url = await postFile(file, { kind: 'campaignMap', campaignId })
      await run(campaignService.putNpc(campaignId, npcId, { image_url: url }))
    } catch (reason) {
      error = reason instanceof Error ? reason.message : String(reason)
    } finally {
      busy = false
      input.value = ''
    }
  }

  function namePlace(id?: string): string {
    return locations.find((place) => place.id === id)?.name ?? 'Nowhere yet'
  }
</script>

<section class="dnd-cast dnd-panel dnd-keyline">
  {#if error}<p class="dnd-cast-error">{error}</p>{/if}

  <div class="dnd-cast-head">
    <h2>Cast</h2>
    {#if isDm}<Button onclick={() => run(campaignService.postNpc(campaignId, {}))}>Add someone</Button>{/if}
  </div>

  {#if shown.length === 0}
    <p class="dnd-cast-note">Nobody has been met yet.</p>
  {:else}
    <ul class="dnd-cast-list">
      {#each shown as npc (npc.id)}
        <li class="dnd-cast-card">
          <div class="dnd-cast-portrait">
            {#if npc.image_url}
              <StoredImage src={npc.image_url} alt="Portrait of {npc.name}" />
            {:else}
              <span class="dnd-cast-initial">{npc.name.charAt(0).toUpperCase()}</span>
            {/if}
          </div>

          <div class="dnd-cast-body">
            {#if isDm}
              <Field label="Name" id="npc-name-{npc.id}">
                <input id="npc-name-{npc.id}" value={npc.name} onchange={(e) => run(campaignService.putNpc(campaignId, npc.id, { name: e.currentTarget.value }))} />
              </Field>
              <Field label="Role" id="npc-role-{npc.id}">
                <input id="npc-role-{npc.id}" value={npc.role} placeholder="Innkeeper, captain, rival" onchange={(e) => run(campaignService.putNpc(campaignId, npc.id, { role: e.currentTarget.value }))} />
              </Field>
              <Field label="What the party knows" id="npc-body-{npc.id}">
                <textarea id="npc-body-{npc.id}" rows="3" value={npc.description} onchange={(e) => run(campaignService.putNpc(campaignId, npc.id, { description: e.currentTarget.value }))}></textarea>
              </Field>
              <div class="dnd-cast-row">
                <Field label="Disposition" id="npc-mood-{npc.id}">
                  <select id="npc-mood-{npc.id}" value={npc.disposition} onchange={(e) => run(campaignService.putNpc(campaignId, npc.id, { disposition: e.currentTarget.value as Disposition }))}>
                    {#each DISPOSITIONS as mood}<option value={mood}>{mood}</option>{/each}
                  </select>
                </Field>
                <Field label="Found at" id="npc-place-{npc.id}">
                  <select id="npc-place-{npc.id}" value={npc.location_id ?? ''} onchange={(e) => run(campaignService.putNpc(campaignId, npc.id, { location_id: e.currentTarget.value || undefined }))}>
                    <option value="">Nowhere yet</option>
                    {#each locations as place}<option value={place.id}>{place.name}</option>{/each}
                  </select>
                </Field>
              </div>
              <label class="dnd-cast-upload">
                <span>Portrait</span>
                <input type="file" accept="image/*" disabled={busy} onchange={(e) => putPortrait(e, npc.id)} />
              </label>
              <div class="dnd-cast-row">
                <Button variant={npc.is_known ? 'secondary' : 'primary'} onclick={() => run(campaignService.putNpc(campaignId, npc.id, { is_known: !npc.is_known }))}>
                  {npc.is_known ? 'Met by the party' : 'Reveal to the party'}
                </Button>
                <Button variant="danger" onclick={() => run(campaignService.deleteNpc(campaignId, npc.id))}>Remove</Button>
              </div>
            {:else}
              <h3>{npc.name}</h3>
              <p class="dnd-cast-note">{npc.role} · {npc.disposition} · {namePlace(npc.location_id)}</p>
              <p>{npc.description}</p>
            {/if}
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .dnd-cast {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-4);
    border-radius: var(--radius-lg);
    background: var(--ground);
  }

  .dnd-cast-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .dnd-cast h2 {
    margin: 0;
    font-size: var(--text-lg);
    color: var(--metal);
  }

  .dnd-cast-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .dnd-cast-card {
    display: flex;
    gap: var(--space-3);
    padding: var(--space-3);
    border: var(--border-width) solid var(--ground-lift);
    border-radius: var(--radius-md);
  }

  .dnd-cast-portrait {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 72px;
    height: 72px;
    border-radius: var(--radius-md);
    border: var(--border-width) solid var(--metal);
    background: var(--ground-raised);
    overflow: hidden;
  }

  .dnd-cast-portrait :global(img) {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .dnd-cast-initial {
    font-size: var(--text-xl);
    color: var(--metal);
  }

  .dnd-cast-body {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    flex: 1;
  }

  .dnd-cast-body h3 {
    margin: 0;
    font-size: var(--text-md);
    color: var(--ink);
  }

  .dnd-cast-body p {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--ink);
  }

  .dnd-cast-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
  }

  .dnd-cast-upload {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    font-size: var(--text-xs);
    color: var(--ink-dim);
  }

  .dnd-cast-note {
    margin: 0;
    font-size: var(--text-xs);
    color: var(--ink-dim);
  }

  .dnd-cast-error {
    margin: 0;
    padding: var(--space-3);
    border-radius: var(--radius-md);
    background: color-mix(in srgb, var(--state-bad) 20%, transparent);
    color: var(--ink);
    font-size: var(--text-sm);
  }
</style>
