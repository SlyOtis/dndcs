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

vi.mock('./swarm', () => ({
  getSwarmFile: () => Promise.resolve(null)
}))

import {
  getBlockRange,
  getFileUrl,
  getHeldBlocks,
  getMediaUrl,
  isDeadFile,
  isStoredFile,
  postFile,
  UploadError,
  type FileRecord
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

const store = { 'X-Media-Store': '1' }

function getStore(answer: (url: string, init: RequestInit) => Response) {
  const calls: { url: string; init: RequestInit }[] = []
  vi.stubGlobal('fetch', (url: string, init: RequestInit = {}) => {
    calls.push({ url, init })
    return Promise.resolve(answer(url, init))
  })
  return calls
}

const record: FileRecord = {
  name: 'theme.mp3',
  type: 'audio/mpeg',
  size: 200_000,
  etag: '"tag-a"',
  count: 0,
  block_size: 65_536,
  blocks: [],
  owner_id: 'lars'
}

describe('the media store', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    written.sets = []
    written.commits = 0
  })

  it('addresses a file: record and a local: reference under /media/', () => {
    expect(getMediaUrl('file:campaigns/c1/files/1757-a1.mp3')).toBe('/media/campaigns/c1/files/1757-a1.mp3')
    expect(getMediaUrl('local:users/lars/old portrait.png')).toBe('/media/users/lars/old%20portrait.png')
  })

  it('resolves a held original to its /media/ URL, so audio streams by range', async () => {
    const calls = getStore(() => new Response(null, { status: 200, headers: { ...store, ETag: '"tag-a"', 'Content-Length': '200000' } }))

    expect(await getFileUrl('local:users/lars/1757000000000-portrait.png')).toBe('/media/users/lars/1757000000000-portrait.png')
    expect(await getFileUrl('file:campaigns/c1/files/1757-a1.mp3')).toBe('/media/campaigns/c1/files/1757-a1.mp3')
    expect(calls.every((call) => call.init.method === 'HEAD')).toBe(true)
  })

  it('probes with a HEAD the store answers 204 when it lacks the file', async () => {
    const calls = getStore(() => new Response(null, { status: 204, headers: store }))

    expect(await getFileUrl('local:users/lars/1757000000000-portrait.png')).toBe('')
    expect(new Headers(calls[0].init.headers).get('X-Media-Probe')).toBe('1')
  })

  it('says the local client is needed when no media store answers', async () => {
    getStore(() => new Response('<!doctype html>', { status: 200, headers: { 'Content-Type': 'text/html' } }))

    await expect(getFileUrl('local:users/lars/1757000000000-portrait.png')).rejects.toThrow('Full size media needs the local client')
  })

  it('PUTs the original to the store and keeps the ETag the store answered', async () => {
    const calls = getStore(() => new Response(null, { status: 201, headers: { ...store, ETag: '"server-tag"' } }))
    const file = new File([new Uint8Array(70_000)], 'Theme.MP3', { type: 'audio/mpeg' })

    const address = await postFile(file, { kind: 'campaignAudio', campaignId: 'c1' })

    expect(address).toMatch(/^file:campaigns\/c1\/files\/\d+-[a-z0-9]+\.mp3$/)
    expect(calls).toHaveLength(1)
    expect(calls[0].init.method).toBe('PUT')
    expect(calls[0].url).toBe(getMediaUrl(address))
    expect(written.sets[0]).toMatchObject({ name: 'Theme.MP3', size: 70_000, etag: '"server-tag"', campaign_id: 'c1', pieces: [] })
    expect((written.sets[0] as FileRecord).blocks).toHaveLength(2)
  })

  it('writes no record when the store is not there', async () => {
    getStore(() => new Response(null, { status: 404 }))
    const file = new File([new Uint8Array(10)], 'theme.mp3', { type: 'audio/mpeg' })

    await expect(postFile(file, { kind: 'campaignAudio', campaignId: 'c1' })).rejects.toBeInstanceOf(UploadError)
    expect(written.commits).toBe(0)
  })

  it('reads one swarm block as a byte range of the original', async () => {
    const calls = getStore(() => new Response(new Uint8Array(3), { status: 206, headers: store }))

    const bytes = await getBlockRange('file:campaigns/c1/files/1757-a1.mp3', record, 1)

    expect(bytes?.byteLength).toBe(3)
    expect(new Headers(calls[0].init.headers).get('Range')).toBe('bytes=65536-131071')
  })

  it('holds every block only when the stored ETag is the record ETag', async () => {
    getStore(() => new Response(null, { status: 200, headers: { ...store, ETag: '"tag-a"', 'Content-Length': '200000' } }))
    expect(await getHeldBlocks('file:campaigns/c1/files/1757-a1.mp3', record)).toBe('all')

    getStore(() => new Response(null, { status: 200, headers: { ...store, ETag: '"tag-b"', 'Content-Length': '200000' } }))
    expect(await getHeldBlocks('file:campaigns/c1/files/1757-a1.mp3', record)).toEqual([])
  })
})
