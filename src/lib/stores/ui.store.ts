import { writable } from 'svelte/store';

interface UIState {
  isSearchDialogOpen: boolean;
  anyDialogOpen: boolean;
}

const initialState: UIState = {
  isSearchDialogOpen: false,
  anyDialogOpen: false
};

function createUIStore() {
  const { subscribe, set, update } = writable<UIState>(initialState);

  return {
    subscribe,
    
    // Search dialog management
    openSearchDialog: () => update(state => ({ ...state, isSearchDialogOpen: true })),
    closeSearchDialog: () => update(state => ({ ...state, isSearchDialogOpen: false })),
    toggleSearchDialog: () => update(state => ({ ...state, isSearchDialogOpen: !state.isSearchDialogOpen })),
    
    // General dialog state management
    setDialogState: (isOpen: boolean) => update(state => ({ ...state, anyDialogOpen: isOpen })),
    
    // Reset all UI state
    reset: () => set(initialState)
  };
}

export const uiStore = createUIStore();

// Derived stores for convenient access
import { derived } from 'svelte/store';

export const isSearchDialogOpen = derived(uiStore, $ui => $ui.isSearchDialogOpen);
export const anyDialogOpen = derived(uiStore, $ui => $ui.anyDialogOpen);