import type { Character, CharacterSkill, Proficiency } from '../character.types'
import { getResolvedCharacter } from './derive'
import type { CharacterSheet, ProficiencyTier, RuleSystem } from './spec.types'

const ATTRIBUTE_IDS: Record<string, string> = {
  strength: 'str',
  dexterity: 'dex',
  constitution: 'con',
  intelligence: 'int',
  wisdom: 'wis',
  charisma: 'cha'
}

export function getAttributeId(title: string): string {
  const key = title.trim().toLowerCase()
  return ATTRIBUTE_IDS[key] ?? key.replace(/[^a-z0-9]/g, '')
}

export function getSkillId(name: string): string {
  const words = name.trim().toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  if (words.length === 0) return ''
  return words[0] + words.slice(1).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join('')
}

export function getTierId(tiers: ProficiencyTier[], multiplier: Proficiency): string {
  const exact = tiers.find((tier) => tier.multiplier === multiplier)
  if (exact) return exact.id
  return tiers[0]?.id ?? 'none'
}

function getProficiencyMap(skills: CharacterSkill[], tiers: ProficiencyTier[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const skill of skills ?? []) {
    map[`skill.${getSkillId(skill.name)}`] = getTierId(tiers, skill.proficiency)
  }
  return map
}

export function getSheet(character: Character, system: RuleSystem): CharacterSheet {
  const tiers = system.proficiencyTiers
  const info = character.info

  const attributes: Record<string, number> = {}
  for (const ability of character.abilities ?? []) {
    attributes[getAttributeId(ability.title)] = ability.score
  }

  const proficiencies = getProficiencyMap(character.skills ?? [], tiers)
  for (const save of character.savingThrows ?? []) {
    proficiencies[`save.${getAttributeId(save.title)}`] = getTierId(tiers, save.proficiency)
  }

  const pools: Record<string, number> = {}
  if (info?.hp) pools.hitPoints = Math.max(0, info.hp.max - info.hp.current)
  if (info?.hp?.hitDiceSpent) pools.hitDice = info.hp.hitDiceSpent
  if (info?.slots) pools.spellSlots = info.slots.expended
  if (info?.inspiration === false) pools.inspiration = 1
  if (character.special) {
    pools[getSkillId(character.special.name)] = Math.max(0, character.special.max - character.special.current)
  }

  const base: CharacterSheet = {
    systems: [system.id],
    level: info?.level ?? 1,
    attributes,
    proficiencies,
    pools,
    bonuses: {}
  }

  const scope = getResolvedCharacter(system, base).scope
  const level = base.level
  const bonuses: Record<string, number> = {}

  if (info?.ac !== undefined) bonuses.armorClass = info.ac - 10 - (scope['mod.dex'] ?? 0)
  if (info?.hp?.max !== undefined) bonuses.hitPoints = info.hp.max - (scope['mod.con'] ?? 0) * level
  if (info?.initiative !== undefined) bonuses.initiative = info.initiative - (scope['mod.dex'] ?? 0)

  const speed = Number.parseInt(String(info?.speed ?? ''), 10)
  if (Number.isFinite(speed)) bonuses.speed = speed - 30

  if (info?.spells?.modifier) bonuses.spellcasting = scope[`mod.${getAttributeId(info.spells.modifier)}`] ?? 0

  return { ...base, bonuses }
}
