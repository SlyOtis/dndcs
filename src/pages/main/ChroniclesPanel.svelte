<script lang="ts">
  import { navigate } from "sly-svelte-location-router";
  import type { CampaignChronicle } from "$lib/firestore.types";
  import Panel from "$components/ui/Panel.svelte";
  import Card from "$components/ui/Card.svelte";

  let { loading = false, chronicles = [] as CampaignChronicle[] } = $props();

  function openCampaign(campaignId: string) {
    navigate(`/campaign/${campaignId}`);
  }
</script>

<Panel title="Chronicles" pad="sm">
  {#if loading}
    <div class="dnd-loading"><span class="dnd-spinner"></span></div>
  {:else if chronicles.length === 0}
    <div class="dnd-empty">
      <span class="dnd-empty-mark">📜</span>
      <span>No session has been written down</span>
    </div>
  {:else}
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
  {/if}
</Panel>
