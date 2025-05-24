import type { Character, CharacterSourceData, LevelUpData } from './character.types';
import { writable, type Writable } from 'svelte/store';

// Character sheet state management
export interface CharacterInfoState {
  showLevelUpDialog: boolean;
  levelUpData?: LevelUpData;
  showThemeDialog: boolean;
  showSourceImportDialog: boolean;
}

// Create reactive state for character info
export function createCharacterInfoStore() {
  const state = writable<CharacterInfoState>({
    showLevelUpDialog: false,
    showThemeDialog: false,
    showSourceImportDialog: false
  });

  return {
    ...state,
    
    // Dialog management
    openLevelUpDialog(data: LevelUpData) {
      state.update(s => ({ ...s, showLevelUpDialog: true, levelUpData: data }));
    },

    closeLevelUpDialog() {
      state.update(s => ({ ...s, showLevelUpDialog: false, levelUpData: undefined }));
    },

    openThemeDialog() {
      state.update(s => ({ ...s, showThemeDialog: true }));
    },

    closeThemeDialog() {
      state.update(s => ({ ...s, showThemeDialog: false }));
    },

    openSourceImportDialog() {
      state.update(s => ({ ...s, showSourceImportDialog: true }));
    },

    closeSourceImportDialog() {
      state.update(s => ({ ...s, showSourceImportDialog: false }));
    }
  };
}

// File import utilities
export const fileImportUtils = {
  async handleFileUpload(file: File): Promise<CharacterSourceData> {
    const fileType = file.type;
    
    if (fileType === 'application/json') {
      const text = await file.text();
      return {
        type: 'json',
        content: text,
        extractedData: JSON.parse(text)
      };
    } else if (fileType === 'text/plain') {
      const text = await file.text();
      return {
        type: 'text',
        content: text
      };
    } else if (fileType === 'application/pdf') {
      return {
        type: 'pdf',
        content: file
      };
    } else if (fileType.startsWith('image/')) {
      return {
        type: 'image',
        content: file
      };
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  },

  triggerFileInput(fileInput: HTMLInputElement) {
    fileInput.click();
  }
};

// Character data utilities
export const characterUtils = {
  getCharacterDisplayName(character: Character): string {
    return character.info.name || 'Unnamed Character';
  },

  getCharacterLevel(character: Character): number {
    return character.info.level || 1;
  },

  getCharacterClass(character: Character): string {
    return character.info.class?.name || 'Unknown';
  },

  getCharacterRace(character: Character): string {
    return character.info.race?.name || 'Unknown';
  },

  formatHealthDisplay(character: Character): string {
    const hp = character.info.hp;
    return `${hp.current}/${hp.max}`;
  },

  formatArmorClass(character: Character): string {
    return character.info.ac.toString();
  },

  getCharacterImage(character: Character): string {
    return character.info.imageUrl || '/default-character.png';
  }
};