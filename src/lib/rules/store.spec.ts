import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { get, writable } from 'svelte/store'
import dnd5e from '../../../public/sources/systems/dnd5e.json'
import gunslinger from '../../../public/sources/systems/gunslinger.json'
import nimble from '../../../public/sources/systems/nimble.json'
import lars from '../character.fixture'
import type { CharacterContext } from '../types'
import { getRulesStore } from './store'
import { clearSystemCache, getSystemStack } from './system'

const DOCUMENTS: Record<string, unknown> = { dnd5e, nimble, gunslinger }

function getContextStub(): CharacterContext {
  return {
    info: writable(lars.info),
    abilities: writable(lars.abilities),
    skills: writable(lars.skills),
    savingThrows: writable(lars.savingThrows),
    special: writable(lars.special)
  } as unknown as CharacterContext
}

async function settle() {
  for (let i = 0; i < 4; i += 1) await new Promise((resolve) => setTimeout(resolve, 0))
}

beforeEach(() => {
  clearSystemCache()
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const id = url.split('/').pop()?.replace('.json', '') ?? ''
    const document = DOCUMENTS[id]
    if (!document) return { ok: false, status: 404, statusText: 'Not Found' }
    return { ok: true, status: 200, statusText: 'OK', json: async () => document }
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('getSystemStack', () => {
  it('loads a system by id', async () => {
    const system = await getSystemStack(['dnd5e'])
    expect(system.id).toBe('dnd5e')
    expect(system.skills).toHaveLength(18)
  })

  it('resolves the extends chain of an overlay', async () => {
    const system = await getSystemStack(['nimble'])
    expect(system.skills).toHaveLength(18)
    expect(system.pools.map((pool) => pool.id)).toContain('mana')
  })

  it('stacks two systems left to right', async () => {
    const system = await getSystemStack(['dnd5e', 'gunslinger'])
    expect(system.attributes.map((attribute) => attribute.id)).toContain('grt')
  })

  it('reports a system that does not load', async () => {
    await expect(getSystemStack(['missing'])).rejects.toThrow('did not load')
  })

  it('refuses an empty system list', async () => {
    await expect(getSystemStack([])).rejects.toThrow('at least one rule system')
  })
})

describe('getRulesStore', () => {
  it('starts empty and fills once the system loads', async () => {
    const store = getRulesStore(getContextStub())
    expect(get(store).resolved).toBeNull()

    await settle()

    const state = get(store)
    expect(state.system?.id).toBe('dnd5e')
    expect(state.error).toBeNull()
    expect(state.resolved?.proficiency).toBe(3)
  })

  it('recomputes when an ability score changes', async () => {
    const context = getContextStub()
    const store = getRulesStore(context)
    await settle()

    const before = get(store).resolved?.attributes.find((entry) => entry.id === 'dex')?.value

    context.abilities.update((list) =>
      list.map((ability) => (ability.title === 'Dexterity' ? { ...ability, score: ability.score + 2 } : ability))
    )

    const after = get(store).resolved?.attributes.find((entry) => entry.id === 'dex')?.value
    expect(after).toBe((before ?? 0) + 1)
  })

  it('recomputes a skill when the level changes', async () => {
    const context = getContextStub()
    const store = getRulesStore(context)
    await settle()

    const before = get(store).resolved?.proficiency
    context.info.update((info) => ({ ...info, level: 17 }))

    expect(get(store).resolved?.proficiency).toBe(6)
    expect(before).toBe(3)
  })

  it('reports a system that does not load instead of throwing', async () => {
    const store = getRulesStore(getContextStub(), ['missing'])
    await settle()

    expect(get(store).error).toContain('did not load')
    expect(get(store).resolved).toBeNull()
  })

  it('exposes the panels an overlay adds', async () => {
    const store = getRulesStore(getContextStub(), ['dnd5e', 'gunslinger'])
    await settle()

    expect(get(store).resolved?.panels.map((panel) => panel.id)).toContain('gunslinger')
  })
})
