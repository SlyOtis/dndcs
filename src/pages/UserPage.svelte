<script lang="ts">
  import { onMount } from 'svelte'
  import { navigate } from 'sly-svelte-location-router'
  import { getTheme, setTheme } from '$lib/dialogs/theme'
  import { userService } from '$lib/firestore.service'
  import { authService } from '$lib/auth.service'
  import { userDetails, userProfile } from '$lib/stores/auth.store'
  import { INTEGRATIONS, type Integration } from '$lib/integrations'
  import { postFile } from '$lib/storage.service'
  import Button from '$components/ui/Button.svelte'
  import Field from '$components/ui/Field.svelte'
  import Panel from '$components/ui/Panel.svelte'
  import Portrait from '$components/ui/Portrait.svelte'
  import Shell from '$components/ui/Shell.svelte'
  import Ornament from '$components/ui/Ornament.svelte'

  let displayName = $state('')
  let keys = $state<Record<string, string>>({})
  let busy = $state(false)
  let error = $state<string | null>(null)
  let saved = $state<string | null>(null)
  let dragging = $state(false)

  onMount(() => {
    setTheme(getTheme())
    displayName = $userProfile?.display_name ?? ''
    for (const entry of INTEGRATIONS) {
      if (entry.keyField) keys[entry.keyField] = ($userDetails as Record<string, any>)?.[entry.keyField] ?? ''
    }
  })

  function statusState(entry: Integration): 'live' | 'planned' | 'blocked' | 'waiting' {
    if (entry.status !== 'live') return entry.status
    if (entry.keyField && !(keys[entry.keyField] ?? '').trim()) return 'waiting'
    return 'live'
  }

  function statusLabel(entry: Integration): string {
    const state = statusState(entry)
    if (state === 'live') return 'Connected'
    if (state === 'waiting') return 'Needs a key'
    if (state === 'planned') return 'Planned'
    return 'Unavailable'
  }

  async function signOut() {
    await authService.signOut()
    navigate('/login')
  }

  async function putProfile() {
    busy = true
    error = null
    saved = null

    const secrets: Record<string, string> = {}
    for (const entry of INTEGRATIONS) {
      if (!entry.keyField || entry.status !== 'live') continue
      const value = (keys[entry.keyField] ?? '').trim()
      if (entry.keyPrefix && value && !value.startsWith(entry.keyPrefix)) {
        error = `${entry.title} keys start with ${entry.keyPrefix}.`
        busy = false
        return
      }
      secrets[entry.keyField] = value
    }

    try {
      await userService.updateProfile({ display_name: displayName.trim() })
      await userService.putUserSecrets(secrets)
      userDetails.update((details) => ({ ...(details ?? {}), ...secrets }))
      saved = 'Saved.'
    } catch (reason) {
      error = reason instanceof Error ? reason.message : String(reason)
    } finally {
      busy = false
    }
  }

  async function dropAvatar(event: DragEvent) {
    event.preventDefault()
    dragging = false
    const file = event.dataTransfer?.files?.[0]
    if (file) await postAvatar(file)
  }

  async function putAvatar(event: Event) {
    const input = event.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (file) await postAvatar(file)
  }

  async function postAvatar(file: File) {

    busy = true
    error = null
    try {
      const url = await postFile(file, { kind: 'user' })
      await userService.updateProfile({ photo_url: url })

      saved = 'Picture updated.'
    } catch (reason) {
      error = reason instanceof Error ? reason.message : String(reason)
    } finally {
      busy = false
    }
  }
</script>

<Shell title="Profile" width="narrow" back={() => navigate('/main')}>
  <header class="user-crown">
    <Portrait
      src={$userProfile?.photo_url}
      alt={displayName || $userProfile?.email || 'Adventurer'}
      frame="shield"
      size="sm"
    />
    <span class="user-lines">
      <h1 class="dnd-heading user-name">{displayName || 'Adventurer'}</h1>
      <p class="user-mail">{$userProfile?.email ?? ''}</p>
    </span>
    <span class="user-mark">
      <span class="user-plate dnd-shield"></span>
      <Ornament name="rosette" size="sm" tone="metal" />
    </span>
  </header>

  {#if error}
    <p class="user-alarm" role="alert">{error}</p>
  {:else if saved}
    <p class="user-word" role="status">{saved}</p>
  {/if}

  <Panel title="Profile">
    <Field label="Display name" id="user-name">
      <input id="user-name" bind:value={displayName} />
    </Field>

    <p class="dnd-label user-label">Picture</p>
    <div
      class="user-drop"
      class:user-drop-live={dragging}
      role="region"
      aria-label="Profile picture drop zone"
      ondragover={(event) => {
        event.preventDefault()
        dragging = true
      }}
      ondragleave={() => (dragging = false)}
      ondrop={dropAvatar}
    >
      {#if $userProfile?.photo_url}
        <Portrait src={$userProfile.photo_url} alt="Your picture" frame="ogee" size="lg" />
      {:else}
        <span class="dnd-empty-mark"><Ornament name="quatrefoil" size="sm" tone="metal" /></span>
      {/if}
      <p class="user-drop-note">Drop a picture, or pick one</p>
      <input
        class="user-drop-input"
        type="file"
        accept="image/*"
        aria-label="Profile picture"
        disabled={busy}
        onchange={putAvatar}
      />
    </div>
  </Panel>

  <Panel title="Integrations">
    <p class="user-note">Every service this app talks to. A key you enter is written to your own private user record, which nobody else can read.</p>

    <ul class="user-list">
      {#each INTEGRATIONS as entry (entry.id)}
        <li class="user-service">
          <div class="user-service-head">
            <h3 class="dnd-heading user-service-name">{entry.title}</h3>
            <span class="user-state user-state-{statusState(entry)}">{statusLabel(entry)}</span>
          </div>

          <p class="user-purpose">{entry.purpose}</p>
          <p class="user-note">{entry.note}</p>

          {#if entry.keyField && entry.status === 'live'}
            <Field label="{entry.title} key" id="key-{entry.id}" help={entry.keyPrefix ? `Starts with ${entry.keyPrefix}` : undefined}>
              <input id="key-{entry.id}" type="password" bind:value={keys[entry.keyField]} />
            </Field>
          {/if}

          <div class="user-links">
            <a href={entry.siteUrl} target="_blank" rel="noopener noreferrer">Open {entry.title}</a>
            {#if entry.keyUrl}
              <a href={entry.keyUrl} target="_blank" rel="noopener noreferrer">Get a key</a>
            {/if}
          </div>
        </li>
      {/each}
    </ul>

    {#snippet actions()}
      <Button size="sm" onclick={putProfile} loading={busy}>Save</Button>
    {/snippet}
  </Panel>
  <div class="user-leave">
    <Button variant="danger" onclick={signOut}>Sign Out</Button>
  </div>
</Shell>

<style>
  .user-crown {
    --user-mark-w: calc(var(--space-6) + var(--space-4));
    --user-mark-h: calc(var(--space-7) + var(--space-2));
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-4) var(--space-5);
    min-width: 0;
    background:
      var(--texture-noise),
      linear-gradient(180deg, var(--ground-lift) 0%, var(--ground-raised) 55%, var(--ground-deep) 100%);
    background-blend-mode: overlay, normal;
    border: var(--border-hair) solid var(--metal-dim);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md), inset 0 var(--border-hair) 0 var(--metal-edge);
  }

  .user-lines {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: var(--space-1);
    min-width: 0;
  }

  .user-name {
    margin: 0;
    font-size: var(--text-xl);
    overflow-wrap: anywhere;
  }

  .user-mail {
    margin: 0;
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--ink-faint);
    overflow-wrap: anywhere;
  }

  .user-mark {
    position: relative;
    isolation: isolate;
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: var(--user-mark-w);
    height: var(--user-mark-h);
  }

  .user-plate {
    position: absolute;
    inset: 0;
    z-index: -1;
    background: linear-gradient(180deg, var(--ground-lift) 0%, var(--ground-deep) 100%);
    box-shadow: inset 0 0 0 var(--border-hair) var(--metal-edge);
  }

  .user-label {
    margin: 0;
    color: var(--metal);
  }

  .user-drop {
    --user-drop-h: calc(var(--space-8) * 2 + var(--space-6));
    --user-drop-sink: inset 0 var(--border-width) var(--space-3) var(--shade-hard);
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    min-height: var(--user-drop-h);
    padding: var(--space-4);
    overflow: hidden;
    border: var(--border-width) dashed var(--metal-dim);
    border-radius: var(--radius-md);
    background: linear-gradient(180deg, var(--ground-deep) 0%, var(--ground) 100%);
    box-shadow: var(--user-drop-sink);
    text-align: center;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .user-drop-live,
  .user-drop:focus-within {
    border-color: var(--metal);
    box-shadow: var(--user-drop-sink), var(--glow-metal);
  }

  .user-drop-note {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-sm);
    color: var(--ink-dim);
  }

  .user-drop-input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }

  .user-leave {
    display: flex;
    justify-content: flex-end;
  }

  .user-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .user-service {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-4);
    border: var(--border-hair) solid var(--metal-dim);
    border-radius: var(--radius-md);
    background: linear-gradient(180deg, var(--ground-raised) 0%, var(--ground-deep) 100%);
  }

  .user-service-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    min-width: 0;
  }

  .user-service-name {
    margin: 0;
    font-size: var(--text-md);
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .user-state {
    flex: none;
    padding: var(--space-1) var(--space-3);
    border: var(--border-hair) solid transparent;
    border-radius: var(--radius-pill);
    font-family: var(--font-display);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
    color: var(--ink);
  }

  .user-state-live {
    border-color: color-mix(in srgb, var(--state-good) 55%, transparent);
    background: color-mix(in srgb, var(--state-good) 22%, transparent);
  }

  .user-state-waiting {
    border-color: color-mix(in srgb, var(--metal) 55%, transparent);
    background: color-mix(in srgb, var(--metal) 20%, transparent);
  }

  .user-state-planned {
    border-color: color-mix(in srgb, var(--state-warn) 55%, transparent);
    background: color-mix(in srgb, var(--state-warn) 22%, transparent);
  }

  .user-state-blocked {
    border-color: color-mix(in srgb, var(--state-bad) 55%, transparent);
    background: color-mix(in srgb, var(--state-bad) 22%, transparent);
  }

  .user-purpose {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--ink);
  }

  .user-note {
    margin: 0;
    font-size: var(--text-xs);
    color: var(--ink-dim);
  }

  .user-links {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4);
    font-size: var(--text-sm);
  }

  .user-word,
  .user-alarm {
    margin: 0;
    padding: var(--space-3) var(--space-4);
    border: var(--border-hair) solid transparent;
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    color: var(--ink);
  }

  .user-alarm {
    border-color: color-mix(in srgb, var(--state-bad) 55%, transparent);
    background: color-mix(in srgb, var(--state-bad) 18%, transparent);
  }

  .user-word {
    border-color: color-mix(in srgb, var(--state-good) 55%, transparent);
    background: color-mix(in srgb, var(--state-good) 18%, transparent);
  }
</style>
