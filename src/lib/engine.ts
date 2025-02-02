import type {CharacterContext, CharacterStore, RollLog} from "./types";
import testCharacter from './character.test'
import {writable, type Unsubscriber, type Writable} from "svelte/store";
import type {Character, CharacterCurrency} from "./character.types";

const rollStore = writable<RollLog>(JSON.parse(localStorage.getItem('roll_log') || '[]'))
const sidebarStore = writable(JSON.parse(localStorage.getItem('sidebar') || 'true'))

export function getRollLog(): { rollStore: Writable<RollLog>, unsubscribe: Unsubscriber } {
  return {
    rollStore,
    unsubscribe: rollStore.subscribe(value => {
      localStorage.setItem('roll_log', JSON.stringify(value));
    })
  }
}


export function getSidebar() {
  return {
    sidebarStore,
    unsubscribeSidebar: sidebarStore.subscribe(value => {
      localStorage.setItem('sidebar', JSON.stringify(value))
    })
  }
}

export async function rollDie(die: number, amount: number) {
  const result = await fetch('https://www.random.org/integers/?format=plain&min=1&rnd=new&col=1&base=10&num=' + amount + '&max=' + die)
    .then(res => res.text());
  return Number(result);
}

export async function rollAbility(name: string, modifier: number) {
  const res = await rollDie(20, 1);
  writeRollLog('ability', `Rolled ${name} 1d20`, res, res + modifier);
}

export async function rollSkill(name: string, modifier: number, proficiency: number) {
  const res = await rollDie(20, 1);
  writeRollLog('skill', `Rolled ${name} 1d20`, res, res + modifier)
}

export async function rollInitiative(modifier: number) {
  const res = await rollDie(20, 1);
  writeRollLog('initiative', `Rolled Initiative 1d20`, res, res + modifier);
}

export async function rollSave(name: string, modifier: number, proficiency: number) {
  const res = await rollDie(20, 1);
  writeRollLog('save', `Rolled ${name} saving throw 1d20`, res, res + modifier);
}

export async function rollPassive(name: string, modifier: number) {
  const res = await rollDie(20, 1);
  writeRollLog('passive', `Rolled ${name} passive 1d20`, res, res + modifier);
}

export async function rollAttack(name: string, modifier: number) {
  const res = await rollDie(20, 1);
  writeRollLog('attack', `Rolled ${name} attack 1d20`, res, res + modifier);
}

export async function rollDamage(name: string, die: number, amount: number, bonus: number) {
  const res = await rollDie(die, amount);
  writeRollLog('damage', `Rolled ${name} damage ${amount}d${die}`, res, res + bonus);
}

export function writeRollLog(type: string, text: string, roll: number, total: number) {
  rollStore.update(state => {
    state.push({type, text, roll, total, rolledAt: Date()})
    return state
  })
}

function writeToCharacterStore(character: Character): Character {
  return character
  // const store = writable<Character>(character, (start) => {
  //   localStorage.setItem('character', JSON.stringify(start));
  // })

  // return store
}

export function asGold(currency: CharacterCurrency): number {
  const totalGP =
    (currency?.pp || 0) * 10 +    // Convert platinum to gold (1pp = 10gp)
    (currency?.gp || 0) +         // Gold pieces as is
    (currency?.sp || 0) * 0.1 +   // Convert silver to gold (1sp = 0.1gp)
    (currency?.cp || 0) * 0.01;   // Convert copper to gold (1cp = 0.01gp)

  return Number(totalGP.toFixed(3)); // Round to 2 decimal places
}

export function addCurrencies(currency: CharacterCurrency, currency2: CharacterCurrency): CharacterCurrency {
  return (Object.keys(currency2) as [curr: keyof CharacterCurrency]).reduce((prev, curr): CharacterCurrency => {
    return {
      ...prev,
      [curr]: (prev?.[curr] || 0) + (currency2?.[curr] || 0),
    }
  }, currency)
}

export function getCharacter(): Character {
  const character = localStorage.getItem('character')
  // TODO:: Redirect on missing character??
  if (character) {
    return writeToCharacterStore(JSON.parse(character) as Character)
  }

  return writeToCharacterStore(testCharacter)
}

export function getCharacterStore(): CharacterStore {
  const character = getCharacter()

  const {unsubscribe, ...rest} = Object.keys(character).reduce((prev: any, curr) => {
    let extProp: any = localStorage.getItem('ch_' + curr)
    if (extProp) {
      extProp = JSON.parse(extProp) as Character[keyof Character]
    }

    const prop = extProp || character[curr as keyof Character] as Character[keyof Character]
    const propStore = writable(prop)

    const unsubscribe = propStore.subscribe(state => {
      localStorage.setItem('ch_' + curr, JSON.stringify(state))
    })

    return {
      ...prev,
      [curr]: propStore,
      unsubscribe: [...prev.unsubscribe, unsubscribe]
    }
  }, {unsubscribe: []}) as CharacterContext & { unsubscribe: Unsubscriber[] }


  return {
    ...rest,
    unsubscribe: () => unsubscribe.forEach(unsub => unsub())
  }
}