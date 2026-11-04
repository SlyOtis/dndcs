import { ApiError, deleteApi, getApi, getCsrfHeaders, getQuery, getSession, postApi } from './api'


const LOCAL_PREFIX = 'local:'
const FILE_PREFIX = 'file:'
const BLOB_PREFIX = 'blob:'
const DATA_ROOT = '/api/file/data'

export type UploadScope =
  | { kind: 'user' }
  | { kind: 'campaignMap'; campaignId: string }
  | { kind: 'campaignAudio'; campaignId: string }

export interface FileRecord {
  name: string
  type: string
  size: number
  etag: string
  owner_id: string
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
  return DATA_ROOT + getQuery({ path: address.slice(FILE_PREFIX.length) })
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

export async function getFileUrl(address: string): Promise<string> {
  if (isDeadFile(address) || isLocalFile(address)) return ''
  if (!isFileRecord(address)) return address

  return getMediaUrl(address)
}

export async function postFile(file: File, scope: UploadScope): Promise<string> {
  getUserId()

  if (scope.kind === 'campaignMap' && !file.type.startsWith('image/')) {
    throw new UploadError('A map needs an image file.')
  }

  if (scope.kind === 'campaignAudio' && !file.type.startsWith('audio/')) {
    throw new UploadError('A sound needs an audio file.')
  }

  const path = getRecordPath(scope, file.name)
  const campaignId = /^campaigns\/([^/]+)\/files\//.exec(path)?.[1]

  await postApi('/file', { path, name: file.name, type: file.type, campaign_id: campaignId }).catch((error) => {
    throw new UploadError(error instanceof ApiError ? error.message : 'The file record was refused.')
  })

  const answer = await fetch(getMediaUrl(FILE_PREFIX + path), {
    method: 'PUT',
    body: file,
    credentials: 'same-origin',
    headers: { ...getCsrfHeaders(), 'Content-Type': file.type || 'application/octet-stream' }
  }).catch(() => null)

  if (!answer?.ok) {
    const envelope = await answer?.json().catch(() => null)
    throw new UploadError(envelope?.error?.message ?? `The file was refused (${answer?.status ?? 'no answer'}).`)
  }

  return FILE_PREFIX + path
}


export async function deleteFile(address: string): Promise<void> {
  if (!isFileRecord(address)) return

  await deleteApi(`/file${getQuery({ path: address.slice(FILE_PREFIX.length) })}`)
}
