<script lang="ts">
  import Dialogs from "$dialogs/Dialogs.svelte";
  import MenuPanel from "$components/MenuPanel.svelte";
  import type {CharacterContext} from "$lib/types";
  import {getCharacterStore, getSidebar} from "$lib/engine";
  import {onDestroy, onMount, setContext} from "svelte";
  import Chat from "$chat/Chat.svelte";
  import Overlay from "$components/Overlay.svelte";
  import Search from "$components/search/Search.svelte";
  import {navigate, routeParams, Router, type Routes, currentRoute} from "sly-svelte-location-router";
  import { sidebarStore } from "$lib/navigation";
  import { initializeGlobalEvents } from "$lib/globalEvents";
  import { userCharacters } from "$lib/stores/character.store";
  import { userCampaigns } from "$lib/stores/campaign.store";
  import { isAuthenticated } from "$lib/stores/auth.store";
  import { uiStore, isSearchDialogOpen, anyDialogOpen } from "$lib/stores/ui.store";
  import SoundManager from "$components/SoundManager.svelte";

  const {unsubscribe, ...chStore} = getCharacterStore()
  const unsubscribeSidebar = sidebarStore.subscribe(() => {});

  const contentRoutes: Routes = {
    "/main/character": {
      name: "character",
      component: () => import("./CharacterPage.svelte")
    },
    "/main/character/create": {
      name: "character-create",
      component: () => import("./CharacterCreatePage.svelte")
    },
    "/main/campaign": {
      name: "campaign",
      component: () => import("./CampaignPage.svelte")
    },
    "/main/campaign/create": {
      name: "campaign-create",
      component: () => import("./CampaignCreatePage.svelte")
    },
    "/main": "/main/character",
  }
  
  $effect(() => {
    // Get current path to check if we're on a create page
    const path = $currentRoute;
    if (path.includes('/create')) {
      return;
    }
    
    // Navigate to create pages if no content exists
    if (path.includes('/character') && $userCharacters.length === 0) {
      navigate('/main/character/create');
    } else if (path.includes('/campaign') && $userCampaigns.length === 0) {
      navigate('/main/campaign/create');
    }
  });
  

  setContext<CharacterContext>('character', chStore);
  setContext('sidebar', sidebarStore)
  setContext('dialogState', {
    get isAnyDialogOpen() {
      return $anyDialogOpen;
    },
    setDialogState: uiStore.setDialogState
  });

  onMount(() => {
    const savedTheme = localStorage.getItem('dnd_theme') || 'medieval';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const cleanupGlobalEvents = initializeGlobalEvents({
      anyDialogOpen: $anyDialogOpen,
      setDialogState: uiStore.setDialogState,
      toggleChat: () => {}, // Empty function since chat has its own toggle now
      openSearchDialog: uiStore.openSearchDialog,
      isSearchDialogOpen: $isSearchDialogOpen,
      closeSearchDialog: uiStore.closeSearchDialog
    });
    
    return () => {
      cleanupGlobalEvents();
    };
  });

  onDestroy(() => {
    unsubscribe()
    unsubscribeSidebar()
  })

  $effect(() => {
    if (!$isAuthenticated) {
      navigate("/");
    }
  });

</script>

<SoundManager />
<Overlay />
<Dialogs />
<Search />

<main>
    <aside class="menu-aside">
        <MenuPanel />
    </aside>
    <div class="main-content">
        <Router routes={contentRoutes} fallback="/main/character/create" />
    </div>
    <aside class="chat-aside">
        <Chat/>
    </aside>
</main>


<style>
    main {
        position: relative;
        width: 100vw;
        height: 100vh;
        display: grid;
        grid-template-columns: var(--size-menu-curr, 0) 1fr var(--size-chat-curr, 0);
        grid-template-rows: 1fr;
        overflow: hidden;
        transition: grid-template-columns 250ms ease-in-out;
        --size-menu-max: 400px;
        --size-chat-max: 400px;
    }

    .main-content {
        position: relative;
        height: 100vh;
        overflow: hidden;
    }

    .not-found {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: 2rem;
        text-align: center;
        color: var(--color-primary-text);
    }

    .not-found h2 {
        margin-bottom: 1rem;
        color: var(--color-primary-main);
    }

    .not-found p {
        margin-bottom: 2rem;
        color: var(--color-secondary-text);
    }

    .not-found button {
        padding: 0.75rem 1.5rem;
        background: var(--color-primary-main);
        color: var(--color-primary-text);
        border: none;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .not-found button:hover {
        background: var(--color-primary-light);
        transform: translateY(-2px);
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
        --translate-x: calc(-100% - 2px);
    }

    .chat-aside {
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



</style>
