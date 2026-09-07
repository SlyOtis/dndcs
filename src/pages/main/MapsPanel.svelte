<script lang="ts">
  import { navigate } from "sly-svelte-location-router";
  import type { CampaignChart } from "$lib/firestore.types";
  import Panel from "$components/ui/Panel.svelte";
  import Card from "$components/ui/Card.svelte";

  let { loading = false, charts = [] as CampaignChart[] } = $props();

  function openCampaign(campaignId: string) {
    navigate(`/campaign/${campaignId}`);
  }
</script>

<Panel title="Maps" pad="sm">
  {#if loading}
    <div class="dnd-loading"><span class="dnd-spinner"></span></div>
  {:else if charts.length === 0}
    <div class="dnd-empty">
      <span class="dnd-empty-mark">🗺</span>
      <span>No land has been charted</span>
    </div>
  {:else}
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
  {/if}
</Panel>
