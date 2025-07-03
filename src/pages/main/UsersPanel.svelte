<script lang="ts">
  import type { UserProfile } from "$lib/firestore.types";

  let { loading = false } = $props();
  
  let users = $state<UserProfile[]>([]);
  let userSearch = $state('');
  
  let filteredUsers = $derived(users.filter(user => 
    user.displayName.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearch.toLowerCase())
  ));

  function addFriend(userId: string) {
    console.log('Adding friend:', userId);
  }

  function inviteToCampaign(userId: string, campaignId: string) {
    console.log('Inviting user', userId, 'to campaign', campaignId);
  }

  function viewUserCharacters(userId: string) {
    console.log('Viewing characters for user:', userId);
  }
</script>

<div class="panel">
  <div class="panel-header">
    <h2>Users</h2>
    <div class="panel-actions">
      <input 
        type="text" 
        placeholder="Search users..." 
        class="search-input"
        bind:value={userSearch}
      />
    </div>
  </div>
  
  <div class="panel-content">
    {#if filteredUsers.length === 0}
      <div class="empty-panel">
        <span class="empty-icon">👥</span>
        <p>Search for users to connect</p>
      </div>
    {:else}
      {#each filteredUsers as user (user.uid)}
        <div class="item-card">
          <div class="item-image">
            {#if user.photoURL}
              <img src={user.photoURL} alt={user.displayName} />
            {:else}
              <div class="placeholder">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
            {/if}
          </div>
          <div class="item-info">
            <h4>{user.displayName}</h4>
            <p>{user.email}</p>
            <div class="user-actions">
              <button class="action-btn" on:click={() => addFriend(user.uid)}>
                Add Friend
              </button>
              <button class="action-btn" on:click={() => viewUserCharacters(user.uid)}>
                View Characters
              </button>
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

  .panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
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
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .item-card:hover {
    border-color: var(--color-primary-main);
    background: rgba(255, 215, 0, 0.1);
  }

  .item-image {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    overflow: hidden;
    border: 2px solid var(--color-primary-main);
    flex-shrink: 0;
  }

  .item-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .placeholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, var(--color-primary-main), var(--color-primary-light));
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    color: var(--color-primary-text);
  }

  .item-info {
    flex: 1;
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
  }

  .user-actions {
    display: flex;
    gap: 0.5rem;
  }

  .action-btn {
    padding: 0.3rem 0.6rem;
    background: var(--color-primary-main);
    border: none;
    border-radius: 4px;
    color: var(--color-primary-text);
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .action-btn:hover {
    background: var(--color-primary-light);
    transform: scale(1.05);
  }
</style>