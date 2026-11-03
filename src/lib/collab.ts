import * as Y from 'yjs'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  where
} from 'firebase/firestore'
import { auth, db } from './firebase'
import type { Owner } from './firestore.types'

/** How long a run of local edits is gathered before it is written. */
const SETTLE_MS = 1200

/** How many stored updates a document carries before they are folded into one. */
const FOLD_AT = 40

export interface Session {
  /** The shared document every peer converges on. */
  ydoc: Y.Doc
  /** The block markdown, shared character by character. */
  content: Y.Text
  /** Walks the local peer's own edits, so one peer's undo never lifts another's work. */
  history: Y.UndoManager
  /** Writes whatever is still gathered and stops listening. */
  leave: () => Promise<void>
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let index = 0; index < bytes.length; index += 8192) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 8192))
  }
  return btoa(binary)
}

function fromBase64(written: string): Uint8Array {
  const binary = atob(written)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

/**
 * Joins the shared document a resource is written in. Every peer appends its own
 * updates under the resource and applies what the others append, so the block
 * text converges without anyone's keystrokes overwriting anyone else's.
 *
 * Firestore carries the updates because it is the one store every player already
 * reaches. A run of edits is gathered for SETTLE_MS before it is written, so a
 * sentence costs one document rather than one per key.
 */
export function joinDoc(owner: Owner, kind: string, id: string, seed: string): Session {
  const ydoc = new Y.Doc()
  const content = ydoc.getText('content')
  const rows = collection(db, owner.at, owner.id, kind, id, 'updates')
  const self = auth.currentUser?.uid ?? 'nobody'

  const history = new Y.UndoManager(content, { trackedOrigins: new Set(['self']) })

  let gathered: Uint8Array[] = []
  let timer: ReturnType<typeof setTimeout> | null = null
  let seen = new Set<string>()
  let live = true

  ydoc.on('update', (update: Uint8Array, origin: unknown) => {
    if (origin === 'remote') return
    gathered.push(update)
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => void flush(), SETTLE_MS)
  })

  async function flush() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    if (gathered.length === 0 || !live) return

    const held = Y.mergeUpdates(gathered)
    gathered = []

    await addDoc(rows, { by: self, body: toBase64(held), at: serverTimestamp() })
  }

  const stop = onSnapshot(query(rows), (snapshot) => {
    const held: Uint8Array[] = []

    snapshot.docs.forEach((entry) => {
      if (seen.has(entry.id)) return
      seen.add(entry.id)
      const body = entry.data().body
      if (typeof body === 'string') held.push(fromBase64(body))
    })

    if (held.length > 0) Y.applyUpdate(ydoc, Y.mergeUpdates(held), 'remote')

    // Nothing stored yet, so the text the resource already carries is the start.
    if (snapshot.empty && content.length === 0 && seed) {
      content.insert(0, seed)
    }

    if (snapshot.size > FOLD_AT) void fold(snapshot.docs.map((entry) => entry.id))
  })

  async function fold(ids: string[]) {
    const merged = Y.encodeStateAsUpdate(ydoc)
    await addDoc(rows, { by: self, body: toBase64(merged), at: serverTimestamp() })
    await Promise.all(ids.map((one) => deleteDoc(doc(rows, one))))
    ids.forEach((one) => seen.delete(one))
  }

  return {
    ydoc,
    content,
    history,
    async leave() {
      live = false
      stop()
      if (timer) clearTimeout(timer)
      if (gathered.length > 0) {
        live = true
        await flush()
        live = false
      }
      history.destroy()
      ydoc.destroy()
    }
  }
}

/** Drops every stored update, which a resource does when it is removed. */
export async function dropDoc(owner: Owner, kind: string, id: string): Promise<void> {
  const rows = collection(db, owner.at, owner.id, kind, id, 'updates')
  const held = await getDocs(query(rows, where('by', '!=', '')))
  await Promise.all(held.docs.map((entry) => deleteDoc(entry.ref)))
}
