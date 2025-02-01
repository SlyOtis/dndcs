import type {Writable} from "svelte/store";

type Currency = 'cp' | 'sp' | 'gp' | 'pp'
type ItemType = 'weapon' | 'armor' | 'consumable' | 'tool' | 'container' | 'treasure' | 'misc'
type Rarity = 'common' | 'uncommon' | 'rare' | 'very rare' | 'legendary' | 'artifact'
type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12'

interface Value {
  amount: number
  currency: Currency
}

interface Damage {
  diceCount: number
  diceType: DiceType
  damageType: string
  bonus: number
}

interface Range {
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

interface Properties {
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

export interface CharacterAction {
  name: string
  type: string
  range: string
  toHit: string
  damage: string
  notes: string
  isWeapon?: boolean
  description?: string
}

export interface ActionCategory {
  title: string
  actions: CharacterAction[]
}

export interface CharacterSavingThrow {
  title: string
  modifier: number
  proficiency: number
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
  title: string
}

export interface CharacterSkill {
  name: string
  ability: string
  modifier: number
  proficiency: number
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
  effects: string[]
  level?: number | null
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
  race: RaceInfo
  class: ClassInfo
  spells: SpellsInfo
  conditions: ConditionInfo[]
  state: StateInfo
}

export interface Character {
  info: CharacterInfo
  feats: Feat[]
  abilities: CharacterAbility[]
  savingThrows: CharacterSavingThrow[]
  skills: CharacterSkill[]
  senses: CharacterSense[]
  actions: CharacterAction[]
  spells: CharacterSpell[]
  proficients: CharacterProficiency[]
  inventory: CharacterInventoryItem[]
}

export type CharacterStore = {
  [K in keyof Character]: Writable<Character[K]>
}