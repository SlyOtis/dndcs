import { derived, writable, type Readable } from 'svelte/store'
import type { Character } from '../character.types'
import type { CharacterContext } from '../types'
import { getResolvedCharacter } from './derive'
import { getSheet } from './sheet'
import type { ResolvedCharacter, RuleSystem, RuleSystemOverlay } from './spec.types'
import { getSystemStack } from './system'

export type RulesState = {
  system: RuleSystem | null
  resolved: ResolvedCharacter | null
  error: string | null
}

const SOURCE_KEYS = ['info', 'abilities', 'skills', 'savingThrows', 'special'] as const

export function getRulesStore(
  context: CharacterContext,
  systems: string[] = ['dnd5e'],
  overlay?: RuleSystemOverlay
): Readable<RulesState> {
  const system = writable<RuleSystem | null>(null)
  const error = writable<string | null>(null)

  getSystemStack(systems, overlay)
    .then((loaded) => system.set(loaded))
    .catch((reason) => error.set(reason instanceof Error ? reason.message : String(reason)))

  const sources = SOURCE_KEYS.map((key) => context[key])

  return derived([system, error, ...sources], ([$system, $error, ...values]) => {
    if ($error) return { system: null, resolved: null, error: $error }
    if (!$system) return { system: null, resolved: null, error: null }

    const character = Object.fromEntries(SOURCE_KEYS.map((key, index) => [key, values[index]])) as unknown as Character

    try {
      return { system: $system, resolved: getResolvedCharacter($system, getSheet(character, $system)), error: null }
    } catch (reason) {
      return { system: $system, resolved: null, error: reason instanceof Error ? reason.message : String(reason) }
    }
  })
}
