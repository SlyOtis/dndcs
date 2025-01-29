<script lang="ts">
  import type { Action } from '../types';
  
  export let actions: Action[];
  
  const tabs = ['ALL', 'ATTACK', 'ACTION', 'BONUS ACTION', 'REACTION', 'OTHER', 'LIMITED USE'];
  let activeTab = 'ALL';
</script>

<div class="actions-container">
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

  <div class="actions-header">
    <div class="action-title">ACTIONS • Attacks per Action: 1</div>
    <button class="manage-button">MANAGE CUSTOM</button>
  </div>

  <div class="actions-table">
    <div class="table-header">
      <span class="attack-col">ATTACK</span>
      <span class="range-col">RANGE</span>
      <span class="hit-col">HIT / DC</span>
      <span class="damage-col">DAMAGE</span>
      <span class="notes-col">NOTES</span>
    </div>
    
    {#each actions as action}
      <div class="table-row">
        <span class="attack-col">{action.name}</span>
        <span class="range-col">{action.range}</span>
        <span class="hit-col">{action.toHit}</span>
        <span class="damage-col">{action.damage}</span>
        <span class="notes-col">{action.notes}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .actions-container {
    background-color: #1a1a1a;
    border-radius: 8px;
    overflow: hidden;
  }

  .tabs {
    display: flex;
    background-color: #2a2a2a;
    border-bottom: 2px solid #c4a000;
    padding: 0.5rem 1rem 0;
  }

  .tab-button {
    background: none;
    border: none;
    color: #666;
    padding: 0.5rem 1rem;
    cursor: pointer;
    border-radius: 4px 4px 0 0;
    margin-right: 0.25rem;
  }

  .tab-button.active {
    background-color: #1a1a1a;
    color: #ffd700;
    border: 2px solid #c4a000;
    border-bottom: none;
  }

  .actions-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #333;
  }

  .action-title {
    color: #ffd700;
    font-weight: bold;
  }

  .manage-button {
    background: none;
    border: none;
    color: #c4a000;
    cursor: pointer;
  }

  .actions-table {
    padding: 1rem;
  }

  .table-header {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr 3fr;
    gap: 1rem;
    padding: 0.5rem;
    border-bottom: 1px solid #333;
    color: #c4a000;
    font-weight: bold;
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

  .attack-col {
    color: #ffd700;
    font-weight: bold;
  }

  .notes-col {
    color: #999;
    font-size: 0.9rem;
  }
</style>
