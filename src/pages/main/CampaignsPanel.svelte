<script lang="ts">
  import { navigate } from "sly-svelte-location-router";
  import { userCampaigns } from "$lib/stores/campaign.store";
  import type { Campaign } from "$lib/firestore.types";

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

<div class="panel">
  <div class="panel-header">
    <h2>Campaigns</h2>
    <div class="panel-actions">
      <input 
        type="text" 
        placeholder="Search campaigns..." 
        class="search-input"
        bind:value={campaignSearch}
      />
      <button class="create-btn" on:click={createNewCampaign}>
        <span>🏰</span>
      </button>
    </div>
  </div>
  
  <div class="panel-content">
    {#if loading}
      <div class="loading-small">
        <div class="spinner"></div>
      </div>
    {:else if filteredCampaigns.length === 0}
      <div class="empty-panel">
        <span class="empty-icon">🏰</span>
        <p>No campaigns found</p>
      </div>
    {:else}
      {#each filteredCampaigns as campaign (campaign.id)}
        <div class="item-card" on:click={() => openCampaign(campaign.id)}>
          <div class="item-info">
            <h4>{campaign.name}</h4>
            <p>{campaign.description}</p>
            <div class="item-stats">
              <span>Players: {campaign.playerIds.length}</span>
              <span>Characters: {campaign.characterIds.length}</span>
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .panel {
    background: var(--color-content-dark);
    border: 2px solid var(--color-primary-main);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .panel-header {
    padding: 1rem;
    border-bottom: 1px solid rgba(255, 215, 0, 0.3);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .panel-header h2 {
    margin: 0;
    color: var(--color-primary-main);
    font-size: 1.5rem;
    font-weight: 700;
  }

  .panel-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .search-input {
    padding: 0.5rem;
    border: 1px solid var(--color-primary-main);
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.3);
    color: var(--color-primary-text);
    font-size: 0.9rem;
    width: 150px;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--color-primary-light);
    box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
  }

  .create-btn {
    padding: 0.5rem;
    background: var(--color-primary-main);
    border: none;
    border-radius: 6px;
    color: var(--color-primary-text);
    cursor: pointer;
    font-size: 1.2rem;
    transition: all 0.2s ease;
  }

  .create-btn:hover {
    background: var(--color-primary-light);
    transform: scale(1.05);
  }

  .panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .loading-small {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100px;
  }

  .spinner {
    width: 24px;
    height: 24px;
    border: 2px solid rgba(255, 215, 0, 0.3);
    border-top: 2px solid var(--color-primary-main);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .empty-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: var(--color-secondary-text);
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 0.5rem;
  }

  .item-card {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 215, 0, 0.2);
    border-radius: 8px;
    padding: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .item-card:hover {
    border-color: var(--color-primary-main);
    background: rgba(255, 215, 0, 0.1);
    transform: translateY(-1px);
  }

  .item-info h4 {
    margin: 0 0 0.25rem 0;
    color: var(--color-primary-main);
    font-size: 1rem;
    font-weight: 600;
  }

  .item-info p {
    margin: 0 0 0.5rem 0;
    color: var(--color-primary-text);
    font-size: 0.85rem;
    line-height: 1.4;
  }

  .item-stats {
    display: flex;
    gap: 1rem;
    font-size: 0.8rem;
    color: var(--color-secondary-text);
  }
</style>