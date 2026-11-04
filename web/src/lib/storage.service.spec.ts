import { afterEach, describe, expect, it, vi } from 'vitest'
import portraitSource from '../components/ui/Portrait.svelte?raw'
import storedImageSource from '../components/ui/StoredImage.svelte?raw'
import createPageSource from '../pages/CharacterCreatePage.svelte?raw'
import resourceShellSource from '../components/campaign/ResourceShell.svelte?raw'

const wire = vi.hoisted(() => ({ reads: [] as string[], deletes: [] as string[], answers: {} as Record<string, unknown> }))

vi.mock('./api', async (original) => ({
  ...(await original<typeof import('./api')>()),
  getSession: () => ({ uid: 'lars', email: '', display_name: '', photo_url: '' }),
  getApi: (path: string) => {
    wire.reads.push(path)
    if (path in wire.answers) return Promise.resolve(wire.answers[path])
    return Promise.resolve(path.includes('?') ? [] : { id: 'a1', name: 'theme.mp3', mime_type: 'audio/mpeg', size_bytes: 3, etag: 'tag-a', uploaded_by: 'lars' })
  },
  deleteApi: (path: string) => {
    wire.deletes.push(path)
    return Promise.resolve(null)
  },
  getCsrfHeaders: () => ({ 'SAuth-CSRF-Token': 'tok' })
}))

import {
  deleteFile,
  getAssets,
  getAssetTab,
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
    expect(createPageSource).toContain("creationData.imageUrl = (await postFile(file, { kind: 'user' })).url")
    expect(createPageSource).toContain('<Portrait src={creationData.imageUrl}')
  })
})

describe('a file the editor makes on a page', () => {
  it('goes to the campaign folder on a campaign page and to the player otherwise, whatever its type', () => {
    expect(resourceShellSource).toContain("return (await postFile(file, campaignId ? { kind: 'campaignFile', campaignId } : { kind: 'user' })).url")
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
    wire.answers = {}
  })

  it('addresses an asset on its data route', () => {
    expect(getMediaUrl('a1')).toBe('/api/asset/a1/data')
  })

  it('opens an asset on its data route in a new tab', () => {
    const open = vi.fn()
    vi.stubGlobal('window', { open })

    getAssetTab('a1')

    expect(open).toHaveBeenCalledWith('/api/asset/a1/data', '_blank', 'noopener')
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

  it('posts the original with its name, type and campaign in one form and answers the asset it became', async () => {
    const calls = getStore(() => new Response(JSON.stringify({ data: { id: 'a1', name: 'theme.mp3', mime_type: 'audio/mpeg', etag: 'tag-a' } }), { status: 201 }))
    const file = new File([new Uint8Array([1, 2, 3])], 'theme.mp3', { type: 'audio/mpeg' })

    const asset = await postFile(file, { kind: 'campaignAudio', campaignId: 'c1' })

    expect(asset).toEqual({ id: 'a1', url: '/api/asset/a1/data', name: 'theme.mp3', mimeType: 'audio/mpeg' })
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
    const calls = getStore(() => new Response(JSON.stringify({ data: { id: 'a2', name: 'portrait.webp', mime_type: 'image/webp' } }), { status: 201 }))
    const file = new File([new Uint8Array([1])], 'portrait.webp', { type: 'image/webp' })

    expect((await postFile(file, { kind: 'user' })).url).toBe('/api/asset/a2/data')
    expect((calls[0].init.body as FormData).has('campaign_id')).toBe(false)
  })

  it('posts any type of file to a campaign folder', async () => {
    const calls = getStore(() => new Response(JSON.stringify({ data: { id: 'a3', name: 'clip.webm', mime_type: 'video/webm' } }), { status: 201 }))
    const file = new File([new Uint8Array([1])], 'clip.webm', { type: 'video/webm' })

    expect((await postFile(file, { kind: 'campaignFile', campaignId: 'c1' })).url).toBe('/api/asset/a3/data')
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

describe('the media the pick tab lists', () => {
  afterEach(() => {
    wire.reads = []
    wire.answers = {}
  })

  const folders = [
    { id: 'f-blackwood', name: 'Blackwood', mime_type: 'inode/directory', parent_id: 'f-blackwood', slug: 'campaign-c2' },
    { id: 'f-own', name: 'Personal', mime_type: 'inode/directory', parent_id: 'f-own', slug: 'user-lars' },
    { id: 'f-ashfall', name: 'Ashfall', mime_type: 'inode/directory', parent_id: 'f-ashfall', slug: 'campaign-c3' }
  ]

  const images = [
    { id: 'i-ruin', name: 'ruin.webp', mime_type: 'image/webp', parent_id: 'f-blackwood', slug: null, tags: [{ name: 'Ruins' }] },
    { id: 'i-keep', name: 'keep.png', mime_type: 'image/png', parent_id: 'f-own', slug: null, tags: [] },
    { id: 'i-gift', name: 'gift.jpg', mime_type: 'image/jpeg', parent_id: 'f-unseen', slug: null }
  ]

  it.each([
    ['image', 'image%2F*'],
    ['video', 'video%2F*'],
    ['audio', 'audio%2F*'],
    ['pdf', 'application%2Fpdf'],
    ['file', '*%2F*']
  ] as const)('asks for %s media by its type, and for the folders it sits in', async (kind, type) => {
    await getAssets('', kind, { kind: 'user' })

    expect(wire.reads).toEqual([`/asset?mime_type=${type}`, '/asset?mime_type=inode%2Fdirectory'])
  })

  it('searches names by the words and holds the hash words back for the tags', async () => {
    await getAssets('old keep #ruins', 'image', { kind: 'user' })

    expect(wire.reads[0]).toBe('/asset?q=old+keep&mime_type=image%2F*')
  })

  it('groups by folder, the folder an upload lands in first, each folder drawn before what it holds', async () => {
    wire.answers = { '/asset?mime_type=image%2F*': images, '/asset?mime_type=inode%2Fdirectory': folders }

    const listed = await getAssets('', 'image', { kind: 'user' })

    expect(listed.map((one) => one.id)).toEqual(['i-gift', 'f-own', 'i-keep', 'f-blackwood', 'i-ruin'])
    expect(listed[1]).toEqual({ id: 'f-own', url: '/api/asset/f-own/data', name: 'Personal', mimeType: 'inode/directory' })
    expect(listed[2]).toEqual({ id: 'i-keep', url: '/api/asset/i-keep/data', name: 'keep.png', mimeType: 'image/png' })
  })

  it('puts the campaign folder first on a campaign page', async () => {
    wire.answers = { '/asset?mime_type=image%2F*': images, '/asset?mime_type=inode%2Fdirectory': folders }

    const listed = await getAssets('', 'image', { kind: 'campaignFile', campaignId: 'c2' })

    expect(listed.map((one) => one.id)).toEqual(['i-gift', 'f-blackwood', 'i-ruin', 'f-own', 'i-keep'])
  })

  it('narrows on a hash word to what carries a tag holding it', async () => {
    wire.answers = { '/asset?mime_type=image%2F*': images, '/asset?mime_type=inode%2Fdirectory': folders }

    const listed = await getAssets('#ruin', 'image', { kind: 'user' })

    expect(listed.map((one) => one.id)).toEqual(['f-blackwood', 'i-ruin'])
  })

  it('never offers a folder as a file to pick', async () => {
    wire.answers = { '/asset?mime_type=*%2F*': [...folders, ...images], '/asset?mime_type=inode%2Fdirectory': folders }

    const listed = await getAssets('', 'file', { kind: 'user' })

    expect(listed.map((one) => one.id)).toEqual(['i-gift', 'f-own', 'i-keep', 'f-blackwood', 'i-ruin'])
  })
})
