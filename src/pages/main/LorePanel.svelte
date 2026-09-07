<script lang="ts">
  import { navigate } from "sly-svelte-location-router";
  import type {
    CampaignChart,
    CampaignChronicle,
    CampaignErrand,
    CampaignFigure,
    CampaignFray,
    CampaignHaunt
  } from "$lib/firestore.types";
  import Card from "$components/ui/Card.svelte";

  let {
    loading = false,
    errands = [] as CampaignErrand[],
    chronicles = [] as CampaignChronicle[],
    charts = [] as CampaignChart[],
    figures = [] as CampaignFigure[],
    haunts = [] as CampaignHaunt[],
    frays = [] as CampaignFray[]
  } = $props();

  function openCampaign(campaignId: string) {
    navigate(`/campaign/${campaignId}`);
  }
</script>

{#if loading}
  <div class="dnd-loading"><span class="dnd-spinner"></span></div>
{:else}
  <div class="lore-list">
    <section class="lore-kind" aria-label="Quests">
      <h3 class="lore-divide">
        <span class="dnd-label lore-divide-name">Quests</span>
        <span class="lore-divide-run"></span>
        <span class="lore-divide-count">{errands.length}</span>
      </h3>
      {#if errands.length === 0}
        <p class="lore-none">No quest stands open</p>
      {/if}
      {#each errands as entry (entry.campaign_id + entry.quest.id)}
        <Card
          title={entry.quest.title}
          sub={entry.campaign_name}
          badge={entry.quest.level ? `lv ${entry.quest.level}` : undefined}
          tone="verdigris"
          onclick={() => openCampaign(entry.campaign_id)}
        >
          <span>{entry.quest.state}</span>
        </Card>
      {/each}
    </section>

    <section class="lore-kind" aria-label="Chronicles">
      <h3 class="lore-divide">
        <span class="dnd-label lore-divide-name">Chronicles</span>
        <span class="lore-divide-run"></span>
        <span class="lore-divide-count">{chronicles.length}</span>
      </h3>
      {#if chronicles.length === 0}
        <p class="lore-none">No session has been written down</p>
      {/if}
      {#each chronicles as entry (entry.campaign_id + entry.session.id)}
        <Card
          title={entry.session.title}
          sub={entry.campaign_name}
          badge="#{entry.session.number}"
          tone="ember"
          onclick={() => openCampaign(entry.campaign_id)}
        >
          <span>{entry.session.played_at}</span>
          <span>{entry.session.present_character_ids.length} present</span>
        </Card>
      {/each}
    </section>

    <section class="lore-kind" aria-label="Maps">
      <h3 class="lore-divide">
        <span class="dnd-label lore-divide-name">Maps</span>
        <span class="lore-divide-run"></span>
        <span class="lore-divide-count">{charts.length}</span>
      </h3>
      {#if charts.length === 0}
        <p class="lore-none">No land has been charted</p>
      {/if}
      {#each charts as entry (entry.campaign_id + entry.map.id)}
        <Card
          title={entry.map.title}
          sub={entry.campaign_name}
          image={entry.map.image_url}
          badge={entry.map.is_visible ? 'shown' : undefined}
          tone="verdigris"
          onclick={() => openCampaign(entry.campaign_id)}
        >
          <span>{entry.map.markers.length} pins</span>
          <span>{entry.map.layers.length} layers</span>
        </Card>
      {/each}
    </section>

    <section class="lore-kind" aria-label="Characters">
      <h3 class="lore-divide">
        <span class="dnd-label lore-divide-name">Characters</span>
        <span class="lore-divide-run"></span>
        <span class="lore-divide-count">{figures.length}</span>
      </h3>
      {#if figures.length === 0}
        <p class="lore-none">No soul has been named</p>
      {/if}
      {#each figures as entry (entry.campaign_id + entry.npc.id)}
        <Card
          title={entry.npc.name}
          sub={entry.campaign_name}
          image={entry.npc.image_url}
          badge={entry.npc.disposition}
          tone="metal"
          onclick={() => openCampaign(entry.campaign_id)}
        >
          <span>{entry.npc.role || 'unnamed part'}</span>
        </Card>
      {/each}
    </section>

    <section class="lore-kind" aria-label="Places">
      <h3 class="lore-divide">
        <span class="dnd-label lore-divide-name">Places</span>
        <span class="lore-divide-run"></span>
        <span class="lore-divide-count">{haunts.length}</span>
      </h3>
      {#if haunts.length === 0}
        <p class="lore-none">No ground has been charted by name</p>
      {/if}
      {#each haunts as entry (entry.campaign_id + entry.location.id)}
        <Card
          title={entry.location.name}
          sub={entry.campaign_name}
          badge={entry.location.kind}
          tone="verdigris"
          onclick={() => openCampaign(entry.campaign_id)}
        >
          <span>{entry.location.is_known ? 'found' : 'unfound'}</span>
        </Card>
      {/each}
    </section>

    <section class="lore-kind" aria-label="Encounters">
      <h3 class="lore-divide">
        <span class="dnd-label lore-divide-name">Encounters</span>
        <span class="lore-divide-run"></span>
        <span class="lore-divide-count">{frays.length}</span>
      </h3>
      {#if frays.length === 0}
        <p class="lore-none">No steel has been drawn yet</p>
      {/if}
      {#each frays as entry (entry.campaign_id + entry.encounter.id)}
        <Card
          title={entry.encounter.title}
          sub={entry.campaign_name}
          badge={entry.encounter.is_active ? 'live' : undefined}
          tone="ember"
          onclick={() => openCampaign(entry.campaign_id)}
        >
          <span>{entry.encounter.combatants.length} combatants</span>
          <span>Round {entry.encounter.round}</span>
        </Card>
      {/each}
    </section>
  </div>
{/if}

<style>
  .lore-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    min-width: 0;
  }

  .lore-kind {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    min-width: 0;
  }

  .lore-divide {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin: 0;
    padding-bottom: var(--space-1);
  }

  .lore-divide-name {
    flex: none;
    color: var(--metal);
  }

  .lore-divide-run {
    flex: 1;
    min-width: 0;
    height: var(--border-hair);
    background: linear-gradient(90deg, var(--metal-dim), transparent);
    opacity: 0.7;
  }

  .lore-divide-count {
    flex: none;
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--ink-faint);
  }

  .lore-none {
    margin: 0;
    padding: var(--space-1) 0 var(--space-2);
    font-size: var(--text-sm);
    color: var(--ink-faint);
  }
</style>
