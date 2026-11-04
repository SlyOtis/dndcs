import { deleteApi, getApi, getCsrfHeaders, getSession } from './api'


const LOCAL_PREFIX = 'local:'
const FILE_PREFIX = 'file:'
const BLOB_PREFIX = 'blob:'
const ASSET_ROOT = '/api/asset'
const ASSET_ADDRESS = /^\/api\/asset\/([0-9a-f-]+)\/data$/

export type UploadScope =
  | { kind: 'user' }
  | { kind: 'campaignMap'; campaignId: string }
  | { kind: 'campaignAudio'; campaignId: string }
  | { kind: 'campaignFile'; campaignId: string }

export interface FileRecord {
  id: string
  name: string
  mime_type: string
  size_bytes: number
  etag: string
  uploaded_by: string
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

function getAssetId(address: string): string {
  return ASSET_ADDRESS.exec(address)?.[1] ?? ''
}

export function isLocalFile(address: string): boolean {
  return address.startsWith(LOCAL_PREFIX)
}

export function isFileRecord(address: string): boolean {
  return ASSET_ADDRESS.test(address)
}

export function isDeadFile(address: string): boolean {
  return address.startsWith(BLOB_PREFIX)
}

export function isStoredFile(address: string): boolean {
  return isLocalFile(address) || isFileRecord(address) || address.startsWith(FILE_PREFIX)
}

export function getMediaUrl(id: string): string {
  return `${ASSET_ROOT}/${id}/data`
}

export async function getFileRecord(address: string): Promise<FileRecord | null> {
  if (!isFileRecord(address)) return null

  return getApi<FileRecord>(`/asset/${getAssetId(address)}`).catch(() => null)
}

export async function getBlockHash(bytes: ArrayBuffer): Promise<string> {
  if (!crypto.subtle) {
    throw new UploadError('Hashing needs a secure context. Reach the app on localhost, not a LAN address.')
  }

  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
}

export async function getFileUrl(address: string): Promise<string> {
  if (isDeadFile(address) || isLocalFile(address) || address.startsWith(FILE_PREFIX)) return ''

  return address
}

export async function postFile(file: File, scope: UploadScope): Promise<string> {
  getUserId()

  if (scope.kind === 'campaignMap' && !file.type.startsWith('image/')) {
    throw new UploadError('A map needs an image file.')
  }

  if (scope.kind === 'campaignAudio' && !file.type.startsWith('audio/')) {
    throw new UploadError('A sound needs an audio file.')
  }

  const form = new FormData()
  form.set('name', file.name)
  form.set('mime_type', file.type || 'application/octet-stream')
  if (scope.kind !== 'user') form.set('campaign_id', scope.campaignId)
  form.set('file', file)

  const answer = await fetch(ASSET_ROOT, {
    method: 'POST',
    body: form,
    credentials: 'same-origin',
    headers: getCsrfHeaders()
  }).catch(() => null)
  const envelope = await answer?.json().catch(() => null)

  if (!answer?.ok || !envelope?.data?.id) {
    throw new UploadError(envelope?.error?.message ?? `The file was refused (${answer?.status ?? 'no answer'}).`)
  }

  return getMediaUrl(envelope.data.id)
}


export async function deleteFile(address: string): Promise<void> {
  if (!isFileRecord(address)) return

  await deleteApi(`/asset/${getAssetId(address)}`)
}
