import { ApiError, deleteApi, getApi, getQuery, getSession, postApi } from './api'
import { getSwarmFile } from './swarm'


const LOCAL_PREFIX = 'local:'
const FILE_PREFIX = 'file:'
const FLOOR_PREFIX = 'floor:'
const BLOB_PREFIX = 'blob:'
const DB_NAME = 'dndcs-files'
const STORE_NAME = 'files'
const MEDIA_ROOT = '/media/'
const MAX_EDGE = 1600
const WEBP_QUALITY = 0.82
const CHUNK_BYTES = 500_000
const BLOCK_BYTES = 65_536
const NO_STORE = 'The media store is not here. Full size media needs the local client: clone the repo and run just dev.'

export type UploadScope =
  | { kind: 'user' }
  | { kind: 'campaignMap'; campaignId: string }
  | { kind: 'campaignAudio'; campaignId: string }

export interface FileRecord {
  name: string
  type: string
  size: number
  etag: string
  count: number
  block_size: number
  blocks: string[]
  owner_id: string
}

export interface FilePlace {
  etag: string
  size: number
}

export class UploadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UploadError'
  }
}

function getUserId(): string {
  const user = getSession()
  if (!user) throw new UploadError('Sign in before uploading a file.')
  return user.uid
}


function getRecordPath(scope: UploadScope, name: string): string {
  const tail = /\.[A-Za-z0-9]{1,8}$/.exec(name)?.[0]?.toLowerCase() ?? ''
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${tail}`

  if (scope.kind === 'user') return `users/${getUserId()}/files/${id}`
  return `campaigns/${scope.campaignId}/files/${id}`
}

function getDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2)

    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME)
    }

    request.onsuccess = () => {
      navigator.storage?.persist?.().catch(() => false)
      resolve(request.result)
    }
    request.onerror = () => reject(new UploadError('This browser refused its local file store.'))
  })
}

function runTransaction<T>(
  name: string,
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return getDatabase().then(
    (database) =>
      new Promise<T>((resolve, reject) => {
        const request = work(database.transaction(name, mode).objectStore(name))
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(new UploadError('The local file store refused the operation.'))
      })
  )
}

export function isLocalFile(address: string): boolean {
  return address.startsWith(LOCAL_PREFIX)
}

export function isFileRecord(address: string): boolean {
  return address.startsWith(FILE_PREFIX)
}

export function isDeadFile(address: string): boolean {
  return address.startsWith(BLOB_PREFIX)
}

export function isStoredFile(address: string): boolean {
  return isLocalFile(address) || isFileRecord(address)
}

export function getMediaUrl(address: string): string {
  const path = address.slice(isLocalFile(address) ? LOCAL_PREFIX.length : FILE_PREFIX.length)
  return MEDIA_ROOT + path.split('/').map(encodeURIComponent).join('/')
}

async function getMediaResponse(address: string, init: RequestInit): Promise<Response> {
  const answer = await fetch(getMediaUrl(address), init).catch(() => null)
  if (!answer?.headers.get('x-media-store')) throw new UploadError(NO_STORE)
  return answer
}

export async function getFilePlace(address: string): Promise<FilePlace | null> {
  const answer = await getMediaResponse(address, { method: 'HEAD', cache: 'no-store', headers: { 'X-Media-Probe': '1' } })
  if (answer.status !== 200) return null

  return { etag: answer.headers.get('etag') ?? '', size: Number(answer.headers.get('content-length') ?? 0) }
}

export async function postMediaFile(address: string, file: Blob): Promise<string> {
  const answer = await getMediaResponse(address, { method: 'PUT', body: file })
  const etag = answer.headers.get('etag')
  if (!answer.ok || !etag) throw new UploadError(`The media store refused the file (${answer.status}).`)

  return etag
}

export async function getFileRecord(address: string): Promise<FileRecord | null> {
  return getApi<FileRecord>(`/file${getQuery({ path: address.slice(FILE_PREFIX.length) })}`).catch(() => null)
}

export async function getBlockHash(bytes: ArrayBuffer): Promise<string> {
  if (!crypto.subtle) {
    throw new UploadError('Hashing needs a secure context. Reach the app on localhost, not a LAN address.')
  }

  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
}

async function getBlockHashes(file: File): Promise<string[]> {
  const hashes: string[] = []

  for (let start = 0; start < file.size; start += BLOCK_BYTES) {
    hashes.push(await getBlockHash(await file.slice(start, start + BLOCK_BYTES).arrayBuffer()))
  }

  return hashes
}

export async function getBlockRange(
  address: string,
  record: FileRecord,
  index: number
): Promise<ArrayBuffer | null> {
  const start = index * record.block_size
  const end = Math.min(start + record.block_size, record.size)
  if (start >= end) return null

  const answer = await getMediaResponse(address, { headers: { Range: `bytes=${start}-${end - 1}` } }).catch(() => null)
  return answer?.status === 206 ? answer.arrayBuffer() : null
}

export async function getHeldBlocks(address: string, record: FileRecord): Promise<number[] | 'all'> {
  const place = await getFilePlace(address).catch(() => null)
  return place?.etag === record.etag ? 'all' : []
}

async function getScaledFile(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const surface = canvas.getContext('2d')
  if (!surface) throw new UploadError('This browser refused a drawing surface.')

  surface.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY)
  )

  if (!blob) throw new UploadError(`${file.name} could not be re-encoded.`)

  return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.webp`, { type: 'image/webp' })
}

function getBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let start = 0; start < bytes.length; start += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(start, start + 0x8000))
  }
  return btoa(binary)
}

function getBytes(text: string): ArrayBuffer {
  const binary = atob(text)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index)
  return bytes.buffer
}

async function postFileRecord(
  file: File,
  floor: File | null,
  path: string,
  etag: string,
  blocks: string[]
): Promise<string> {
  const bytes = floor ? new Uint8Array(await floor.arrayBuffer()) : new Uint8Array()
  const count = floor ? Math.ceil(bytes.length / CHUNK_BYTES) : 0
  const pieces: string[] = []

  for (let index = 0; index < count; index++) {
    pieces.push(getBase64(bytes.subarray(index * CHUNK_BYTES, (index + 1) * CHUNK_BYTES)))
  }

  const campaignId = /^campaigns\/([^/]+)\/files\//.exec(path)?.[1]

  await postApi('/file', {
    path,
    name: file.name,
    type: file.type,
    size: file.size,
    etag,
    block_size: BLOCK_BYTES,
    blocks,
    campaign_id: campaignId,
    pieces
  }).catch((error) => {
    throw new UploadError(error instanceof ApiError ? error.message : 'The file record was refused.')
  })
  return FILE_PREFIX + path
}

async function getFloorBlob(address: string, record: FileRecord): Promise<Blob | null> {
  const path = address.slice(FILE_PREFIX.length)
  const parts = await getApi<{ index: number; data: string }[]>(`/file/piece${getQuery({ path })}`).catch(() => null)
  if (!parts || parts.length !== record.count) return null

  return new Blob(
    parts.map((entry) => getBytes(entry.data)),
    { type: 'image/webp' }
  )
}

function pullOriginal(address: string, record: FileRecord): void {
  getSwarmFile(address, record)
    .then((pulled) => (pulled ? postMediaFile(address, pulled) : null))
    .catch(() => undefined)
}

export async function getFileUrl(address: string): Promise<string> {
  if (isDeadFile(address)) return ''
  if (!isStoredFile(address)) return address

  const place = await getFilePlace(address).catch(() => undefined)
  const hosted = place === undefined
  if (place) return getMediaUrl(address)

  if (isLocalFile(address)) {
    if (hosted) throw new UploadError(NO_STORE)
    return ''
  }

  const record = await getFileRecord(address)
  if (!record) return ''

  if (!record.count) {
    if (hosted) throw new UploadError(NO_STORE)

    const pulled = await getSwarmFile(address, record)
    if (!pulled) return ''

    await postMediaFile(address, pulled)
    return getMediaUrl(address)
  }

  if (!hosted) pullOriginal(address, record)

  const kept = await runTransaction<Blob | undefined>(STORE_NAME, 'readonly', (store) =>
    store.get(FLOOR_PREFIX + address)
  )
  if (kept) return URL.createObjectURL(kept)

  const floor = await getFloorBlob(address, record)
  if (!floor) return ''

  await runTransaction(STORE_NAME, 'readwrite', (store) => store.put(floor, FLOOR_PREFIX + address))
  return URL.createObjectURL(floor)
}

export async function postFile(file: File, scope: UploadScope): Promise<string> {
  getUserId()

  if (scope.kind === 'campaignMap' && !file.type.startsWith('image/')) {
    throw new UploadError('A map needs an image file.')
  }

  if (scope.kind === 'campaignAudio' && !file.type.startsWith('audio/')) {
    throw new UploadError('A sound needs an audio file.')
  }

  const floor = file.type.startsWith('image/') ? await getScaledFile(file) : null
  const blocks = await getBlockHashes(file)
  const path = getRecordPath(scope, file.name)
  const etag = await postMediaFile(FILE_PREFIX + path, file)

  return postFileRecord(file, floor, path, etag, blocks)
}


export async function deleteFile(address: string): Promise<void> {
  if (isFileRecord(address)) {
    const path = address.slice(FILE_PREFIX.length)
    await deleteApi(`/file${getQuery({ path })}`)
    await runTransaction(STORE_NAME, 'readwrite', (store) => store.delete(FLOOR_PREFIX + address))
  }

  if (isStoredFile(address)) await getMediaResponse(address, { method: 'DELETE' }).catch(() => undefined)
}
