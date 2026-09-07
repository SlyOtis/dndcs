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
    PartyMember
  } from "$lib/firestore.types";
  import { getCatalog, type CatalogEntry } from "$lib/catalog";
  import MenuPanel from "$components/MenuPanel.svelte";
  import Chat from "$chat/Chat.svelte";
  import { sidebarStore } from "$lib/navigation";
  import { uiStore, anyDialogOpen } from "$lib/stores/ui.store";
  import { userCharacters } from "$lib/stores/character.store";
  import { userCampaigns } from "$lib/stores/campaign.store";
  import { characterService, campaignService } from "$lib/firestore.service";
  import { userProfile, userDetails } from "$lib/stores/auth.store";
  import { navigate } from "sly-svelte-location-router";
  import CharactersPanel from "./main/CharactersPanel.svelte";
  import CampaignsPanel from "./main/CampaignsPanel.svelte";
  import ChroniclesPanel from "./main/ChroniclesPanel.svelte";
  import QuestsPanel from "./main/QuestsPanel.svelte";
  import PartyPanel from "./main/PartyPanel.svelte";
  import MapsPanel from "./main/MapsPanel.svelte";
  import CastPanel from "./main/CastPanel.svelte";
  import PlacesPanel from "./main/PlacesPanel.svelte";
  import EncountersPanel from "./main/EncountersPanel.svelte";
  import CatalogPanel from "./main/CatalogPanel.svelte";
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
  let party = $state<PartyMember[]>([]);
  let charts = $state<CampaignChart[]>([]);
  let figures = $state<CampaignFigure[]>([]);
  let haunts = $state<CampaignHaunt[]>([]);
  let frays = $state<CampaignFray[]>([]);
  let classes = $state<CatalogEntry[]>([]);
  let races = $state<CatalogEntry[]>([]);

  const name = $derived($userDetails?.display_name || $userProfile?.display_name || 'Adventurer');

  onMount(async () => {
    setTheme(getTheme());

    try {
      const [characters, campaigns] = await Promise.all([
        characterService.getUserCharacters(),
        campaignService.getUserCampaigns()
      ]);
      userCharacters.set(characters);
      userCampaigns.set(campaigns);

      const [sessions, quests, members, maps, npcs, locations, encounters, shelfClasses, shelfRaces] =
        await Promise.all([
          campaignService.getRecentSessions(campaigns),
          campaignService.getActiveQuests(campaigns),
          campaignService.getPartyMembers(campaigns),
          campaignService.getChartedMaps(campaigns),
          campaignService.getKnownNpcs(campaigns),
          campaignService.getKnownLocations(campaigns),
          campaignService.getRecentEncounters(campaigns),
          getCatalog('classes'),
          getCatalog('races')
        ]);
      chronicles = sessions;
      errands = quests;
      party = members;
      charts = maps;
      figures = npcs;
      haunts = locations;
      frays = encounters;
      classes = shelfClasses;
      races = shelfRaces;
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

    <div class="hall-plot hall-plot-roll"><CharactersPanel {loading} /></div>
    <div class="hall-plot hall-plot-camps"><CampaignsPanel {loading} /></div>
    <div class="hall-plot hall-plot-chron"><ChroniclesPanel {loading} {chronicles} /></div>
    <div class="hall-plot hall-plot-quests"><QuestsPanel {loading} {errands} /></div>
    <div class="hall-plot hall-plot-party"><PartyPanel {loading} members={party} /></div>
    <div class="hall-plot hall-plot-maps"><MapsPanel {loading} {charts} /></div>
    <div class="hall-plot hall-plot-cast"><CastPanel {loading} {figures} /></div>
    <div class="hall-plot hall-plot-places"><PlacesPanel {loading} {haunts} /></div>
    <div class="hall-plot hall-plot-fights"><EncountersPanel {loading} {frays} /></div>
    <div class="hall-plot hall-plot-shelf"><CatalogPanel {loading} {classes} {races} /></div>
  </div>
</Shell>

<style>
  .hall-hero {
    --hall-rule-run: calc(var(--space-8) * 6);
    --hall-rule-share: 70%;
    grid-area: hero;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
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
    width: min(var(--hall-rule-run), var(--hall-rule-share));
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
    --hall-col: var(--space-8);
    --hall-wide: calc(var(--space-8) * 5);
    --hall-tall: calc(var(--space-8) * 5);
    --hall-run: calc(var(--space-8) * 4);
    display: grid;
    grid-template-columns: repeat(4, minmax(min(var(--hall-col), 100%), 1fr));
    grid-template-rows:
      auto
      minmax(var(--hall-tall), auto)
      minmax(var(--hall-run), auto)
      minmax(var(--hall-run), auto);
    grid-template-areas:
      'hero hero hero hero'
      'roll roll camps camps'
      'chron quests party maps'
      'cast places fights shelf';
    gap: var(--space-5);
    min-width: 0;
  }

  .hall-plot {
    display: grid;
    min-width: 0;
    min-height: 0;
  }

  .hall-plot-roll {
    grid-area: roll;
  }

  .hall-plot-camps {
    grid-area: camps;
  }

  .hall-plot-chron {
    grid-area: chron;
  }

  .hall-plot-quests {
    grid-area: quests;
  }

  .hall-plot-party {
    grid-area: party;
  }

  .hall-plot-maps {
    grid-area: maps;
  }

  .hall-plot-cast {
    grid-area: cast;
  }

  .hall-plot-places {
    grid-area: places;
  }

  .hall-plot-fights {
    grid-area: fights;
  }

  .hall-plot-shelf {
    grid-area: shelf;
  }

  @media (max-width: 1200px) {
    .hall-grid {
      grid-template-columns: repeat(auto-fit, minmax(min(var(--hall-wide), 100%), 1fr));
      grid-template-rows: none;
      grid-template-areas: none;
    }

    .hall-plot {
      grid-area: auto;
      min-height: var(--hall-run);
    }

    .hall-hero {
      grid-area: auto;
      grid-column: 1 / -1;
    }
  }
</style>
