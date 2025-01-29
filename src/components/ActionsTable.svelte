<script lang="ts">
  import type { Action } from '../types';
  
  export let actions: Action[] = [];
  
  const tabs = ['ALL', 'ATTACK', 'ACTION', 'BONUS ACTION', 'REACTION', 'OTHER', 'LIMITED USE'];
  let activeTab = 'ALL';

  let $searchQuery = '';
  
  let $filteredActions = $derived(actions.filter(action => {
    if ($searchQuery) {
      return action.name.toLowerCase().includes($searchQuery.toLowerCase());
    }
    return true;
  }));

  let $actionCategories = $derived([
    {
      title: 'ATTACK',
      actions: $filteredActions.filter(a => a.isWeapon)
    },
    {
      title: 'Actions in Combat',
      actions: $filteredActions.filter(a => !a.isWeapon)
    }
  ]);
</script>

<div class="actions-container">
  <div class="top-bar">
    <div class="search-bar">
      <input 
        type="text" 
        placeholder="Search Item Names, Types, Rarities, or Tags"
        bind:value={$searchQuery}
      >
      <button class="filter-button">
        <span class="filter-icon">▼</span>
      </button>
    </div>
    <button class="manage-button">MANAGE CUSTOM</button>
  </div>

  <div class="tabs">
    {#each tabs as tab}
      <button 
        class="tab-button" 
        class:active={activeTab === tab}
        on:click={() => activeTab = tab}
      >
        {tab}
      </button>
    {/each}
  </div>

  <div class="actions-content">
    {#each $actionCategories as category}
      {#if category.actions.length > 0}
        <div class="category-header">
          {#if category.title === 'ATTACK'}
            <div class="subtitle">ACTIONS • Attacks per Action: 1</div>
          {:else}
            <div class="category-title">{category.title}</div>
          {/if}
        </div>

        <div class="actions-table">
          {#if category.title === 'ATTACK'}
            <div class="table-header">
              <span class="attack-col">ATTACK</span>
              <span class="range-col">RANGE</span>
              <span class="hit-col">HIT / DC</span>
              <span class="damage-col">DAMAGE</span>
              <span class="notes-col">NOTES</span>
            </div>
          {/if}
          
          {#each category.actions as action}
            <div class="table-row">
              {#if action.isWeapon}
                <span class="attack-col weapon-name">{action.name}</span>
                <span class="range-col">{action.range}</span>
                <span class="hit-col">{action.toHit}</span>
                <span class="damage-col">{action.damage}</span>
                <span class="notes-col">{action.notes}</span>
              {:else}
                <span class="action-name">{action.name}</span>
                {#if action.description}
                  <div class="action-description">{action.description}</div>
                {/if}
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    {/each}
  </div>
</div>

<style>
  .actions-container {
    background-color: #1a1a1a;
    border-radius: 8px;
    overflow: hidden;
  }

  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #333;
  }

  .search-bar {
    display: flex;
    flex: 1;
    margin-right: 1rem;
  }

  .search-bar input {
    flex: 1;
    background-color: #2a2a2a;
    border: 1px solid #333;
    border-radius: 4px;
    padding: 0.5rem;
    color: #fff;
  }

  .filter-button {
    background: #2a2a2a;
    border: 1px solid #333;
    border-radius: 4px;
    padding: 0.5rem;
    margin-left: 0.5rem;
    color: #c4a000;
    cursor: pointer;
  }

  .tabs {
    display: flex;
    background-color: #2a2a2a;
    padding: 0.5rem 1rem 0;
    border-bottom: 2px solid #c4a000;
  }

  .tab-button {
    background: none;
    border: none;
    color: #666;
    padding: 0.5rem 1rem;
    cursor: pointer;
    border-radius: 4px 4px 0 0;
    margin-right: 0.25rem;
    font-size: 0.9rem;
  }

  .tab-button.active {
    background-color: #1a1a1a;
    color: #ffd700;
    border: 2px solid #c4a000;
    border-bottom: none;
  }

  .manage-button {
    background: none;
    border: none;
    color: #c4a000;
    cursor: pointer;
    font-size: 0.9rem;
  }

  .actions-content {
    padding: 1rem;
  }

  .category-header {
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
  }

  .category-title {
    color: #ffd700;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }

  .subtitle {
    color: #ffd700;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }

  .actions-table {
    margin-bottom: 2rem;
  }

  .table-header {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr 3fr;
    gap: 1rem;
    padding: 0.5rem;
    border-bottom: 1px solid #333;
    color: #c4a000;
    font-weight: bold;
    font-size: 0.9rem;
  }

  .table-row {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr 3fr;
    gap: 1rem;
    padding: 0.5rem;
    border-bottom: 1px solid #333;
    align-items: center;
  }

  .table-row:last-child {
    border-bottom: none;
  }

  .weapon-name {
    color: #ffd700;
    font-weight: bold;
  }

  .action-name {
    color: #ffd700;
    font-weight: bold;
    grid-column: 1 / -1;
  }

  .action-description {
    grid-column: 1 / -1;
    color: #999;
    font-size: 0.9rem;
    margin-top: 0.5rem;
  }

  .notes-col {
    color: #999;
    font-size: 0.9rem;
  }
</style>
