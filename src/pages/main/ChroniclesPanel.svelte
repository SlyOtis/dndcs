<script lang="ts">
  import { navigate } from "sly-svelte-location-router";
  import type { CampaignChronicle } from "$lib/firestore.types";
  import Rail from "$components/ui/Rail.svelte";
  import Card from "$components/ui/Card.svelte";

  let { loading = false, chronicles = [] as CampaignChronicle[] } = $props();

  function openCampaign(campaignId: string) {
    navigate(`/campaign/${campaignId}`);
  }
</script>

<Rail
  title="Chronicles"
  note="the latest word from the table"
  tone="ember"
  mark="📜"
  empty="No session has been written down"
  count={chronicles.length}
  {loading}
>
  {#each chronicles as entry (entry.campaign_id + entry.session.id)}
    <Card
      layout="tile"
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
</Rail>
