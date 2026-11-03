import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { COLLECTIONS } from '../src/lib/firestore.types'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const read = (name: string) => readFileSync(resolve(root, name), 'utf8')

const rules = read('firestore.rules')

const block = (path: string, from = 0) => {
  const head = `match ${path} {`
  const start = rules.indexOf(head, from)
  if (start < 0) return ''

  let depth = 0
  for (let i = start + head.length - 1; i < rules.length; i += 1) {
    if (rules[i] === '{') depth += 1
    if (rules[i] === '}') {
      depth -= 1
      if (depth === 0) return rules.slice(start, i + 1)
    }
  }

  return ''
}

const allows = (body: string) =>
  body.split('\n').map((line) => line.trim()).filter((line) => line.startsWith('allow'))

const own = (body: string) => {
  const nested = body.indexOf('match ', 1)
  return allows(nested < 0 ? body : body.slice(0, nested))
}

const recipe = (name: string) => {
  const found = new RegExp(`^${name}(?: [^\\n]*)?:[^\\n]*\\n((?:[ \\t]+[^\\n]*\\n?)*)`, 'm').exec(read('justfile'))
  return (found?.[1] ?? '').split('\n').map((line) => line.trim()).filter(Boolean)
}

const chat = block('/chat/{entryId}')
const campaign = block('/campaigns/{campaignId}')
const generic = block('/{part}/{recordId}')

describe('the campaign chat rules the shared roll log needs', () => {
  it('governs the path the client writes, campaigns/<id>/chat', () => {
    expect(COLLECTIONS.CAMPAIGNS).toBe('campaigns')
    expect(COLLECTIONS.CHAT).toBe('chat')
    expect(campaign).toContain('match /chat/{entryId} {')
    expect(chat).not.toBe('')
  })

  it('lets every member read the open log, and only the DM the hidden rolls', () => {
    expect(allows(chat)).toContain('allow read: if member() && (resource.data.is_hidden == false || isOwner(campaignOf(campaignId).dm_id));')
    expect(chat).toContain('isOwner(campaignOf(campaignId).dm_id)')
    expect(chat).toContain('uid() in campaignOf(campaignId).player_ids')
  })

  it('lets a member create only an entry they authored', () => {
    expect(allows(chat)).toContain('allow create: if member() && request.resource.data.author_id == uid();')
  })

  it('keeps editing and deleting an entry with its author', () => {
    expect(allows(chat)).toContain('allow update, delete: if isOwner(resource.data.author_id);')
  })

  it('opens nothing else, so read, create, update and delete are the whole surface', () => {
    expect(allows(chat)).toEqual([
      'allow read: if member() && (resource.data.is_hidden == false || isOwner(campaignOf(campaignId).dm_id));',
      'allow create: if member() && request.resource.data.author_id == uid();',
      'allow update, delete: if isOwner(resource.data.author_id);'
    ])
  })
})

describe('the generic campaign record rules', () => {
  it('excludes chat from the writes every other part allows', () => {
    expect(allows(generic)).toContain(
      "allow create: if part != 'chat' && atTheTable() && isOwner(request.resource.data.owner_id);"
    )
    expect(allows(generic)).toContain(
      "allow update, delete: if part != 'chat' && isOwner(resource.data.owner_id);"
    )
    expect(allows(generic)).not.toContain('allow write: if isOwner(parent().dm_id);')
  })

  it('reads by the resolved reader list, so a list query and the rule agree', () => {
    expect(allows(generic)).toContain('allow read: if signedIn() && uid() in resource.data.readers;')
  })

  it('gives the DM no override, so only the owner writes what they made', () => {
    expect(allows(generic).join('\n')).not.toContain('isOwner(parent().dm_id)')
  })

  it('does not reach the log through a recursive match on the campaign itself', () => {
    expect(campaign.match(/match [^\n]*document=\*\*[^\n]*/g)).toEqual(['match /files/{fileId}/{document=**} {'])
    expect(own(campaign)).toEqual([
      'allow read: if isMember();',
      'allow create: if isOwner(request.resource.data.dm_id);',
      'allow update: if isOwner(stored().dm_id)',
      'allow delete: if isOwner(stored().dm_id);'
    ])
  })
})

describe('the membership rules a table needs to gather', () => {
  const party = block('/parties/{partyId}')
  const character = block('/characters/{characterId}')

  it('lets a player bring a character to the campaign and touch nothing else of it', () => {
    expect(campaign).toContain("|| (signedIn() && uid() in stored().player_ids && onlyCharacters());")
    expect(rules).toContain(
      "return request.resource.data.diff(resource.data).affectedKeys().hasOnly(['character_ids', 'updated_at']);"
    )
  })

  it('lets a party member bring a character to the party, while only the owner deletes it', () => {
    expect(allows(party)).toEqual([
      'allow read: if signedIn() && uid() in resource.data.member_ids;',
      'allow create: if isOwner(request.resource.data.owner_id);',
      'allow update: if isOwner(resource.data.owner_id)',
      'allow delete: if isOwner(resource.data.owner_id);'
    ])
    expect(party).toContain('|| (signedIn() && uid() in resource.data.member_ids && onlyCharacters());')
  })

  it('lets every player at the campaign read a character brought to it, so the party roll loads for them', () => {
    expect(character).toContain('uid() in campaignOf(stored().campaign_id).player_ids;')
    expect(character).toContain('|| atTheTable();')
  })

  it('keeps no rule for the chat sessions nothing writes any more', () => {
    expect(rules).not.toContain('chatSessions')
  })
})

describe('the rules file just rules deploys', () => {
  it('is the file firebase.json names for cloud.firestore', () => {
    expect(JSON.parse(read('firebase.json')).firestore.rules).toBe('firestore.rules')
  })

  it('is released with the indexes by just rules, the storage rules standing apart while the project has no Storage', () => {
    expect(recipe('rules')).toEqual(['firebase deploy --only firestore:rules,firestore:indexes'])
    expect(recipe('storage-rules')).toEqual(['firebase deploy --only storage:rules'])
  })

  it('is released again by just firebase-deploy, so the code that needs it never ships alone', () => {
    expect(read('justfile')).toMatch(/^firebase-deploy: gate rules$/m)
    expect(recipe('firebase-deploy')).toEqual(['firebase deploy --only hosting'])
  })

  it('is version 2 and closes on a deny all, so nothing unnamed is open', () => {
    expect(rules.startsWith("rules_version = '2';")).toBe(true)
    expect(allows(block('/{document=**}', rules.lastIndexOf('match /{document=**}')))).toEqual([
      'allow read, write: if false;'
    ])
  })

  it('carries balanced braces, so firebase compiles it', () => {
    expect(rules.split('{').length).toBe(rules.split('}').length)
  })
})
