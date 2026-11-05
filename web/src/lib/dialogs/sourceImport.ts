import { writable } from 'svelte/store';

export interface SourceImportState {
  isOpen: boolean;
}

export function createSourceImportStore() {
  const state = writable<SourceImportState>({ isOpen: false });

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
