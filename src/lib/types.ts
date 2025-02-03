import type {Unsubscriber, Writable} from "svelte/store";
import type {Character} from "./character.types";

export type RollLog = Array<RollLogItem>

export interface RollResult {
  sum: number;
  rolls: Array<number>
}

export interface RollLogItem {
  type: string
  text: string
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