import { writable } from 'svelte/store';

interface UIState {
  isSearchDialogOpen: boolean;
  searchSeed: string;
  menuOpen: boolean;
  menuView: 'menu' | 'soundboard' | 'music';
  chatOpen: boolean;
  anyDialogOpen: boolean;
}

const initialState: UIState = {
  isSearchDialogOpen: false,
  searchSeed: '',
  menuOpen: false,
  menuView: 'menu',
  chatOpen: false,
  anyDialogOpen: false
};

function createUIStore() {
  const { subscribe, set, update } = writable<UIState>(initialState);

  return {
    subscribe,
    
    // Search dialog management
    openSearchDialog: (seed = '') => update(state => ({ ...state, isSearchDialogOpen: true, searchSeed: seed })),
    closeSearchDialog: () => update(state => ({ ...state, isSearchDialogOpen: false, searchSeed: '' })),
    toggleSearchDialog: () => update(state => ({ ...state, isSearchDialogOpen: !state.isSearchDialogOpen, searchSeed: '' })),
    
    toggleMenu: () => update(state => ({ ...state, menuOpen: !state.menuOpen, chatOpen: state.menuOpen && state.chatOpen })),
    openSoundboard: () => update(state => ({ ...state, menuOpen: true, menuView: 'soundboard', chatOpen: false })),
    openMusic: () => update(state => {
      const menuOpen = !(state.menuOpen && state.menuView === 'music');
      return { ...state, menuOpen, menuView: 'music', chatOpen: !menuOpen && state.chatOpen };
    }),
    openMenu: () => update(state => ({ ...state, menuOpen: true, menuView: 'menu', chatOpen: false })),
    toggleChat: () => update(state => ({ ...state, chatOpen: !state.chatOpen, menuOpen: state.chatOpen && state.menuOpen })),

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
export const searchSeed = derived(uiStore, $ui => $ui.searchSeed);
export const anyDialogOpen = derived(uiStore, $ui => $ui.anyDialogOpen);
export const menuOpen = derived(uiStore, $ui => $ui.menuOpen);
export const menuView = derived(uiStore, $ui => $ui.menuView);
export const chatOpen = derived(uiStore, $ui => $ui.chatOpen);
