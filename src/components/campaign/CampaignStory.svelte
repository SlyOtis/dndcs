<script lang="ts">
  import { campaignService } from '$lib/firestore.service'
  import type { CampaignNpc, CampaignQuest, CampaignSession, CharacterDocument, QuestState } from '$lib/firestore.types'
  import Button from '$components/ui/Button.svelte'
  import Field from '$components/ui/Field.svelte'

  const {
    campaignId,
    isDm = false,
    sessions = [],
    quests = [],
    npcs = [],
    characters = [],
    onChange
  }: {
    /** Campaign the story belongs to. */
    campaignId: string
    /** Grants writing. Players read what has been revealed. */
    isDm?: boolean
    /** Session log, newest first. */
    sessions?: CampaignSession[]
    /** Every quest, whatever its state. */
    quests?: CampaignQuest[]
    /** Cast, used to name a quest giver. */
    npcs?: CampaignNpc[]
    /** Party, used to mark who was present. */
    characters?: CharacterDocument[]
    /** Runs after any write so the page reloads its records. */
    onChange?: () => void
  } = $props()

  const STATES: QuestState[] = ['active', 'done', 'abandoned']

  let error = $state<string | null>(null)
  let openSession = $state<string | null>(null)

  const shownQuests = $derived(isDm ? quests : quests.filter((quest) => quest.is_known))
  const active = $derived(shownQuests.filter((quest) => quest.state === 'active'))
  const closed = $derived(shownQuests.filter((quest) => quest.state !== 'active'))

  async function run(work: Promise<unknown>) {
    error = null
    try {
      await work
      onChange?.()
    } catch (reason) {
      error = reason instanceof Error ? reason.message : String(reason)
    }
  }

  function addSession() {
    const next = sessions.reduce((highest, entry) => Math.max(highest, entry.number), 0) + 1
    run(campaignService.postSession(campaignId, { number: next, title: `Session ${next}` }))
  }

  function togglePresent(session: CampaignSession, characterId: string) {
    const present = session.present_character_ids.includes(characterId)
      ? session.present_character_ids.filter((id) => id !== characterId)
      : [...session.present_character_ids, characterId]
    run(campaignService.putSession(campaignId, session.id, { present_character_ids: present }))
  }

  function nameNpc(id?: string): string {
    return npcs.find((npc) => npc.id === id)?.name ?? 'Unknown'
  }
</script>

<div class="dnd-story">
  {#if error}<p class="dnd-story-error">{error}</p>{/if}

  <section class="dnd-story-panel primary-border">
    <div class="dnd-story-head">
      <h2>Quests</h2>
      {#if isDm}<Button onclick={() => run(campaignService.postQuest(campaignId, {}))}>Add quest</Button>{/if}
    </div>

    {#if shownQuests.length === 0}
      <p class="dnd-story-note">No quest has been taken up yet.</p>
    {:else}
      {#each [{ title: 'Active', list: active }, { title: 'Closed', list: closed }] as group}
        {#if group.list.length > 0}
          <h3 class="dnd-story-group">{group.title}</h3>
          <ul class="dnd-story-list">
            {#each group.list as quest (quest.id)}
              <li class="dnd-story-record">
                {#if isDm}
                  <Field label="Title" id="quest-title-{quest.id}">
                    <input id="quest-title-{quest.id}" value={quest.title} onchange={(e) => run(campaignService.putQuest(campaignId, quest.id, { title: e.currentTarget.value }))} />
                  </Field>
                  <Field label="What the party knows" id="quest-body-{quest.id}">
                    <textarea id="quest-body-{quest.id}" rows="3" value={quest.description} onchange={(e) => run(campaignService.putQuest(campaignId, quest.id, { description: e.currentTarget.value }))}></textarea>
                  </Field>
                  <div class="dnd-story-row">
                    <Field label="State" id="quest-state-{quest.id}">
                      <select id="quest-state-{quest.id}" value={quest.state} onchange={(e) => run(campaignService.putQuest(campaignId, quest.id, { state: e.currentTarget.value as QuestState }))}>
                        {#each STATES as state}<option value={state}>{state}</option>{/each}
                      </select>
                    </Field>
                    <Field label="Given by" id="quest-giver-{quest.id}">
                      <select id="quest-giver-{quest.id}" value={quest.giver_npc_id ?? ''} onchange={(e) => run(campaignService.putQuest(campaignId, quest.id, { giver_npc_id: e.currentTarget.value || undefined }))}>
                        <option value="">Nobody yet</option>
                        {#each npcs as npc}<option value={npc.id}>{npc.name}</option>{/each}
                      </select>
                    </Field>
                  </div>
                  <div class="dnd-story-row">
                    <Button variant={quest.is_known ? 'secondary' : 'primary'} onclick={() => run(campaignService.putQuest(campaignId, quest.id, { is_known: !quest.is_known }))}>
                      {quest.is_known ? 'Known to the party' : 'Reveal to the party'}
                    </Button>
                    <Button variant="danger" onclick={() => run(campaignService.deleteQuest(campaignId, quest.id))}>Remove</Button>
                  </div>
                {:else}
                  <h4>{quest.title}</h4>
                  <p>{quest.description}</p>
                  <p class="dnd-story-note">{quest.state}{#if quest.giver_npc_id} · given by {nameNpc(quest.giver_npc_id)}{/if}</p>
                {/if}
              </li>
            {/each}
          </ul>
        {/if}
      {/each}
    {/if}
  </section>

  <section class="dnd-story-panel primary-border">
    <div class="dnd-story-head">
      <h2>Session log</h2>
      {#if isDm}<Button onclick={addSession}>Add session</Button>{/if}
    </div>

    {#if sessions.length === 0}
      <p class="dnd-story-note">No session has been recorded yet.</p>
    {:else}
      <ul class="dnd-story-list">
        {#each sessions as session (session.id)}
          <li class="dnd-story-record">
            <button type="button" class="dnd-story-toggle" onclick={() => (openSession = openSession === session.id ? null : session.id)}>
              <span>{session.number}. {session.title}</span>
              <span class="dnd-story-note">{session.played_at} · {session.present_character_ids.length} present</span>
            </button>

            {#if openSession === session.id}
              {#if isDm}
                <Field label="Title" id="session-title-{session.id}">
                  <input id="session-title-{session.id}" value={session.title} onchange={(e) => run(campaignService.putSession(campaignId, session.id, { title: e.currentTarget.value }))} />
                </Field>
                <Field label="Played on" id="session-date-{session.id}">
                  <input id="session-date-{session.id}" type="date" value={session.played_at} onchange={(e) => run(campaignService.putSession(campaignId, session.id, { played_at: e.currentTarget.value }))} />
                </Field>
                <Field label="What happened" id="session-summary-{session.id}">
                  <textarea id="session-summary-{session.id}" rows="5" value={session.summary} onchange={(e) => run(campaignService.putSession(campaignId, session.id, { summary: e.currentTarget.value }))}></textarea>
                </Field>
                <fieldset class="dnd-story-present">
                  <legend>Who was there</legend>
                  {#each characters as entry (entry.id)}
                    <label>
                      <input
                        type="checkbox"
                        checked={session.present_character_ids.includes(entry.id)}
                        onchange={() => togglePresent(session, entry.id)}
                      />
                      {entry.metadata.name}
                    </label>
                  {/each}
                </fieldset>
                <Button variant="danger" onclick={() => run(campaignService.deleteSession(campaignId, session.id))}>Remove session</Button>
              {:else}
                <p>{session.summary || 'Nothing was written down.'}</p>
              {/if}
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</div>

<style>
  .dnd-story {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .dnd-story-panel {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-4);
    border-radius: var(--radius-lg);
    background: var(--color-content-dark);
  }

  .dnd-story-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .dnd-story-panel h2 {
    margin: 0;
    font-size: var(--text-lg);
    color: var(--color-primary-main);
  }

  .dnd-story-group {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--color-secondary-text);
  }

  .dnd-story-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .dnd-story-record {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-3);
    border: var(--border-width) solid var(--color-content-light);
    border-radius: var(--radius-md);
  }

  .dnd-story-record h4 {
    margin: 0;
    font-size: var(--text-md);
    color: var(--color-content-text);
  }

  .dnd-story-record p {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--color-content-text);
  }

  .dnd-story-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
  }

  .dnd-story-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--color-content-text);
    font-family: inherit;
    font-size: var(--text-sm);
    text-align: left;
    cursor: pointer;
  }

  .dnd-story-toggle:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  .dnd-story-present {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    margin: 0;
    padding: var(--space-2);
    border: var(--border-width) solid var(--color-content-light);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    color: var(--color-content-text);
  }

  .dnd-story-present legend {
    font-size: var(--text-xs);
    color: var(--color-primary-main);
  }

  .dnd-story-note {
    margin: 0;
    font-size: var(--text-xs);
    color: var(--color-secondary-text);
  }

  .dnd-story-error {
    margin: 0;
    padding: var(--space-3);
    border-radius: var(--radius-md);
    background: color-mix(in srgb, var(--color-danger) 20%, transparent);
    color: var(--color-content-text);
    font-size: var(--text-sm);
  }
</style>
