import { describe, it, expect, beforeAll } from 'vitest'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  classSlugs,
  magic,
  marketplaceSlug,
  missingSlug,
  pages,
  portrait,
  races,
  root,
  sandbox,
  speciesSlugs,
  type Run,
  type Sandbox
} from './reference.fixture'

const read = (name: string) => readFileSync(resolve(root, '..', name), 'utf8')

const recipe = (name: string) => {
  const found = new RegExp(`^${name}(?: [^\\n]*)?:[^\\n]*\\n((?:[ \\t]+[^\\n]*\\n?)*)`, 'm').exec(read('justfile'))
  return (found?.[1] ?? '').split('\n').map((line) => line.trim()).filter(Boolean)
}

const git = (...args: string[]) => spawnSync('git', args, { cwd: root, encoding: 'utf8' })

describe('just reference races', () => {
  let box: Sandbox
  let done: Run

  beforeAll(() => {
    box = sandbox(pages('species', speciesSlugs))
    done = box.run('races')
  }, 120_000)

  it('runs to the end and reports every link the listing carries', () => {
    expect(done.status).toBe(0)
    expect(done.out).toMatch(new RegExp(`^${speciesSlugs.length + 2} races listed$`, 'm'))
  })

  it('reads the listing and the pages at /species, which is where D and D Beyond serves species', () => {
    const asked = box.requests()
    expect(asked).toContain('https://www.dndbeyond.com/species')
    for (const slug of speciesSlugs) expect(asked).toContain(`https://www.dndbeyond.com/species/${slug}`)
    expect(asked.filter((url) => /dndbeyond\.com\/races/.test(url))).toEqual([])
  })

  it('writes the folder named races, not the path named species', () => {
    expect(box.has('races')).toBe(true)
    expect(box.has('species')).toBe(false)
  })

  it('fills a folder per link that answers with a species page', () => {
    expect(box.folders('races')).toEqual([...speciesSlugs].sort())
  })

  it('carries every race public/sources/races/index.json names', () => {
    const folders = box.folders('races')
    for (const id of races) expect(folders.some((folder) => folder.replace(/^\d+-/, '') === id)).toBe(true)
  })

  it('gives each species folder the markdown and at least one image', () => {
    for (const slug of speciesSlugs) {
      const held = box.files('races', slug)
      expect(held).toContain(`${slug}.md`)
      expect(held.filter((name) => !name.endsWith('.md')).length).toBeGreaterThanOrEqual(1)
      expect(box.read('races', slug, `${slug}.md`).trim()).not.toBe('')
    }
  })

  it('writes the image the page carries, byte for byte, under its own basename', () => {
    for (const slug of speciesSlugs) {
      expect(box.bytes('races', slug, `${slug}.png`)).toEqual(portrait(slug))
      expect(box.bytes('races', slug, `${slug}.png`).slice(0, magic.length)).toEqual(magic)
    }
  })

  it('holds the description, every trait as a heading and every subrace as a heading', () => {
    const markdown = box.read('races', '3-elf', '3-elf.md')
    expect(markdown).toMatch(/^# Elf$/m)
    expect(markdown).toMatch(/^The Elf description paragraph the 2014 page carries\.$/m)
    expect(markdown).toMatch(/^## Elf Traits$/m)
    expect(markdown).toMatch(/^#### Darkvision$/m)
    expect(markdown).toMatch(/^You see in dim light within 60 feet as if it were bright light\.$/m)
    expect(markdown).toMatch(/^#### Keen Senses$/m)
    expect(markdown).toMatch(/^## Variant Elf$/m)
    expect(markdown).toMatch(/^#### Cantrip$/m)
  })

  it('links the image from the markdown by basename', () => {
    expect(box.read('races', '3-elf', '3-elf.md')).toContain('![Elf](3-elf.png)')
  })

  it('skips a link that redirects to something other than a species page', () => {
    expect(done.out).toContain(`skip ${marketplaceSlug}: not a species page`)
    expect(box.folders('races')).not.toContain(marketplaceSlug)
  })

  it('skips a species that answers 404 and keeps going', () => {
    expect(done.out).toContain(`https://www.dndbeyond.com/species/${missingSlug} answered 404`)
    expect(box.folders('races')).not.toContain(missingSlug)
  })
})

describe('a second run of the races kind', () => {
  let box: Sandbox

  beforeAll(() => {
    box = sandbox(pages('species', speciesSlugs))
    box.run('races')
  }, 120_000)

  const asked = () => box.requests().filter((url) => url === 'https://www.dndbeyond.com/species/3-elf').length

  it('leaves a species already on disk alone', () => {
    const before = asked()
    const again = box.run('races')
    expect(again.out).toContain('skip 3-elf: on disk')
    expect(asked()).toBe(before)
  })

  it('fetches it again under --refresh', () => {
    const before = asked()
    const again = box.run('races', '--refresh')
    expect(again.out).not.toContain('skip 3-elf: on disk')
    expect(asked()).toBe(before + 1)
    expect(box.folders('races')).toEqual([...speciesSlugs].sort())
  })

  it('refuses a flag it does not know', () => {
    const again = box.run('races', '--nope')
    expect(again.status).toBe(1)
    expect(again.out).toContain('unknown flag: --nope')
  })
})

describe('the classes kind the races kind was added beside', () => {
  let box: Sandbox
  let done: Run

  beforeAll(() => {
    box = sandbox(pages('classes', classSlugs))
    done = box.run('classes')
  }, 120_000)

  it('still reads /classes and still writes the classes folder', () => {
    expect(done.status).toBe(0)
    expect(box.requests()).toContain('https://www.dndbeyond.com/classes')
    expect(box.requests().filter((url) => /dndbeyond\.com\/species/.test(url))).toEqual([])
    expect(box.folders('classes')).toEqual([...classSlugs].sort())
    expect(box.has('races')).toBe(false)
  })

  it('names the class when it skips a page that is not one', () => {
    expect(done.out).toContain(`skip ${marketplaceSlug}: not a class page`)
  })
})

describe('the reference script itself', () => {
  const box = sandbox({})

  it('parses under bash', () => {
    expect(spawnSync('bash', ['-n', resolve(root, 'scripts/reference.sh')]).status).toBe(0)
  })

  it('names both kinds in its usage line and refuses anything else', () => {
    for (const args of [[], ['species'], ['spells']]) {
      const done = box.run(...args)
      expect(done.status).toBe(1)
      expect(done.out).toContain('usage: scripts/reference.sh <classes|races> [--refresh]')
    }
  })

  it('is what just reference runs, with the kind passed through', () => {
    expect(recipe('reference')).toEqual(['bash web/scripts/reference.sh {{kind}} {{ARGS}}'])
  })
})

describe('what the fetcher writes never reaches git', () => {
  it('is ignored, so git status shows nothing under reference/', () => {
    expect(read('.gitignore').split('\n')).toContain('reference/')
    expect(git('check-ignore', '-q', 'reference/dndbeyond/races/3-elf/3-elf.md').status).toBe(0)
    expect(git('check-ignore', '-q', 'reference/dndbeyond/classes/12-barbarian/12-barbarian.png').status).toBe(0)
    expect(git('status', '--porcelain', '--', 'reference').stdout).toBe('')
  })

  it('is not what the gate runs, which needs no network', () => {
    expect(recipe('gate')).toEqual(['just check', 'just test', 'just build', 'just vet'])
  })
})
