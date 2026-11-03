import { describe, expect, it } from 'vitest'
import dnd5e from '../../../public/sources/systems/dnd5e.json'
import lars from '../character.fixture'
import { getResolvedCharacter } from './derive'
import { getAttributeId, getSheet, getSkillId, getTierId } from './sheet'
import type { RuleSystem } from './spec.types'

const core = dnd5e as RuleSystem

describe('identifier mapping', () => {
  it('maps an ability title to its system id', () => {
    expect(getAttributeId('Strength')).toBe('str')
    expect(getAttributeId('  dexterity ')).toBe('dex')
  })

  it('maps a skill name to a camel case id', () => {
    expect(getSkillId('Animal Handling')).toBe('animalHandling')
    expect(getSkillId('Sleight of Hand')).toBe('sleightOfHand')
    expect(getSkillId('Perception')).toBe('perception')
  })

  it('maps a proficiency multiplier to a tier id', () => {
    expect(getTierId(core.proficiencyTiers, 0)).toBe('none')
    expect(getTierId(core.proficiencyTiers, 0.5)).toBe('half')
    expect(getTierId(core.proficiencyTiers, 1)).toBe('proficient')
    expect(getTierId(core.proficiencyTiers, 2)).toBe('expertise')
  })
})

describe('getSheet on the sample character', () => {
  const sheet = getSheet(lars, core)
  const resolved = getResolvedCharacter(core, sheet)

  it('carries the level', () => {
    expect(sheet.level).toBe(lars.info.level)
  })

  it('carries every ability score under its system id', () => {
    for (const ability of lars.abilities) {
      expect(sheet.attributes[getAttributeId(ability.title)]).toBe(ability.score)
    }
  })

  it('reproduces the stored armor class through the engine', () => {
    expect(resolved.derived.find((entry) => entry.id === 'armorClass')?.value).toBe(lars.info.ac)
  })

  it('reproduces the stored initiative through the engine', () => {
    expect(resolved.derived.find((entry) => entry.id === 'initiative')?.value).toBe(lars.info.initiative)
  })

  it('reproduces the stored maximum hit points through the engine', () => {
    expect(resolved.pools.find((entry) => entry.id === 'hitPoints')?.max).toBe(lars.info.hp.max)
  })

  it('reproduces the stored speed through the engine', () => {
    const speed = resolved.derived.find((entry) => entry.id === 'speed')?.value
    expect(speed).toBe(Number.parseInt(lars.info.speed, 10))
  })

  it('reproduces every stored skill modifier through the engine', () => {
    for (const skill of lars.skills) {
      const id = getSkillId(skill.name)
      const derived = resolved.skills.find((entry) => entry.id === id)
      if (!derived) continue
      expect([id, derived.value]).toEqual([id, skill.modifier])
    }
  })

  it('reproduces every stored saving throw through the engine', () => {
    for (const save of lars.savingThrows) {
      const id = getAttributeId(save.title)
      const derived = resolved.saves.find((entry) => entry.id === id)
      if (!derived) continue
      expect([id, derived.value]).toEqual([id, save.modifier])
    }
  })

  it('carries damage taken as spent hit points', () => {
    const pool = resolved.pools.find((entry) => entry.id === 'hitPoints')
    expect(pool?.spent).toBe(lars.info.hp.max - lars.info.hp.current)
    expect(pool?.remaining).toBe(lars.info.hp.current)
  })

  it('carries the custom resource pool the character owns', () => {
    expect(sheet.pools[getSkillId(lars.special.name)]).toBe(lars.special.max - lars.special.current)
  })
})
