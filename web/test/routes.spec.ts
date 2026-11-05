import { describe, it, vi, expect } from 'vitest'

vi.hoisted(() => {
  ;(globalThis as any).window = { location: { pathname: '/', search: '', origin: 'http://localhost' } }
})

import { resolveRoute } from '../node_modules/sly-svelte-location-router/dist/router.js'

const page = () => async () => ({ default: {} })

const routes: any = {
  '/': '/main',
  '/main': { name: 'main', component: page() },
  '/login': '/main',
  '/signup': '/main',
  '/main/create/character': { name: 'character-create', component: page() },
  '/main/create/character/class': { name: 'character-class', component: page() },
  '/main/create/character/race': { name: 'character-race', component: page() },
  '/sources/:kind/:id': { name: 'source-view', component: page() },
  '/main/create/campaign': { name: 'campaign-create', component: page() },
  '/character/:id': { name: 'character-view', component: page() },
  '/user': { name: 'user', component: page() },
  '/campaign/:id': { name: 'campaign-view', component: page() }
}

describe('every route the app can reach resolves to its own page', () => {
  for (const [path, want] of [
    ['/main', 'main'],
    ['/login', 'main'],
    ['/signup', 'main'],
    ['/user', 'user'],
    ['/character/GBrry3iBrlac8Pdb1n6e', 'character-view'],
    ['/campaign/abc123', 'campaign-view'],
    ['/main/create/character', 'character-create'],
    ['/main/create/character/class', 'character-class'],
    ['/main/create/character/race', 'character-race'],
    ['/sources/classes/fighter', 'source-view'],
    ['/sources/races/tiefling', 'source-view']
  ] as const) {
    it(`${path} resolves to ${want}`, () => {
      const found = resolveRoute(path.split('/').filter(Boolean), routes)
      expect({ name: found.matched?.name, remaining: found.remaining }).toEqual({ name: want, remaining: [] })
    })
  }

  it('the root redirects to the hearth', () => {
    expect(resolveRoute([], routes).matched?.name).toBe('main')
  })
})

describe('character status', () => {
  it('marks a character with an unknown race as a draft', async () => {
    const { getCharacterStatus } = await import('../src/lib/firestore.service')
    const doc: any = {
      character: { info: { name: 'Testy', class: { name: 'Cleric' }, race: { name: 'Unknown' } } }
    }
    expect(getCharacterStatus(doc.character)).toBe('draft')
  })

  it('marks a fully configured character as ready', async () => {
    const { getCharacterStatus } = await import('../src/lib/firestore.service')
    const doc: any = {
      character: { info: { name: 'Fatty', class: { name: 'Gunslinger' }, race: { name: 'Human' } } }
    }
    expect(getCharacterStatus(doc.character)).toBe('ready')
  })

  it('marks a nameless character as a draft', async () => {
    const { getCharacterStatus } = await import('../src/lib/firestore.service')
    const doc: any = {
      character: { info: { name: '  ', class: { name: 'Rogue' }, race: { name: 'Elf' } } }
    }
    expect(getCharacterStatus(doc.character)).toBe('draft')
  })
})
