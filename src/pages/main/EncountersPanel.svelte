<script lang="ts">
  import { navigate } from "sly-svelte-location-router";
  import type { CampaignFray } from "$lib/firestore.types";
  import Panel from "$components/ui/Panel.svelte";
  import Card from "$components/ui/Card.svelte";

  let { loading = false, frays = [] as CampaignFray[] } = $props();

  function openCampaign(campaignId: string) {
    navigate(`/campaign/${campaignId}`);
  }
</script>

<Panel title="Encounters" pad="sm">
  {#if loading}
    <div class="dnd-loading"><span class="dnd-spinner"></span></div>
  {:else if frays.length === 0}
    <div class="dnd-empty">
      <span class="dnd-empty-mark">💀</span>
      <span>No steel has been drawn yet</span>
    </div>
  {:else}
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
  {/if}
</Panel>
