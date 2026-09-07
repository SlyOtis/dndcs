<script lang="ts">
  import { navigate } from "sly-svelte-location-router";
  import type { CampaignErrand } from "$lib/firestore.types";
  import Panel from "$components/ui/Panel.svelte";
  import Card from "$components/ui/Card.svelte";

  let { loading = false, errands = [] as CampaignErrand[] } = $props();

  function openCampaign(campaignId: string) {
    navigate(`/campaign/${campaignId}`);
  }
</script>

<Panel title="Quests" pad="sm">
  {#if loading}
    <div class="dnd-loading"><span class="dnd-spinner"></span></div>
  {:else if errands.length === 0}
    <div class="dnd-empty">
      <span class="dnd-empty-mark">🗡</span>
      <span>No quest stands open</span>
    </div>
  {:else}
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
  {/if}
</Panel>
