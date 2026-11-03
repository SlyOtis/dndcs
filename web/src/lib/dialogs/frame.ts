import { writable } from 'svelte/store';

export interface FrameState {
  isOpen: boolean;
}

export function createFrameStore() {
  const state = writable<FrameState>({ isOpen: false });

  return {
    ...state,

    open() {
      state.update(s => ({ ...s, isOpen: true }));
    },

    close() {
      state.update(s => ({ ...s, isOpen: false }));
    }
  };
}
