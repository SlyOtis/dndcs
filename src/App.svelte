<script lang="ts">
  import {Router, currentRoute, navigate, type Routes} from "sly-svelte-location-router";
  import {onMount, onDestroy} from "svelte";
  import { initializeAuth } from "$lib/auth.init";
  import { isAuthenticated, isLoading } from "$lib/stores/auth.store";
  import EffectDefs from "$components/ui/EffectDefs.svelte";
  import Aura from "$components/ui/Aura.svelte";
  import Ornament from "$components/ui/Ornament.svelte";
  import Flame from "$components/ui/Flame.svelte";

  const PUBLIC_PATHS = ["/login", "/signup"];

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
    "/user": {
      name: "user",
      component: () => import("./pages/UserPage.svelte")
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

  $effect(() => {
    if ($isLoading || $isAuthenticated) return;
    if (PUBLIC_PATHS.includes($currentRoute.path)) return;
    navigate("/login");
  });
</script>

<EffectDefs />

{#if $isLoading}
  <div class="loading-screen">
    <Aura variant="motes" tone="ember" density="thick" />
    <Aura variant="runes" tone="verdigris" />

    <div class="loading-content">
      <span class="loading-flame">
        <Flame size="lg" intensity="steady" />
      </span>
      <h2 class="dnd-heading dnd-heading-hero">D&amp;D Character Sheet</h2>
      <span class="loading-rule">
        <Ornament name="divider" tone="metal" />
      </span>
      <p class="dnd-label loading-note">Lighting the braziers</p>
    </div>
  </div>
{:else}
  <Router {routes} fallback="/main" />
{/if}

<style>
  .loading-screen {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: var(--backdrop);
    z-index: 9999;
  }

  .loading-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-4);
    text-align: center;
    padding: var(--space-7);
  }

  .loading-flame {
    display: block;
    margin-bottom: var(--space-2);
  }

  .loading-rule {
    display: block;
    width: min(340px, 70vw);
  }

  .loading-note {
    margin: 0;
    color: var(--ink-dim);
  }
</style>
