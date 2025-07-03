<script lang="ts">
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

  // Create character store and context for any components that need it
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
    const savedTheme = localStorage.getItem('dnd_theme') || 'medieval';
    document.documentElement.setAttribute('data-theme', savedTheme);

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

<main>
  <div class="topbar">
    <div class="user-info">
      <span class="display-name">{$userDetails?.display_name}</span>
      <span class="email">{$user?.email || ''}</span>
    </div>
    <button class="sign-out-btn" on:click={handleSignOut}>
      Sign Out
    </button>
  </div>
  
  <aside class="menu-aside">
    <MenuPanel />
  </aside>
  
  <div class="main-content">
    <div class="panels-grid">
      <CharactersPanel {loading} />
      <CampaignsPanel {loading} />
      <UsersPanel {loading} />
    </div>
  </div>
  
  <aside class="chat-aside">
    <Chat />
  </aside>
</main>

<style>
  main {
    position: relative;
    width: 100vw;
    height: 100vh;
    display: grid;
    grid-template-columns: var(--size-menu-curr, 0) 1fr var(--size-chat-curr, 0);
    grid-template-rows: 64px 1fr;
    grid-template-areas: 
      "topbar topbar topbar"
      "menu content chat";
    overflow: hidden;
    transition: grid-template-columns 250ms ease-in-out;
    --size-menu-max: 400px;
    --size-chat-max: 400px;
  }

  .topbar {
    grid-area: topbar;
    height: 64px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2rem;
    background: var(--color-content-dark);
    border-bottom: 2px solid var(--color-primary-main);
    z-index: 20;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .display-name {
    color: var(--color-primary-text);
    font-weight: 600;
    font-size: 1rem;
  }

  .email {
    color: var(--color-primary-text);
    opacity: 0.7;
    font-size: 0.9rem;
  }

  .sign-out-btn {
    padding: 0.5rem 1rem;
    background: transparent;
    border: 2px solid var(--color-primary-main);
    border-radius: 6px;
    color: var(--color-primary-main);
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .sign-out-btn:hover {
    background: var(--color-primary-main);
    color: var(--color-content-dark);
  }

  .main-content {
    grid-area: content;
    position: relative;
    height: calc(100vh - 64px);
    overflow: hidden;
    background: 
      linear-gradient(135deg, rgba(20, 15, 10, 0.95) 0%, rgba(40, 25, 15, 0.9) 50%, rgba(15, 10, 5, 0.98) 100%),
      url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffd700' fill-opacity='0.05'%3E%3Ccircle cx='6' cy='6' r='1.5'/%3E%3Ccircle cx='18' cy='18' r='1'/%3E%3Ccircle cx='42' cy='12' r='1.5'/%3E%3Ccircle cx='54' cy='30' r='1'/%3E%3Ccircle cx='30' cy='48' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  }

  .menu-aside,
  .chat-aside {
    position: relative;
    overflow: hidden;
    z-index: 10;
    background: var(--color-content-dark);
    border: 2px solid var(--color-primary-main);
    box-shadow: 4px 0 12px rgba(0, 0, 0, 0.3);
    transform: translateX(var(--translate-x, 0));
    transition: transform 250ms ease-in-out;
  }

  .menu-aside {
    grid-area: menu;
    --translate-x: calc(-100% - 2px);
  }

  .chat-aside {
    grid-area: chat;
    border-left: 2px solid var(--color-primary-main);
    border-right: none;
    box-shadow: -4px 0 12px rgba(0, 0, 0, 0.3);
    --translate-x: calc(100% + 2px);
  }

  :root[style*="--size-menu-curr: var(--size-menu-max)"] .menu-aside {
    --translate-x: 0;
  }

  :root[style*="--size-chat-curr: var(--size-chat-max)"] .chat-aside {
    --translate-x: 0;
  }

  .panels-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1rem;
    height: calc(100vh - 64px);
    padding: 1rem;
  }

  @media (max-width: 1200px) {
    .panels-grid {
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
    }
  }

  @media (max-width: 768px) {
    .panels-grid {
      grid-template-columns: 1fr;
      grid-template-rows: 1fr 1fr 1fr;
    }
  }
</style>