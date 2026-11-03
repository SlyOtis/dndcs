import { describe, expect, it } from 'vitest'
import dnd5e from '../../../public/sources/systems/dnd5e.json'
import gunslinger from '../../../public/sources/systems/gunslinger.json'
import fighter from '../../../public/sources/classes/fighter.json'
import wizard from '../../../public/sources/classes/wizard.json'
import warlock from '../../../public/sources/classes/warlock.json'
import lars from '../character.fixture'
import type { Character } from '../character.types'
import type { CatalogEntry } from '../catalog'
import { getMergedSystem } from '../rules/system'
import type { RuleSystem, RuleSystemOverlay } from '../rules/spec.types'
import { getLevelUp, getLevelledCharacter, getStartingCharacter } from './levelUp'

const core = dnd5e as unknown as RuleSystem
const slinger = getMergedSystem(core, gunslinger as RuleSystemOverlay)

function getCharacter(level: number, die = 6): Character {
  return {
    ...lars,
    feats: [],
    info: {
      ...lars.info,
      level,
      hp: { current: 20, max: 30, temporary: 0 },
      class: { name: 'Wizard', hitDice: { amount: level, die } }
    }
  }
}

describe('getLevelUp', () => {
  it('reads the next level, the proficiency formula and the stored hit die', () => {
    const levelUp = getLevelUp(getCharacter(4), core, wizard as CatalogEntry)

    expect(levelUp.level).toBe(5)
    expect(levelUp.proficiencyBonus).toBe(3)
    expect(levelUp.hitDiceGain).toEqual({ amount: 1, die: 6 })
  })

  it('offers the improvement at a level the system names, spending its points over its attributes', () => {
    const levelUp = getLevelUp(getCharacter(3), core, wizard as CatalogEntry)

    expect(levelUp.choices).toHaveLength(1)
    expect(levelUp.choices[0].type).toBe('abilityScore')
    expect(levelUp.choices[0].options).toEqual(['str', 'dex', 'con', 'int', 'wis', 'cha'])
    expect(levelUp.choices[0].maxSelections).toBe(2)
  })

  it('offers no improvement between the named levels', () => {
    expect(getLevelUp(getCharacter(4), core, wizard as CatalogEntry).choices).toEqual([])
  })

  it('lets the class name its own improvement levels', () => {
    expect(getLevelUp(getCharacter(5), core, fighter as CatalogEntry).choices).toHaveLength(1)
    expect(getLevelUp(getCharacter(5), core, wizard as CatalogEntry).choices).toEqual([])
  })

  it('offers the attributes an overlay adds', () => {
    expect(getLevelUp(getCharacter(3), slinger, null).choices[0].options).toContain('grt')
  })

  it('lists the class features that arrive at the level and none of another level', () => {
    const levelUp = getLevelUp(getCharacter(1), core, wizard as CatalogEntry)
    expect(levelUp.newFeatures.map((feature) => feature.id)).toEqual(['arcane_tradition'])
  })

  it('reads the spell slots from the table the class casts by', () => {
    expect(getLevelUp(getCharacter(4), core, wizard as CatalogEntry).spellSlotChanges).toEqual({ 1: 4, 2: 3, 3: 2 })
    expect(getLevelUp(getCharacter(4), core, warlock as CatalogEntry).spellSlotChanges).toEqual({ 3: 2 })
    expect(getLevelUp(getCharacter(4), core, fighter as CatalogEntry).spellSlotChanges).toBeUndefined()
  })

  it('refuses a level past the maximum', () => {
    expect(() => getLevelUp(getCharacter(20), core, wizard as CatalogEntry)).toThrow('already at level 20')
  })
})

describe('getLevelledCharacter', () => {
  it('raises one ability by two and recomputes its modifier', () => {
    const character = getCharacter(3)
    const levelUp = getLevelUp(character, core, wizard as CatalogEntry)
    const levelled = getLevelledCharacter(character, core, levelUp, [['int', 'int']])

    expect(levelled.abilities.find((ability) => ability.id === 'int')).toMatchObject({ score: 12, modifier: 1 })
    expect(levelled.abilities.find((ability) => ability.id === 'str')?.score).toBe(12)
  })

  it('raises two abilities by one each', () => {
    const character = getCharacter(3)
    const levelUp = getLevelUp(character, core, wizard as CatalogEntry)
    const levelled = getLevelledCharacter(character, core, levelUp, [['str', 'cha']])

    expect(levelled.abilities.find((ability) => ability.id === 'str')?.score).toBe(13)
    expect(levelled.abilities.find((ability) => ability.id === 'cha')?.score).toBe(13)
  })

  it('stops an ability at the cap the system declares', () => {
    const character = getCharacter(3)
    const levelUp = getLevelUp(character, core, wizard as CatalogEntry)
    const levelled = getLevelledCharacter(character, core, levelUp, [['dex', 'dex']])

    expect(levelled.abilities.find((ability) => ability.id === 'dex')?.score).toBe(20)
  })

  it('adds the hit points the system formula gives, with the raised constitution', () => {
    const character = getCharacter(3)
    const levelUp = getLevelUp(character, core, wizard as CatalogEntry)

    const plain = getLevelledCharacter(character, core, levelUp, [['str', 'cha']])
    expect(plain.info.hp).toMatchObject({ max: 36, current: 26 })

    const hardy = getLevelledCharacter(character, core, levelUp, [['con', 'con']])
    expect(hardy.info.hp).toMatchObject({ max: 37, current: 27 })
  })

  it('writes the level, the proficiency, the hit dice, the slots and the features once', () => {
    const character = getCharacter(1)
    const levelUp = getLevelUp(character, core, wizard as CatalogEntry)
    const levelled = getLevelledCharacter(character, core, levelUp, [])
    const again = getLevelledCharacter(levelled, core, levelUp, [])

    expect(levelled.info.level).toBe(2)
    expect(levelled.info.proficiencyBonus).toBe(2)
    expect(levelled.info.class.hitDice.amount).toBe(2)
    expect(levelled.info.spells?.slots).toEqual({ 1: 3 })
    expect(levelled.feats.map((feat) => feat.id)).toEqual(['arcane_tradition'])
    expect(again.feats.map((feat) => feat.id)).toEqual(['arcane_tradition'])
  })

  it('leaves the character it was given untouched', () => {
    const character = getCharacter(3)
    const before = JSON.stringify(character)
    getLevelledCharacter(character, core, getLevelUp(character, core, wizard as CatalogEntry), [['con', 'con']])

    expect(JSON.stringify(character)).toBe(before)
  })
})

describe('getStartingCharacter', () => {
  it('fills the hit points, features, slots and proficiency a new character starts at its level with', () => {
    const started = getStartingCharacter(getCharacter(3), core, wizard as CatalogEntry)

    expect(started.info.hp).toMatchObject({ max: 20, current: 20 })
    expect(started.info.proficiencyBonus).toBe(2)
    expect(started.info.class.hitDice.amount).toBe(3)
    expect(started.info.spells?.slots).toEqual({ 1: 4, 2: 2 })
    expect(started.feats.map((feat) => feat.id)).toEqual(['spellcasting', 'arcane_recovery', 'arcane_tradition'])
  })

  it('starts a first level character at its full hit die', () => {
    expect(getStartingCharacter(getCharacter(1, 10), core, fighter as CatalogEntry).info.hp.max).toBe(12)
  })
})
