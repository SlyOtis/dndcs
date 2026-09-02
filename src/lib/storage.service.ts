import { getDownloadURL, getStorage, ref, uploadBytes, deleteObject, type FirebaseStorage } from 'firebase/storage'
import { app, auth } from './firebase'

const storage: FirebaseStorage = getStorage(app)

const MEGABYTE = 1024 * 1024

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

  const target = ref(storage, getPath(scope, file.name))
  await uploadBytes(target, file, { contentType: file.type })
  return getDownloadURL(target)
}

export async function deleteFile(url: string): Promise<void> {
  await deleteObject(ref(storage, url))
}

export { storage }
