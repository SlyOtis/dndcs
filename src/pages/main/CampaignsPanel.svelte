<script lang="ts">
  import { navigate } from "sly-svelte-location-router";
  import { userCampaigns } from "$lib/stores/campaign.store";
  import Panel from "$components/ui/Panel.svelte";
  import Card from "$components/ui/Card.svelte";
  import Sigil from "$components/ui/Sigil.svelte";

  let { loading = false } = $props();

  let campaignSearch = $state('');

  let filteredCampaigns = $derived($userCampaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(campaignSearch.toLowerCase()) ||
    campaign.description.toLowerCase().includes(campaignSearch.toLowerCase())
  ));

  function createNewCampaign() {
    navigate('/main/create/campaign');
  }

  function openCampaign(campaignId: string) {
    navigate(`/campaign/${campaignId}`);
  }
</script>

<Panel title="Campaigns" variant="stone">
  {#snippet actions()}
    <input
      type="text"
      class="dnd-search"
      placeholder="Search the chronicles..."
      aria-label="Search campaigns"
      bind:value={campaignSearch}
    />
    <Sigil title="Raise a new campaign" tone="verdigris" size="sm" onclick={createNewCampaign}>🏰</Sigil>
  {/snippet}

  {#if loading}
    <div class="dnd-loading"><span class="dnd-spinner"></span></div>
  {:else if filteredCampaigns.length === 0}
    <div class="dnd-empty">
      <span class="dnd-empty-mark">🏰</span>
      <p>No chronicles have been opened</p>
    </div>
  {:else}
    {#each filteredCampaigns as campaign (campaign.id)}
      <Card
        title={campaign.name}
        sub={campaign.description}
        tone="verdigris"
        onclick={() => openCampaign(campaign.id)}
      >
        <span>Players {campaign.player_ids.length}</span>
        <span>Characters {campaign.character_ids.length}</span>
      </Card>
    {/each}
  {/if}
</Panel>
