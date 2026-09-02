<script lang="ts">
  import { postUIAction } from "$lib/chat";
  import { user, userProfile } from "$lib/stores/auth.store";
  import { userCharacters } from "$lib/stores/character.store";
  import { userCampaigns } from "$lib/stores/campaign.store";
  import { authService } from "$lib/auth.service";
  import { navigate, currentRoute } from "sly-svelte-location-router";

  let { onNavigateToSoundboard, onSelectCharacter } = $props<{
    onNavigateToSoundboard: () => void;
    onSelectCharacter?: (characterId: string) => void;
  }>();

  let campaignsExpanded = $state(false);
  let charactersExpanded = $state(false);
  
  // Get current section from route
  const currentSection = $derived.by(() => {
    if ($currentRoute.path.includes('/campaign')) return 'campaign';
    return 'character';
  });

  function exportCharacter() {
    postUIAction('exportCharacter');
  }

  function levelUp() {
    postUIAction('openLevelUpDialog');
  }

  function openThemes() {
    postUIAction('openThemeDialog');
  }

  function openSources() {
    postUIAction('openSourceImport');
  }

  function toggleCampaigns() {
    campaignsExpanded = !campaignsExpanded;
  }

  function toggleCharacters() {
    charactersExpanded = !charactersExpanded;
  }

  function selectCharacter(characterId: string) {
    if (onSelectCharacter) {
      onSelectCharacter(characterId);
    }
    navigate(`/character/${characterId}`);
  }

  function createNewCharacter() {
    navigate('/main/create/character');
  }

  function createNewCampaign() {
    navigate('/main/create/campaign');
  }

  function selectCampaign(campaignId: string) {
    navigate(`/campaign/${campaignId}`);
  }

  async function signOut() {
    try {
      await authService.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }
</script>

<div class="main-menu">
  <!-- User Info Section -->
  <div class="user-info">
    {#if $userProfile}
      <div class="user-avatar">
        {#if $userProfile.photo_url}
          <img src={$userProfile.photo_url} alt="User avatar" />
        {:else}
          <div class="avatar-placeholder">
            {$userProfile.display_name?.charAt(0) || $userProfile.email?.charAt(0) || '?'}
          </div>
        {/if}
      </div>
      <div class="user-details">
        <h3>{$userProfile.display_name || 'User'}</h3>
        <p>{$userProfile.email}</p>
        <div class="user-actions">
          <button class="sign-out-btn" onclick={() => navigate('/user')}>Account and integrations</button>
          <button class="sign-out-btn" onclick={signOut}>Sign Out</button>
        </div>
      </div>
    {:else}
      <div class="user-loading">Loading user info...</div>
    {/if}
  </div>

  <div class="menu-sections">
    <!-- Campaigns Section -->
    <div class="menu-section" class:active={currentSection === 'campaign'}>
      <button class="section-header" onclick={toggleCampaigns}>
        <svg class="expand-icon" class:expanded={campaignsExpanded} viewBox="0 0 24 24" fill="currentColor">
          <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
        </svg>
        <svg class="section-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,2L13.09,6.26L18,7L13.09,7.74L12,12L10.91,7.74L6,7L10.91,6.26L12,2M12,15L13.09,19.26L18,20L13.09,20.74L12,25L10.91,20.74L6,20L10.91,19.26L12,15Z" />
        </svg>
        Campaigns ({$userCampaigns.length})
      </button>
      
      {#if campaignsExpanded}
        <div class="section-content">
          {#each $userCampaigns as campaign}
            <button class="item-button campaign-item" onclick={() => selectCampaign(campaign.id)}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z" />
              </svg>
              <div class="item-details">
                <span class="item-name">{campaign.name}</span>
                <span class="item-meta">{campaign.player_ids.length} players</span>
              </div>
            </button>
          {:else}
            <div class="empty-state">No campaigns yet</div>
          {/each}
          
          <button class="create-button" onclick={createNewCampaign}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
            </svg>
            Create New Campaign
          </button>
        </div>
      {/if}
    </div>

    <!-- Characters Section -->
    <div class="menu-section" class:active={currentSection === 'character'}>
      <button class="section-header" onclick={toggleCharacters}>
        <svg class="expand-icon" class:expanded={charactersExpanded} viewBox="0 0 24 24" fill="currentColor">
          <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
        </svg>
        <svg class="section-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
        </svg>
        Characters ({$userCharacters.length})
      </button>
      
      {#if charactersExpanded}
        <div class="section-content">
          {#each $userCharacters as character}
            <button class="item-button character-item" onclick={() => selectCharacter(character.id)}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
              </svg>
              <div class="item-details">
                <span class="item-name">{character.metadata.name}</span>
                <span class="item-meta">Level {character.metadata.level} {character.metadata.class}</span>
              </div>
            </button>
          {:else}
            <div class="empty-state">No characters yet</div>
          {/each}
          
          <button class="create-button" onclick={createNewCharacter}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
            </svg>
            Create New Character
          </button>
        </div>
      {/if}
    </div>
  </div>

  <!-- Action Buttons -->
  <div class="menu-actions">
    <button class="menu-button" onclick={exportCharacter}>
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
      </svg>
      Export Character
    </button>
    <button class="menu-button" onclick={levelUp}>
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M15,20A1,1 0 0,0 16,19V4H20A1,1 0 0,0 21,3A1,1 0 0,0 20,2H16C14.89,2 14,2.9 14,4V19A1,1 0 0,0 15,20M8,20A1,1 0 0,0 9,19V4H13A1,1 0 0,0 14,3A1,1 0 0,0 13,2H9C7.89,2 7,2.9 7,4V19A1,1 0 0,0 8,20M2,20A1,1 0 0,0 3,19V4H7A1,1 0 0,0 8,3A1,1 0 0,0 7,2H3C1.89,2 1,2.9 1,4V19A1,1 0 0,0 2,20Z" />
      </svg>
      Level Up
    </button>
    <button class="menu-button" onclick={openThemes}>
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12,3A9,9 0 0,0 3,12A9,9 0 0,0 12,21A1.02,1.02 0 0,0 13,20C13,19.75 12.9,19.5 12.8,19.3L12.5,18.9C12.5,18.6 12.6,18.3 12.8,18.1C13,17.9 13.3,17.8 13.6,17.8H16.2A4.8,4.8 0 0,0 21,13C21,7.04 16.96,3 12,3M6.5,12A1.5,1.5 0 0,1 8,10.5A1.5,1.5 0 0,1 9.5,12A1.5,1.5 0 0,1 8,13.5A1.5,1.5 0 0,1 6.5,12M10,7.5A1.5,1.5 0 0,1 11.5,6A1.5,1.5 0 0,1 13,7.5A1.5,1.5 0 0,1 11.5,9A1.5,1.5 0 0,1 10,7.5M16,7.5A1.5,1.5 0 0,1 17.5,6A1.5,1.5 0 0,1 19,7.5A1.5,1.5 0 0,1 17.5,9A1.5,1.5 0 0,1 16,7.5M14.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,12A1.5,1.5 0 0,1 16,13.5A1.5,1.5 0 0,1 14.5,12Z" />
      </svg>
      Change Theme
    </button>
    <button class="menu-button" onclick={openSources}>
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,5V19H5V5H19Z" />
      </svg>
      Import Sources
    </button>
    <button class="menu-button" onclick={onNavigateToSoundboard}>
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12,3V13.55C11.41,13.21 10.73,13 10,13A3,3 0 0,0 7,16A3,3 0 0,0 10,19A3,3 0 0,0 13,16V7H17V5H12Z" />
      </svg>
      Soundboard
    </button>
  </div>
</div>

<style>
  .main-menu {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 1rem;
    gap: 1rem;
    overflow-y: auto;
  }

  /* User Info Section */
  .user-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: var(--ground-raised);
    border-radius: 8px;
    border: 1px solid var(--metal);
  }

  .user-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
  }

  .user-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-placeholder {
    width: 100%;
    height: 100%;
    background: var(--metal);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ground);
    font-weight: bold;
    font-size: 1.2rem;
  }

  .user-details {
    flex: 1;
    min-width: 0;
  }

  .user-details h3 {
    margin: 0 0 0.25rem 0;
    color: var(--metal);
    font-size: 1.1rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-details p {
    margin: 0 0 0.5rem 0;
    color: var(--ink-dim);
    font-size: 0.85rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .sign-out-btn {
    background: transparent;
    border: 1px solid var(--ember);
    color: var(--ink-dim);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .sign-out-btn:hover {
    background: var(--ember);
    color: var(--ink);
  }

  .user-loading {
    color: var(--ink-dim);
    font-style: italic;
    text-align: center;
    padding: 1rem;
  }

  /* Menu Sections */
  .menu-sections {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-height: 0;
  }

  .menu-section {
    background: var(--ground);
    border: 1px solid var(--sheen-soft);
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.2s ease;
  }

  .menu-section.active {
    border-color: var(--metal);
    background: var(--ground-raised);
    box-shadow: 0 0 0 1px var(--metal);
  }

  .section-header {
    width: 100%;
    padding: 0.75rem 1rem;
    background: var(--ground-raised);
    border: none;
    color: var(--ink);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.95rem;
    font-weight: 500;
  }

  .section-header:hover {
    background: var(--ground-lift);
  }

  .expand-icon {
    width: 16px;
    height: 16px;
    transition: transform 0.2s ease;
  }

  .expand-icon.expanded {
    transform: rotate(90deg);
  }

  .section-icon {
    width: 18px;
    height: 18px;
    color: var(--metal);
  }

  .section-content {
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    max-height: 200px;
    overflow-y: auto;
  }

  .item-button {
    width: 100%;
    padding: 0.5rem 0.75rem;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 6px;
    color: var(--ink);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-align: left;
  }

  .item-button:hover {
    background: var(--ground-lift);
    border-color: var(--metal);
    transform: translateX(2px);
  }

  .item-button svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    color: var(--ember);
  }

  .item-details {
    flex: 1;
    min-width: 0;
  }

  .item-name {
    display: block;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 0.1rem;
  }

  .item-meta {
    display: block;
    font-size: 0.8rem;
    color: var(--ink-dim);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .empty-state {
    padding: 1rem;
    text-align: center;
    color: var(--ink-dim);
    font-style: italic;
    font-size: 0.9rem;
  }

  .create-button {
    width: 100%;
    padding: 0.75rem 1rem;
    background: var(--metal);
    border: 1px solid var(--metal-bright);
    border-radius: 6px;
    color: var(--ink);
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .create-button:hover {
    background: var(--metal-bright);
    transform: translateX(2px);
    box-shadow: 2px 2px 8px var(--shade-soft);
  }

  .create-button svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  /* Action Buttons */
  .menu-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: auto;
    padding-top: 1rem;
    border-top: 1px solid var(--sheen-soft);
  }

  .menu-button {
    padding: 0.75rem 1rem;
    background: var(--ground-raised);
    border: 1px solid var(--metal);
    border-radius: 8px;
    color: var(--ink);
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .menu-button:hover {
    background: var(--metal);
    transform: translateX(4px);
    box-shadow: 2px 2px 8px var(--shade-soft);
  }

  .menu-button svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    transition: transform 0.2s ease;
  }

  .menu-button:hover svg {
    transform: scale(1.1);
  }
</style>
