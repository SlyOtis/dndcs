import { writable } from 'svelte/store';

// Navigation state management
export const sidebarStore = writable<boolean>(false);

// Sound management
export const soundManager = {
  enabled: writable<boolean>(localStorage.getItem('dnd_sound_enabled') !== 'false'),
  
  toggle() {
    this.enabled.update(enabled => {
      const newValue = !enabled;
      localStorage.setItem('dnd_sound_enabled', newValue.toString());
      return newValue;
    });
  },

  playSound(soundName: string) {
    this.enabled.subscribe(enabled => {
      if (enabled) {
        // Sound playing logic would go here
        console.log(`Playing sound: ${soundName}`);
      }
    })();
  }
};

// Dialog state management
export interface DialogState {
  isAnyDialogOpen: boolean;
  setDialogState: (isOpen: boolean) => void;
}

export function createDialogState(): DialogState {
  let isOpen = false;
  const callbacks: ((isOpen: boolean) => void)[] = [];

  return {
    get isAnyDialogOpen() {
      return isOpen;
    },
    setDialogState(newState: boolean) {
      isOpen = newState;
      callbacks.forEach(callback => callback(isOpen));
    }
  };
}

// Music panel state
export const musicPanelStore = writable<boolean>(false);

// Navigation actions
export const navigationActions = {
  toggleSidebar() {
    sidebarStore.update(curr => !curr);
  },

  toggleMusicPanel() {
    musicPanelStore.update(curr => !curr);
    
    // Dispatch event for parent component
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('musicPanelToggled', {
        detail: { isOpen: false } // Will be updated by the store subscription
      }));
    }
  },

  openDocs() {
    if (typeof window !== 'undefined') {
      window.open('https://docs.anthropic.com/en/docs/claude-code', '_blank');
    }
  }
};