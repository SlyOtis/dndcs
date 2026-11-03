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
  updates: [] as Array<{ id: string, data: Record<string, unknown> }>,
  deleted: [] as unknown[][]
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
  getDocs: () =>
    Promise.resolve({
      empty: wire.docs.length === 0,
      docs: wire.docs.map((entry) => ({ data: () => entry, ref: { segments: ['ref', (entry as { id?: string }).id] } }))
    }),
  setDoc: (target: { id: string }, data: Record<string, unknown>) => {
    wire.writes.push({ id: target.id, data })
    return Promise.resolve()
  },
  updateDoc: (target: { id: string }, data: Record<string, unknown>) => {
    wire.updates.push({ id: target.id, data })
    return Promise.resolve()
  },
  deleteDoc: (target: { segments: unknown[] }) => {
    wire.deleted.push(target.segments)
    return Promise.resolve()
  },
  arrayUnion: (...values: unknown[]) => ({ union: values }),
  arrayRemove: (...values: unknown[]) => ({ remove: values }),
  deleteField: () => 'delete-field',
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

import { campaignService, characterService, getCharacterMetadata, partyService, userService } from './firestore.service'

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
  wire.deleted.length = 0
})

describe('the campaign chat collection the rules govern', () => {
  const settle = () => new Promise((resolve) => setTimeout(resolve, 0))
  const campaign = (dm_id: string) => ({ exists: () => true, data: () => ({ dm_id }) })

  it('is the path the listener subscribes to, ordered by created_at', async () => {
    wire.held = campaign('lars')
    campaignService.postChatListener('camp-1', () => {})
    await settle()

    expect(wire.paths).toEqual([['db', 'campaigns', 'camp-1'], ['db', 'campaigns', 'camp-1', 'chat']])
    expect(wire.orders).toEqual(['created_at'])
  })

  it('streams every entry to the DM, hidden rolls included', async () => {
    wire.held = campaign('lars')
    campaignService.postChatListener('camp-1', () => {})
    await settle()

    const { constraints } = wire.streams[0].target as { constraints: Array<{ kind: string }> }
    expect(constraints.map((one) => one.kind)).toEqual(['orderBy'])
  })

  it('asks only for open entries as a player, the query the read rule admits', async () => {
    wire.held = campaign('dis')
    campaignService.postChatListener('camp-1', () => {})
    await settle()

    const { constraints } = wire.streams[0].target as { constraints: Array<{ kind: string, args?: unknown[] }> }
    expect(constraints[0]).toEqual({ kind: 'where', args: ['is_hidden', '==', false] })
    expect(constraints[1].kind).toBe('orderBy')
  })

  it('never opens a stream once stopped before the campaign read settles', async () => {
    wire.held = campaign('lars')
    const stop = campaignService.postChatListener('camp-1', () => {})
    stop()
    await settle()

    expect(wire.streams).toEqual([])
  })

  it('reaches the caller from the stream, so a roll needs no fetch and no reload', async () => {
    wire.held = campaign('lars')
    const seen: CampaignChatEntry[][] = []
    const stop = campaignService.postChatListener('camp-1', (entries) => seen.push(entries))
    await settle()

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
          owner_id: 'lars',
          readers: ['lars'],
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

const sheet = (name: string, level: number, className: string, race: string) =>
  ({
    info: { name, level, imageUrl: '', class: { name: className, hitDice: { amount: level, die: 8 } }, race: { name: race, type: '' } }
  }) as unknown as CharacterDocument['character']

describe('the metadata a character card reads', () => {
  it('is derived from the character: name, level, class, race and status', () => {
    expect(getCharacterMetadata(sheet(' Brakka ', 3, 'Cleric', 'Dwarf'))).toEqual({
      name: 'Brakka',
      level: 3,
      class: 'Cleric',
      race: 'Dwarf',
      status: 'ready'
    })
    expect(getCharacterMetadata(sheet('', 1, 'Unknown', 'Unknown'))).toEqual({
      name: 'Unnamed Character',
      level: 1,
      class: 'Unknown',
      race: 'Unknown',
      status: 'draft'
    })
  })

  it('is written with the character on every save, so a card never goes stale', async () => {
    await characterService.updateCharacter('char-1', sheet('Brakka', 4, 'Cleric', 'Dwarf'))

    expect(wire.updates[0].data).toMatchObject({
      'metadata.name': 'Brakka',
      'metadata.level': 4,
      'metadata.class': 'Cleric',
      'metadata.race': 'Dwarf',
      'metadata.status': 'ready'
    })
  })

  it('is repaired on read when a stored card lags the character', async () => {
    wire.docs.push({
      id: 'char-1',
      owner_id: 'lars',
      character: sheet('Brakka', 5, 'Cleric', 'Dwarf'),
      metadata: { name: 'Draft', level: 1, class: 'Cleric', race: 'Unknown', status: 'draft' }
    })

    const found = await characterService.getUserCharacters()

    expect(found[0].metadata).toMatchObject({ name: 'Brakka', level: 5, race: 'Dwarf', status: 'ready' })
    expect(wire.updates).toEqual([
      {
        id: 'char-1',
        data: {
          'metadata.name': 'Brakka',
          'metadata.level': 5,
          'metadata.class': 'Cleric',
          'metadata.race': 'Dwarf',
          'metadata.status': 'ready'
        }
      }
    ])
  })
})

describe('a character copied', () => {
  it('is a new document named as a copy, owned by the one copying, never a template', async () => {
    wire.held = {
      exists: () => true,
      data: () => ({
        id: 'char-1',
        owner_id: 'lars',
        character: sheet('Brakka', 5, 'Cleric', 'Dwarf'),
        metadata: { name: 'Brakka', level: 5, class: 'Cleric', race: 'Dwarf', tags: ['manually-created'], is_template: true }
      })
    }

    const copyId = await characterService.postCharacterCopy('char-1')
    const written = wire.writes[0].data as unknown as CharacterDocument

    expect(copyId).toBe('entry-1')
    expect(written.owner_id).toBe('lars')
    expect(written.character.info.name).toBe('Brakka (copy)')
    expect(written.metadata).toMatchObject({ name: 'Brakka (copy)', level: 5, tags: ['manually-created'], is_template: false })
  })

  it('is refused when the character is gone', async () => {
    await expect(characterService.postCharacterCopy('char-9')).rejects.toThrow('nothing to copy')
    expect(wire.writes).toEqual([])
  })
})

describe('a character deleted', () => {
  it('goes last, after the documents under it, so the rule that reads it still answers', async () => {
    wire.docs.push({ id: 'sources' })

    await characterService.deleteCharacter('char-1')

    expect(wire.deleted).toEqual([['ref', 'sources'], ['db', 'characters', 'char-1']])
  })
})

const profile = (uid: string, email: string) => ({ uid, email, display_name: uid, friends: [] })

const table = (fields: Record<string, unknown> = {}) => ({
  id: 'camp-1',
  name: 'Throwaway',
  description: '',
  dm_id: 'lars',
  player_ids: ['dis'],
  party_ids: [],
  character_ids: [],
  is_active: true,
  settings: {},
  ...fields
})

describe('a friend named by address', () => {
  it('is added to the friends of the one signed in, by uid, without rewriting the rest', async () => {
    wire.docs.push(profile('dis', 'dis@example.test'))

    const found = await userService.postFriend('Dis@Example.test ')

    expect(found.uid).toBe('dis')
    expect(wire.updates).toEqual([{ id: 'lars', data: { friends: { union: ['dis'] }, updated_at: 'server-time' } }])
  })

  it('is refused when nobody signs in with the address, and nothing is written', async () => {
    await expect(userService.postFriend('nobody@example.test')).rejects.toThrow('Nobody signs in with that address.')
    expect(wire.updates).toEqual([])
  })

  it('is refused when it is the address of the one signed in', async () => {
    wire.docs.push(profile('lars', 'lars@example.test'))

    await expect(userService.postFriend('lars@example.test')).rejects.toThrow('That address is your own.')
    expect(wire.updates).toEqual([])
  })

  it('is removed by uid', async () => {
    await userService.deleteFriend('dis')

    expect(wire.updates).toEqual([{ id: 'lars', data: { friends: { remove: ['dis'] }, updated_at: 'server-time' } }])
  })
})

describe('the players at a campaign', () => {
  it('gains the uid the address names', async () => {
    wire.docs.push(profile('ola', 'ola@example.test'))
    wire.held = { exists: () => true, data: () => table() }

    const found = await campaignService.postCampaignPlayer('camp-1', 'ola@example.test')

    expect(found.uid).toBe('ola')
    expect(wire.updates).toEqual([{ id: 'camp-1', data: { player_ids: { union: ['ola'] }, updated_at: 'server-time' } }])
  })

  it('refuses the dungeon master and a player already seated', async () => {
    wire.held = { exists: () => true, data: () => table() }

    wire.docs.push(profile('lars', 'lars@example.test'))
    await expect(campaignService.postCampaignPlayer('camp-1', 'lars@example.test')).rejects.toThrow('dungeon master')

    wire.docs.length = 0
    wire.docs.push(profile('dis', 'dis@example.test'))
    await expect(campaignService.postCampaignPlayer('camp-1', 'dis@example.test')).rejects.toThrow('already at the table')

    expect(wire.updates).toEqual([])
  })

  it('loses a player together with the characters that player brought', async () => {
    wire.docs.push(
      { id: 'char-1', owner_id: 'dis', campaign_id: 'camp-1' },
      { id: 'char-2', owner_id: 'lars', campaign_id: 'camp-1' }
    )

    await campaignService.deleteCampaignPlayer('camp-1', 'dis')

    expect(wire.updates).toEqual([
      { id: 'camp-1', data: { character_ids: { remove: ['char-1'] }, updated_at: 'server-time' } },
      { id: 'char-1', data: { campaign_id: 'delete-field' } },
      { id: 'camp-1', data: { player_ids: { remove: ['dis'] }, updated_at: 'server-time' } }
    ])
  })
})

describe('a character brought to a campaign', () => {
  it('carries the campaign id and is named on the campaign roll', async () => {
    await campaignService.postCampaignCharacter('camp-1', 'char-1')

    expect(wire.updates).toEqual([
      { id: 'char-1', data: { campaign_id: 'camp-1' } },
      { id: 'camp-1', data: { character_ids: { union: ['char-1'] }, updated_at: 'server-time' } }
    ])
  })

  it('leaves the roll before it drops the campaign id, so the dungeon master may still write it', async () => {
    await campaignService.deleteCampaignCharacter('camp-1', 'char-1')

    expect(wire.updates).toEqual([
      { id: 'camp-1', data: { character_ids: { remove: ['char-1'] }, updated_at: 'server-time' } },
      { id: 'char-1', data: { campaign_id: 'delete-field' } }
    ])
  })
})

describe('a character brought to a party', () => {
  it('is added to and removed from character_ids and touches nothing else', async () => {
    await partyService.postPartyCharacter('party-1', 'char-1')
    await partyService.deletePartyCharacter('party-1', 'char-1')

    expect(wire.updates).toEqual([
      { id: 'party-1', data: { character_ids: { union: ['char-1'] }, updated_at: 'server-time' } },
      { id: 'party-1', data: { character_ids: { remove: ['char-1'] }, updated_at: 'server-time' } }
    ])
  })
})

describe('a campaign deleted', () => {
  it('goes last, after what hangs under it, so the rules that read it still answer', async () => {
    await campaignService.deleteCampaign('camp-1')

    expect(wire.deleted.at(-1)).toEqual(['db', 'campaigns', 'camp-1'])
  })

  it('takes its maps, its encounters and the characters brought to it with it', async () => {
    wire.docs.push({ id: 'row-1', owner_id: 'lars', layers: [], image_url: '', address: '' })

    await campaignService.deleteCampaign('camp-1')

    expect(wire.deleted).toContainEqual(['db', 'campaigns', 'camp-1', 'maps', 'row-1'])
    expect(wire.deleted).toContainEqual(['ref', 'row-1'])
    expect(wire.updates).toContainEqual({ id: 'row-1', data: { campaign_id: 'delete-field' } })
    expect(wire.deleted.at(-1)).toEqual(['db', 'campaigns', 'camp-1'])
  })
})

describe('an encounter', () => {
  it('is written under the campaign with its combatants, round and turn', async () => {
    const combatant = {
      id: 'c-1',
      name: 'Goblin',
      kind: 'npc' as const,
      modifier: 2,
      initiative: 14,
      hit_points: 7,
      max_hit_points: 7,
      conditions: [],
      is_hit_points_known: false
    }

    await campaignService.postEncounter('camp-1', { title: 'Ambush', combatants: [combatant], is_active: true })

    expect(wire.paths[0]).toEqual(['db', 'campaigns', 'camp-1', 'encounters'])
    expect(wire.writes[0].data).toMatchObject({
      title: 'Ambush',
      combatants: [combatant],
      round: 1,
      turn: 0,
      is_active: true,
      owner_id: 'lars',
      readers: ['lars']
    })
  })

  it('advances by a put that names only what changed', async () => {
    await campaignService.putEncounter('camp-1', 'enc-1', { turn: 1, round: 2 })

    expect(wire.updates).toEqual([{ id: 'enc-1', data: { turn: 1, round: 2, updated_at: 'server-time' } }])
  })

  it('is deleted at its own path', async () => {
    await campaignService.deleteEncounter('camp-1', 'enc-1')

    expect(wire.deleted).toEqual([['db', 'campaigns', 'camp-1', 'encounters', 'enc-1']])
  })
})
