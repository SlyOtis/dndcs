import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { get } from 'svelte/store'
import type { Readable, Unsubscriber } from 'svelte/store'
import type { User } from 'firebase/auth'
import type { Timestamp } from 'firebase/firestore'
import type { CampaignCardKind, CampaignChatEntry, UserProfile } from './firestore.types'
import type { RollLogItem } from './types'
import type { ChatLog, ReplicateLogItem } from './chat'
import chatItemSource from '../components/chat/ChatItem.svelte?raw'

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
    posted: [] as Array<{ campaignId: string, entry: Record<string, unknown> }>,
    listeners: [] as Array<{ campaignId: string, onChange: (entries: CampaignChatEntry[]) => void }>,
    stopped: [] as string[]
  }
})

vi.mock('sly-svelte-location-router', async () => {
  const { writable } = await import('svelte/store')
  return { currentRoute: writable(null) }
})

vi.mock('./firestore.service', () => ({
  campaignService: {
    postChatEntry: (campaignId: string, entry: Record<string, unknown>) => {
      wire.posted.push({ campaignId, entry })
      return Promise.resolve('entry-1')
    },
    postChatListener: (campaignId: string, onChange: (entries: CampaignChatEntry[]) => void) => {
      wire.listeners.push({ campaignId, onChange })
      return () => wire.stopped.push(campaignId)
    }
  },
  characterService: {
    getCharacter: () => Promise.resolve({ campaign_id: null })
  }
}))

import { getChatLog } from './chat'
import { getRollLog, writeRollLog } from './engine'
import { user, userProfile } from './stores/auth.store'
import { currentCampaignId } from './stores/campaign.store'

const { rollStore } = getRollLog()

const stamp = (at: string) =>
  ({ toDate: () => new Date(at), toMillis: () => new Date(at).getTime() }) as unknown as Timestamp

const shared = (fields: Partial<CampaignChatEntry>): CampaignChatEntry => ({
  id: 'shared-1',
  author_id: 'dis',
  author_name: 'Dis',
  kind: 'roll',
  body: 'Dis rolls perception',
  query: '',
  is_hidden: false,
  roll_kind: 'skill',
  formula: '1d20+5',
  dice: [13],
  roll: 13,
  total: 18,
  created_at: stamp('2026-09-06T10:00:00.000Z'),
  updated_at: stamp('2026-09-06T10:00:00.000Z'),
  ...fields
})

const rolled = (rolledAt: string, text: string): RollLogItem => ({
  type: 'skill',
  text,
  formula: '1d20+3',
  roll: 14,
  total: 17,
  details: '14',
  rolledAt
})

const items = (store: Readable<ChatLog>) =>
  get(store) as unknown as Array<{ createdAt: Date, type: string, data: RollLogItem }>

const signedIn = (uid: string, name: string) => {
  user.set({ uid } as unknown as User)
  userProfile.set({ display_name: name } as unknown as UserProfile)
}

const card = (fields: Partial<CampaignChatEntry>): CampaignChatEntry =>
  shared({
    id: 'shared-card',
    kind: 'message',
    body: '**Longsword**\n\nVersatile (1d10), 15 gp.',
    query: 'Lookup Item: longsword',
    roll_kind: '',
    formula: '',
    dice: [],
    roll: 0,
    total: 0,
    ...fields
  })

const chats = (store: Readable<ChatLog>) =>
  get(store) as unknown as Array<{ createdAt: Date, type: string, data: ReplicateLogItem }>

const streamed = (entry: CampaignChatEntry) => {
  signedIn('lars', 'Lars')
  const log = getChatLog()
  close = log.unsubscribeChat

  currentCampaignId.set('camp-1')
  wire.listeners[0].onChange([entry])

  return chats(log.chatStore)[0]
}

let close: Unsubscriber | null = null

beforeEach(() => {
  wire.posted.length = 0
  wire.listeners.length = 0
  wire.stopped.length = 0
  rollStore.set([])
  currentCampaignId.set(null)
  user.set(null)
  userProfile.set(null)
})

afterEach(() => {
  close?.()
  close = null
})

describe('the shared roll log inside a campaign', () => {
  it('streams the campaign chat collection the rules open', () => {
    const log = getChatLog()
    close = log.unsubscribeChat

    currentCampaignId.set('camp-1')

    expect(wire.listeners.map((listener) => listener.campaignId)).toEqual(['camp-1'])
  })

  it('puts a roll another member made into this member log the moment it arrives, without a reload', () => {
    signedIn('lars', 'Lars')
    const log = getChatLog()
    close = log.unsubscribeChat

    currentCampaignId.set('camp-1')
    expect(get(log.chatStore)).toEqual([])

    wire.listeners[0].onChange([shared({})])

    expect(get(log.chatStore)).toEqual([
      {
        createdAt: new Date('2026-09-06T10:00:00.000Z'),
        type: 'roll',
        data: {
          type: 'skill',
          text: 'Dis rolls perception',
          author: 'Dis',
          formula: '1d20+5',
          roll: 13,
          total: 18,
          details: '13',
          rolledAt: '2026-09-06T10:00:00.000Z'
        }
      }
    ])
  })

  it('holds both members rolls in the order the stream delivers them', () => {
    signedIn('lars', 'Lars')
    const log = getChatLog()
    close = log.unsubscribeChat

    currentCampaignId.set('camp-1')
    wire.listeners[0].onChange([
      shared({ id: 'shared-1', author_id: 'lars', author_name: 'Lars', body: 'Lars rolls initiative' }),
      shared({
        id: 'shared-2',
        author_id: 'dis',
        author_name: 'Dis',
        body: 'Dis rolls initiative',
        created_at: stamp('2026-09-06T10:01:00.000Z'),
        updated_at: stamp('2026-09-06T10:01:00.000Z')
      })
    ])

    expect(items(log.chatStore).map((item) => [item.data.author, item.data.text])).toEqual([
      ['Lars', 'Lars rolls initiative'],
      ['Dis', 'Dis rolls initiative']
    ])
  })

  it('publishes a local roll with the author id the create rule tests', () => {
    signedIn('lars', 'Lars')
    const log = getChatLog()
    close = log.unsubscribeChat

    currentCampaignId.set('camp-1')
    writeRollLog('skill', 'Lars rolls stealth', '1d20+3', 14, 17, '14')

    expect(wire.posted).toHaveLength(1)
    expect(wire.posted[0].campaignId).toBe('camp-1')
    expect(get(rollStore)).toEqual([])
    expect(wire.posted[0].entry).toEqual({
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
  })

  it('publishes a roll once and shows it through the stream, never twice', () => {
    signedIn('lars', 'Lars')
    const log = getChatLog()
    close = log.unsubscribeChat

    currentCampaignId.set('camp-1')
    writeRollLog('skill', 'Lars rolls stealth', '1d20+3', 14, 17, '14')

    expect(wire.posted).toHaveLength(1)
    expect(get(log.chatStore)).toEqual([])

    wire.listeners[0].onChange([shared({ author_id: 'lars', author_name: 'Lars', body: 'Lars rolls stealth' })])

    expect(get(log.chatStore)).toHaveLength(1)
  })

  it('republishes nothing when the local store grows inside a campaign', () => {
    signedIn('lars', 'Lars')
    const log = getChatLog()
    close = log.unsubscribeChat

    currentCampaignId.set('camp-1')
    rollStore.set([rolled('2026-09-06T10:02:00.000Z', 'Lars rolls stealth')])

    expect(wire.posted).toEqual([])
    expect(get(log.chatStore)).toEqual([])
  })

  it('subscribes once per campaign and stops the stream when the campaign is left', () => {
    const log = getChatLog()
    close = log.unsubscribeChat

    currentCampaignId.set('camp-1')
    currentCampaignId.set('camp-1')
    expect(wire.listeners).toHaveLength(1)

    currentCampaignId.set(null)
    expect(wire.stopped).toEqual(['camp-1'])
    expect(wire.listeners).toHaveLength(1)
  })
})

describe('the roll log outside a campaign', () => {
  it('writes nothing to firestore, where the rules deny it', () => {
    const log = getChatLog()
    close = log.unsubscribeChat

    rollStore.set([rolled('2026-09-06T10:03:00.000Z', 'Lars rolls alone')])

    expect(wire.posted).toEqual([])
    expect(wire.listeners).toEqual([])
  })

  it('keeps showing the local roll log', () => {
    const log = getChatLog()
    close = log.unsubscribeChat

    rollStore.set([rolled('2026-09-06T10:03:00.000Z', 'Lars rolls alone')])

    expect(items(log.chatStore).map((item) => item.data.text)).toEqual(['Lars rolls alone'])
  })

  it('drops back to the local log when the campaign is left', () => {
    signedIn('lars', 'Lars')
    const log = getChatLog()
    close = log.unsubscribeChat

    currentCampaignId.set('camp-1')
    wire.listeners[0].onChange([shared({})])
    expect(get(log.chatStore)).toHaveLength(1)

    rollStore.set([rolled('2026-09-06T10:04:00.000Z', 'Lars rolls alone')])
    currentCampaignId.set(null)

    expect(items(log.chatStore).map((item) => item.data.text)).toEqual(['Lars rolls alone'])
  })
})

describe('the card payload another member reads off the shared log', () => {
  it('rebuilds the item card payload the card treatment is bound to', () => {
    expect(streamed(card({ card_kind: 'item_card' }))).toEqual({
      createdAt: new Date('2026-09-06T10:00:00.000Z'),
      type: 'chat',
      data: {
        sentAt: new Date('2026-09-06T10:00:00.000Z'),
        returnedAt: new Date('2026-09-06T10:00:00.000Z'),
        hidden: false,
        query: 'Dis: Lookup Item: longsword',
        response: '**Longsword**\n\nVersatile (1d10), 15 gp.',
        message: '**Longsword**\n\nVersatile (1d10), 15 gp.',
        data: { type: 'item_card' }
      }
    })
  })

  it('rebuilds the npc card payload the same way', () => {
    const item = streamed(
      card({
        card_kind: 'npc_card',
        body: '**Goblin**\n\nAC 15, 7 hp.',
        query: 'Lookup NPC: goblin'
      })
    )

    expect(item.type).toBe('chat')
    expect(item.data.data).toEqual({ type: 'npc_card' })
  })

  it('carries the kind alone, never the item or npc blob the sender held', () => {
    const item = streamed(card({ card_kind: 'item_card' }))

    expect(Object.keys(item.data.data)).toEqual(['type'])
  })

  it('leaves a message that is no card without a payload, so it renders plain', () => {
    const item = streamed(card({ card_kind: '' }))

    expect(item.type).toBe('chat')
    expect(item.data.data).toBeUndefined()
  })

  it('leaves an entry written before the kind was stored without a payload', () => {
    expect(streamed(card({})).data.data).toBeUndefined()
  })

  it('narrows a kind the treatment does not know to no payload', () => {
    const item = streamed(card({ card_kind: 'monster_card' as unknown as CampaignCardKind }))

    expect(item.data.data).toBeUndefined()
  })

  it('keeps a roll off the card path, whatever the entry carries', () => {
    const item = streamed(shared({ card_kind: 'item_card' }))

    expect(item.type).toBe('roll')
  })

  it('binds the card class to the payload the rebuilt entry hands the item', () => {
    expect(chatItemSource.replace(/\s+/g, ' ')).toContain(
      "class:card={logItem.data.data?.type === 'item_card' || logItem.data.data?.type === 'npc_card'}"
    )
  })
})
