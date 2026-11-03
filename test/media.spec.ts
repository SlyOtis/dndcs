import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { createServer, type Server } from 'node:http'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { getMediaHandler, getMediaRange } from '../vite.config'

const bytes = Buffer.from(Array.from({ length: 1000 }, (_, index) => index % 256))
const tag = `"${createHash('sha256').update(bytes).digest('base64url')}"`

let root = ''
let server: Server
let base = ''

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'dndcs-media-'))
  await writeFile(join(tmpdir(), 'dndcs-media-outside.txt'), 'secret')
  const handle = getMediaHandler(join(root, 'media'))
  server = createServer((req, res) => void handle(req, res))
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done))
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

afterAll(async () => {
  await new Promise((done) => server.close(done))
  await rm(root, { recursive: true, force: true })
  await rm(join(tmpdir(), 'dndcs-media-outside.txt'), { force: true })
})

describe('the media store range header', () => {
  it('reads a closed, an open and a suffix range', () => {
    expect(getMediaRange(undefined, 1000)).toBe(null)
    expect(getMediaRange('bytes=0-99', 1000)).toEqual({ start: 0, end: 99 })
    expect(getMediaRange('bytes=900-', 1000)).toEqual({ start: 900, end: 999 })
    expect(getMediaRange('bytes=-100', 1000)).toEqual({ start: 900, end: 999 })
    expect(getMediaRange('bytes=990-5000', 1000)).toEqual({ start: 990, end: 999 })
  })

  it('refuses a range it cannot satisfy and ignores a multipart one', () => {
    expect(getMediaRange('bytes=1000-', 1000)).toBe('bad')
    expect(getMediaRange('bytes=50-10', 1000)).toBe('bad')
    expect(getMediaRange('bytes=-', 1000)).toBe('bad')
    expect(getMediaRange('items=0-1', 1000)).toBe('bad')
    expect(getMediaRange('bytes=0-1,5-6', 1000)).toBe(null)
  })
})

describe('the media store', () => {
  it('writes a PUT body to media/ and answers with the content hash as a strong ETag', async () => {
    const put = await fetch(`${base}/users/lars/files/song.mp3`, { method: 'PUT', body: bytes })
    expect(put.status).toBe(201)
    expect(put.headers.get('etag')).toBe(tag)
    expect(put.headers.get('x-media-store')).toBe('1')
    expect(await readFile(join(root, 'media/users/lars/files/song.mp3'))).toEqual(bytes)
  })

  it('serves the whole file with its type, its ETag and byte ranges', async () => {
    const whole = await fetch(`${base}/users/lars/files/song.mp3`)
    expect(whole.status).toBe(200)
    expect(whole.headers.get('content-type')).toBe('audio/mpeg')
    expect(whole.headers.get('etag')).toBe(tag)
    expect(whole.headers.get('accept-ranges')).toBe('bytes')
    expect(Buffer.from(await whole.arrayBuffer())).toEqual(bytes)

    const head = await fetch(`${base}/users/lars/files/song.mp3`, { method: 'HEAD' })
    expect(head.status).toBe(200)
    expect(head.headers.get('content-length')).toBe('1000')
  })

  it('answers a matching If-None-Match with 304', async () => {
    const fresh = await fetch(`${base}/users/lars/files/song.mp3`, { headers: { 'If-None-Match': tag } })
    expect(fresh.status).toBe(304)

    const stale = await fetch(`${base}/users/lars/files/song.mp3`, { headers: { 'If-None-Match': '"other"' } })
    expect(stale.status).toBe(200)
  })

  it('answers a single range with 206 and a bad one with 416', async () => {
    const part = await fetch(`${base}/users/lars/files/song.mp3`, { headers: { Range: 'bytes=100-199' } })
    expect(part.status).toBe(206)
    expect(part.headers.get('content-range')).toBe('bytes 100-199/1000')
    expect(Buffer.from(await part.arrayBuffer())).toEqual(bytes.subarray(100, 200))

    const bad = await fetch(`${base}/users/lars/files/song.mp3`, { headers: { Range: 'bytes=5000-' } })
    expect(bad.status).toBe(416)
    expect(bad.headers.get('content-range')).toBe('bytes */1000')
  })

  it('changes the ETag when the bytes change', async () => {
    const put = await fetch(`${base}/users/lars/files/song.mp3`, { method: 'PUT', body: 'other' })
    expect(put.status).toBe(204)
    expect(put.headers.get('etag')).not.toBe(tag)
  })

  it('refuses a path that climbs out of media/', async () => {
    const climb = await fetch(`${base}/..%2F..%2Fdndcs-media-outside.txt`)
    expect(climb.status).toBe(403)

    const write = await fetch(`${base}/..%2Fescape.txt`, { method: 'PUT', body: 'x' })
    expect(write.status).toBe(403)
  })

  it('deletes a file and then answers 404', async () => {
    expect((await fetch(`${base}/users/lars/files/song.mp3`, { method: 'DELETE' })).status).toBe(204)
    const gone = await fetch(`${base}/users/lars/files/song.mp3`)
    expect(gone.status).toBe(404)
    expect(gone.headers.get('x-media-store')).toBe('1')
  })

  it('answers a probe for a file it lacks with 204, so the browser logs no failed load', async () => {
    const probe = await fetch(`${base}/users/lars/files/song.mp3`, { method: 'HEAD', headers: { 'X-Media-Probe': '1' } })
    expect(probe.status).toBe(204)
    expect(probe.headers.get('x-media-store')).toBe('1')
  })
})
