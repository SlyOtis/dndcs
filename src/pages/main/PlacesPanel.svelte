<script lang="ts">
  import { navigate } from "sly-svelte-location-router";
  import type { CampaignHaunt } from "$lib/firestore.types";
  import Panel from "$components/ui/Panel.svelte";
  import Card from "$components/ui/Card.svelte";

  let { loading = false, haunts = [] as CampaignHaunt[] } = $props();

  function openCampaign(campaignId: string) {
    navigate(`/campaign/${campaignId}`);
  }
</script>

<Panel title="Places" pad="sm">
  {#if loading}
    <div class="dnd-loading"><span class="dnd-spinner"></span></div>
  {:else if haunts.length === 0}
    <div class="dnd-empty">
      <span class="dnd-empty-mark">🏔</span>
      <span>No ground has been charted by name</span>
    </div>
  {:else}
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
  {/if}
</Panel>
