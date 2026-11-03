import { beforeEach, describe, expect, it, vi } from 'vitest'

const wire = vi.hoisted(() => ({
  steps: [] as string[],
  stored: {} as Record<string, Array<Record<string, unknown>>>,
  puts: [] as Array<{ part: string, id: string, values: Record<string, unknown> }>
}))

vi.mock('./firestore.service', () => ({
  campaignService: {
    getPart: (owner: { at: string, id: string }, part: string) =>
      Promise.resolve(wire.stored[`${owner.at}/${owner.id}/${part}`] ?? []),
    putPart: (_owner: unknown, part: string, id: string, values: Record<string, unknown>) => {
      wire.puts.push({ part, id, values })
      return Promise.resolve()
    },
    deletePart: (owner: { at: string, id: string }, part: string, id: string) => {
      wire.steps.push(`delete ${owner.at}/${owner.id}/${part}/${id}`)
      return Promise.resolve()
    }
  }
}))

vi.mock('./collab', () => ({
  dropDoc: (owner: { at: string, id: string }, part: string, id: string) => {
    wire.steps.push(`drop ${owner.at}/${owner.id}/${part}/${id}`)
    return Promise.resolve()
  }
}))

vi.mock('./storage.service', () => ({
  isStoredFile: (address: string) => address.startsWith('file:'),
  deleteFile: (address: string) => {
    wire.steps.push(`file ${address}`)
    return Promise.resolve()
  }
}))

import { deleteOne, deleteResources, getBlank, getReaders, putReaders, type Resource } from './resources'

const campaign = { id: 'camp-1', dm_id: 'lars', player_ids: ['dis', 'ola'] }
const party = { id: 'party-1', member_ids: ['lars', 'kari'] }

const one = (fields: Partial<Resource> = {}): Resource => ({ ...getBlank('entries', 'lars'), id: 'res-1', ...fields })

beforeEach(() => {
  wire.steps.length = 0
  wire.puts.length = 0
  wire.stored = {}
})

describe('getReaders', () => {
  it('is the owner alone for a private resource', () => {
    expect(getReaders(one(), [campaign], [party])).toEqual(['lars'])
  })

  it('brings the dungeon master and the players of a campaign it is shared with', () => {
    expect(getReaders(one({ owner_id: 'dis', share_campaigns: ['camp-1'] }), [campaign], [])).toEqual([
      'dis',
      'lars',
      'ola'
    ])
  })

  it('brings the members of a party it is shared with, and the people named, once each', () => {
    const shared = one({ share_parties: ['party-1'], share_users: ['kari', 'per'] })
    expect(getReaders(shared, [], [party])).toEqual(['lars', 'kari', 'per'])
  })

  it('ignores a campaign or party it is not shared with, whatever is handed in', () => {
    expect(getReaders(one({ share_campaigns: ['camp-2'] }), [campaign], [party])).toEqual(['lars'])
  })
})

describe('deleteOne', () => {
  it('drops the shared document first, then the stored pictures, then the resource, at the stored collection', async () => {
    const held = one({ id: 'npc-1', image: 'file:a', images: ['file:a', 'file:b', 'https://example.test/c.png'] })

    await deleteOne({ at: 'campaigns', id: 'camp-1' }, 'characters', held)

    expect(wire.steps).toEqual([
      'drop campaigns/camp-1/npcs/npc-1',
      'file file:a',
      'file file:b',
      'delete campaigns/camp-1/npcs/npc-1'
    ])
  })
})

describe('deleteResources', () => {
  it('deletes only what the named owner wrote, on every roll', async () => {
    wire.stored['campaigns/camp-1/locations'] = [{ id: 'place-1', owner_id: 'lars' }, { id: 'place-2', owner_id: 'dis' }]
    wire.stored['campaigns/camp-1/quests'] = [{ id: 'quest-1', owner_id: 'lars' }]

    const count = await deleteResources({ at: 'campaigns', id: 'camp-1' }, 'lars')

    expect(count).toBe(2)
    expect(wire.steps.filter((step) => step.startsWith('delete'))).toEqual([
      'delete campaigns/camp-1/locations/place-1',
      'delete campaigns/camp-1/quests/quest-1'
    ])
  })
})

describe('putReaders', () => {
  it('rewrites the readers of what the owner shared with a changed party, and leaves the rest', async () => {
    wire.stored['users/lars/entries'] = [
      { id: 'e-1', owner_id: 'lars', share_parties: ['party-1'], readers: ['lars'] },
      { id: 'e-2', owner_id: 'lars', readers: ['lars'] },
      { id: 'e-3', owner_id: 'dis', share_parties: ['party-1'], readers: ['dis'] }
    ]

    const written = await putReaders([{ at: 'users', id: 'lars' }], 'lars', [], [party])

    expect(written).toBe(1)
    expect(wire.puts).toHaveLength(1)
    expect(wire.puts[0]).toMatchObject({ part: 'entries', id: 'e-1', values: { readers: ['lars', 'kari'] } })
  })

  it('writes nothing when the readers already match, in whatever order', async () => {
    wire.stored['campaigns/camp-1/npcs'] = [
      { id: 'n-1', owner_id: 'lars', share_campaigns: ['camp-1'], readers: ['ola', 'dis', 'lars'] }
    ]

    expect(await putReaders([{ at: 'campaigns', id: 'camp-1' }], 'lars', [campaign], [])).toBe(0)
    expect(wire.puts).toEqual([])
  })
})
