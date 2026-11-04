import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

class FakeSource {
  static CLOSED = 2
  static made: FakeSource[] = []
  url: string
  readyState = 0
  closed = false
  handlers = new Map<string, Array<() => void>>()

  constructor(url: string) {
    this.url = url
    FakeSource.made.push(this)
  }

  addEventListener(name: string, handler: () => void) {
    this.handlers.set(name, [...(this.handlers.get(name) ?? []), handler])
  }

  fire(name: string) {
    for (const handler of this.handlers.get(name) ?? []) handler()
  }

  close() {
    this.closed = true
  }
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

beforeEach(() => {
  FakeSource.made = []
  vi.stubGlobal('EventSource', FakeSource)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('a live list over the stream', () => {
  it('shares one connection between the lists of a campaign', async () => {
    const { getStream } = await import('./api')
    const stopChat = getStream('/campaign/c/stream', 'chat', async () => [], () => {})
    const stopMaps = getStream('/campaign/c/stream', 'map', async () => [], () => {})

    expect(FakeSource.made).toHaveLength(1)
    expect(FakeSource.made[0].url).toBe('/api/campaign/c/stream')
    stopChat()
    expect(FakeSource.made[0].closed).toBe(false)
    stopMaps()
    expect(FakeSource.made[0].closed).toBe(true)
  })

  it('reloads on its own kind and on a reconnect, not on another kind', async () => {
    const { getStream } = await import('./api')
    let loads = 0
    const seen: number[] = []
    const stop = getStream('/campaign/k/stream', 'chat', async () => ++loads, (value) => seen.push(value))
    await settle()

    FakeSource.made[0].fire('map')
    await settle()
    FakeSource.made[0].fire('chat')
    await settle()
    FakeSource.made[0].fire('open')
    await settle()

    expect(seen).toEqual([1, 2, 3])
    stop()
  })

  it('hands nothing on when the reload answers the same list', async () => {
    const { getStream } = await import('./api')
    const seen: unknown[] = []
    const stop = getStream('/profile/stream', 'profile', async () => ({ uid: 'u' }), (value) => seen.push(value))
    await settle()
    FakeSource.made[0].fire('profile')
    await settle()

    expect(seen).toEqual([{ uid: 'u' }])
    stop()
  })

  it('tells the list when the stream is refused', async () => {
    const { getStream } = await import('./api')
    const errors: unknown[] = []
    const stop = getStream('/resource/r/stream', 'update', async () => [], () => {}, (error) => errors.push(error))
    await settle()
    FakeSource.made[0].readyState = FakeSource.CLOSED
    FakeSource.made[0].fire('error')

    expect(errors).toHaveLength(1)
    stop()
  })
})
