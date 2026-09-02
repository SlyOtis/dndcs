<script lang="ts">
  import BaseDialog from "../BaseDialog.svelte";
  import { uiStore, isSearchDialogOpen } from "$lib/stores/ui.store";
  
  // Use global store instead of props
  let isOpen = $derived($isSearchDialogOpen);

  let searchInput: HTMLInputElement;
  let searchQuery = $state('');
  
  // Sample commands for now - can be expanded later
  const commands = [
    { name: 'Toggle Chat', shortcut: 'Ctrl+L', action: 'toggle-chat' },
    { name: 'Search Everything', shortcut: 'Ctrl+K', action: 'search' },
    { name: 'Undo', shortcut: 'Ctrl+Z', action: 'undo' },
    { name: 'Redo', shortcut: 'Ctrl+Y', action: 'redo' },
    { name: 'Open Character Menu', shortcut: 'Click Dragon', action: 'character-menu' },
    { name: 'Level Up', shortcut: '', action: 'level-up' },
    { name: 'Save Character', shortcut: '', action: 'save' },
    { name: 'Load Character', shortcut: '', action: 'load' },
    { name: 'Roll Dice', shortcut: '', action: 'dice' },
    { name: 'Cast Spell', shortcut: '', action: 'spell' },
    { name: 'Use Item', shortcut: '', action: 'item' },
    { name: 'Rest', shortcut: '', action: 'rest' }
  ];
  
  let filteredCommands = $derived(
    commands.filter(cmd => 
      cmd.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.shortcut.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
  
  let selectedIndex = $state(0);
  
  function handleKeydown(event: KeyboardEvent) {
    if (!isOpen) return;
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, filteredCommands.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        break;
      case 'Enter':
        event.preventDefault();
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex].action);
        }
        break;
    }
  }
  
  function executeCommand(action: string) {
    console.log('Executing command:', action);
    // For now, just close the dialog
    // Later this can be expanded to actually execute commands
    uiStore.closeSearchDialog();
    searchQuery = '';
    selectedIndex = 0;
  }
  
  // Focus the input when dialog opens
  $effect(() => {
    if (isOpen && searchInput) {
      searchInput.focus();
    }
  });
  
  // Reset selected index when search changes
  $effect(() => {
    searchQuery; // dependency
    selectedIndex = 0;
  });
  
  // Reset state when dialog closes
  $effect(() => {
    if (!isOpen) {
      searchQuery = '';
      selectedIndex = 0;
    }
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<BaseDialog isOpen={isOpen} onClose={uiStore.closeSearchDialog} width="600px" showCloseButton={false} closeOnEscape={false}>
  <div class="search-container">
    <div class="search-icon">🔍</div>
    <input 
      bind:this={searchInput}
      bind:value={searchQuery}
      type="text" 
      placeholder="Search commands..."
      class="search-input"
    />
  </div>
  
  <div class="results">
    {#each filteredCommands as command, index}
      <button
        type="button"
        class="result-item"
        class:selected={index === selectedIndex}
        onclick={() => executeCommand(command.action)}
      >
        <div class="command-info">
          <div class="command-name">{command.name}</div>
          {#if command.shortcut}
            <div class="command-shortcut">{command.shortcut}</div>
          {/if}
        </div>
      </button>
    {/each}
    
    {#if filteredCommands.length === 0}
      <div class="no-results">No commands found</div>
    {/if}
  </div>
</BaseDialog>

<style>
  .search-container {
    display: flex;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid var(--color-primary-main);
    gap: 12px;
  }
  
  .search-icon {
    font-size: 1.2rem;
    color: var(--color-primary-main);
  }
  
  .search-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: var(--color-primary-text);
    font-size: 1.1rem;
    padding: 8px 0;
  }
  
  .search-input::placeholder {
    color: var(--color-secondary-text);
  }
  
  .results {
    max-height: 400px;
    overflow-y: auto;
  }
  
  .result-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    cursor: pointer;
    transition: background 0.2s ease;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .result-item:hover,
  .result-item.selected {
    background: var(--color-content-light);
  }
  
  .command-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
  
  .command-name {
    color: var(--color-primary-text);
    font-weight: 500;
  }
  
  .command-shortcut {
    color: var(--color-secondary-text);
    font-size: 0.9rem;
    font-family: 'Courier New', monospace;
    background: var(--color-content-main);
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid var(--color-primary-main);
  }
  
  .no-results {
    padding: 24px 16px;
    text-align: center;
    color: var(--color-secondary-text);
    font-style: italic;
  }
</style>