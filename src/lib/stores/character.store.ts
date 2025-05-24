import { writable } from 'svelte/store';
import type { CharacterDocument } from '../firestore.types';
import type { Character } from '../character.types';

// Current character being edited
export const currentCharacter = writable<Character | null>(null);
export const currentCharacterId = writable<string | null>(null);
export const currentCharacterDoc = writable<CharacterDocument | null>(null);

// All user characters
export const userCharacters = writable<CharacterDocument[]>([]);

// Character loading states
export const isLoadingCharacter = writable(false);
export const isSavingCharacter = writable(false);
export const characterError = writable<string | null>(null);

// Character selection
export const selectedCharacterId = writable<string | null>(null);

// Auto-save functionality
let autoSaveTimeout: NodeJS.Timeout;

export function enableAutoSave(characterId: string, saveFunction: (character: Character) => Promise<void>) {
  currentCharacter.subscribe(($character) => {
    if (!$character || !characterId) return;
    
    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    
    // Set new timeout for auto-save (5 seconds after last change)
    autoSaveTimeout = setTimeout(async () => {
      try {
        isSavingCharacter.set(true);
        await saveFunction($character);
        console.log('Character auto-saved');
      } catch (error) {
        console.error('Auto-save failed:', error);
        characterError.set('Auto-save failed');
      } finally {
        isSavingCharacter.set(false);
      }
    }, 5000);
  });
}

export function disableAutoSave() {
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
  }
}