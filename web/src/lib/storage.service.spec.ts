import { afterEach, describe, expect, it, vi } from 'vitest'
import portraitSource from '../components/ui/Portrait.svelte?raw'
import storedImageSource from '../components/ui/StoredImage.svelte?raw'
import createPageSource from '../pages/CharacterCreatePage.svelte?raw'

const written = vi.hoisted(() => ({ sets: [] as unknown[], commits: 0 }))

vi.mock('./api', () => ({
  ApiError: class extends Error {},
  getSession: () => ({ uid: 'lars', email: '', display_name: '', photo_url: '' }),
  getQuery: (values: Record<string, string>) => `?${new URLSearchParams(values).toString()}`,
  getApi: () => Promise.reject(new Error('absent')),
  deleteApi: () => Promise.resolve(null),
  postApi: (_path: string, body: unknown) => {
    written.sets.push(body)
    written.commits++
    return Promise.resolve({ id: 'file-1' })
  }
}))

import {
  getFileUrl,
  getMediaUrl,
  isDeadFile,
  isStoredFile,
  postFile,
  UploadError
} from './storage.service'

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

function getStore(answer: (url: string, init: RequestInit) => Response) {
  const calls: { url: string; init: RequestInit }[] = []
  vi.stubGlobal('fetch', (url: string, init: RequestInit = {}) => {
    calls.push({ url, init })
    return Promise.resolve(answer(url, init))
  })
  return calls
}

describe('the service file store', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    written.sets = []
    written.commits = 0
  })

  it('addresses a file: record on the service data route', () => {
    expect(getMediaUrl('file:campaigns/c1/files/1-a.mp3')).toBe('/api/file/data?path=campaigns%2Fc1%2Ffiles%2F1-a.mp3')
  })

  it('resolves a file: record to its data route, so audio and video stream by range', async () => {
    expect(await getFileUrl('file:users/lars/files/1-a.webp')).toBe('/api/file/data?path=users%2Flars%2Ffiles%2F1-a.webp')
  })

  it('resolves a legacy local: reference to nothing, since no local store remains', async () => {
    expect(await getFileUrl('local:users/lars/1757000000000-portrait.png')).toBe('')
  })

  it('leaves a hosted address as it is', async () => {
    expect(await getFileUrl('https://example.test/portrait.webp')).toBe('https://example.test/portrait.webp')
  })

  it('writes the record, then PUTs the original bytes to the service', async () => {
    const calls = getStore(() => new Response(JSON.stringify({ data: { etag: 'tag-a' } }), { status: 200 }))
    const file = new File([new Uint8Array([1, 2, 3])], 'theme.mp3', { type: 'audio/mpeg' })

    const address = await postFile(file, { kind: 'campaignAudio', campaignId: 'c1' })

    expect(address).toMatch(/^file:campaigns\/c1\/files\/\d+-[a-z0-9]+\.mp3$/)
    expect(written.sets).toEqual([{ path: address.slice('file:'.length), name: 'theme.mp3', type: 'audio/mpeg', campaign_id: 'c1' }])
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe(getMediaUrl(address))
    expect(calls[0].init.method).toBe('PUT')
    expect(calls[0].init.body).toBe(file)
    expect((calls[0].init.headers as Record<string, string>)['Content-Type']).toBe('audio/mpeg')
  })

  it('carries the service refusal as an UploadError', async () => {
    getStore(() => new Response(JSON.stringify({ error: { message: 'The file is larger than 256 MB' } }), { status: 413 }))
    const file = new File([new Uint8Array([1])], 'huge.mp3', { type: 'audio/mpeg' })

    await expect(postFile(file, { kind: 'user' })).rejects.toThrow(new UploadError('The file is larger than 256 MB'))
  })

  it('refuses a map that is not an image before anything is written', async () => {
    const calls = getStore(() => new Response(null, { status: 200 }))
    const file = new File([new Uint8Array([1])], 'notes.txt', { type: 'text/plain' })

    await expect(postFile(file, { kind: 'campaignMap', campaignId: 'c1' })).rejects.toThrow('A map needs an image file.')
    expect(written.commits).toBe(0)
    expect(calls).toHaveLength(0)
  })
})
