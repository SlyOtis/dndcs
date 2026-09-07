import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { get } from 'svelte/store'
import type { Character } from './character.types'

const wire = vi.hoisted(() => {
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

  return {
    updates: [] as Array<{ id: string, character: Character }>,
    refuse: false
  }
})

vi.mock('./firestore.service', () => ({
  characterService: {
    updateCharacter: (id: string, character: Character) => {
      if (wire.refuse) return Promise.reject(new Error('permission-denied'))
      wire.updates.push({ id, character })
      return Promise.resolve()
    }
  },
  campaignService: {
    postChatEntry: () => Promise.resolve('entry-1')
  }
}))

import { applyStateToCharacter, characterWriteError, getCharacterStore, getEmptyCharacter } from './engine'

const vault = (): Character => {
  const character = getEmptyCharacter()
  character.info.name = 'Testy'
  character.info.hp = { current: 22, max: 30, temporary: 0 }
  return character
}

let sheet = 0

const opened = () => {
  sheet += 1
  const store = getCharacterStore(`char-${sheet}`, vault())
  applyStateToCharacter(vault(), true)
  return { id: `char-${sheet}`, store }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  getCharacterStore('local')
  wire.updates.length = 0
  wire.refuse = false
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('a sheet edit reaching the character document', () => {
  it('writes nothing while the sheet is only opening', () => {
    getCharacterStore('char-opening', vault())
    vi.advanceTimersByTime(2000)

    expect(wire.updates).toEqual([])
  })

  it('writes nothing back for the document the sheet was loaded from', () => {
    opened()
    vi.advanceTimersByTime(2000)

    expect(wire.updates).toEqual([])
  })

  it('writes one document for one slider drag, carrying the value the drag settled on', () => {
    const { id, store } = opened()

    for (const current of [21, 19, 16, 14, 12]) {
      store.info.update((info) => ({ ...info, hp: { ...info.hp, current } }))
      vi.advanceTimersByTime(100)
    }
    expect(wire.updates).toEqual([])

    vi.advanceTimersByTime(600)

    expect(wire.updates).toHaveLength(1)
    expect(wire.updates[0].id).toBe(id)
    expect(wire.updates[0].character.info.hp.current).toBe(12)
    expect(wire.updates[0].character.info.name).toBe('Testy')
  })

  it('writes the whole character, so the second browser reads every part back', () => {
    const { store } = opened()

    store.info.update((info) => ({ ...info, ac: 15 }))
    vi.advanceTimersByTime(600)

    expect(Object.keys(wire.updates[0].character).sort()).toEqual(Object.keys(getEmptyCharacter()).sort())
    expect(wire.updates[0].character.info.ac).toBe(15)
  })

  it('writes a state once, not again on the next settle', async () => {
    const { store } = opened()

    store.info.update((info) => ({ ...info, ac: 15 }))
    await vi.advanceTimersByTimeAsync(600)
    store.info.update((info) => ({ ...info, ac: 15 }))
    await vi.advanceTimersByTimeAsync(600)

    expect(wire.updates).toHaveLength(1)
  })

  it('flushes a pending edit before the sheet turns to another character', () => {
    const { id, store } = opened()

    store.info.update((info) => ({ ...info, ac: 15 }))
    getCharacterStore('char-next', vault())

    expect(wire.updates.map((entry) => entry.id)).toEqual([id])
  })

  it('never writes the local sheet, which lives in this browser alone', () => {
    const store = getCharacterStore('local')

    store.info.update((info) => ({ ...info, ac: 15 }))
    vi.advanceTimersByTime(2000)

    expect(wire.updates).toEqual([])
  })

  it('raises the alarm when the vault refuses the write, and clears it when the next lands', async () => {
    const { store } = opened()

    wire.refuse = true
    store.info.update((info) => ({ ...info, ac: 15 }))
    await vi.advanceTimersByTimeAsync(600)
    expect(get(characterWriteError)).toBe('That change did not reach the vault. The next change tries again.')

    wire.refuse = false
    store.info.update((info) => ({ ...info, ac: 16 }))
    await vi.advanceTimersByTimeAsync(600)

    expect(get(characterWriteError)).toBe('')
    expect(wire.updates).toHaveLength(1)
    expect(wire.updates[0].character.info.ac).toBe(16)
  })
})
