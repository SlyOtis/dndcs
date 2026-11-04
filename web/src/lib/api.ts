const API_ROOT = '/api'

export interface SessionUser {
  uid: string
  email: string
  display_name: string
  photo_url: string
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

let session: SessionUser | null = null

export function getSession(): SessionUser | null {
  return session
}

export function putSession(user: SessionUser | null): void {
  session = user
}

export function getSessionId(): string {
  if (!session) throw new ApiError(401, 'User not authenticated')
  return session.uid
}

export function getCsrfHeaders(): Record<string, string> {
  const cookie = document.cookie.split('; ').find((part) => part.startsWith('sauth_csrf_token='))
  return cookie ? { 'SAuth-CSRF-Token': decodeURIComponent(cookie.slice('sauth_csrf_token='.length)) } : {}
}

async function getAnswer<T>(method: string, path: string, body?: unknown): Promise<T> {
  const write = method === 'GET' ? {} : getCsrfHeaders()
  const answer = await fetch(API_ROOT + path, {
    method,
    credentials: 'include',
    headers: body === undefined ? { ...write, Accept: 'application/json' } : { ...write, Accept: 'application/json', 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  })
  const envelope = (await answer.json().catch(() => null)) as { data?: T; error?: { message?: string } } | null
  if (!answer.ok) {
    throw new ApiError(answer.status, envelope?.error?.message || `${method} ${path} answered ${answer.status}`)
  }
  return (envelope?.data ?? null) as T
}

export function getApi<T>(path: string): Promise<T> {
  return getAnswer<T>('GET', path)
}

export function postApi<T>(path: string, body: unknown = {}): Promise<T> {
  return getAnswer<T>('POST', path, body)
}

export function putApi<T>(path: string, body: unknown = {}): Promise<T> {
  return getAnswer<T>('PUT', path, body)
}

export function deleteApi<T>(path: string): Promise<T> {
  return getAnswer<T>('DELETE', path)
}

export function getQuery(values: Record<string, string | undefined>): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) if (value) query.set(key, value)
  const text = query.toString()
  return text ? `?${text}` : ''
}

interface Watcher {
  kind: string
  refresh: () => void
  fail: (error: unknown) => void
}

interface Stream {
  source: EventSource
  watchers: Set<Watcher>
  kinds: Set<string>
}

const streams = new Map<string, Stream>()

function getSource(path: string): Stream {
  const held = streams.get(path)
  if (held) return held

  const source = new EventSource(API_ROOT + path, { withCredentials: true })
  const stream: Stream = { source, watchers: new Set(), kinds: new Set() }

  source.addEventListener('open', () => {
    for (const watcher of stream.watchers) watcher.refresh()
  })
  source.addEventListener('error', () => {
    if (source.readyState !== EventSource.CLOSED) return
    for (const watcher of stream.watchers) watcher.fail(new ApiError(0, `${path} closed`))
  })

  streams.set(path, stream)
  return stream
}

function putKind(stream: Stream, kind: string): void {
  if (stream.kinds.has(kind)) return
  stream.kinds.add(kind)
  stream.source.addEventListener(kind, () => {
    for (const watcher of stream.watchers) if (watcher.kind === kind) watcher.refresh()
  })
}

export function getStream<T>(
  path: string,
  kind: string,
  load: () => Promise<T>,
  onChange: (value: T) => void,
  onError?: (error: unknown) => void
): () => void {
  let closed = false
  let last = ''
  let running = false
  let again = false

  const refresh = async () => {
    if (closed) return
    if (running) {
      again = true
      return
    }
    running = true
    try {
      const value = await load()
      const seen = JSON.stringify(value)
      if (!closed && seen !== last) {
        last = seen
        onChange(value)
      }
    } catch (error) {
      if (!closed) onError?.(error)
    }
    running = false
    if (again) {
      again = false
      void refresh()
    }
  }

  const watcher: Watcher = { kind, refresh: () => void refresh(), fail: (error) => !closed && onError?.(error) }
  const stream = getSource(path)
  putKind(stream, kind)
  stream.watchers.add(watcher)
  void refresh()

  return () => {
    closed = true
    stream.watchers.delete(watcher)
    if (stream.watchers.size === 0) {
      stream.source.close()
      streams.delete(path)
    }
  }
}
