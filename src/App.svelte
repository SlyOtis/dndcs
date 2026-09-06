<script lang="ts">
  import {Router, type RouteGuard, type Routes} from "sly-svelte-location-router";
  import {onMount, onDestroy} from "svelte";
  import { get } from "svelte/store";
  import { initializeAuth } from "$lib/auth.init";
  import { isAuthenticated, isLoading } from "$lib/stores/auth.store";
  import EffectDefs from "$components/ui/EffectDefs.svelte";
  import Aura from "$components/ui/Aura.svelte";
  import Ornament from "$components/ui/Ornament.svelte";
  import Flame from "$components/ui/Flame.svelte";
  import Search from "$components/search/Search.svelte";
  import { handleGlobalKeydown } from "$lib/globalEvents";

  const requireSignIn: RouteGuard = async () =>
    get(isAuthenticated) ? null : { path: "/login", state: { from: window.location.pathname } };

  function page(name: string, load: () => Promise<unknown>) {
    return async () => {
      try {
        return (await load()) as any;
      } catch (reason) {
        console.error(
          `[dndcs] "${name}" did not load. A stale dev server is the usual cause: stop it and run just dev.`,
          reason
        );
        throw reason;
      }
    };
  }

  const routes: Routes = {
    "/": "/main",
    "/main": {
      name: "main",
      component: page("MainPage", () => import("./pages/MainPage.svelte")),
      guard: requireSignIn
    },
    "/login": {
      name: "login",
      component: page("LoginPage", () => import("./pages/LoginPage.svelte")),
    },
    "/signup": {
      name: "signup",
      component: page("SignupPage", () => import("./pages/SignupPage.svelte")),
    },
    "/main/create/character": {
      name: "character-create",
      component: page("CharacterCreatePage", () => import("./pages/CharacterCreatePage.svelte")),
      guard: requireSignIn
    },
    "/main/create/character/class": {
      name: "character-class",
      component: page("CharacterClassPage", () => import("./pages/CharacterClassPage.svelte")),
      guard: requireSignIn
    },
    "/main/create/character/race": {
      name: "character-race",
      component: page("CharacterRacePage", () => import("./pages/CharacterRacePage.svelte")),
      guard: requireSignIn
    },
    "/sources/:kind/:id": {
      name: "source-view",
      component: page("SourcePage", () => import("./pages/SourcePage.svelte")),
      guard: requireSignIn
    },
    "/main/create/campaign": {
      name: "campaign-create",
      component: page("CampaignCreatePage", () => import("./pages/CampaignCreatePage.svelte")),
      guard: requireSignIn
    },
    "/character/:id": {
      name: "character-view",
      component: page("CharacterPage", () => import("./pages/CharacterPage.svelte")),
      guard: requireSignIn
    },
    "/user": {
      name: "user",
      component: page("UserPage", () => import("./pages/UserPage.svelte")),
      guard: requireSignIn
    },
    "/campaign/:id": {
      name: "campaign-view",
      component: page("CampaignPage", () => import("./pages/CampaignPage.svelte")),
      guard: requireSignIn
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

<svelte:window onkeydown={handleGlobalKeydown} />

<EffectDefs />
<Search />

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
  <svelte:boundary>
    <Router {routes} fallback={() => import("./pages/NotFoundPage.svelte")}>
      <div class="loading-screen">
        <Aura variant="motes" tone="ember" density="thick" />

        <div class="loading-content">
          <span class="loading-flame"><Flame size="lg" intensity="steady" /></span>
          <span class="loading-rule"><Ornament name="divider" tone="metal" /></span>
          <p class="dnd-label loading-note">Turning the page</p>
        </div>
      </div>
    </Router>

    {#snippet failed(error: unknown, reset: () => void)}
      <div class="page-broke" role="alert">
        <h2 class="dnd-heading">This page did not load</h2>
        <p class="page-broke-text">{error instanceof Error ? error.message : String(error)}</p>
        <p class="page-broke-note">
          If this followed a code change, the dev server is holding a stale module. Stop it and run
          <code>just dev</code> again.
        </p>
        <button type="button" class="page-broke-again" onclick={reset}>Try again</button>
      </div>
    {/snippet}
  </svelte:boundary>
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

  .page-broke {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
    max-width: 70ch;
    margin: var(--space-8) auto;
    padding: var(--space-6);
    border: var(--border-width) solid color-mix(in srgb, var(--state-bad) 55%, transparent);
    border-radius: var(--radius-lg);
    background: color-mix(in srgb, var(--state-bad) 14%, var(--ground-raised));
  }

  .page-broke-text {
    margin: 0;
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--ink);
    overflow-wrap: anywhere;
  }

  .page-broke-note {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--ink-dim);
  }

  .page-broke-again {
    padding: var(--space-2) var(--space-5);
    border: var(--border-hair) solid var(--metal);
    border-radius: var(--radius-pill);
    background: linear-gradient(180deg, var(--metal) 0%, var(--metal-dim) 100%);
    font-family: var(--font-display);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
    color: var(--ground-deep);
    cursor: pointer;
  }
</style>
