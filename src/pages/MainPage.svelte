<script lang="ts">
  import { getTheme, setTheme } from "$lib/dialogs/theme";
  import { onMount, setContext, onDestroy } from "svelte";
  import { getCharacterStore } from "$lib/engine";
  import type { CharacterContext } from "$lib/types";
  import type { CampaignChronicle, CampaignErrand, PartyMember } from "$lib/firestore.types";
  import MenuPanel from "$components/MenuPanel.svelte";
  import Chat from "$chat/Chat.svelte";
  import { sidebarStore } from "$lib/navigation";
  import { uiStore, anyDialogOpen } from "$lib/stores/ui.store";
  import { userCharacters } from "$lib/stores/character.store";
  import { userCampaigns } from "$lib/stores/campaign.store";
  import { characterService, campaignService } from "$lib/firestore.service";
  import { user, userProfile, userDetails } from "$lib/stores/auth.store";
  import { authService } from "$lib/auth.service";
  import { navigate } from "sly-svelte-location-router";
  import CharactersPanel from "./main/CharactersPanel.svelte";
  import CampaignsPanel from "./main/CampaignsPanel.svelte";
  import ChroniclesPanel from "./main/ChroniclesPanel.svelte";
  import QuestsPanel from "./main/QuestsPanel.svelte";
  import PartyPanel from "./main/PartyPanel.svelte";
  import Button from "$components/ui/Button.svelte";
  import Aura from "$components/ui/Aura.svelte";
  import Ornament from "$components/ui/Ornament.svelte";
  import StoredImage from "$components/ui/StoredImage.svelte";

  const {unsubscribe, ...chStore} = getCharacterStore()
  const unsubscribeSidebar = sidebarStore.subscribe(() => {});

  setContext<CharacterContext>('character', chStore);
  setContext('sidebar', sidebarStore)
  setContext('dialogState', {
    get isAnyDialogOpen() {
      return $anyDialogOpen;
    },
    setDialogState: uiStore.setDialogState
  });

  let loading = $state(true);
  let error = $state<string | null>(null);
  let chronicles = $state<CampaignChronicle[]>([]);
  let errands = $state<CampaignErrand[]>([]);
  let party = $state<PartyMember[]>([]);

  const name = $derived($userDetails?.display_name || $userProfile?.display_name || 'Adventurer');
  const initial = $derived(name.charAt(0).toUpperCase());

  onMount(async () => {
    setTheme(getTheme());

    try {
      const [characters, campaigns] = await Promise.all([
        characterService.getUserCharacters(),
        campaignService.getUserCampaigns()
      ]);
      userCharacters.set(characters);
      userCampaigns.set(campaigns);

      const [sessions, quests, members] = await Promise.all([
        campaignService.getRecentSessions(campaigns),
        campaignService.getActiveQuests(campaigns),
        campaignService.getPartyMembers(campaigns)
      ]);
      chronicles = sessions;
      errands = quests;
      party = members;
    } catch (err) {
      error = err instanceof Error ? err.message : 'The archive did not answer';
    } finally {
      loading = false;
    }
  });

  onDestroy(() => {
    unsubscribe();
    unsubscribeSidebar();
  });

  function createCharacter() {
    navigate('/main/create/character');
  }

  function createCampaign() {
    navigate('/main/create/campaign');
  }

  function openProfile() {
    navigate('/user');
  }

  function dismissError() {
    error = null;
  }

  async function signOut() {
    await authService.signOut();
    navigate('/login');
  }
</script>


<main class="hall">
  <header class="hall-bar">
    <span class="hall-bar-crest"><Ornament name="rosette" size="sm" tone="metal" /></span>
    <span class="hall-bar-mark">Hearth</span>

    <nav class="hall-nav" aria-label="Main">
      <Button variant="ghost" size="sm" onclick={createCharacter}>New Character</Button>
      <Button variant="ghost" size="sm" onclick={createCampaign}>New Campaign</Button>
    </nav>

    <span class="hall-bar-run" aria-hidden="true"></span>

    <button type="button" class="hall-chip" onclick={openProfile} title="Your profile">
      <span class="hall-chip-face">
        {#if $userProfile?.photo_url}
          <StoredImage src={$userProfile.photo_url} alt="" />
        {:else}
          <span class="hall-chip-initial">{initial}</span>
        {/if}
      </span>
      <span class="hall-chip-lines">
        <span class="hall-chip-name">{name}</span>
        <span class="hall-chip-mail">{$user?.email ?? ''}</span>
      </span>
    </button>

    <span class="hall-bar-split" aria-hidden="true"></span>

    <Button variant="ghost" size="sm" onclick={signOut}>Sign Out</Button>
  </header>

  <aside class="hall-aside hall-aside-menu">
    <MenuPanel />
  </aside>

  <div class="hall-content">
    <span class="hall-veil" aria-hidden="true">
      <Aura variant="veil" tone="verdigris" />
      <Aura variant="motes" tone="ember" density="sparse" />
    </span>

    <div class="dnd-scroll hall-scroll">
      <section class="hall-hero">
        <p class="dnd-label hall-hero-eyebrow">The hearth is lit</p>
        <h1 class="dnd-heading dnd-heading-hero hall-hero-name">{name}</h1>
        <span class="hall-hero-rule"><Ornament name="divider" tone="metal" /></span>
        <p class="hall-hero-note">
          {$userCharacters.length} characters, {$userCampaigns.length} campaigns, {errands.length} quests open.
        </p>
        <div class="hall-hero-acts">
          <Button variant="primary" size="md" onclick={createCharacter}>Forge a Character</Button>
          <Button variant="secondary" size="md" onclick={createCampaign}>Raise a Campaign</Button>
        </div>
      </section>

      {#if error}
        <div class="hall-error" role="alert">
          <span class="hall-error-mark" aria-hidden="true">⚠</span>
          <p class="hall-error-text">{error}</p>
          <Button variant="ghost" size="sm" onclick={dismissError}>Dismiss</Button>
        </div>
      {/if}

      <div class="hall-rails">
        <CharactersPanel {loading} />
        <CampaignsPanel {loading} />
        <ChroniclesPanel {loading} {chronicles} />
        <QuestsPanel {loading} {errands} />
        <PartyPanel {loading} members={party} />
      </div>
    </div>
  </div>

  <aside class="hall-aside hall-aside-chat">
    <Chat />
  </aside>
</main>

<style>
  .hall {
    position: relative;
    width: 100vw;
    height: 100vh;
    display: grid;
    grid-template-columns: var(--size-menu-curr, 0) 1fr var(--size-chat-curr, 0);
    grid-template-rows: 68px 1fr;
    grid-template-areas:
      'topbar topbar topbar'
      'menu content chat';
    overflow: hidden;
    transition: grid-template-columns 250ms ease-in-out;
    background: var(--backdrop);
    --size-menu-max: 400px;
    --size-chat-max: 400px;
  }

  .hall-bar {
    grid-area: topbar;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    height: 68px;
    padding: 0 var(--space-5);
    background:
      var(--texture-noise),
      linear-gradient(180deg, var(--ground-lift) 0%, var(--ground) 70%, var(--ground-deep) 100%);
    background-blend-mode: overlay, normal;
    border-bottom: var(--border-hair) solid var(--metal-dim);
    box-shadow: 0 4px 18px var(--shade), inset 0 1px 0 var(--metal-edge);
    z-index: 20;
  }

  .hall-bar-crest {
    display: flex;
    flex: none;
  }

  .hall-bar-mark {
    flex: none;
    font-family: var(--font-display);
    font-size: var(--text-md);
    font-weight: 700;
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
    color: var(--metal-bright);
    text-shadow: var(--glow-metal);
  }

  .hall-nav {
    display: flex;
    flex: none;
    gap: var(--space-2);
    padding-inline-start: var(--space-4);
    border-inline-start: var(--border-hair) solid var(--metal-dim);
  }

  .hall-bar-run {
    flex: 1;
    min-width: var(--space-4);
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--metal-dim) 50%, transparent);
  }

  .hall-bar-split {
    flex: none;
    width: 1px;
    height: 30px;
    background: var(--metal-dim);
  }

  .hall-chip {
    display: flex;
    flex: none;
    align-items: center;
    gap: var(--space-3);
    max-width: 260px;
    padding: var(--space-1) var(--space-3) var(--space-1) var(--space-1);
    background: linear-gradient(180deg, var(--ground-lift) 0%, var(--ground-deep) 100%);
    border: var(--border-hair) solid var(--metal-dim);
    border-radius: var(--radius-pill);
    cursor: pointer;
    text-align: start;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .hall-chip:hover {
    border-color: var(--metal);
    box-shadow: var(--glow-metal);
  }

  .hall-chip:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  .hall-chip-face {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    overflow: hidden;
    border-radius: var(--radius-pill);
    background: radial-gradient(circle at 38% 26%, var(--ground-lift) 0%, var(--ground-deep) 84%);
    box-shadow: inset 0 0 0 var(--border-hair) var(--metal-dim);
  }

  .hall-chip-face :global(img) {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .hall-chip-initial {
    font-family: var(--font-display);
    font-size: var(--text-md);
    font-weight: 700;
    color: var(--metal);
  }

  .hall-chip-lines {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .hall-chip-name {
    font-family: var(--font-display);
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--metal-bright);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .hall-chip-mail {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--ink-faint);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .hall-content {
    grid-area: content;
    position: relative;
    min-height: 0;
    overflow: hidden;
    background:
      var(--texture-motes),
      radial-gradient(ellipse at 50% -10%, var(--verdigris-dim) 0%, transparent 60%),
      linear-gradient(180deg, var(--ground) 0%, var(--ground-deep) 100%);
  }

  .hall-veil {
    position: absolute;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
  }

  .hall-scroll {
    position: relative;
    z-index: 1;
    height: 100%;
    padding: var(--space-6) var(--space-6) var(--space-8);
  }

  .hall-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    padding-bottom: var(--space-6);
    text-align: center;
  }

  .hall-hero-eyebrow {
    margin: 0;
    color: var(--ink-faint);
  }

  .hall-hero-name {
    font-size: var(--text-2xl);
  }

  .hall-hero-rule {
    display: block;
    width: min(420px, 70%);
  }

  .hall-hero-note {
    margin: 0;
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--ink-dim);
  }

  .hall-hero-acts {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-3);
    margin-top: var(--space-3);
  }

  .hall-error {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-5);
    padding: var(--space-3) var(--space-4);
    border: var(--border-hair) solid color-mix(in srgb, var(--state-bad) 55%, transparent);
    border-radius: var(--radius-md);
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--state-bad) 22%, transparent),
      color-mix(in srgb, var(--state-bad) 6%, transparent)
    );
  }

  .hall-error-mark {
    flex: none;
    font-size: var(--text-lg);
    color: var(--state-bad);
  }

  .hall-error-text {
    flex: 1;
    min-width: 0;
    margin: 0;
    font-size: var(--text-sm);
    color: var(--ink);
    overflow-wrap: anywhere;
  }

  .hall-rails {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .hall-aside {
    position: relative;
    overflow: hidden;
    z-index: 10;
    background:
      var(--texture-weave),
      linear-gradient(180deg, var(--ground-raised) 0%, var(--ground-deep) 100%);
    box-shadow: 0 0 24px var(--shade-hard);
    transform: translateX(var(--translate-x, 0));
    transition: transform 250ms ease-in-out;
  }

  .hall-aside-menu {
    grid-area: menu;
    border-right: var(--border-width) solid var(--metal-dim);
    --translate-x: calc(-100% - 2px);
  }

  .hall-aside-chat {
    grid-area: chat;
    border-left: var(--border-width) solid var(--metal-dim);
    --translate-x: calc(100% + 2px);
  }

  :root[style*='--size-menu-curr: var(--size-menu-max)'] .hall-aside-menu {
    --translate-x: 0;
  }

  :root[style*='--size-chat-curr: var(--size-chat-max)'] .hall-aside-chat {
    --translate-x: 0;
  }

  @media (max-width: 1100px) {
    .hall-chip-lines {
      display: none;
    }

    .hall-chip {
      padding: var(--space-1);
    }
  }

  @media (max-width: 860px) {
    .hall-nav {
      display: none;
    }

    .hall-bar-mark {
      display: none;
    }

    .hall-scroll {
      padding: var(--space-4) var(--space-4) var(--space-7);
    }
  }
</style>
