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
  import { userProfile, userDetails } from "$lib/stores/auth.store";
  import { navigate } from "sly-svelte-location-router";
  import CharactersPanel from "./main/CharactersPanel.svelte";
  import CampaignsPanel from "./main/CampaignsPanel.svelte";
  import ChroniclesPanel from "./main/ChroniclesPanel.svelte";
  import QuestsPanel from "./main/QuestsPanel.svelte";
  import PartyPanel from "./main/PartyPanel.svelte";
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
      <span class="hall-error-mark"><Ornament name="skull" size="sm" tone="ember" /></span>
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
</Shell>

<style>
  .hall-hero {
    --hall-rule-run: calc(var(--space-8) * 6);
    --hall-rule-share: 70%;
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

  .hall-rails {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }
</style>
