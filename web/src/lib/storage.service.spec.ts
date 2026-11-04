import { afterEach, describe, expect, it, vi } from 'vitest'
import portraitSource from '../components/ui/Portrait.svelte?raw'
import storedImageSource from '../components/ui/StoredImage.svelte?raw'
import createPageSource from '../pages/CharacterCreatePage.svelte?raw'
import resourceShellSource from '../components/campaign/ResourceShell.svelte?raw'

const wire = vi.hoisted(() => ({ reads: [] as string[], deletes: [] as string[] }))

vi.mock('./api', () => ({
  getSession: () => ({ uid: 'lars', email: '', display_name: '', photo_url: '' }),
  getApi: (path: string) => {
    wire.reads.push(path)
    return Promise.resolve({ id: 'a1', name: 'theme.mp3', mime_type: 'audio/mpeg', size_bytes: 3, etag: 'tag-a', uploaded_by: 'lars' })
  },
  deleteApi: (path: string) => {
    wire.deletes.push(path)
    return Promise.resolve(null)
  },
  getCsrfHeaders: () => ({ 'SAuth-CSRF-Token': 'tok' })
}))

import {
  deleteFile,
  getFileRecord,
  getFileUrl,
  getMediaUrl,
  isDeadFile,
  isFileRecord,
  isStoredFile,
  postFile,
  UploadError
} from './storage.service'

const dead = 'blob:http://localhost:5174/5d0c2b1e-4f1a-4b7e-9d1c-0b6e7f3a2c11'
const stored = '/api/asset/0b6e7f3a-2c11-4f1a-9d1c-5d0c2b1e4b7e/data'

describe('a blob: portrait address', () => {
  it('is dead, since an object URL lives for one page in one browser', () => {
    expect(isDeadFile(dead)).toBe(true)
    expect(isStoredFile(dead)).toBe(false)
    expect(isDeadFile(stored)).toBe(false)
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

describe('a file the editor makes on a page', () => {
  it('goes to the campaign folder on a campaign page and to the player otherwise, whatever its type', () => {
    expect(resourceShellSource).toContain("return await postFile(file, campaignId ? { kind: 'campaignFile', campaignId } : { kind: 'user' })")
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

describe('the service asset store', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    wire.reads = []
    wire.deletes = []
  })

  it('addresses an asset on its data route', () => {
    expect(getMediaUrl('a1')).toBe('/api/asset/a1/data')
  })

  it('resolves an asset address to itself, so audio and video stream by range', async () => {
    expect(isFileRecord(stored)).toBe(true)
    expect(isStoredFile(stored)).toBe(true)
    expect(await getFileUrl(stored)).toBe(stored)
  })

  it('resolves an old file: record and a legacy local: reference to nothing, since neither store remains', async () => {
    expect(isFileRecord('file:users/lars/files/1-a.webp')).toBe(false)
    expect(isStoredFile('file:users/lars/files/1-a.webp')).toBe(true)
    expect(await getFileUrl('file:users/lars/files/1-a.webp')).toBe('')
    expect(await getFileUrl('local:users/lars/1757000000000-portrait.png')).toBe('')
  })

  it('leaves a hosted address as it is', async () => {
    expect(isStoredFile('https://example.test/portrait.webp')).toBe(false)
    expect(await getFileUrl('https://example.test/portrait.webp')).toBe('https://example.test/portrait.webp')
  })

  it('posts the original with its name, type and campaign in one form and keeps the asset address', async () => {
    const calls = getStore(() => new Response(JSON.stringify({ data: { id: 'a1', etag: 'tag-a' } }), { status: 201 }))
    const file = new File([new Uint8Array([1, 2, 3])], 'theme.mp3', { type: 'audio/mpeg' })

    const address = await postFile(file, { kind: 'campaignAudio', campaignId: 'c1' })

    expect(address).toBe('/api/asset/a1/data')
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe('/api/asset')
    expect(calls[0].init.method).toBe('POST')
    const form = calls[0].init.body as FormData
    expect(form.get('name')).toBe('theme.mp3')
    expect(form.get('mime_type')).toBe('audio/mpeg')
    expect(form.get('campaign_id')).toBe('c1')
    expect((form.get('file') as File).name).toBe('theme.mp3')
    expect((calls[0].init.headers as Record<string, string>)['SAuth-CSRF-Token']).toBe('tok')
    expect((calls[0].init.headers as Record<string, string>)['Content-Type']).toBeUndefined()
  })

  it('posts a player\'s own file without a campaign', async () => {
    const calls = getStore(() => new Response(JSON.stringify({ data: { id: 'a2' } }), { status: 201 }))
    const file = new File([new Uint8Array([1])], 'portrait.webp', { type: 'image/webp' })

    expect(await postFile(file, { kind: 'user' })).toBe('/api/asset/a2/data')
    expect((calls[0].init.body as FormData).has('campaign_id')).toBe(false)
  })

  it('posts any type of file to a campaign folder', async () => {
    const calls = getStore(() => new Response(JSON.stringify({ data: { id: 'a3' } }), { status: 201 }))
    const file = new File([new Uint8Array([1])], 'clip.webm', { type: 'video/webm' })

    expect(await postFile(file, { kind: 'campaignFile', campaignId: 'c1' })).toBe('/api/asset/a3/data')
    expect((calls[0].init.body as FormData).get('campaign_id')).toBe('c1')
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
    expect(calls).toHaveLength(0)
  })

  it('reads and deletes an asset by the id in its address, and leaves an old file: record alone', async () => {
    expect(await getFileRecord(stored)).toMatchObject({ id: 'a1', mime_type: 'audio/mpeg' })
    expect(await getFileRecord('file:users/lars/files/1-a.webp')).toBeNull()
    await deleteFile(stored)
    await deleteFile('file:users/lars/files/1-a.webp')

    expect(wire.reads).toEqual(['/asset/0b6e7f3a-2c11-4f1a-9d1c-5d0c2b1e4b7e'])
    expect(wire.deletes).toEqual(['/asset/0b6e7f3a-2c11-4f1a-9d1c-5d0c2b1e4b7e'])
  })
})
