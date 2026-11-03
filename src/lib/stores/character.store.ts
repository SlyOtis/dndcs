import { writable } from 'svelte/store';
import type { CharacterDocument } from '../firestore.types';

const RECENT_LIMIT = 8;

export const currentCharacterId = writable<string | null>(null);

export const userCharacters = writable<CharacterDocument[]>([]);

export function getRecentCharacters(held: string[], id: string): string[] {
  return [id, ...held.filter((one) => one !== id)].slice(0, RECENT_LIMIT);
}

export function getRecentFirst(characters: CharacterDocument[], recent: string[]): CharacterDocument[] {
  const rank = (entry: CharacterDocument) => {
    const at = recent.indexOf(entry.id);
    return at === -1 ? recent.length : at;
  };
  return [...characters].sort((a, b) => rank(a) - rank(b));
}
