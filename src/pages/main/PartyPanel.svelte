<script lang="ts">
  import { navigate } from "sly-svelte-location-router";
  import type { PartyMember } from "$lib/firestore.types";
  import Rail from "$components/ui/Rail.svelte";
  import Card from "$components/ui/Card.svelte";

  let { loading = false, members = [] as PartyMember[] } = $props();

  let search = $state('');

  let shown = $derived(members.filter((entry) =>
    entry.profile.display_name.toLowerCase().includes(search.toLowerCase()) ||
    entry.profile.email.toLowerCase().includes(search.toLowerCase()) ||
    entry.campaign_name.toLowerCase().includes(search.toLowerCase())
  ));

  function openCampaign(campaignId: string) {
    navigate(`/campaign/${campaignId}`);
  }
</script>

<Rail
  title="Party"
  note="{members.length} at the table"
  tone="metal"
  mark="🛡"
  empty="Nobody rides with you yet"
  count={shown.length}
  {loading}
>
  {#snippet actions()}
    <input
      type="text"
      class="dnd-search"
      placeholder="Search the party..."
      aria-label="Search the party"
      bind:value={search}
    />
  {/snippet}

  {#each shown as entry (entry.campaign_id + entry.profile.uid)}
    <Card
      layout="tile"
      title={entry.profile.display_name || entry.profile.email}
      sub={entry.campaign_name}
      image={entry.profile.photo_url}
      badge={entry.is_dm ? 'DM' : undefined}
      tone="metal"
      onclick={() => openCampaign(entry.campaign_id)}
    />
  {/each}
</Rail>
