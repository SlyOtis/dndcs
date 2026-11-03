const API_ROOT = '/api'
const POLL = 4_000

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

async function getAnswer<T>(method: string, path: string, body?: unknown): Promise<T> {
  const answer = await fetch(API_ROOT + path, {
    method,
    credentials: 'include',
    headers: body === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
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

export function getEvery<T>(load: () => Promise<T>, onChange: (value: T) => void, onError?: (error: unknown) => void): () => void {
  let closed = false
  let last = ''
  let timer: ReturnType<typeof setTimeout> | null = null

  const tick = async () => {
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
    if (!closed) timer = setTimeout(tick, POLL)
  }

  tick()
  return () => {
    closed = true
    if (timer) clearTimeout(timer)
  }
}
