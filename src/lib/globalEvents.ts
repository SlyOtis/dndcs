import { get } from 'svelte/store';
import { sidebarStore } from './navigation';

interface GlobalEventContext {
  anyDialogOpen: boolean;
  setDialogState: (isOpen: boolean) => void;
  toggleChat: () => void;
  openSearchDialog: () => void;
  isSearchDialogOpen: boolean;
  closeSearchDialog: () => void;
}

let context: GlobalEventContext | null = null;

export function initializeGlobalEvents(eventContext: GlobalEventContext) {
  context = eventContext;
  
  // Add global keyboard listener
  window.addEventListener('keydown', handleGlobalKeydown);
  
  return () => {
    // Cleanup listener
    window.removeEventListener('keydown', handleGlobalKeydown);
  };
}

function handleGlobalKeydown(event: KeyboardEvent) {
  if (!context) return;
  
  // Handle escape key
  if (event.key === 'Escape') {
    handleEscapeKey(event);
    return;
  }
  
  // Handle keyboard shortcuts (only when not in input fields and no dialog is open)
  if (!context.anyDialogOpen && 
      !(event.target instanceof HTMLInputElement) && 
      !(event.target instanceof HTMLTextAreaElement)) {
    
    // Ctrl+Z / Cmd+Z for undo
    if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
      handleUndoShortcut(event);
      return;
    }
    
    // Ctrl+Y / Cmd+Shift+Z for redo
    if (((event.ctrlKey || event.metaKey) && event.key === 'y') ||
        ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'z')) {
      handleRedoShortcut(event);
      return;
    }
    
    // Ctrl+L / Cmd+L for toggling AI chat
    if ((event.ctrlKey || event.metaKey) && event.key === 'l') {
      handleChatToggleShortcut(event);
      return;
    }
    
    // Ctrl+K / Cmd+K for search dialog
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      handleSearchShortcut(event);
      return;
    }
  }
}

function handleEscapeKey(event: KeyboardEvent) {
  if (!context) return;
  
  // Don't prevent default if we're in an input field
  if (event.target instanceof HTMLInputElement || 
      event.target instanceof HTMLTextAreaElement) {
    return;
  }
  
  event.preventDefault();
  
  // Close search dialog first if it's open
  if (context.isSearchDialogOpen) {
    context.closeSearchDialog();
    return;
  }
  
  // If any dialog is open, let the dialogs handle their own escape first
  // Only use global close if individual dialogs don't handle it
  if (context.anyDialogOpen) {
    // Give a small delay to allow individual dialog escape handlers to work first
    setTimeout(() => {
      if (context?.anyDialogOpen) {
        // If still open after individual handlers, use global close
        window.dispatchEvent(new CustomEvent('closeDialogs'));
      }
    }, 10);
  } else if (get(sidebarStore)) {
    // If no dialogs are open but chat is open, close the chat
    sidebarStore.set(false);
  }
}

function handleUndoShortcut(event: KeyboardEvent) {
  event.preventDefault();
  import('./changelog').then(({ undoLastChange }) => {
    const result = undoLastChange();
    if (result.success) {
      // Show undo feedback message
      window.dispatchEvent(new CustomEvent('showToast', {
        detail: { message: `↶ Undone: ${result.description}`, type: 'info' }
      }));
    }
  });
}

function handleRedoShortcut(event: KeyboardEvent) {
  event.preventDefault();
  import('./changelog').then(({ redoLastChange }) => {
    const result = redoLastChange();
    if (result.success) {
      // Show redo feedback message
      window.dispatchEvent(new CustomEvent('showToast', {
        detail: { message: `↷ Redone: ${result.description}`, type: 'info' }
      }));
    }
  });
}

function handleChatToggleShortcut(event: KeyboardEvent) {
  if (!context) return;
  
  event.preventDefault();
  context.toggleChat();
  
  // Show feedback message
  const isOpen = get(sidebarStore);
  window.dispatchEvent(new CustomEvent('showToast', {
    detail: { 
      message: `💬 Chat ${isOpen ? 'opened' : 'closed'}`, 
      type: 'info' 
    }
  }));
}

function handleSearchShortcut(event: KeyboardEvent) {
  if (!context) return;
  
  event.preventDefault();
  context.openSearchDialog();
}