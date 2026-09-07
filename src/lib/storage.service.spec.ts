import { describe, expect, it, vi } from 'vitest'
import portraitSource from '../components/ui/Portrait.svelte?raw'
import storedImageSource from '../components/ui/StoredImage.svelte?raw'
import createPageSource from '../pages/CharacterCreatePage.svelte?raw'

vi.mock('./firebase', () => ({
  db: 'db',
  auth: { currentUser: { uid: 'lars' } }
}))

vi.mock('./swarm', () => ({
  getSwarmFile: () => Promise.resolve(null)
}))

vi.mock('firebase/firestore', () => ({
  collection: () => ({}),
  doc: () => ({}),
  getDoc: () => Promise.resolve({ exists: () => false, data: () => null }),
  getDocs: () => Promise.resolve({ docs: [] }),
  orderBy: () => ({}),
  query: () => ({}),
  serverTimestamp: () => 'server-time',
  writeBatch: () => ({ set: () => undefined, delete: () => undefined, commit: () => Promise.resolve() })
}))

import { getFileUrl, isDeadFile, isStoredFile } from './storage.service'

const dead = 'blob:http://localhost:5174/5d0c2b1e-4f1a-4b7e-9d1c-0b6e7f3a2c11'

describe('a blob: portrait address', () => {
  it('is dead, since an object URL lives for one page in one browser', () => {
    expect(isDeadFile(dead)).toBe(true)
    expect(isStoredFile(dead)).toBe(false)
    expect(isDeadFile('file:users/lars/files/1757000000000-a1b2c3d4.webp')).toBe(false)
    expect(isDeadFile('local:users/lars/1757000000000-portrait.png')).toBe(false)
    expect(isDeadFile('https://example.test/portrait.webp')).toBe(false)
  })

  it('resolves to nothing, so no image is requested and no console error follows', async () => {
    expect(await getFileUrl(dead)).toBe('')
  })

  it('draws the portrait initial in place of the image', () => {
    expect(portraitSource).toContain("const picture = $derived(src && !isDeadFile(src) ? src : '')")
    expect(portraitSource).toContain('{#if picture}')
    expect(portraitSource).toContain('<StoredImage src={picture} {alt} />')
  })

  it('leaves a stored image unresolved rather than handing the browser a dead src', () => {
    expect(storedImageSource).toContain("resolved = isDeadFile(address) ? '' : address")
  })
})

describe('the portrait preview on the create page', () => {
  it('is the stored address the file was posted to, never an object URL', () => {
    expect(createPageSource).not.toContain('createObjectURL')
    expect(createPageSource).toContain("creationData.imageUrl = await postFile(file, { kind: 'user' })")
    expect(createPageSource).toContain('<Portrait src={creationData.imageUrl}')
  })
})
