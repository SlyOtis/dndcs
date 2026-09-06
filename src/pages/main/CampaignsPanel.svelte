<script lang="ts">
  import { navigate } from "sly-svelte-location-router";
  import { userCampaigns } from "$lib/stores/campaign.store";
  import Rail from "$components/ui/Rail.svelte";
  import Card from "$components/ui/Card.svelte";
  import Sigil from "$components/ui/Sigil.svelte";
  import Glyph from "$components/ui/Glyph.svelte";

  let { loading = false } = $props();

  let search = $state('');

  let shown = $derived($userCampaigns.filter((entry) =>
    entry.name.toLowerCase().includes(search.toLowerCase()) ||
    entry.description.toLowerCase().includes(search.toLowerCase())
  ));

  function createCampaign() {
    navigate('/main/create/campaign');
  }

  function openCampaign(campaignId: string) {
    navigate(`/campaign/${campaignId}`);
  }
</script>

<Rail
  title="Campaigns"
  note="{$userCampaigns.length} under way"
  tone="verdigris"
  mark="🏰"
  empty="No chronicle has been opened"
  count={shown.length}
  {loading}
>
  {#snippet actions()}
    <input
      type="text"
      class="dnd-search"
      placeholder="Search the chronicles..."
      aria-label="Search campaigns"
      bind:value={search}
    />
    <Sigil title="Raise a new campaign" tone="verdigris" size="sm" onclick={createCampaign} frame="plate"><Glyph name="campaign" size="sm" /></Sigil>
  {/snippet}

  {#each shown as entry (entry.id)}
    <Card
      layout="tile"
      title={entry.name}
      sub={entry.description}
      tone="verdigris"
      badge={entry.is_active ? 'live' : undefined}
      onclick={() => openCampaign(entry.id)}
    >
      <span>Players {entry.player_ids.length}</span>
      <span>Heroes {entry.character_ids.length}</span>
    </Card>
  {/each}
</Rail>
