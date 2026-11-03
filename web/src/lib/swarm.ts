import { deleteApi, getApi, getEvery, getSession, postApi, putApi } from './api'
import { getBlockHash, getBlockRange, getFileRecord, getHeldBlocks, type FileRecord } from './storage.service'

const ICE = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }]
const BEAT = 20_000
const STALE = 60_000
const ASK_TIMEOUT = 8_000

type Frame =
  | { t: 'have?'; id: number; address: string }
  | { t: 'have'; id: number; blocks: number[] | 'all' }
  | { t: 'want'; id: number; address: string; index: number }
  | { t: 'miss'; id: number }

interface Peer {
  id: string
  connection: RTCPeerConnection
  channel: RTCDataChannel | null
}

const peers = new Map<string, Peer>()
const pending = new Map<number, (answer: Frame | ArrayBuffer) => void>()

let selfId = ''
let swarmId = ''
let ticket = 1
let seats = 0
let leaveSeat: (() => void) | null = null

function getSelfId(): string {
  const uid = getSession()?.uid
  if (!uid) throw new Error('Sign in before joining the swarm.')
  return `${uid}.${Math.random().toString(36).slice(2, 10)}`
}

async function postSignal(to: string, kind: string, payload: unknown): Promise<void> {
  if (!swarmId) return

  await postApi(`/campaign/${swarmId}/signal`, {
    from: selfId,
    to,
    kind,
    payload: JSON.stringify(payload)
  }).catch(() => undefined)
}

function postFrame(peer: Peer, frame: Frame): void {
  if (peer.channel?.readyState === 'open') peer.channel.send(JSON.stringify(frame))
}

async function postBlock(peer: Peer, id: number, address: string, index: number): Promise<void> {
  const record = await getFileRecord(address)
  const bytes = record ? await getBlockRange(address, record, index) : null

  if (!bytes) return postFrame(peer, { t: 'miss', id })

  const frame = new Uint8Array(4 + bytes.byteLength)
  new DataView(frame.buffer).setUint32(0, id)
  frame.set(new Uint8Array(bytes), 4)

  if (peer.channel?.readyState === 'open') peer.channel.send(frame)
}

async function readFrame(peer: Peer, data: string | ArrayBuffer): Promise<void> {
  if (typeof data !== 'string') {
    const id = new DataView(data).getUint32(0)
    pending.get(id)?.(data.slice(4))
    return
  }

  const frame = JSON.parse(data) as Frame

  if (frame.t === 'have?') {
    const record = await getFileRecord(frame.address)
    const blocks = record ? await getHeldBlocks(frame.address, record) : []
    return postFrame(peer, { t: 'have', id: frame.id, blocks })
  }

  if (frame.t === 'want') {
    return postBlock(peer, frame.id, frame.address, frame.index)
  }

  pending.get(frame.id)?.(frame)
}

function openChannel(peer: Peer, channel: RTCDataChannel): void {
  channel.binaryType = 'arraybuffer'
  channel.onmessage = (event) => readFrame(peer, event.data)
  channel.onclose = () => {
    if (peer.channel === channel) peer.channel = null
  }
  peer.channel = channel
}

function getPeer(id: string): Peer {
  const held = peers.get(id)
  if (held) return held

  const connection = new RTCPeerConnection({ iceServers: ICE })
  const peer: Peer = { id, connection, channel: null }

  connection.onicecandidate = (event) => {
    if (event.candidate) postSignal(id, 'ice', event.candidate.toJSON())
  }

  connection.ondatachannel = (event) => openChannel(peer, event.channel)

  connection.onconnectionstatechange = () => {
    if (connection.connectionState === 'failed' || connection.connectionState === 'closed') {
      peers.delete(id)
    }
  }

  peers.set(id, peer)
  return peer
}

async function postOffer(id: string): Promise<void> {
  const peer = getPeer(id)
  openChannel(peer, peer.connection.createDataChannel('media'))

  const offer = await peer.connection.createOffer()
  await peer.connection.setLocalDescription(offer)
  await postSignal(id, 'offer', offer)
}

async function readSignal(from: string, kind: string, payload: any): Promise<void> {
  const peer = getPeer(from)

  if (kind === 'offer') {
    await peer.connection.setRemoteDescription(payload)
    const answer = await peer.connection.createAnswer()
    await peer.connection.setLocalDescription(answer)
    return postSignal(from, 'answer', answer)
  }

  if (kind === 'answer') {
    if (!peer.connection.currentRemoteDescription) {
      await peer.connection.setRemoteDescription(payload)
    }
    return
  }

  await peer.connection.addIceCandidate(payload).catch(() => {})
}

function leaveHeld(): void {
  seats = Math.max(0, seats - 1)
  if (seats > 0) return
  leaveSeat?.()
  leaveSeat = null
}

export function joinSwarm(campaignId: string): () => void {
  if (swarmId === campaignId && leaveSeat) {
    seats++
    return leaveHeld
  }

  leaveSeat?.()
  selfId = getSelfId()
  swarmId = campaignId
  seats = 1

  const seat = `/campaign/${campaignId}/peer/${selfId}`
  const beat = () =>
    putApi(seat).catch(() => {
      stopped = true
    })

  let stopped = false
  const timer = setInterval(() => {
    if (!stopped) beat()
  }, BEAT)

  beat()

  const watchers: (() => void)[] = [
    getEvery(
      () => getApi<{ id: string; seen_at: string }[]>(`/campaign/${campaignId}/peer`),
      (found) => {
        for (const entry of found) {
          const id = entry.id

          if (id === selfId || peers.has(id)) continue
          if (Date.now() - Date.parse(entry.seen_at) > STALE) continue
          if (selfId < id) postOffer(id).catch(() => undefined)
        }
      },
      () => (stopped = true)
    ),

    getEvery(
      () => deleteApi<{ id: string; from: string; kind: string; payload: string }[]>(`/campaign/${campaignId}/signal/${selfId}`),
      (found) => {
        for (const { from, kind, payload } of found) {
          readSignal(from, kind, JSON.parse(payload)).catch(() => undefined)
        }
      },
      () => (stopped = true)
    )
  ]

  leaveSeat = () => {
    clearInterval(timer)
    for (const stop of watchers) stop()
    for (const peer of peers.values()) peer.connection.close()
    peers.clear()
    deleteApi(seat).catch(() => undefined)
    selfId = ''
    swarmId = ''
  }

  return leaveHeld
}

function ask<T extends Frame | ArrayBuffer>(peer: Peer, send: (id: number) => void): Promise<T | null> {
  return new Promise((resolve) => {
    const id = ticket++
    const timer = setTimeout(() => {
      pending.delete(id)
      resolve(null)
    }, ASK_TIMEOUT)

    pending.set(id, (answer) => {
      clearTimeout(timer)
      pending.delete(id)
      resolve(answer as T)
    })

    send(id)
  })
}

async function getHolders(address: string, count: number): Promise<Map<Peer, Set<number>>> {
  const holders = new Map<Peer, Set<number>>()
  const whole = () => new Set(Array.from({ length: count }, (_, index) => index))

  await Promise.all(
    [...peers.values()]
      .filter((peer) => peer.channel?.readyState === 'open')
      .map(async (peer) => {
        const answer = await ask<Frame>(peer, (id) => postFrame(peer, { t: 'have?', id, address }))
        if (!answer || answer instanceof ArrayBuffer || answer.t !== 'have') return

        const held = answer.blocks === 'all' ? whole() : new Set(answer.blocks)
        if (held.size) holders.set(peer, held)
      })
  )

  return holders
}

export async function getSwarmFile(address: string, record: FileRecord): Promise<Blob | null> {
  if (!record.blocks?.length || peers.size === 0) return null

  const holders = await getHolders(address, record.blocks.length)
  if (holders.size === 0) return null

  const parts = new Array<ArrayBuffer | null>(record.blocks.length).fill(null)

  for (let index = 0; index < record.blocks.length; index++) {
    for (const [peer, held] of holders) {
      if (!held.has(index)) continue

      const answer = await ask<Frame | ArrayBuffer>(peer, (id) =>
        postFrame(peer, { t: 'want', id, address, index })
      )

      if (!(answer instanceof ArrayBuffer)) continue
      if ((await getBlockHash(answer)) !== record.blocks[index]) continue

      parts[index] = answer
      break
    }

    if (!parts[index]) return null
  }

  return new Blob(parts as ArrayBuffer[], { type: record.type })
}
