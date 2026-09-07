<script lang="ts">
  import { navigate } from "sly-svelte-location-router";
  import type { PartyMember } from "$lib/firestore.types";
  import Panel from "$components/ui/Panel.svelte";
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

<Panel title="Party" pad="sm">
  {#snippet actions()}
    <input
      type="text"
      class="dnd-search party-search"
      placeholder="Search the party..."
      aria-label="Search the party"
      bind:value={search}
    />
  {/snippet}

  {#if loading}
    <div class="dnd-loading"><span class="dnd-spinner"></span></div>
  {:else if shown.length === 0}
    <div class="dnd-empty">
      <span class="dnd-empty-mark">🛡</span>
      <span>Nobody rides with you yet</span>
    </div>
  {:else}
    {#each shown as entry (entry.campaign_id + entry.profile.uid)}
      <Card
        title={entry.profile.display_name || entry.profile.email}
        sub={entry.campaign_name}
        image={entry.profile.photo_url}
        badge={entry.is_dm ? 'DM' : undefined}
        tone="metal"
        onclick={() => openCampaign(entry.campaign_id)}
      />
    {/each}
  {/if}
</Panel>

<style>
  .party-search {
    width: 100%;
    min-width: 0;
  }
</style>
