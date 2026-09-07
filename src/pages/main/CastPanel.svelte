<script lang="ts">
  import { navigate } from "sly-svelte-location-router";
  import type { CampaignFigure } from "$lib/firestore.types";
  import Panel from "$components/ui/Panel.svelte";
  import Card from "$components/ui/Card.svelte";

  let { loading = false, figures = [] as CampaignFigure[] } = $props();

  function openCampaign(campaignId: string) {
    navigate(`/campaign/${campaignId}`);
  }
</script>

<Panel title="Cast" pad="sm">
  {#if loading}
    <div class="dnd-loading"><span class="dnd-spinner"></span></div>
  {:else if figures.length === 0}
    <div class="dnd-empty">
      <span class="dnd-empty-mark">🎭</span>
      <span>No soul has been named</span>
    </div>
  {:else}
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
  {/if}
</Panel>
