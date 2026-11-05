import { beforeEach, describe, expect, it } from 'vitest'
import { get } from 'svelte/store'
import { uiStore } from './ui.store'

const drawers = () => {
  const { menuOpen, chatOpen, menuView } = get(uiStore)
  return { menuOpen, chatOpen, menuView }
}

describe('the two sidebars', () => {
  beforeEach(() => uiStore.reset())

  it('closes the chat when the menu opens', () => {
    uiStore.toggleChat()
    uiStore.toggleMenu()
    expect(drawers()).toEqual({ menuOpen: true, chatOpen: false, menuView: 'menu' })

    uiStore.toggleChat()
    uiStore.openMenu()
    expect(drawers()).toEqual({ menuOpen: true, chatOpen: false, menuView: 'menu' })

    uiStore.toggleChat()
    uiStore.openSoundboard()
    expect(drawers()).toEqual({ menuOpen: true, chatOpen: false, menuView: 'soundboard' })

    uiStore.toggleChat()
    uiStore.openMusic()
    expect(drawers()).toEqual({ menuOpen: true, chatOpen: false, menuView: 'music' })
  })

  it('closes the menu when the chat opens', () => {
    uiStore.openMenu()
    uiStore.toggleChat()
    expect(drawers()).toEqual({ menuOpen: false, chatOpen: true, menuView: 'menu' })
  })

  it('leaves the other sidebar alone when one closes', () => {
    uiStore.toggleChat()
    uiStore.openMusic()
    uiStore.openMusic()
    expect(drawers()).toEqual({ menuOpen: false, chatOpen: false, menuView: 'music' })

    uiStore.toggleMenu()
    uiStore.toggleMenu()
    expect(drawers()).toEqual({ menuOpen: false, chatOpen: false, menuView: 'music' })

    uiStore.toggleChat()
    uiStore.toggleChat()
    expect(drawers()).toEqual({ menuOpen: false, chatOpen: false, menuView: 'music' })
  })
})
