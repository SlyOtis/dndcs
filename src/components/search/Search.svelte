<script lang="ts">
  import BaseDialog from "../BaseDialog.svelte";
  import Field from "$components/ui/Field.svelte";
  import Ornament from "$components/ui/Ornament.svelte";
  import { uiStore, isSearchDialogOpen } from "$lib/stores/ui.store";

  let isOpen = $derived($isSearchDialogOpen);

  let searchInput: HTMLInputElement;
  let searchQuery = $state('');

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
    uiStore.closeSearchDialog();
    searchQuery = '';
    selectedIndex = 0;
  }

  $effect(() => {
    if (isOpen && searchInput) {
      searchInput.focus();
    }
  });

  $effect(() => {
    searchQuery;
    selectedIndex = 0;
  });

  $effect(() => {
    if (!isOpen) {
      searchQuery = '';
      selectedIndex = 0;
    }
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<BaseDialog isOpen={isOpen} onClose={uiStore.closeSearchDialog} width="600px" showCloseButton={false} closeOnEscape={false}>
  <div class="head">
    <Field label="Command" id="search-command" help="Arrow keys walk the list, Enter invokes">
      <input
        id="search-command"
        bind:this={searchInput}
        bind:value={searchQuery}
        type="text"
        placeholder="Search commands..."
      />
    </Field>
  </div>

  <span class="key">
    <Ornament name="divider" tone="metal" />
  </span>

  <div class="rites dnd-scroll">
    {#each filteredCommands as command, index}
      <button
        type="button"
        class="rite"
        class:rite-lit={index === selectedIndex}
        aria-current={index === selectedIndex ? 'true' : undefined}
        onclick={() => executeCommand(command.action)}
      >
        <span class="rite-mark" aria-hidden="true"></span>
        <span class="rite-name">{command.name}</span>
        {#if command.shortcut}
          <span class="rite-key">{command.shortcut}</span>
        {/if}
      </button>
    {/each}

    {#if filteredCommands.length === 0}
      <p class="hollow">No commands found</p>
    {/if}
  </div>
</BaseDialog>

<style>
  .head {
    padding: var(--space-5) var(--space-5) var(--space-3);
  }

  .key {
    display: block;
    width: 220px;
    margin: 0 auto;
    opacity: 0.75;
    pointer-events: none;
  }

  .rites {
    max-height: 400px;
    overflow-y: auto;
    padding: var(--space-2) var(--space-3) var(--space-4);
  }

  .rite {
    --rite-rim: transparent;
    --rite-light: transparent;
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    width: 100%;
    padding: var(--space-3) var(--space-4);
    background: linear-gradient(90deg, var(--ground-raised) 0%, transparent 85%);
    border: var(--border-hair) solid var(--rite-rim);
    border-radius: var(--radius-md) var(--radius-sm) var(--radius-sm) var(--radius-md);
    color: var(--ink);
    text-align: left;
    cursor: pointer;
    transition: border-color 0.15s ease, background 0.15s ease;
  }

  .rite:hover,
  .rite-lit {
    --rite-rim: var(--metal-dim);
    --rite-light: var(--metal);
    background: linear-gradient(90deg, var(--ground-lift) 0%, var(--ground-raised) 100%);
  }

  .rite-lit {
    --rite-rim: var(--metal);
    box-shadow: inset 0 0 20px -10px var(--ember-glow);
  }

  .rite:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  .rite-mark {
    flex: none;
    width: 9px;
    height: 9px;
    transform: rotate(45deg);
    background: var(--rite-light);
    box-shadow: 0 0 8px var(--rite-light);
    transition: background 0.15s ease;
  }

  .rite-name {
    flex: 1;
    font-family: var(--font-display);
    font-size: var(--text-sm);
    letter-spacing: var(--tracking-wide);
    color: var(--ink);
  }

  .rite-key {
    flex: none;
    padding: var(--space-1) var(--space-2);
    background: linear-gradient(180deg, var(--ground-deep) 0%, var(--ground) 100%);
    border: var(--border-hair) solid var(--metal-dim);
    border-radius: var(--radius-sm);
    box-shadow: inset 0 1px 0 var(--metal-edge);
    color: var(--ink-dim);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
  }

  .hollow {
    margin: 0;
    padding: var(--space-5) var(--space-4);
    text-align: center;
    color: var(--ink-faint);
    font-style: italic;
  }
</style>
