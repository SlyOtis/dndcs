import { get } from 'svelte/store';
import { sidebarStore } from './navigation';
import { uiStore } from './stores/ui.store';

export function handleGlobalKeydown(event: KeyboardEvent) {
  const command = event.ctrlKey || event.metaKey;
  const key = event.key.toLowerCase();

  if (command && key === 'k') {
    event.preventDefault();
    uiStore.toggleSearchDialog();
    return;
  }

  if (event.key === 'Escape') {
    handleEscapeKey(event);
    return;
  }

  const inField =
    event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement;

  if (get(uiStore).anyDialogOpen || inField) return;

  if (command && key === 'z' && !event.shiftKey) {
    handleUndoShortcut(event);
    return;
  }

  if (command && (key === 'y' || (event.shiftKey && key === 'z'))) {
    handleRedoShortcut(event);
    return;
  }

  if (command && key === 'l') {
    handleChatToggleShortcut(event);
  }
}

function handleEscapeKey(event: KeyboardEvent) {
  if (get(uiStore).isSearchDialogOpen) {
    event.preventDefault();
    uiStore.closeSearchDialog();
    return;
  }

  if (
    event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLTextAreaElement
  ) {
    return;
  }

  event.preventDefault();

  if (get(uiStore).anyDialogOpen) {
    setTimeout(() => {
      if (get(uiStore).anyDialogOpen) {
        window.dispatchEvent(new CustomEvent('closeDialogs'));
      }
    }, 10);
  } else if (get(sidebarStore)) {
    sidebarStore.set(false);
  }
}

function handleUndoShortcut(event: KeyboardEvent) {
  event.preventDefault();
  import('./changelog').then(({ undoLastChange }) => {
    const result = undoLastChange();
    if (result.success) {
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
      window.dispatchEvent(new CustomEvent('showToast', {
        detail: { message: `↷ Redone: ${result.description}`, type: 'info' }
      }));
    }
  });
}

function handleChatToggleShortcut(event: KeyboardEvent) {
  event.preventDefault();
  sidebarStore.update((open) => !open);

  window.dispatchEvent(new CustomEvent('showToast', {
    detail: {
      message: `💬 Chat ${get(sidebarStore) ? 'opened' : 'closed'}`,
      type: 'info'
    }
  }));
}
