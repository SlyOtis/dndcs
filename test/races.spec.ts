import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import index from '../public/sources/races/index.json'
import dragonborn from '../public/sources/races/dragonborn.json'
import dwarf from '../public/sources/races/dwarf.json'
import elf from '../public/sources/races/elf.json'
import gnome from '../public/sources/races/gnome.json'
import halfElf from '../public/sources/races/half-elf.json'
import halfOrc from '../public/sources/races/half-orc.json'
import halfling from '../public/sources/races/halfling.json'
import human from '../public/sources/races/human.json'
import tiefling from '../public/sources/races/tiefling.json'

type Trait = { id: string; name: string; description: string; source: string }

const races: Record<string, { image: string; traits: Trait[] }> = {
  dragonborn, dwarf, elf, gnome, 'half-elf': halfElf, 'half-orc': halfOrc, halfling, human, tiefling
}

describe('every core race carries its traits', () => {
  it('the index lists the nine races and nothing else', () => {
    expect([...index.races].sort()).toEqual(Object.keys(races).sort())
  })

  for (const [id, race] of Object.entries(races)) {
    it(`${id} carries a non empty traits array of base features with unique ids`, () => {
      expect(race.traits.length).toBeGreaterThan(0)
      for (const trait of race.traits) {
        expect(Object.keys(trait).sort()).toEqual(['description', 'id', 'name', 'source'])
        expect(trait.id).toMatch(/^[a-z_]+$/)
        expect(trait.name.trim()).not.toBe('')
        expect(trait.description.trim()).not.toBe('')
        expect(trait.source).toBe('base')
      }
      expect(new Set(race.traits.map((t) => t.id)).size).toBe(race.traits.length)
    })

    it(`${id} carries an image that resolves under public`, () => {
      expect(race.image).toMatch(/^\/sources\/art\/races\/[a-z-]+\.svg$/)
      expect(existsSync(resolve(__dirname, `../public${race.image}`))).toBe(true)
    })
  }
})
