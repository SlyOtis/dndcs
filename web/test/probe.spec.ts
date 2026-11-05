import { describe, it, vi, expect } from 'vitest'

vi.hoisted(() => {
  const g = globalThis as any
  g.window = { location: { pathname: '/', search: '', origin: 'http://localhost' } }
})

import { resolveRoute } from '../node_modules/sly-svelte-location-router/dist/router.js'

const routes: any = {
  '/': '/main',
  '/main': { name: 'main', component: async () => ({}) },
  '/login': '/main',
  '/signup': '/main',
  '/main/create/character': { name: 'character-create', component: async () => ({}) },
  '/main/create/character/class': { name: 'character-class', component: async () => ({}) },
  '/main/create/character/race': { name: 'character-race', component: async () => ({}) },
  '/sources/:kind/:id': { name: 'source-view', component: async () => ({}) },
  '/main/create/campaign': { name: 'campaign-create', component: async () => ({}) },
  '/character/:id': { name: 'character-view', component: async () => ({}) },
  '/user': { name: 'user', component: async () => ({}) },
  '/campaign/:id': { name: 'campaign-view', component: async () => ({}) }
}

describe('route resolution', () => {
  for (const [path, want] of [
    ['/main', 'main'],
    ['/character/GBrry3iBrlac8Pdb1n6e', 'character-view'],
    ['/main/create/character', 'character-create'],
    ['/main/create/character/class', 'character-class'],
    ['/main/create/character/race', 'character-race'],
    ['/sources/classes/fighter', 'source-view'],
    ['/user', 'user']
  ] as const) {
    it(`${path} -> ${want}`, () => {
      const segments = path.split('/').filter(Boolean)
      const got = resolveRoute(segments, routes)
      expect({ path, name: got.matched?.name, remaining: got.remaining }).toEqual({
        path, name: want, remaining: []
      })
    })
  }
})
