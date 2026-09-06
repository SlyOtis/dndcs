import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import type { CampaignChatEntry } from './firestore.types'

const wire = vi.hoisted(() => ({
  paths: [] as unknown[][],
  orders: [] as string[],
  writes: [] as Array<{ id: string, data: Record<string, unknown> }>,
  streams: [] as Array<{
    target: unknown,
    onChange: (snapshot: { docs: Array<{ data: () => unknown }> }) => void
  }>,
  stopped: [] as string[],
  docs: [] as unknown[]
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
  getDoc: () => Promise.resolve({ exists: () => false, data: () => null }),
  getDocs: () => Promise.resolve({ docs: wire.docs.map((entry) => ({ data: () => entry })) }),
  setDoc: (target: { id: string }, data: Record<string, unknown>) => {
    wire.writes.push({ id: target.id, data })
    return Promise.resolve()
  },
  updateDoc: () => Promise.resolve(),
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

import { campaignService } from './firestore.service'

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

  it('reads back oldest first, whatever order the collection answers in', async () => {
    const late = entry({ id: 'shared-2', created_at: stamp('2026-09-06T10:05:00.000Z') })
    const early = entry({ id: 'shared-1', created_at: stamp('2026-09-06T10:00:00.000Z') })
    wire.docs.push(late, early)

    const entries = await campaignService.getChatEntries('camp-1')

    expect(entries.map((found) => found.id)).toEqual(['shared-1', 'shared-2'])
    expect(wire.paths).toEqual([['db', 'campaigns', 'camp-1', 'chat']])
  })
})
