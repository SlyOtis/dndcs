<script lang="ts">
  import { onMount } from 'svelte'
  import { navigate } from 'sly-svelte-location-router'
  import { getTheme, setTheme } from '$lib/dialogs/theme'
  import { userService } from '$lib/firestore.service'
  import { userProfile } from '$lib/stores/auth.store'
  import { INTEGRATIONS, type Integration } from '$lib/integrations'
  import { postFile } from '$lib/storage.service'
  import Background from '$components/Background.svelte'
  import Button from '$components/ui/Button.svelte'
  import Field from '$components/ui/Field.svelte'
  import StoredImage from '$components/ui/StoredImage.svelte'
  import Aura from '$components/ui/Aura.svelte'
  import Ornament from '$components/ui/Ornament.svelte'

  let displayName = $state('')
  let keys = $state<Record<string, string>>({})
  let busy = $state(false)
  let error = $state<string | null>(null)
  let saved = $state<string | null>(null)

  onMount(() => {
    setTheme(getTheme())
    const profile = $userProfile
    if (!profile) return
    displayName = profile.display_name ?? ''
    for (const entry of INTEGRATIONS) {
      if (entry.keyField) keys[entry.keyField] = (profile as Record<string, any>)[entry.keyField] ?? ''
    }
  })

  function statusLabel(entry: Integration): string {
    if (entry.status === 'live') return 'Connected'
    if (entry.status === 'planned') return 'Planned'
    return 'Unavailable'
  }

  async function putProfile() {
    busy = true
    error = null
    saved = null

    const updates: Record<string, unknown> = { display_name: displayName.trim() }
    for (const entry of INTEGRATIONS) {
      if (!entry.keyField || entry.status !== 'live') continue
      const value = (keys[entry.keyField] ?? '').trim()
      if (entry.keyPrefix && value && !value.startsWith(entry.keyPrefix)) {
        error = `${entry.title} keys start with ${entry.keyPrefix}.`
        busy = false
        return
      }
      updates[entry.keyField] = value
    }

    try {
      await userService.updateProfile(updates)
      userProfile.update((profile) => (profile ? { ...profile, ...updates } as typeof profile : profile))
      saved = 'Saved.'
    } catch (reason) {
      error = reason instanceof Error ? reason.message : String(reason)
    } finally {
      busy = false
    }
  }

  async function putAvatar(event: Event) {
    const input = event.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    busy = true
    error = null
    try {
      const url = await postFile(file, { kind: 'user' })
      await userService.updateProfile({ photo_url: url })
      userProfile.update((profile) => (profile ? { ...profile, photo_url: url } : profile))
      saved = 'Picture updated.'
    } catch (reason) {
      error = reason instanceof Error ? reason.message : String(reason)
    } finally {
      busy = false
      input.value = ''
    }
  }
</script>

<Background />

<Aura variant="motes" tone="ember" density="sparse" />

<main class="dnd-user">
  <header class="dnd-user-header dnd-panel dnd-keyline">
    {#if $userProfile?.photo_url}
      <span class="dnd-user-avatar"><StoredImage src={$userProfile.photo_url} alt="Your picture" /></span>
    {:else}
      <div class="dnd-user-avatar dnd-user-placeholder">{(displayName || $userProfile?.email || '?').charAt(0).toUpperCase()}</div>
    {/if}
    <div>
      <h1>{displayName || 'Adventurer'}</h1>
      <p>{$userProfile?.email ?? ''}</p>
    </div>
    <span class="dnd-user-crest"><Ornament name="rosette" size="sm" tone="metal" /></span>
    <Button variant="secondary" onclick={() => navigate("/main")}>Back to the table</Button>
  </header>

  {#if error}<p class="dnd-user-error">{error}</p>{/if}
  {#if saved}<p class="dnd-user-note">{saved}</p>{/if}

  <section class="dnd-user-panel dnd-panel dnd-keyline">
    <h2>Profile</h2>
    <Field label="Display name" id="user-name">
      <input id="user-name" bind:value={displayName} />
    </Field>
    <label class="dnd-user-upload">
      <span>Picture</span>
      <input type="file" accept="image/*" disabled={busy} onchange={putAvatar} />
    </label>
  </section>

  <section class="dnd-user-panel dnd-panel dnd-keyline">
    <h2>Integrations</h2>
    <p class="dnd-user-note">Every service this app talks to. A key you enter stays on your own user document.</p>

    <ul class="dnd-user-list">
      {#each INTEGRATIONS as entry (entry.id)}
        <li class="dnd-user-integration">
          <div class="dnd-user-row">
            <h3>{entry.title}</h3>
            <span class="dnd-user-status dnd-user-status-{entry.status}">{statusLabel(entry)}</span>
          </div>
          <p class="dnd-user-purpose">{entry.purpose}</p>
          <p class="dnd-user-note">{entry.note}</p>

          {#if entry.keyField && entry.status === 'live'}
            <Field label="{entry.title} key" id="key-{entry.id}" help={entry.keyPrefix ? `Starts with ${entry.keyPrefix}` : undefined}>
              <input id="key-{entry.id}" type="password" bind:value={keys[entry.keyField]} />
            </Field>
          {/if}

          <div class="dnd-user-links">
            <a href={entry.siteUrl} target="_blank" rel="noopener noreferrer">Open {entry.title}</a>
            {#if entry.keyUrl}
              <a href={entry.keyUrl} target="_blank" rel="noopener noreferrer">Get a key</a>
            {/if}
          </div>
        </li>
      {/each}
    </ul>

    <Button onclick={putProfile} loading={busy}>Save</Button>
  </section>
</main>

<style>
  .dnd-user {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    width: 100%;
    max-width: 860px;
    margin: 0 auto;
    padding: var(--space-5);
    overflow-y: auto;
  }

  .dnd-user-header,
  .dnd-user-panel {
    padding: var(--space-4);
    border-radius: var(--radius-lg);
    background: var(--ground);
  }

  .dnd-user-header {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  .dnd-user-crest {
    margin-inline-start: auto;
    opacity: 0.7;
  }

  .dnd-user-header h1 {
    margin: 0;
    font-size: var(--text-xl);
    color: var(--metal);
  }

  .dnd-user-header p {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--ink-dim);
  }

  .dnd-user-avatar {
    width: 64px;
    height: 64px;
    border-radius: var(--radius-pill);
    border: var(--border-width) solid var(--metal);
    object-fit: cover;
  }

  .dnd-user-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--ground-raised);
    color: var(--metal);
    font-size: var(--text-xl);
  }

  .dnd-user-panel {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .dnd-user-panel h2 {
    margin: 0;
    font-size: var(--text-lg);
    color: var(--metal);
  }

  .dnd-user-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .dnd-user-integration {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-3);
    border: var(--border-width) solid var(--ground-lift);
    border-radius: var(--radius-md);
  }

  .dnd-user-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
  }

  .dnd-user-row h3 {
    margin: 0;
    font-size: var(--text-md);
    color: var(--ink);
  }

  .dnd-user-status {
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-pill);
    font-size: var(--text-xs);
  }

  .dnd-user-status-live {
    background: color-mix(in srgb, var(--state-good) 25%, transparent);
    color: var(--ink);
  }

  .dnd-user-status-planned {
    background: color-mix(in srgb, var(--state-warn) 25%, transparent);
    color: var(--ink);
  }

  .dnd-user-status-blocked {
    background: color-mix(in srgb, var(--state-bad) 25%, transparent);
    color: var(--ink);
  }

  .dnd-user-purpose {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--ink);
  }

  .dnd-user-links {
    display: flex;
    gap: var(--space-3);
  }

  .dnd-user-links a {
    font-size: var(--text-sm);
    color: var(--metal);
  }

  .dnd-user-upload {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--ink);
  }

  .dnd-user-note {
    margin: 0;
    font-size: var(--text-xs);
    color: var(--ink-dim);
  }

  .dnd-user-error {
    margin: 0;
    padding: var(--space-3);
    border-radius: var(--radius-md);
    background: color-mix(in srgb, var(--state-bad) 20%, transparent);
    color: var(--ink);
    font-size: var(--text-sm);
  }
</style>
