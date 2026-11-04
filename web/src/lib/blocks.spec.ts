import { describe, it, expect } from 'vitest'
import {
  getBlock,
  getBlockMarkdown,
  getBlocksFromMarkdown,
  getColumns,
  getDocument,
  getDocumentHtml,
  getDocumentMarkdown,
  getEmptyDocument,
  getHeadingNumbers,
  getMeeting,
  getReferences,
  getSlug
} from './blocks'

describe('reading markdown into blocks', () => {
  it('reads a heading at the depth its hashes name', () => {
    const [block] = getBlocksFromMarkdown('### The Sunken Barrow')
    expect(block.kind).toBe('heading')
    expect(block.options.level).toBe(3)
    expect(block.text).toBe('The Sunken Barrow')
  })

  it('reads a fence with its language and keeps the body raw', () => {
    const [block] = getBlocksFromMarkdown('```json\n{ "a": 1 }\n```')
    expect(block.kind).toBe('code')
    expect(block.options.language).toBe('json')
    expect(block.text).toBe('{ "a": 1 }')
  })

  it('tells a callout from a plain quote', () => {
    const [callout, quote] = getBlocksFromMarkdown('> [!note] Mind the seal\n\n> Maelis said nothing')
    expect(callout.kind).toBe('callout')
    expect(callout.text).toBe('Mind the seal')
    expect(quote.kind).toBe('quote')
    expect(quote.text).toBe('Maelis said nothing')
  })

  it('reads a picture into its own block', () => {
    const [block] = getBlocksFromMarkdown('![The keep](file:maps/keep.png)')
    expect(block.kind).toBe('image')
    expect(block.options.src).toBe('file:maps/keep.png')
    expect(block.options.alt).toBe('The keep')
  })

  it('joins a wrapped paragraph into one run', () => {
    const blocks = getBlocksFromMarkdown('The party took\nthe north road.')
    expect(blocks).toHaveLength(1)
    expect(blocks[0].text).toBe('The party took the north road.')
  })

  it('never hands back an empty document', () => {
    expect(getDocument('').blocks).toHaveLength(1)
    expect(getDocument(null).blocks).toHaveLength(1)
    expect(getEmptyDocument().blocks[0].kind).toBe('paragraph')
  })
})

describe('a line that only looks like a block', () => {
  it('reads an unfinished picture as a paragraph and moves on', () => {
    const blocks = getBlocksFromMarkdown('![the cellar\nstairs](/api/asset/a/data)\n\nAfter.')
    expect(blocks.map((block) => block.kind)).toEqual(['paragraph', 'paragraph'])
    expect(blocks[0].text).toBe('![the cellar stairs](/api/asset/a/data)')
    expect(blocks[1].text).toBe('After.')
  })

  it('writes a caption that holds a line break on one line', () => {
    const block = getBlock('image', '', { alt: 'the cellar\nstairs', src: '/api/asset/a/data' })
    const [read] = getBlocksFromMarkdown(getBlockMarkdown(block))
    expect(read.kind).toBe('image')
    expect(read.options.alt).toBe('the cellar stairs')
  })
})

describe('writing blocks back out', () => {
  it('round trips every kind through markdown', () => {
    const source = [
      '# Blackwood',
      '',
      'The party took the north road.',
      '',
      '- a lantern',
      '',
      '1. the seal',
      '',
      '> Maelis said nothing',
      '',
      '> [!note] Mind the seal',
      '',
      '```json',
      '{ "a": 1 }',
      '```',
      '',
      '---',
      '',
      '![The keep](file:maps/keep.png)'
    ].join('\n')

    expect(getDocumentMarkdown(getDocument(source))).toBe(source)
  })

  it('reads a stored json document straight back', () => {
    const document = getDocument('# Blackwood')
    expect(getDocument(JSON.stringify(document)).blocks[0].text).toBe('Blackwood')
  })
})

describe('references written in the text', () => {
  it('collects an at mention and a hash tag once each', () => {
    const document = getDocument('Met @Maelis at #blackwood. @Maelis knew of #blackwood already.')
    expect(getReferences(document)).toEqual([
      { mark: '@', label: 'Maelis' },
      { mark: '#', label: 'blackwood' }
    ])
  })

  it('leaves a hash that opens a heading alone', () => {
    expect(getReferences(getDocument('# Blackwood'))).toEqual([])
  })

  it('takes a mention that opens a line', () => {
    expect(getReferences(getDocument('@Maelis waited.'))).toEqual([{ mark: '@', label: 'Maelis' }])
  })
})

describe('nested lists', () => {
  it('reads two leading spaces as one level of depth', () => {
    const [top, under, deeper] = getBlocksFromMarkdown('- a lantern\n  - its oil\n    1. a wick')
    expect(top.options.depth).toBeUndefined()
    expect(under.kind).toBe('bullet')
    expect(under.options.depth).toBe(1)
    expect(deeper.kind).toBe('number')
    expect(deeper.options.depth).toBe(2)
  })

  it('writes depth back as leading spaces on every list kind', () => {
    const source = '- a lantern\n\n  - its oil\n\n    1. a wick\n\n  - [x] lit'
    expect(getDocumentMarkdown(getDocument(source))).toBe(source)
  })

  it('keeps a heading level and a list depth when the block also carries its own look', () => {
    const document = getDocument('## Blackwood')
    document.blocks[0].options = { ...document.blocks[0].options, align: 'center' }
    const back = getDocument(getDocumentMarkdown(document))
    expect(back.blocks[0].options.level).toBe(2)
    expect(back.blocks[0].options.align).toBe('center')
  })
})

describe('the fenced kinds', () => {
  it.each([
    ['mermaid', 'graph TD; A-->B'],
    ['html', '<p>Mind the seal</p>'],
    ['embed', 'https://example.org/frame'],
    ['meeting', 'Date: 2026-09-11\nAttendees: @Maelis\nNotes: The seal held.'],
    ['map', 'https://www.openstreetmap.org/export/embed.html?bbox=1,2,3,4']
  ])('reads a %s fence and writes it back', (kind, body) => {
    const source = `\`\`\`${kind}\n${body}\n\`\`\``
    const [block] = getBlocksFromMarkdown(source)
    expect(block.kind).toBe(kind)
    expect(block.text).toBe(body)
    expect(getDocumentMarkdown(getDocument(source))).toBe(source)
  })

  it('reads columns split on a rule line', () => {
    const source = '```columns\n# Left\n\nOne\n---\n# Right\n\nTwo\n```'
    const [block] = getBlocksFromMarkdown(source)
    expect(block.kind).toBe('columns')
    expect(getColumns(block.text)).toEqual(['# Left\n\nOne', '# Right\n\nTwo'])
    expect(getDocumentMarkdown(getDocument(source))).toBe(source)
  })

  it('takes a meeting apart into its lines', () => {
    expect(getMeeting('Date: 2026-09-11\nAttendees: Maelis, Tam\nNotes: The seal held.\nNothing more.')).toEqual({
      date: '2026-09-11',
      attendees: 'Maelis, Tam',
      notes: 'The seal held.\nNothing more.'
    })
  })
})

describe('the directive and link kinds', () => {
  it('reads a toc directive line', () => {
    const [block] = getBlocksFromMarkdown('[toc]')
    expect(block.kind).toBe('toc')
    expect(getDocumentMarkdown(getDocument('[toc]'))).toBe('[toc]')
  })

  it('reads a video link line', () => {
    const source = '[video: The ambush](file:clips/ambush.webm)'
    const [block] = getBlocksFromMarkdown(source)
    expect(block.kind).toBe('video')
    expect(block.text).toBe('The ambush')
    expect(block.options.src).toBe('file:clips/ambush.webm')
    expect(getDocumentMarkdown(getDocument(source))).toBe(source)
  })

  it('reads a pdf link line', () => {
    const source = '[pdf: The charter](file:docs/charter.pdf)'
    const [block] = getBlocksFromMarkdown(source)
    expect(block.kind).toBe('pdf')
    expect(block.options.src).toBe('file:docs/charter.pdf')
    expect(getDocumentMarkdown(getDocument(source))).toBe(source)
  })

  it('reads a page link line by id', () => {
    const source = '[page: The Sunken Barrow](abc123)'
    const [block] = getBlocksFromMarkdown(source)
    expect(block.kind).toBe('page')
    expect(block.text).toBe('The Sunken Barrow')
    expect(block.options.page).toBe('abc123')
    expect(getDocumentMarkdown(getDocument(source))).toBe(source)
  })

  it('keeps a media read view in the fence', () => {
    const document = getDocument('[video: The ambush](file:clips/ambush.webm)')
    document.blocks[0].options = { ...document.blocks[0].options, view: 'link' }
    const back = getDocument(getDocumentMarkdown(document))
    expect(back.blocks[0].kind).toBe('video')
    expect(back.blocks[0].options.src).toBe('file:clips/ambush.webm')
    expect(back.blocks[0].options.view).toBe('link')
  })
})

describe('the file kind', () => {
  const attached = { assetId: 'a1', name: 'The charter.pdf', url: '/api/asset/a1/data', mimeType: 'application/pdf' }

  it('writes the four values it was attached with into a file fence, in the order Mar writes them', () => {
    expect(getBlockMarkdown(getBlock('file', '', attached))).toBe(
      '```file {"assetId":"a1","name":"The charter.pdf","url":"/api/asset/a1/data","mimeType":"application/pdf"}\n\n```'
    )
  })

  it('reads the fence Mar writes back into the same block', () => {
    const [block] = getBlocksFromMarkdown(
      '```file {"assetId":"a1","name":"The charter.pdf","url":"/api/asset/a1/data","mimeType":"application/pdf"}\n```'
    )
    expect(block.kind).toBe('file')
    expect(block.text).toBe('')
    expect(block.options).toEqual(attached)
  })

  it('round trips through markdown with every value kept', () => {
    const document = { blocks: [getBlock('paragraph', 'The deed is below.'), getBlock('file', '', attached)] }
    const back = getDocument(getDocumentMarkdown(document))
    expect(back.blocks.map((block) => block.kind)).toEqual(['paragraph', 'file'])
    expect(back.blocks[1].options).toEqual(attached)
    expect(getDocumentMarkdown(back)).toBe(getDocumentMarkdown(document))
  })

  it('draws as a link to its file in html', () => {
    expect(getDocumentHtml({ blocks: [getBlock('file', '', attached)] })).toContain(
      '<a class="dnd-file" href="/api/asset/a1/data">The charter.pdf</a>'
    )
  })
})

describe('heading numbers', () => {
  it('counts an outline and restarts under a shallower heading', () => {
    const { blocks } = getDocument('# One\n\n## One one\n\n## One two\n\n# Two\n\n## Two one')
    const numbers = getHeadingNumbers(blocks)
    expect(blocks.map((block) => numbers[block.id])).toEqual(['1.', '1.1', '1.2', '2.', '2.1'])
  })

  it('makes a slug a heading is reached by', () => {
    expect(getSlug('The Sunken Barrow!')).toBe('the-sunken-barrow')
  })
})

describe('the document as html', () => {
  it('nests list items by depth and numbers headings when asked', () => {
    const html = getDocumentHtml(getDocument('# One\n\n- a\n\n  - b\n\n- c'), true)
    expect(html).toContain('<h1 id="one">1. One</h1>')
    expect(html).toContain('<ul>\n<li>a</li>\n<ul>\n<li>b</li>\n</ul>\n<li>c</li>\n</ul>')
  })

  it('draws every new kind in its own element', () => {
    const html = getDocumentHtml(
      getDocument(
        [
          '```mermaid\ngraph TD; A-->B\n```',
          '```html\n<b>raw</b>\n```',
          '[toc]',
          '```toc {"placement":"right"}\n\n```',
          '```columns\nLeft\n---\nRight\n```',
          '[video: clip](v.webm)',
          '[pdf: doc](d.pdf)',
          '```embed\nhttps://example.org\n```',
          '```meeting\nDate: today\nAttendees: us\nNotes: none\n```',
          '```map\nhttps://example.org/map\n```',
          '[page: Sub](id1)'
        ].join('\n\n')
      )
    )
    expect(html).toContain('<pre class="mermaid">')
    expect(html).toContain('<b>raw</b>')
    expect(html).toContain('<nav class="dnd-toc">')
    expect(html).toContain('<nav class="dnd-toc dnd-toc-right">')
    expect(html).toContain('<div class="dnd-column"><p>Left</p></div>')
    expect(html).toContain('<video controls src="v.webm">')
    expect(html).toContain('type="application/pdf"')
    expect(html).toContain('<iframe src="https://example.org"')
    expect(html).toContain('<aside class="dnd-meeting">')
    expect(html).toContain('<iframe src="https://example.org/map"')
    expect(html).toContain('<a class="dnd-page" href="id1">Sub</a>')
  })
})
