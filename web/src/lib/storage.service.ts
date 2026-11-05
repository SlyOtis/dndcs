import { deleteApi, getApi, getCsrfHeaders, getQuery, getSession, postApi } from './api'
import { getColumns, getDocument, type Block, type MediaAsset, type MediaKind } from './blocks'


const LOCAL_PREFIX = 'local:'
const FILE_PREFIX = 'file:'
const BLOB_PREFIX = 'blob:'
const ASSET_ROOT = '/api/asset'
const ASSET_ADDRESS = /^\/api\/asset\/([0-9a-f-]+)\/data$/
const FOLDER_TYPE = 'inode/directory'
const MEDIA_TYPES: Record<MediaKind, string> = {
  image: 'image/*',
  video: 'video/*',
  audio: 'audio/*',
  pdf: 'application/pdf',
  file: '*/*'
}

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
  parent_id: string
  slug: string | null
  tags?: { name: string }[]
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

function getMediaAsset(asset: FileRecord): MediaAsset {
  return { id: asset.id, url: getMediaUrl(asset.id), name: asset.name, mimeType: asset.mime_type }
}

export function getAssetTab(assetId: string): void {
  window.open(getMediaUrl(assetId), '_blank', 'noopener')
}

export async function getAssets(query: string, kind: MediaKind, scope: UploadScope): Promise<MediaAsset[]> {
  const words = query.split(/\s+/).filter(Boolean)
  const tags = words.filter((word) => word.startsWith('#') && word.length > 1).map((word) => word.slice(1).toLowerCase())
  const named = words.filter((word) => !word.startsWith('#')).join(' ')

  const [found, folders] = await Promise.all([
    getApi<FileRecord[]>(`/asset${getQuery({ q: named, mime_type: MEDIA_TYPES[kind] })}`),
    getApi<FileRecord[]>(`/asset${getQuery({ mime_type: FOLDER_TYPE })}`)
  ])

  const home = scope.kind === 'user' ? `user-${getUserId()}` : `campaign-${scope.campaignId}`
  const held = (found ?? [])
    .filter((asset) => asset.mime_type !== FOLDER_TYPE)
    .filter((asset) => tags.every((tag) => (asset.tags ?? []).some((one) => one.name.toLowerCase().includes(tag))))
    .sort((a, b) => a.name.localeCompare(b.name))
  const shelves = [...(folders ?? [])].sort((a, b) => Number(b.slug === home) - Number(a.slug === home) || a.name.localeCompare(b.name))
  const loose = held.filter((asset) => !shelves.some((folder) => folder.id === asset.parent_id))

  return [
    ...loose.map(getMediaAsset),
    ...shelves.flatMap((folder) => {
      const inside = held.filter((asset) => asset.parent_id === folder.id)
      return inside.length > 0 ? [folder, ...inside].map(getMediaAsset) : []
    })
  ]
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

export async function postFile(file: File, scope: UploadScope): Promise<MediaAsset> {
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

  return getMediaAsset(envelope.data)
}


export async function deleteFile(address: string): Promise<void> {
  if (!isFileRecord(address)) return

  await deleteApi(`/asset/${getAssetId(address)}`)
}

function getBlockAssets(blocks: Block[]): string[] {
  return blocks.flatMap((block) => {
    if (block.kind === 'columns') return getColumns(block.text).flatMap((column) => getBlockAssets(getDocument(column).blocks))
    const address = block.kind === 'file' ? getMediaUrl(block.options.assetId ?? '') : block.kind === 'map' ? block.text.trim() : (block.options.src ?? '')
    const id = getAssetId(address)
    return id ? [id] : []
  })
}

export async function putAttachments(resourceId: string, content: string): Promise<void> {
  const wanted = new Set(getBlockAssets(getDocument(content).blocks))
  const held = (await getApi<{ id: string; asset_id: string }[]>(`/asset/object${getQuery({ object_type: 'resource', object_id: resourceId })}`)) ?? []

  await Promise.all([
    ...[...wanted]
      .filter((assetId) => !held.some((link) => link.asset_id === assetId))
      .map((assetId) => postApi(`/asset/${assetId}/object`, { object_type: 'resource', object_id: resourceId })),
    ...held
      .filter((link) => !wanted.has(link.asset_id))
      .map((link) => deleteApi(`/asset/${link.asset_id}/object/${link.id}`))
  ])
}
