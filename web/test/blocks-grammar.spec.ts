import { describe, expect, it } from 'vitest'
import { getBlock, getBlockMarkdown, getBlocksFromMarkdown, getDocumentMarkdown } from '../src/lib/blocks'

const round = (block: ReturnType<typeof getBlock>) => getBlocksFromMarkdown(getBlockMarkdown(block))[0]

describe('a block markdown has no form for', () => {
  it('keeps its kind and its options through the fence', () => {
    const held = round(getBlock('table', 'a | b\n1 | 2'))
    expect(held.kind).toBe('table')
    expect(held.text).toBe('a | b\n1 | 2')
  })

  it('keeps a toggle open through the fence', () => {
    const held = round(getBlock('toggle', 'What lies beneath', { open: true }))
    expect(held.kind).toBe('toggle')
    expect(held.options.open).toBe(true)
  })

  it('keeps the look a block carries of its own', () => {
    const held = round(getBlock('paragraph', 'Set wide and centred', { align: 'center', size: 'lg', own: true }))
    expect(held.options.align).toBe('center')
    expect(held.options.size).toBe('lg')
    expect(held.options.own).toBe(true)
  })

  it('opens and closes with one more backtick than the run inside it, so blocks nest', () => {
    const written = getBlockMarkdown(getBlock('table', 'holds ``` inside'))
    expect(written.startsWith('````')).toBe(true)
    expect(round(getBlock('table', 'holds ``` inside')).text).toBe('holds ``` inside')
  })
})

describe('a table of contents', () => {
  it('stays a directive line in the flow and becomes a fence as a legend', () => {
    expect(getBlockMarkdown(getBlock('toc'))).toBe('[toc]')
    expect(getBlockMarkdown(getBlock('toc', '', { placement: 'right' }))).toBe('```toc {"placement":"right"}\n\n```')
    const held = round(getBlock('toc', '', { placement: 'left' }))
    expect(held.kind).toBe('toc')
    expect(held.options.placement).toBe('left')
  })
})

describe('a task block', () => {
  it('round trips unchecked and checked', () => {
    expect(getBlockMarkdown(getBlock('todo', 'Break the seal'))).toBe('- [ ] Break the seal')
    expect(round(getBlock('todo', 'Break the seal', { done: true })).options.done).toBe(true)
    expect(round(getBlock('todo', 'Break the seal', { done: true })).kind).toBe('todo')
  })
})

describe('a plain block', () => {
  it('is still written as plain markdown when it carries nothing of its own', () => {
    expect(getBlockMarkdown(getBlock('heading', 'History', { level: 2 }))).toBe('## History')
    expect(getBlockMarkdown(getBlock('bullet', 'one'))).toBe('- one')
    expect(getBlockMarkdown(getBlock('quote', 'said so'))).toBe('> said so')
  })

  it('survives a whole document round trip', () => {
    const blocks = [
      getBlock('heading', 'The ask', { level: 2 }),
      getBlock('paragraph', 'Who wants it done.'),
      getBlock('todo', 'Ask in Greyford', { done: true }),
      getBlock('table', 'name | worth'),
      getBlock('paragraph', 'Centred', { align: 'center', own: true })
    ]
    const again = getBlocksFromMarkdown(getDocumentMarkdown({ blocks }))
    expect(again.map((one) => one.kind)).toEqual(['heading', 'paragraph', 'todo', 'table', 'paragraph'])
    expect(again[4].options.align).toBe('center')
  })
})
