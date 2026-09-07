<script lang="ts">
  import { getTheme, setTheme } from "$lib/dialogs/theme";
  import { onMount, setContext, onDestroy } from "svelte";
  import { getCharacterStore } from "$lib/engine";
  import type { CharacterContext } from "$lib/types";
  import type {
    CampaignChart,
    CampaignChronicle,
    CampaignErrand,
    CampaignFigure,
    CampaignFray,
    CampaignHaunt,
    UserProfile
  } from "$lib/firestore.types";
  import MenuPanel from "$components/MenuPanel.svelte";
  import Chat from "$chat/Chat.svelte";
  import { sidebarStore } from "$lib/navigation";
  import { uiStore, anyDialogOpen } from "$lib/stores/ui.store";
  import { userCharacters } from "$lib/stores/character.store";
  import { userCampaigns } from "$lib/stores/campaign.store";
  import { characterService, campaignService, userService } from "$lib/firestore.service";
  import { userProfile, userDetails } from "$lib/stores/auth.store";
  import { navigate } from "sly-svelte-location-router";
  import CharactersPanel from "./main/CharactersPanel.svelte";
  import CampaignsPanel from "./main/CampaignsPanel.svelte";
  import LorePanel from "./main/LorePanel.svelte";
  import FriendsPanel from "./main/FriendsPanel.svelte";
  import Button from "$components/ui/Button.svelte";
  import Ornament from "$components/ui/Ornament.svelte";
  import Shell from "$components/ui/Shell.svelte";
  import Sigil from "$components/ui/Sigil.svelte";
  import Glyph from "$components/ui/Glyph.svelte";
  import { postUIAction } from "$lib/chat";

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
  let charts = $state<CampaignChart[]>([]);
  let figures = $state<CampaignFigure[]>([]);
  let haunts = $state<CampaignHaunt[]>([]);
  let frays = $state<CampaignFray[]>([]);
  let friends = $state<UserProfile[]>([]);
  let campaignSearch = $state('');
  let characterSearch = $state('');

  const name = $derived($userDetails?.display_name || $userProfile?.display_name || 'Adventurer');

  onMount(async () => {
    setTheme(getTheme());

    try {
      const [characters, campaigns, known] = await Promise.all([
        characterService.getUserCharacters(),
        campaignService.getUserCampaigns(),
        userService.getProfiles($userProfile?.friends ?? [])
      ]);
      userCharacters.set(characters);
      userCampaigns.set(campaigns);
      friends = known;

      const [sessions, quests, maps, npcs, locations, encounters] = await Promise.all([
        campaignService.getRecentSessions(campaigns),
        campaignService.getActiveQuests(campaigns),
        campaignService.getChartedMaps(campaigns),
        campaignService.getKnownNpcs(campaigns),
        campaignService.getKnownLocations(campaigns),
        campaignService.getRecentEncounters(campaigns)
      ]);
      chronicles = sessions;
      errands = quests;
      charts = maps;
      figures = npcs;
      haunts = locations;
      frays = encounters;
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

  function dismissError() {
    error = null;
  }
</script>

<Shell title="Hearth" width="full">
  {#snippet nav()}
    <Button variant="ghost" size="sm" onclick={createCharacter}>New Character</Button>
    <Button variant="ghost" size="sm" onclick={createCampaign}>New Campaign</Button>
  {/snippet}

  {#snippet tools()}
    <Sigil title="Change theme" size="sm" onclick={() => postUIAction('openThemeDialog')}>
      <Glyph name="theme" size="sm" />
    </Sigil>
  {/snippet}

  {#snippet menu()}
    <MenuPanel />
  {/snippet}

  {#snippet chat()}
    <Chat />
  {/snippet}

  {#if error}
    <div class="hall-error" role="alert">
      <span class="hall-error-mark"><Ornament name="skull" size="sm" tone="ember" /></span>
      <p class="hall-error-text">{error}</p>
      <Button variant="ghost" size="sm" onclick={dismissError}>Dismiss</Button>
    </div>
  {/if}

  <div class="hall-grid">
    <section class="hall-hero" aria-label="Hearth">
      <div class="hall-hero-word">
        <p class="dnd-label hall-hero-eyebrow">The hearth is lit</p>
        <h1 class="dnd-heading hall-hero-name">{name}</h1>
        <p class="hall-hero-note">
          {$userCharacters.length} characters, {$userCampaigns.length} campaigns, {errands.length} quests open.
        </p>
      </div>
      <div class="hall-hero-acts">
        <Button variant="primary" size="md" onclick={createCharacter}>Forge a Character</Button>
        <Button variant="secondary" size="md" onclick={createCampaign}>Raise a Campaign</Button>
      </div>
    </section>

    <section class="hall-plot hall-plot-camps" aria-label="Campaigns">
      <header class="hall-divide">
        <h2 class="dnd-label hall-divide-name">Campaigns</h2>
        <span class="hall-divide-note">{$userCampaigns.length} under way</span>
        <span class="hall-divide-run"></span>
        <input
          type="text"
          class="dnd-search hall-divide-search"
          placeholder="Search the chronicles..."
          aria-label="Search campaigns"
          bind:value={campaignSearch}
        />
        <Sigil title="Raise a new campaign" tone="verdigris" size="sm" onclick={createCampaign} frame="plate"><Glyph name="campaign" size="sm" /></Sigil>
      </header>
      <CampaignsPanel {loading} search={campaignSearch} />
    </section>

    <section class="hall-plot hall-plot-roll" aria-label="Characters">
      <header class="hall-divide">
        <h2 class="dnd-label hall-divide-name">Characters</h2>
        <span class="hall-divide-note">{$userCharacters.length} on the roll</span>
        <span class="hall-divide-run"></span>
        <input
          type="text"
          class="dnd-search hall-divide-search"
          placeholder="Search the roll..."
          aria-label="Search characters"
          bind:value={characterSearch}
        />
        <Sigil title="Forge a new character" tone="ember" size="sm" onclick={createCharacter} frame="star"><Glyph name="character" size="sm" /></Sigil>
      </header>
      <CharactersPanel {loading} search={characterSearch} />
    </section>

    <section class="hall-plot hall-plot-lore" aria-label="Lore">
      <header class="hall-divide">
        <h2 class="dnd-label hall-divide-name">Lore</h2>
        <span class="hall-divide-note">what the campaigns hold</span>
        <span class="hall-divide-run"></span>
      </header>
      <LorePanel {loading} {errands} {chronicles} {charts} {figures} {haunts} {frays} />
    </section>

    <aside class="hall-plot hall-plot-friends" aria-label="Friends">
      <header class="hall-divide">
        <h2 class="dnd-label hall-divide-name">Friends</h2>
        <span class="hall-divide-note">{friends.length} known</span>
        <span class="hall-divide-run"></span>
      </header>
      <FriendsPanel {loading} {friends} />
    </aside>
  </div>
</Shell>

<style>
  .hall-hero {
    grid-area: hero;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    min-width: 0;
    padding-bottom: var(--space-4);
    border-bottom: var(--border-hair) solid var(--metal-dim);
  }

  .hall-hero-word {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    min-width: 0;
  }

  .hall-hero-eyebrow {
    margin: 0;
    color: var(--ink-faint);
  }

  .hall-hero-name {
    font-size: var(--text-2xl);
    letter-spacing: var(--tracking-caps);
    overflow-wrap: anywhere;
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
    gap: var(--space-3);
  }

  .hall-error {
    display: flex;
    align-items: center;
    gap: var(--space-3);
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
    display: flex;
    flex: none;
  }

  .hall-error-text {
    flex: 1;
    min-width: 0;
    margin: 0;
    font-size: var(--text-sm);
    color: var(--ink);
    overflow-wrap: anywhere;
  }

  .hall-grid {
    --hall-side: calc(var(--space-8) * 3);
    --hall-side-share: 22%;
    --hall-search: calc(var(--space-8) * 3);
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(min(var(--hall-side), 100%), var(--hall-side-share));
    grid-template-rows: auto auto auto minmax(0, 1fr);
    grid-template-areas:
      'hero friends'
      'camps friends'
      'roll friends'
      'lore friends';
    column-gap: var(--space-6);
    row-gap: var(--space-6);
    min-width: 0;
  }

  .hall-plot {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    min-width: 0;
  }

  .hall-plot-camps {
    grid-area: camps;
  }

  .hall-plot-roll {
    grid-area: roll;
  }

  .hall-plot-lore {
    grid-area: lore;
  }

  .hall-plot-friends {
    grid-area: friends;
    align-self: stretch;
    padding-inline-start: var(--space-5);
    border-inline-start: var(--border-hair) solid var(--metal-dim);
  }

  .hall-divide {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
    min-width: 0;
  }

  .hall-divide-name {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--metal-bright);
  }

  .hall-divide-note {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--ink-faint);
  }

  .hall-divide-run {
    flex: 1;
    min-width: 0;
    height: var(--border-hair);
    background: linear-gradient(90deg, var(--metal-dim), transparent);
  }

  .hall-divide-search {
    flex: 0 1 var(--hall-search);
    width: auto;
    min-width: 0;
  }

  @media (max-width: 1100px) {
    .hall-grid {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: none;
      grid-template-areas:
        'hero'
        'camps'
        'roll'
        'lore'
        'friends';
    }

    .hall-plot-friends {
      padding-inline-start: 0;
      padding-top: var(--space-5);
      border-inline-start: none;
      border-top: var(--border-hair) solid var(--metal-dim);
    }
  }
</style>
