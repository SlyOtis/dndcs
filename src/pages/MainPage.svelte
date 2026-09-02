<script lang="ts">
  import { getTheme, setTheme } from "$lib/dialogs/theme";
  import { onMount, setContext, onDestroy } from "svelte";
  import { getCharacterStore, getSidebar } from "$lib/engine";
  import type { CharacterContext } from "$lib/types";
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
  import UsersPanel from "./main/UsersPanel.svelte";
  import Banner from "$components/ui/Banner.svelte";
  import Button from "$components/ui/Button.svelte";
  import Aura from "$components/ui/Aura.svelte";
  import Ornament from "$components/ui/Ornament.svelte";

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

  onMount(async () => {
    setTheme(getTheme());

    try {
      const [characters, campaigns] = await Promise.all([
        characterService.getUserCharacters(),
        campaignService.getUserCampaigns()
      ]);
      userCharacters.set(characters);
      userCampaigns.set(campaigns);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load data';
    } finally {
      loading = false;
    }
  });
  
  onDestroy(() => {
    unsubscribe();
    unsubscribeSidebar();
  });

  async function handleSignOut() {
    await authService.signOut();
    navigate('/login');
  }
</script>


<main class="hall">
  <header class="hall-bar">
    <span class="hall-bar-crest"><Ornament name="rosette" size="sm" tone="metal" /></span>

    <Banner text={$userDetails?.display_name ?? 'Adventurer'} sub={$user?.email ?? ''} size="md" />

    <span class="hall-bar-run"><Ornament name="vine" tone="metal" /></span>

    <Button variant="ghost" size="sm" onclick={handleSignOut}>Sign Out</Button>
  </header>

  <aside class="hall-aside hall-aside-menu">
    <MenuPanel />
  </aside>

  <div class="hall-content">
    <Aura variant="veil" tone="verdigris" />
    <Aura variant="motes" tone="ember" density="sparse" />

    {#if error}
      <p class="hall-error" role="alert">{error}</p>
    {/if}

    <div class="hall-grid">
      <CharactersPanel {loading} />
      <CampaignsPanel {loading} />
      <UsersPanel {loading} />
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
    gap: var(--space-4);
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
    flex: none;
  }

  .hall-bar-run {
    flex: 1;
    min-width: 0;
    opacity: 0.4;
  }

  .hall-content {
    grid-area: content;
    position: relative;
    height: calc(100vh - 68px);
    overflow: hidden;
    background:
      var(--texture-motes),
      radial-gradient(ellipse at 50% -10%, var(--verdigris-dim) 0%, transparent 60%),
      linear-gradient(180deg, var(--ground) 0%, var(--ground-deep) 100%);
  }

  .hall-error {
    position: relative;
    z-index: 2;
    margin: var(--space-4) var(--space-4) 0;
    padding: var(--space-3) var(--space-4);
    border-block: var(--border-hair) solid color-mix(in srgb, var(--state-bad) 55%, transparent);
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--state-bad) 24%, transparent),
      color-mix(in srgb, var(--state-bad) 6%, transparent)
    );
    font-size: var(--text-sm);
    color: var(--ink);
  }

  .hall-grid {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: var(--space-4);
    height: 100%;
    padding: var(--space-4);
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

  @media (max-width: 1200px) {
    .hall-grid {
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
    }
  }

  @media (max-width: 768px) {
    .hall-bar-run {
      display: none;
    }

    .hall-grid {
      grid-template-columns: 1fr;
      grid-template-rows: repeat(3, minmax(240px, 1fr));
      overflow-y: auto;
    }
  }
</style>
