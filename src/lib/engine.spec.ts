import { beforeEach, describe, expect, it, vi } from 'vitest'
import { get } from 'svelte/store'
import type { Character } from './character.types'
import lars from './character.fixture'
import { applyStateToCharacter, getCharacterStore, getEmptyCharacter } from './engine'

const stored = vi.hoisted(() => {
  const values: Record<string, string> = {}

  ;(globalThis as any).localStorage = {
    getItem: (key: string) => values[key] ?? null,
    setItem: (key: string, value: string) => {
      values[key] = value
    },
    removeItem: (key: string) => {
      delete values[key]
    }
  }

  return values
})

const sources = import.meta.glob<string>('/src/**/*.{ts,svelte}', {
  query: '?raw',
  import: 'default',
  eager: true
})

const listKeys = [
  'feats',
  'abilities',
  'savingThrows',
  'skills',
  'senses',
  'actions',
  'spells',
  'proficients',
  'inventory',
  'equipped'
] as const

let sheets = 0

function getSheetId() {
  sheets += 1
  return `testy-${sheets}`
}

function getIdentity(character: Character) {
  return [
    character.info.name,
    character.info.description,
    character.info.imageUrl,
    character.info.infoUrl,
    character.info.class.name,
    character.info.race.name,
    character.background.title,
    character.special.name
  ]
}

beforeEach(() => {
  for (const key of Object.keys(stored)) delete stored[key]
})

describe('getEmptyCharacter', () => {
  it('is the character the fixture is not', () => {
    expect(lars.info.name).toBe('Lucky Lars')
    expect(getIdentity(lars).every((value) => value.length > 3)).toBe(true)

    const serialized = JSON.stringify(getEmptyCharacter())
    for (const value of getIdentity(lars)) expect(serialized).not.toContain(value)
  })

  it('carries every key a character carries', () => {
    expect(Object.keys(getEmptyCharacter()).sort()).toEqual(Object.keys(lars).sort())
  })

  it('holds no name, no level and no class of anyone', () => {
    const empty = getEmptyCharacter()

    expect(empty.info.name).toBe('')
    expect(empty.info.description).toBe('')
    expect(empty.info.imageUrl).toBe('')
    expect(empty.info.infoUrl).toBe('')
    expect(empty.info.class.name).toBe('Unknown')
    expect(empty.info.race.name).toBe('Unknown')
    expect(empty.info.hp).toEqual({ current: 0, max: 0, temporary: 0 })
    expect(empty.info.level).not.toBe(lars.info.level)
    expect(empty.info.ac).not.toBe(lars.info.ac)
    expect(empty.info.proficiencyBonus).not.toBe(lars.info.proficiencyBonus)
    expect(empty.background.title).toBe('')
    expect(empty.background.description).toBe('')
    expect(empty.special.name).toBe('')
    expect(empty.currency).toEqual({})
    expect(empty.soundBoard.clips).toEqual([])
  })

  it('holds nothing in any list the sheet renders', () => {
    const empty = getEmptyCharacter()

    for (const key of listKeys) expect(empty[key]).toEqual([])

    expect(lars.abilities.length).toBeGreaterThan(0)
    expect(lars.skills.length).toBeGreaterThan(0)
    expect(lars.actions.length).toBeGreaterThan(0)
  })

  it('hands out a fresh character every call', () => {
    const first = getEmptyCharacter()
    const second = getEmptyCharacter()

    expect(first).not.toBe(second)
    expect(first.info).not.toBe(second.info)

    first.info.name = 'Testy'
    first.abilities.push(lars.abilities[0])

    expect(second.info.name).toBe('')
    expect(second.abilities).toEqual([])
  })
})

describe('getCharacterStore before the routed character lands', () => {
  it('opens every store empty', () => {
    const store = getCharacterStore(getSheetId())

    expect(get(store.info).name).toBe('')
    expect(get(store.info).name).not.toBe(lars.info.name)
    expect(get(store.info).class.name).toBe('Unknown')
    expect(get(store.info).race.name).toBe('Unknown')
    expect(get(store.abilities)).toEqual([])
    expect(get(store.skills)).toEqual([])
    expect(get(store.savingThrows)).toEqual([])
    expect(get(store.actions)).toEqual([])
    expect(get(store.inventory)).toEqual([])
    expect(get(store.background).title).toBe('')

    for (const value of getIdentity(lars)) {
      expect(JSON.stringify(get(store.info))).not.toContain(value)
    }

    store.unsubscribe()
  })

  it('builds one store per character key', () => {
    const { unsubscribe, ...store } = getCharacterStore(getSheetId())

    expect(Object.keys(store).sort()).toEqual(Object.keys(getEmptyCharacter()).sort())

    unsubscribe()
  })

  it('takes the routed character when the read lands', () => {
    const store = getCharacterStore(getSheetId())

    applyStateToCharacter(lars)

    expect(get(store.info).name).toBe(lars.info.name)
    expect(get(store.info).level).toBe(lars.info.level)
    expect(get(store.abilities)).toHaveLength(lars.abilities.length)

    store.unsubscribe()
  })

  it('carries no character into the next sheet', () => {
    const first = getCharacterStore(getSheetId())
    applyStateToCharacter(lars)
    expect(get(first.info).name).toBe(lars.info.name)
    first.unsubscribe()

    const second = getCharacterStore(getSheetId())
    expect(get(second.info).name).toBe('')
    expect(get(second.abilities)).toEqual([])
    second.unsubscribe()
  })
})

describe('the fixture character', () => {
  it('is imported by no file under src outside a spec', () => {
    const paths = Object.keys(sources)

    expect(paths).toContain('/src/lib/character.fixture.ts')

    const reach = /(?:from|import\()\s*['"][^'"]*character\.fixture['"]/

    const importers = paths.filter(
      (path) => !path.endsWith('.spec.ts') && reach.test(sources[path])
    )

    expect(importers).toEqual([])
  })
})
