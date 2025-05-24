import type { Character, LevelUpData, Feat, LevelUpChoice } from '../character.types';
import { writable } from 'svelte/store';

export interface LevelUpState {
  isOpen: boolean;
  data?: LevelUpData;
}

export function createLevelUpStore() {
  const state = writable<LevelUpState>({ isOpen: false });

  return {
    ...state,
    
    open(data: LevelUpData) {
      state.update(s => ({ ...s, isOpen: true, data }));
    },

    close() {
      state.update(s => ({ ...s, isOpen: false, data: undefined }));
    }
  };
}

export const levelUpLogic = {
  async generateLevelUpData(character: Character, targetLevel: number): Promise<LevelUpData> {
    const sources = localStorage.getItem('character_sources');
    let structuredSources: any[] = [];
    
    if (sources) {
      try {
        structuredSources = JSON.parse(sources).filter((source: any) => source.enabled !== false);
      } catch (error) {
        console.error('Error parsing character sources:', error);
        structuredSources = [];
      }
    }

    const levelUpData: LevelUpData = {
      level: targetLevel,
      hitDiceGain: { amount: 1, die: character.info.class.hitDice?.die || 8 },
      proficiencyBonus: Math.ceil(targetLevel / 4) + 1,
      newFeatures: await this.generateNewFeatures(character, targetLevel, structuredSources),
      choices: await this.generateLevelUpChoices(character, targetLevel, structuredSources),
      spellSlotChanges: this.generateSpellSlotChanges(character, targetLevel)
    };

    return levelUpData;
  },

  async generateNewFeatures(character: Character, level: number, structuredSources: any[]): Promise<Feat[]> {
    const features: Feat[] = [];

    // Basic ASI feature at every 4th level
    if (level % 4 === 0 && level <= 19) {
      features.push({
        id: `asi_${level}`,
        level,
        source: "class",
        title: "Ability Score Improvement",
        description: "You can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1."
      });
    }

    // Add basic class feature if no other features
    if (features.length === 0) {
      features.push({
        id: `class_feature_${level}`,
        level,
        source: "class",
        title: `${character.info.class.name} Feature`,
        description: `You gain a new class feature at level ${level}. Consult your class description for details.`
      });
    }

    return features;
  },

  async generateLevelUpChoices(character: Character, level: number, structuredSources: any[]): Promise<LevelUpChoice[]> {
    const choices: LevelUpChoice[] = [];

    // ASI or Feat choice at appropriate levels
    if (level % 4 === 0 && level <= 19) {
      choices.push({
        type: 'abilityScore',
        title: 'Ability Score Improvement',
        description: 'Choose how to improve your ability scores',
        options: ['STR +2', 'DEX +2', 'CON +2', 'INT +2', 'WIS +2', 'CHA +2', 'Two different +1'],
        maxSelections: 1
      });
    }

    return choices;
  },

  generateSpellSlotChanges(character: Character, level: number): Record<number, number> | undefined {
    const spellcastingClasses = ['wizard', 'sorcerer', 'warlock', 'bard', 'cleric', 'druid'];
    if (!spellcastingClasses.includes(character.info.class.name.toLowerCase())) {
      return undefined;
    }

    const slots: Record<number, number> = {};
    if (level >= 1) slots[1] = Math.min(4, level + 1);
    if (level >= 3) slots[2] = Math.min(3, Math.floor((level - 1) / 2));
    if (level >= 5) slots[3] = Math.min(3, Math.floor((level - 3) / 2));
    if (level >= 7) slots[4] = Math.min(3, Math.floor((level - 5) / 2));
    if (level >= 9) slots[5] = Math.min(2, Math.floor((level - 7) / 2));
    
    return slots;
  },

  checkForCharacterSources(character: Character): boolean {
    const sources = localStorage.getItem('character_sources');
    if (sources) {
      try {
        const parsedSources = JSON.parse(sources);
        if (Array.isArray(parsedSources) && parsedSources.some(source => source.enabled !== false)) {
          return true;
        }
      } catch (error) {
        console.error('Error parsing character sources:', error);
      }
    }

    return !!(
      character.info.class &&
      character.info.class.name &&
      character.info.class.name !== 'Unknown'
    );
  }
};