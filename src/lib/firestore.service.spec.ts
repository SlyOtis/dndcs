import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import type { CampaignChatEntry, CharacterDocument } from './firestore.types'

const wire = vi.hoisted(() => ({
  paths: [] as unknown[][],
  orders: [] as string[],
  writes: [] as Array<{ id: string, data: Record<string, unknown> }>,
  streams: [] as Array<{
    target: unknown,
    onChange: (snapshot: { docs: Array<{ data: () => unknown }> }) => void
  }>,
  stopped: [] as string[],
  docs: [] as unknown[],
  held: null as null | { exists: () => boolean, data: () => unknown },
  updates: [] as Array<{ id: string, data: Record<string, unknown> }>
}))

vi.mock('./firebase', () => ({
  db: 'db',
  auth: { currentUser: { uid: 'lars' } }
}))

vi.mock('firebase/firestore', () => ({
  collection: (...segments: unknown[]) => {
    wire.paths.push(segments)
    return { kind: 'collection', segments }
  },
  doc: (...segments: unknown[]) => {
    if (segments.length === 1) return { id: 'entry-1', parent: segments[0] }
    wire.paths.push(segments)
    return { id: String(segments[segments.length - 1]), segments }
  },
  getDoc: () => Promise.resolve(wire.held ?? { exists: () => false, data: () => null }),
  getDocs: () => Promise.resolve({ docs: wire.docs.map((entry) => ({ data: () => entry })) }),
  setDoc: (target: { id: string }, data: Record<string, unknown>) => {
    wire.writes.push({ id: target.id, data })
    return Promise.resolve()
  },
  updateDoc: (target: { id: string }, data: Record<string, unknown>) => {
    wire.updates.push({ id: target.id, data })
    return Promise.resolve()
  },
  deleteDoc: () => Promise.resolve(),
  query: (target: unknown, ...constraints: unknown[]) => ({ kind: 'query', target, constraints }),
  where: (...args: unknown[]) => ({ kind: 'where', args }),
  orderBy: (field: string) => {
    wire.orders.push(field)
    return { kind: 'orderBy', field }
  },
  limit: (count: number) => ({ kind: 'limit', count }),
  onSnapshot: (
    target: unknown,
    onChange: (snapshot: { docs: Array<{ data: () => unknown }> }) => void
  ) => {
    wire.streams.push({ target, onChange })
    return () => wire.stopped.push('stopped')
  },
  serverTimestamp: () => 'server-time'
}))

import { campaignService, characterService } from './firestore.service'

const stamp = (at: string) =>
  ({ toDate: () => new Date(at), toMillis: () => new Date(at).getTime() }) as unknown as Timestamp

const entry = (fields: Partial<CampaignChatEntry>): CampaignChatEntry => ({
  id: 'shared-1',
  author_id: 'lars',
  author_name: 'Lars',
  kind: 'roll',
  body: 'Lars rolls stealth',
  query: '',
  is_hidden: false,
  roll_kind: 'skill',
  formula: '1d20+3',
  dice: [14],
  roll: 14,
  total: 17,
  created_at: stamp('2026-09-06T10:00:00.000Z'),
  updated_at: stamp('2026-09-06T10:00:00.000Z'),
  ...fields
})

beforeEach(() => {
  wire.paths.length = 0
  wire.orders.length = 0
  wire.writes.length = 0
  wire.streams.length = 0
  wire.stopped.length = 0
  wire.docs.length = 0
  wire.held = null
  wire.updates.length = 0
})

describe('the campaign chat collection the rules govern', () => {
  it('is the path the listener subscribes to, ordered by created_at', () => {
    campaignService.postChatListener('camp-1', () => {})

    expect(wire.paths).toEqual([['db', 'campaigns', 'camp-1', 'chat']])
    expect(wire.orders).toEqual(['created_at'])
  })

  it('reaches the caller from the stream, so a roll needs no fetch and no reload', () => {
    const seen: CampaignChatEntry[][] = []
    const stop = campaignService.postChatListener('camp-1', (entries) => seen.push(entries))

    const first = entry({ id: 'shared-1', author_id: 'dis', author_name: 'Dis' })
    wire.streams[0].onChange({ docs: [{ data: () => first }] })
    expect(seen).toEqual([[first]])

    const second = entry({ id: 'shared-2' })
    wire.streams[0].onChange({ docs: [{ data: () => first }, { data: () => second }] })
    expect(seen[1]).toEqual([first, second])

    stop()
    expect(wire.stopped).toEqual(['stopped'])
  })

  it('is the path an entry is written to, carrying the author id the create rule tests', async () => {
    const id = await campaignService.postChatEntry('camp-1', {
      author_id: 'lars',
      author_name: 'Lars',
      kind: 'roll',
      body: 'Lars rolls stealth',
      query: '',
      is_hidden: false,
      roll_kind: 'skill',
      formula: '1d20+3',
      dice: [14],
      roll: 14,
      total: 17
    })

    expect(id).toBe('entry-1')
    expect(wire.paths).toEqual([['db', 'campaigns', 'camp-1', 'chat']])
    expect(wire.writes).toEqual([
      {
        id: 'entry-1',
        data: {
          author_id: 'lars',
          author_name: 'Lars',
          kind: 'roll',
          body: 'Lars rolls stealth',
          query: '',
          is_hidden: false,
          roll_kind: 'skill',
          formula: '1d20+3',
          dice: [14],
          roll: 14,
          total: 17,
          id: 'entry-1',
          created_at: 'server-time',
          updated_at: 'server-time'
        }
      }
    ])
  })

  it('stores the card kind on the entry, so the treatment survives another member read', async () => {
    await campaignService.postChatEntry('camp-1', {
      author_id: 'lars',
      author_name: 'Lars',
      kind: 'message',
      body: '**Longsword**\n\nVersatile (1d10), 15 gp.',
      query: 'Lookup Item: longsword',
      is_hidden: false,
      card_kind: 'item_card',
      roll_kind: '',
      formula: '',
      dice: [],
      roll: 0,
      total: 0
    })

    expect(wire.writes[0].data.card_kind).toBe('item_card')
    expect(Object.values(wire.writes[0].data)).not.toContain(undefined)
  })

  it('reads back oldest first, whatever order the collection answers in', async () => {
    const late = entry({ id: 'shared-2', created_at: stamp('2026-09-06T10:05:00.000Z') })
    const early = entry({ id: 'shared-1', created_at: stamp('2026-09-06T10:00:00.000Z') })
    wire.docs.push(late, early)

    const entries = await campaignService.getChatEntries('camp-1')

    expect(entries.map((found) => found.id)).toEqual(['shared-1', 'shared-2'])
    expect(wire.paths).toEqual([['db', 'campaigns', 'camp-1', 'chat']])
  })
})

const dead = 'blob:http://localhost:5174/5d0c2b1e-4f1a-4b7e-9d1c-0b6e7f3a2c11'
const kept = 'file:users/lars/files/1757000000000-a1b2c3d4.webp'

const portrait = (id: string, imageUrl: string): CharacterDocument =>
  ({
    id,
    owner_id: 'lars',
    character: { info: { name: 'Testy', imageUrl, class: { name: 'Fighter' }, race: { name: 'Human' } } },
    metadata: { name: 'Testy', level: 1, class: 'Fighter', race: 'Human', status: 'ready' },
    permissions: { viewers: [], editors: [], dm_override: true }
  }) as unknown as CharacterDocument

describe('a character that carries a dead blob: portrait address', () => {
  it('is read back without it, and the document is written without it, on getCharacter', async () => {
    wire.held = { exists: () => true, data: () => portrait('char-1', dead) }

    const found = await characterService.getCharacter('char-1')

    expect(found?.character.info.imageUrl).toBe('')
    expect(wire.updates).toEqual([{ id: 'char-1', data: { 'character.info.imageUrl': '' } }])
  })

  it('is read back without it, each of them, on getUserCharacters', async () => {
    wire.docs.push(portrait('char-1', dead), portrait('char-2', kept), portrait('char-3', dead))

    const found = await characterService.getUserCharacters()

    expect(found.map((entry) => entry.character.info.imageUrl)).toEqual(['', kept, ''])
    expect(wire.updates).toEqual([
      { id: 'char-1', data: { 'character.info.imageUrl': '' } },
      { id: 'char-3', data: { 'character.info.imageUrl': '' } }
    ])
  })

  it('is the only kind of address the read rewrites: a file: record and a hosted address stay', async () => {
    wire.docs.push(portrait('char-2', kept), portrait('char-4', 'https://example.test/portrait.webp'))

    const found = await characterService.getUserCharacters()

    expect(found.map((entry) => entry.character.info.imageUrl)).toEqual([kept, 'https://example.test/portrait.webp'])
    expect(wire.updates).toEqual([])
  })

  it('is written by nothing: a new character carries the stored address it was given', async () => {
    await characterService.createCharacter(portrait('char-5', kept).character)

    expect((wire.writes[0].data.character as CharacterDocument['character']).info.imageUrl).toBe(kept)
    expect(wire.updates).toEqual([])
  })
})
