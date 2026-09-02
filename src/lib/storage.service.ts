import { getDownloadURL, getStorage, ref, uploadBytes, deleteObject, type FirebaseStorage } from 'firebase/storage'
import { app, auth } from './firebase'

const storage: FirebaseStorage = getStorage(app)

const MEGABYTE = 1024 * 1024
const LOCAL_PREFIX = 'local:'
const DB_NAME = 'dndcs-files'
const STORE_NAME = 'files'

export type UploadScope =
  | { kind: 'user' }
  | { kind: 'campaignMap'; campaignId: string }
  | { kind: 'campaignAudio'; campaignId: string }

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

function getPath(scope: UploadScope, name: string): string {
  const safe = name.replace(/[^A-Za-z0-9._-]/g, '_')
  const stamp = `${Date.now()}-${safe}`

  if (scope.kind === 'campaignMap') return `campaigns/${scope.campaignId}/maps/${stamp}`
  if (scope.kind === 'campaignAudio') return `campaigns/${scope.campaignId}/audio/${stamp}`
  return `users/${getUserId()}/${stamp}`
}

function getLimit(scope: UploadScope): number {
  return scope.kind === 'user' ? 10 : 20
}

function getDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(new UploadError('This browser refused its local file store.'))
  })
}

function runTransaction<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return getDatabase().then(
    (database) =>
      new Promise<T>((resolve, reject) => {
        const request = work(database.transaction(STORE_NAME, mode).objectStore(STORE_NAME))
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(new UploadError('The local file store refused the operation.'))
      })
  )
}

export function isLocalFile(address: string): boolean {
  return address.startsWith(LOCAL_PREFIX)
}

async function postLocalFile(file: File, path: string): Promise<string> {
  await runTransaction('readwrite', (store) => store.put(file, path))
  return LOCAL_PREFIX + path
}

export async function getFileUrl(address: string): Promise<string> {
  if (!isLocalFile(address)) return address

  const blob = await runTransaction<Blob | undefined>('readonly', (store) =>
    store.get(address.slice(LOCAL_PREFIX.length))
  )

  if (!blob) return ''
  return URL.createObjectURL(blob)
}

export async function postFile(file: File, scope: UploadScope): Promise<string> {
  getUserId()

  const limit = getLimit(scope)
  if (file.size > limit * MEGABYTE) {
    throw new UploadError(`${file.name} is ${(file.size / MEGABYTE).toFixed(1)}MB. The limit is ${limit}MB.`)
  }

  if (scope.kind === 'campaignMap' && !file.type.startsWith('image/')) {
    throw new UploadError('A map needs an image file.')
  }

  if (scope.kind === 'campaignAudio' && !file.type.startsWith('audio/')) {
    throw new UploadError('A sound needs an audio file.')
  }

  const path = getPath(scope, file.name)

  try {
    const target = ref(storage, path)
    await uploadBytes(target, file, { contentType: file.type })
    return await getDownloadURL(target)
  } catch {
    return postLocalFile(file, path)
  }
}

export async function deleteFile(address: string): Promise<void> {
  if (isLocalFile(address)) {
    await runTransaction('readwrite', (store) => store.delete(address.slice(LOCAL_PREFIX.length)))
    return
  }
  await deleteObject(ref(storage, address))
}

export { storage }
