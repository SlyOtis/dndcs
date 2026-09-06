import type {Unsubscriber, Writable} from "svelte/store";
import type {Character, CharacterAbility, CharacterSkill, CharacterSense, CharacterSavingThrow} from "./character.types";

export type RollLog = Array<RollLogItem>

export interface RollResult {
  sum: number;
  rolls: Array<number>
}

export interface RollLogItem {
  type: string
  text: string
  author?: string
  formula: string
  roll: number
  total: number
  details?: string
  rolledAt: string
}

/** Svelte store for Character type */
export type CharacterStore = CharacterContext & { unsubscribe: Unsubscriber }

/** Context providing individual Svelte stores for each Character property */
export type CharacterContext = {
  [K in keyof Character]: Writable<Character[K]>
}

// Re-export character types for convenience
export type { CharacterAbility, CharacterSkill, CharacterSense, CharacterSavingThrow };