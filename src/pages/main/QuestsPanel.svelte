<script lang="ts">
  import { navigate } from "sly-svelte-location-router";
  import type { CampaignErrand } from "$lib/firestore.types";
  import Rail from "$components/ui/Rail.svelte";
  import Card from "$components/ui/Card.svelte";

  let { loading = false, errands = [] as CampaignErrand[] } = $props();

  function openCampaign(campaignId: string) {
    navigate(`/campaign/${campaignId}`);
  }
</script>

<Rail
  title="Quests"
  note="what the parties chase now"
  tone="verdigris"
  mark="🗡"
  empty="No quest stands open"
  count={errands.length}
  {loading}
>
  {#each errands as entry (entry.campaign_id + entry.quest.id)}
    <Card
      layout="tile"
      title={entry.quest.title}
      sub={entry.campaign_name}
      badge={entry.quest.level ? `lv ${entry.quest.level}` : undefined}
      tone="verdigris"
      onclick={() => openCampaign(entry.campaign_id)}
    >
      <span>{entry.quest.state}</span>
    </Card>
  {/each}
</Rail>
