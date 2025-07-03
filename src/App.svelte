<script lang="ts">
  import {Router, type Routes} from "sly-svelte-location-router";
  import {onMount, onDestroy} from "svelte";
  import { initializeAuth } from "$lib/auth.init";
  import { isLoading, isAuthenticated } from "$lib/stores/auth.store";

  const routes: Routes = {
    "/": "/main",
    "/main": {
      name: "main",
      component: () => import("./pages/MainPage.svelte")
    },
    "/login": {
      name: "login",
      component: () => import("./pages/LoginPage.svelte"),
    },
    "/signup": {
      name: "signup",
      component: () => import("./pages/SignupPage.svelte"),
    },
    "/main/create/character": {
      name: "character-create",
      component: () => import("./pages/CharacterCreatePage.svelte")
    },
    "/main/create/character/class": {
      name: "character-class",
      component: () => import("./pages/CharacterClassPage.svelte")
    },
    "/main/create/campaign": {
      name: "campaign-create",
      component: () => import("./pages/CampaignCreatePage.svelte")
    },
    "/character/:id": {
      name: "character-view",
      component: () => import("./pages/CharacterPage.svelte")
    },
    "/campaign/:id": {
      name: "campaign-view",
      component: () => import("./pages/CampaignPage.svelte")
    }
  }

  let unsubscribeAuth: (() => void) | null = null;

  onMount(() => {
    unsubscribeAuth = initializeAuth();
  });

  onDestroy(() => {
    if (unsubscribeAuth) {
      unsubscribeAuth();
    }
  });
</script>

{#if $isLoading}
  <div class="loading-screen">
    <div class="loading-content">
      <div class="spinner"></div>
      <h2>D&D Character Sheet</h2>
      <p>Loading your adventure...</p>
    </div>
  </div>
{:else}
  <Router {routes} fallback="/main/character" />
{/if}

<style>
  .loading-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: var(--color-content-dark, #1a1a1a);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  }

  .loading-content {
    text-align: center;
    color: var(--color-primary-text, #ffffff);
  }

  .loading-content h2 {
    margin: 1rem 0 0.5rem 0;
    color: var(--color-primary-main, #d4af37);
    font-size: 2rem;
  }

  .loading-content p {
    margin: 0;
    color: var(--color-secondary-text, #cccccc);
    font-size: 1.1rem;
  }

  .spinner {
    width: 60px;
    height: 60px;
    border: 4px solid rgba(212, 175, 55, 0.3);
    border-left: 4px solid var(--color-primary-main, #d4af37);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem auto;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>