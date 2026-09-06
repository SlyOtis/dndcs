import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore'
import { auth, db } from './firebase'
import { getSwarmFile } from './swarm'


const LOCAL_PREFIX = 'local:'
const FILE_PREFIX = 'file:'
const FLOOR_PREFIX = 'floor:'
const BLOB_PREFIX = 'blob:'
const DB_NAME = 'dndcs-files'
const STORE_NAME = 'files'
const PATH_STORE = 'places'
const MAX_EDGE = 1600
const WEBP_QUALITY = 0.82
const CHUNK_BYTES = 500_000
const BLOCK_BYTES = 65_536

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
  const user = auth.currentUser
  if (!user) throw new UploadError('Sign in before uploading a file.')
  return user.uid
}


function getRecordPath(scope: UploadScope, name: string): string {
  const tail = /\.[A-Za-z0-9]{1,8}$/.exec(name)?.[0]?.toLowerCase() ?? ""
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
      if (!database.objectStoreNames.contains(PATH_STORE)) database.createObjectStore(PATH_STORE)
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

export async function getFilePlace(address: string): Promise<FilePlace | null> {
  return (await runTransaction<FilePlace | undefined>(PATH_STORE, 'readonly', (store) => store.get(address))) ?? null
}

async function putFilePlace(address: string, place: FilePlace): Promise<void> {
  await runTransaction(PATH_STORE, 'readwrite', (store) => store.put(place, address))
}

export async function deleteFilePlace(address: string): Promise<void> {
  await runTransaction(PATH_STORE, 'readwrite', (store) => store.delete(address))
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

export async function getMediaBlob(address: string): Promise<Blob | null> {
  return (await runTransaction<Blob | undefined>(STORE_NAME, 'readonly', (store) => store.get(address))) ?? null
}

export async function postMediaFile(address: string, file: Blob, etag: string): Promise<string> {
  await runTransaction(STORE_NAME, 'readwrite', (store) => store.put(file, address))
  await putFilePlace(address, { etag, size: file.size })

  return etag
}

export function getRecordTag(record: FileRecord): Promise<string> {
  return getBlockHash(new TextEncoder().encode(record.blocks.join('')).buffer as ArrayBuffer)
}

export async function getFileRecord(address: string): Promise<FileRecord | null> {
  const held = await getDoc(doc(db, address.slice(FILE_PREFIX.length))).catch(() => null)
  return held?.exists() ? (held.data() as FileRecord) : null
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

  const blob = await getMediaBlob(address)
  if (!blob) return null

  return blob.slice(start, end).arrayBuffer()
}

export async function getHeldBlocks(address: string, record: FileRecord): Promise<number[] | 'all'> {
  const place = await getFilePlace(address)
  return place?.size === record.size ? 'all' : []
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
  scope: UploadScope,
  etag: string,
  blocks: string[]
): Promise<string> {
  const bytes = floor ? new Uint8Array(await floor.arrayBuffer()) : new Uint8Array()
  const count = floor ? Math.ceil(bytes.length / CHUNK_BYTES) : 0
  const path = getRecordPath(scope, file.name)
  const batch = writeBatch(db)

  const record: FileRecord = {
    name: file.name,
    type: file.type,
    size: file.size,
    etag,
    count,
    block_size: BLOCK_BYTES,
    blocks,
    owner_id: getUserId()
  }

  batch.set(doc(db, path), { ...record, created_at: serverTimestamp() })

  for (let index = 0; index < count; index++) {
    batch.set(doc(db, path, 'chunks', String(index)), {
      index,
      data: getBase64(bytes.subarray(index * CHUNK_BYTES, (index + 1) * CHUNK_BYTES))
    })
  }

  await batch.commit()
  return FILE_PREFIX + path
}

async function getFloorBlob(address: string, record: FileRecord): Promise<Blob | null> {

  const path = address.slice(FILE_PREFIX.length)
  const parts = await getDocs(query(collection(db, path, 'chunks'), orderBy('index'))).catch(() => null)
  if (!parts || parts.size !== record.count) return null

  return new Blob(
    parts.docs.map((entry) => getBytes((entry.data() as { data: string }).data)),
    { type: 'image/webp' }
  )
}

function pullOriginal(address: string, record: FileRecord): void {
  getSwarmFile(address, record).then(async (pulled) => {
    if (pulled) await postMediaFile(address, pulled, await getRecordTag(record))
  })
}

export async function getFileUrl(address: string): Promise<string> {
  if (isDeadFile(address)) return ''
  if (!isStoredFile(address)) return address

  if (isLocalFile(address)) {
    const legacy = await runTransaction<Blob | undefined>(STORE_NAME, 'readonly', (store) =>
      store.get(address.slice(LOCAL_PREFIX.length))
    )
    return legacy ? URL.createObjectURL(legacy) : ''
  }

  const original = await getMediaBlob(address)
  if (original) return URL.createObjectURL(original)

  const record = await getFileRecord(address)
  if (!record) return ''

  if (!record.count) {
    const pulled = await getSwarmFile(address, record)
    if (!pulled) return ''

    await postMediaFile(address, pulled, await getRecordTag(record))
    return URL.createObjectURL(pulled)
  }

  const kept = await runTransaction<Blob | undefined>(STORE_NAME, 'readonly', (store) =>
    store.get(FLOOR_PREFIX + address)
  )

  if (kept) {
    pullOriginal(address, record)
    return URL.createObjectURL(kept)
  }

  const floor = await getFloorBlob(address, record)
  if (!floor) return ''

  await runTransaction(STORE_NAME, 'readwrite', (store) => store.put(floor, FLOOR_PREFIX + address))
  pullOriginal(address, record)

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
  const etag = await getBlockHash(new TextEncoder().encode(blocks.join('')).buffer as ArrayBuffer)

  const address = await postFileRecord(file, floor, scope, etag, blocks)
  await postMediaFile(address, file, etag)

  return address
}


export async function deleteFile(address: string): Promise<void> {
  if (isLocalFile(address)) {
    await runTransaction(STORE_NAME, 'readwrite', (store) => store.delete(address.slice(LOCAL_PREFIX.length)))
    return
  }

  if (isFileRecord(address)) {
    const path = address.slice(FILE_PREFIX.length)
    const parts = await getDocs(collection(db, path, 'chunks'))
    const batch = writeBatch(db)

    for (const entry of parts.docs) batch.delete(entry.ref)
    batch.delete(doc(db, path))

    await batch.commit()
    await runTransaction(STORE_NAME, 'readwrite', (store) => store.delete(address))
  }
}

