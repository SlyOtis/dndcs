<script lang="ts">
  import { onMount } from 'svelte';
  
  interface CampaignMetadata {
    name: string;
    description: string;
    version: string;
    created: string;
    lastModified: string;
    dmName: string;
    setting: string;
    startLevel: number;
    currentLevel: number;
  }

  interface Campaign {
    metadata: CampaignMetadata;
    settings: any;
    world: any;
    story: any;
    sessions: any[];
    calendar: any;
    homebrew: any;
  }

  let campaign: Campaign | null = null;
  let loading = true;
  let error: string | null = null;

  onMount(async () => {
    try {
      // For now, we don't have campaign data loading logic
      // In a real app, this would load the selected campaign
      loading = false;
    } catch (err) {
      error = 'Failed to load campaign data';
      loading = false;
    }
  });

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
</script>

<div class="campaign-container">
  {#if loading}
    <div class="loading">Loading campaign...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else if !campaign}
    <div class="no-campaign">
      <h2>No Campaign Loaded</h2>
      <p>Create a new campaign or load an existing one to get started.</p>
      <div class="actions">
        <button class="btn-primary">Create New Campaign</button>
        <button class="btn-secondary">Load Campaign</button>
      </div>
    </div>
  {:else}
    <div class="campaign-header">
      <h1>{campaign.metadata.name}</h1>
      <div class="campaign-info">
        <div class="info-item">
          <div class="info-label">DM:</div>
          <span>{campaign.metadata.dmName}</span>
        </div>
        <div class="info-item">
          <div class="info-label">Setting:</div>
          <span>{campaign.metadata.setting}</span>
        </div>
        <div class="info-item">
          <div class="info-label">Level:</div>
          <span>{campaign.metadata.currentLevel}</span>
        </div>
        <div class="info-item">
          <div class="info-label">Created:</div>
          <span>{formatDate(campaign.metadata.created)}</span>
        </div>
      </div>
      <p class="description">{campaign.metadata.description}</p>
    </div>

    <div class="campaign-tabs">
      <button class="tab active">Overview</button>
      <button class="tab">World</button>
      <button class="tab">Story</button>
      <button class="tab">Sessions</button>
      <button class="tab">Settings</button>
      <button class="tab">Homebrew</button>
    </div>

    <div class="campaign-content">
      <div class="overview-grid">
        <div class="card">
          <h3>Recent Sessions</h3>
          <div class="session-list">
            {#if campaign.sessions && campaign.sessions.length > 0}
              {#each campaign.sessions.slice(-3) as session}
                <div class="session-item">
                  <div class="session-date">{formatDate(session.date)}</div>
                  <div class="session-summary">{session.summary}</div>
                </div>
              {/each}
            {:else}
              <p class="empty">No sessions recorded yet</p>
            {/if}
          </div>
        </div>

        <div class="card">
          <h3>Active Quests</h3>
          <div class="quest-list">
            {#if campaign.story?.sideQuests}
              {#each campaign.story.sideQuests.filter(q => q.status === 'active') as quest}
                <div class="quest-item">
                  <div class="quest-title">{quest.title}</div>
                  <div class="quest-level">Level {quest.level}</div>
                </div>
              {/each}
            {:else}
              <p class="empty">No active quests</p>
            {/if}
          </div>
        </div>

        <div class="card">
          <h3>World Locations</h3>
          <div class="location-list">
            {#if campaign.world?.locations}
              {#each campaign.world.locations.slice(0, 5) as location}
                <div class="location-item">
                  <div class="location-name">{location.name}</div>
                  <div class="location-type">{location.type}</div>
                </div>
              {/each}
            {:else}
              <p class="empty">No locations defined</p>
            {/if}
          </div>
        </div>

        <div class="card">
          <h3>Important NPCs</h3>
          <div class="npc-list">
            {#if campaign.world?.npcs}
              {#each campaign.world.npcs.slice(0, 5) as npc}
                <div class="npc-item">
                  <div class="npc-name">{npc.name}</div>
                  <div class="npc-info">{npc.race} {npc.class || npc.occupation}</div>
                </div>
              {/each}
            {:else}
              <p class="empty">No NPCs defined</p>
            {/if}
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .campaign-container {
    padding: 1rem 1rem 3rem 1rem;
    max-width: 1200px;
    margin: 0 auto;
    height: 100%;
    overflow-y: auto;
  }

  .loading, .error {
    text-align: center;
    padding: 2rem;
    font-size: 1.2rem;
  }

  .error {
    color: #dc3545;
  }

  .no-campaign {
    text-align: center;
    padding: 3rem;
  }

  .no-campaign h2 {
    margin-bottom: 1rem;
    color: #333;
  }

  .no-campaign p {
    margin-bottom: 2rem;
    color: #666;
  }

  .actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }

  .btn-primary, .btn-secondary {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.2s;
  }

  .btn-primary {
    background-color: #007bff;
    color: white;
  }

  .btn-primary:hover {
    background-color: #0056b3;
  }

  .btn-secondary {
    background-color: #6c757d;
    color: white;
  }

  .btn-secondary:hover {
    background-color: #545b62;
  }

  .campaign-header {
    margin-bottom: 2rem;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 1rem;
  }

  .campaign-header h1 {
    margin: 0 0 1rem 0;
    color: #333;
  }

  .campaign-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .info-item {
    display: flex;
    gap: 0.5rem;
  }

  .info-label {
    font-weight: bold;
    color: #666;
  }

  .description {
    color: #666;
    line-height: 1.5;
  }

  .campaign-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    border-bottom: 1px solid #e0e0e0;
  }

  .tab {
    padding: 0.75rem 1rem;
    border: none;
    background: none;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
  }

  .tab:hover {
    background-color: #f8f9fa;
  }

  .tab.active {
    border-bottom-color: #007bff;
    color: #007bff;
    font-weight: bold;
  }

  .overview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
  }

  .card {
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 0.5rem;
    padding: 1rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .card h3 {
    margin: 0 0 1rem 0;
    color: #333;
    border-bottom: 1px solid #f0f0f0;
    padding-bottom: 0.5rem;
  }

  .session-item, .quest-item, .location-item, .npc-item {
    padding: 0.5rem 0;
    border-bottom: 1px solid #f5f5f5;
  }

  .session-item:last-child, .quest-item:last-child, 
  .location-item:last-child, .npc-item:last-child {
    border-bottom: none;
  }

  .session-date, .quest-level, .location-type, .npc-info {
    font-size: 0.875rem;
    color: #666;
  }

  .session-summary, .quest-title, .location-name, .npc-name {
    font-weight: 500;
    color: #333;
  }

  .empty {
    color: #999;
    font-style: italic;
    text-align: center;
    padding: 1rem;
  }
</style>