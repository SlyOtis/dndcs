import { afterEach, describe, expect, it, vi } from 'vitest'

const storage = vi.hoisted(() => ({
  postFile: vi.fn(() => Promise.resolve('file:users/lars/files/1757-a1.mp3')),
  getFileUrl: vi.fn(() => Promise.resolve('/media/users/lars/files/1757-a1.mp3'))
}))

vi.mock('./storage.service', () => storage)

import { playSoundClip, postSoundClip } from './soundboard'

class FakeAudio {
  static played: string[] = []
  src: string
  volume = 1
  preload = ''
  duration = 2.5
  private heard: Record<string, () => void> = {}

  constructor(src = '') {
    this.src = src
  }

  addEventListener(name: string, run: () => void) {
    this.heard[name] = run
    if (name === 'loadedmetadata') queueMicrotask(run)
  }

  play() {
    FakeAudio.played.push(this.src)
    queueMicrotask(() => this.heard.ended?.())
    return Promise.resolve()
  }
}

describe('a sound clip', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    FakeAudio.played = []
  })

  it('posts its audio through postFile and keeps the address, never the bytes', async () => {
    vi.stubGlobal('Audio', FakeAudio)
    const file = new File([new Uint8Array(8)], 'Door Creak.mp3', { type: 'audio/mpeg' })

    const clip = await postSoundClip('', file)

    expect(storage.postFile).toHaveBeenCalledWith(file, { kind: 'user' })
    expect(clip).toMatchObject({ name: 'Door Creak', address: 'file:users/lars/files/1757-a1.mp3', duration: 2.5 })
    expect(clip).not.toHaveProperty('audioData')
  })

  it('plays from the media store URL its address resolves to', async () => {
    vi.stubGlobal('Audio', FakeAudio)

    await playSoundClip({ id: 'c', name: 'Door', address: 'file:users/lars/files/1757-a1.mp3', volume: 0.5, created_at: '' })

    expect(FakeAudio.played).toEqual(['/media/users/lars/files/1757-a1.mp3'])
  })
})
