import type {Writable} from "svelte/store";

type Currency = keyof CharacterCurrency
type ItemType = 'weapon' | 'armor' | 'consumable' | 'tool' | 'container' | 'treasure' | 'misc'
type Rarity = 'common' | 'uncommon' | 'rare' | 'very rare' | 'legendary' | 'artifact'


type ActionType = 'Action' | 'Bonus' | 'Reaction' | 'Other'
/**
 * Indicator for how to render the action, as Special text block, or an inline standard Attack/Heal/Spell action
 */
type ActionLayout = 'Attack' | 'Special'
type Proficiency = 0 | 0.5 | 1 | 2

export interface Value {
  amount: number
  currency: Currency
}

export interface Damage {
  amount: number
  dice: number
  type: string
  bonus: number
}

export interface Range {
  normal: number
  max: number
}

interface ArmorClass {
  base: number
  bonus: number
  dexModifier: boolean
  maxDexBonus: number
}

interface Requirements {
  strength?: number
  level?: number
  class?: string[]
  race?: string[]
}

interface Effect {
  type: string
  value: number | string
  duration: string
  condition: string
  target?: string
}

interface Charges {
  max: number
  current: number
  rechargeOn: string
}

interface Enchantment {
  name: string
  description: string
  type: 'passive' | 'active' | 'charge'
  charges?: Charges
  effects: Effect[]
}

interface Container {
  capacity: {
    weight: number
    items: number
  }
  contents: CharacterInventoryItem[]
}

export interface Properties {
  damage?: Damage
  range?: Range
  ac?: ArmorClass
}

interface Attunement {
  required: boolean
  attuned: boolean
}

interface CharacterInventoryItem {
  id: string
  title: string
  type: ItemType
  subtype?: string
  rarity: Rarity
  attributes: string[]
  description: string
  value: Value
  weight: number
  quantity: number
  equippable: boolean
  equipped: boolean
  attunement: Attunement
  properties?: Properties
  requirements?: Requirements
  enchantments?: Enchantment[]
  container?: Container
  customProperties?: Record<string, unknown>
}

export interface ActionRange {
  min: number
  max: number
}

export interface DamageSave {
  dc: number
  type: string
  onSuccess: string
}

export interface DamageAoe {
  type: string
  size: number
}

export interface CharacterAction {
  name: string
  description?: string
  layout: ActionLayout
  type: ActionType
  range?: Range
  damage?: Array<Damage>
  save?: DamageSave
  aoe?: DamageAoe
  toHit?: number
  properties?: Array<string>
  itemId?: string
  spellId?: string
  effects?: Effect[]
  usesSlots?: boolean
}

export interface CharacterSavingThrow {
  title: string
  modifier: number
  proficiency: Proficiency
}

export interface CharacterAbility {
  id: string
  title: string
  score: number
  modifier: number
}

export interface CharacterHitPoints {
  current: number
  max: number
  temporary: number
}

interface HitDice {
  amount: number
  die: number
}

interface RaceInfo {
  name: string
  type: string
}

interface ClassInfo {
  name: string
  hitDice: HitDice
}

interface Feat {
  id: string
  title: string
  description: string
}

export interface CharacterSkill {
  name: string
  ability: string
  modifier: number
  proficiency: Proficiency
}

export interface CharacterSense {
  title: string
  score: number | string
  condition?: null | string
}

export interface SpellsInfo {
  modifier: string
  slots: {
    [level: number]: number
  }
}

export interface CharacterSpell {
  title: string
  score: number | string
  condition?: null | string
}

export interface CharacterProficiency {
  id: string
  title: string
  value: string[]
}

export interface StateImage {
  overlay: boolean
  url: string
}

export interface ConditionInfo {
  title: string
  image?: StateImage
  effects?: string[]
  level?: number | null
}

export interface DefenceInfo {
  title: string
  image?: StateImage
  effects?: string[]
}

type StateDetail = {
  id: string
  description: string
  value: string | number | boolean | object
  duration?: number
  savingThrow?: {
    type: string
    dc: number
  }
  removeConditions?: {
    onDamage?: boolean
    onAction?: boolean
    onTurnEnd?: boolean
    onSave?: boolean
  }
}

interface StateInfo {
  type: string
  image?: StateImage
  source?: string
  startTime?: number
  duration?: number
  details?: StateDetail[]
  effects?: string[]
}

/**
 * Custom slots such as Grit Points, Sorcerer Points, and so on.
 */
export interface SlotsInfo {
  title: string
  description: string
  amount: number
  expended: number
  regainedAt?: string
}

export interface CharacterInfo {
  name: string
  description: string
  gender: string
  imageUrl: string
  info: string
  level: number
  inspiration: boolean
  hp: CharacterHitPoints
  ac: number
  initiative: number
  speed: string
  proficiencyBonus: number
  weight: number
  carry_capacity: number
  race: RaceInfo
  class: ClassInfo
  spells?: SpellsInfo
  slots?: SlotsInfo
  conditions: ConditionInfo[]
  defences: DefenceInfo[]
  state: StateInfo
}

export interface CharacterCurrency {
  gp?: number
  sp?: number
  cp?: number
  pp?: number
}

export interface Character {
  info: CharacterInfo
  feats: Feat[]
  abilities: CharacterAbility[]
  savingThrows: CharacterSavingThrow[]
  skills: CharacterSkill[] // All possible skills for the character
  senses: CharacterSense[] // All possible sense for the character, all passive abilities, darkvision and so on
  actions: CharacterAction[]
  spells: CharacterSpell[]
  proficients: CharacterProficiency[]
  inventory: CharacterInventoryItem[]
  currency: CharacterCurrency
}

export type CharacterStore = Writable<Character>

//
export type CharacterContext = {
  [K in keyof Character]: Writable<Character[K]>
}