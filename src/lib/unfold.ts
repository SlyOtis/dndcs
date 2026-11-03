/**
 * Folds a box open and shut by animating max-height to its measured content
 * height, then lets it go once open so the content may keep growing.
 */
export function unfold(node: HTMLElement, open: boolean) {
  let shown = open

  node.style.overflow = 'hidden'
  node.style.willChange = 'max-height'
  node.style.transition = 'max-height 0.22s cubic-bezier(0.4, 0, 0.2, 1)'
  node.style.maxHeight = open ? 'none' : '0px'
  node.inert = !open

  function settle(event: TransitionEvent) {
    if (event.target !== node || event.propertyName !== 'max-height') return
    if (shown) node.style.maxHeight = 'none'
  }

  node.addEventListener('transitionend', settle)

  return {
    update(next: boolean) {
      if (next === shown) return
      shown = next
      node.inert = !next
      node.style.maxHeight = `${node.scrollHeight}px`
      void node.offsetHeight
      node.style.maxHeight = next ? `${node.scrollHeight}px` : '0px'
    },
    destroy() {
      node.removeEventListener('transitionend', settle)
    }
  }
}
