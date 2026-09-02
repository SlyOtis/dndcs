<script lang="ts">
  import { navigate } from "sly-svelte-location-router";
  import { userCharacters } from "$lib/stores/character.store";
  import type { CharacterDocument } from "$lib/firestore.types";

  let { loading = false } = $props();
  
  let characterSearch = $state('');
  
  let filteredCharacters = $derived($userCharacters.filter(char => 
    char.metadata.name.toLowerCase().includes(characterSearch.toLowerCase()) ||
    char.metadata.class.toLowerCase().includes(characterSearch.toLowerCase()) ||
    char.metadata.race.toLowerCase().includes(characterSearch.toLowerCase())
  ));

  function createNewCharacter() {
    navigate('/main/create/character');
  }

  function openCharacter(characterId: string) {
    navigate(`/character/${characterId}`);
  }
</script>

<div class="panel">
  <div class="panel-header">
    <h2>Characters</h2>
    <div class="panel-actions">
      <input 
        type="text" 
        placeholder="Search characters..." 
        class="search-input"
        bind:value={characterSearch}
      />
      <button class="create-btn" onclick={createNewCharacter}>
        <span>⚔️</span>
      </button>
    </div>
  </div>
  
  <div class="panel-content">
    {#if loading}
      <div class="loading-small">
        <div class="spinner"></div>
      </div>
    {:else if filteredCharacters.length === 0}
      <div class="empty-panel">
        <span class="empty-icon">🎲</span>
        <p>No characters found</p>
      </div>
    {:else}
      {#each filteredCharacters as character (character.id)}
        <button type="button" class="item-card" onclick={() => openCharacter(character.id)}>
          <div class="item-image">
            {#if character.character.info?.imageUrl}
              <img src={character.character.info?.imageUrl} alt={character.metadata.name} />
            {:else}
              <div class="placeholder">
                {character.metadata.name.charAt(0).toUpperCase()}
              </div>
            {/if}
          </div>
          <div class="item-info">
            <h4>{character.metadata.name}</h4>
            <p>Level {character.metadata.level} {character.metadata.race} {character.metadata.class}</p>
            <div class="item-stats">
              <span>HP: {character.character.info?.hp?.current || 0}/{character.character.info?.hp?.max || 0}</span>
              <span>AC: {character.character.info?.ac || 10}</span>
            </div>
          </div>
        </button>
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
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .item-card:hover {
    border-color: var(--color-primary-main);
    background: rgba(255, 215, 0, 0.1);
    transform: translateY(-1px);
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

  .item-stats {
    display: flex;
    gap: 1rem;
    font-size: 0.8rem;
    color: var(--color-secondary-text);
  }
</style>