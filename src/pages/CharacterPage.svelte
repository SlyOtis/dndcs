<script lang="ts">
  import CharacterInfo from "../components/CharacterInfo.svelte";
  import type {CharacterContext} from "../lib/types";
  import {getCharacterStore, getSidebar} from "../lib/engine";
  import {onDestroy, onMount, setContext} from "svelte";
  import CharacterSheet from "../components/CharacterSheet.svelte";
  import AIChat from "../components/chat/AIChat.svelte";
  import Background from "../components/Background.svelte";
  import DamageDisplay from "../components/DamageDisplay.svelte";
  import {navigate} from "sly-svelte-location-router";

  const {unsubscribe, ...chStore} = getCharacterStore()
  const {unsubscribeSidebar, sidebarStore} = getSidebar()
  
  // Global dialog state management
  let anyDialogOpen = $state(false);
  
  function setDialogState(isOpen: boolean) {
    anyDialogOpen = isOpen;
  }
  
  // Global keyboard handler
  function handleGlobalKeydown(event: KeyboardEvent) {
    // Handle escape key
    if (event.key === 'Escape') {
      // Don't prevent default if we're in an input field
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      event.preventDefault();
      
      // If any dialog is open, let the dialogs handle their own escape first
      // Only use global close if individual dialogs don't handle it
      if (anyDialogOpen) {
        // Give a small delay to allow individual dialog escape handlers to work first
        setTimeout(() => {
          if (anyDialogOpen) {
            // If still open after individual handlers, use global close
            window.dispatchEvent(new CustomEvent('closeDialogs'));
          }
        }, 10);
      } else if ($sidebarStore) {
        // If no dialogs are open but chat is open, close the chat
        sidebarStore.set(false);
      }
      return;
    }
    
    // Handle undo/redo shortcuts (only when not in input fields and no dialog is open)
    if (!anyDialogOpen && 
        !(event.target instanceof HTMLInputElement) && 
        !(event.target instanceof HTMLTextAreaElement)) {
      
      // Ctrl+Z / Cmd+Z for undo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        import('../lib/changelog').then(({ undoLastChange }) => {
          const result = undoLastChange();
          if (result.success) {
            // Show undo feedback message
            window.dispatchEvent(new CustomEvent('showToast', {
              detail: { message: `↶ Undone: ${result.description}`, type: 'info' }
            }));
          }
        });
        return;
      }
      
      // Ctrl+Y / Cmd+Shift+Z for redo
      if (((event.ctrlKey || event.metaKey) && event.key === 'y') ||
          ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'z')) {
        event.preventDefault();
        import('../lib/changelog').then(({ redoLastChange }) => {
          const result = redoLastChange();
          if (result.success) {
            // Show redo feedback message
            window.dispatchEvent(new CustomEvent('showToast', {
              detail: { message: `↷ Redone: ${result.description}`, type: 'info' }
            }));
          }
        });
        return;
      }
    }
  }

  setContext<CharacterContext>('character', chStore);
  setContext('sidebar', sidebarStore)
  setContext('dialogState', {
    get isAnyDialogOpen() {
      return anyDialogOpen;
    },
    setDialogState
  });

  onMount(() => {
    // Apply saved theme or default to medieval
    const savedTheme = localStorage.getItem('dnd_theme') || 'medieval';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Add global keyboard listener
    window.addEventListener('keydown', handleGlobalKeydown);
    
    return () => {
      // Cleanup keyboard listener
      window.removeEventListener('keydown', handleGlobalKeydown);
    };
  });

  onDestroy(() => {
    unsubscribe()
    unsubscribeSidebar()
  })

  if (!localStorage.getItem("replicate_api_key")) {
    navigate("/")
  }

</script>

<header>
    <CharacterInfo/>
</header>

<main style:--size-sidebar-curr={$sidebarStore ? 'var(--size-sidebar-max)' : '0'}>
    <CharacterSheet/>
    <aside>
        <AIChat/>
    </aside>
    <Background/>
</main>

<DamageDisplay/>

<style>
    header {
        position: relative;
        width: 100%;
        height: 100px;
        display: flex;
        border-bottom: 1px solid var(--color-primary-main);
        z-index: 10;
    }

    main {
        position: relative;
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-columns: 1fr var(--size-sidebar-curr);
        grid-template-rows: 1fr;
        overflow: hidden;
        transition: grid-template-columns 250ms ease-in-out;
    }

    aside {
        position: relative;
        top: 0;
        bottom: 0;
        right: 0;
        z-index: 10;
    }

    aside > button {
        position: absolute;
        top: 32px;
        width: 100%;
        left: -100%;
        overflow: visible;
        z-index: 10;
    }
</style>
