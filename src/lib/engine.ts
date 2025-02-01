import type {Character, CharacterStore} from "./types";
import {writable} from "svelte/store";

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

export function writeRollLog(type: string, text: string, roll: number, total: number) {
  let log = localStorage.getItem('roll_log') || '[]'
  const logData = JSON.parse(log) as Array<{
    type: string,
    text: string,
    roll: number,
    total: number,
    rolledAt: string
  }>
  logData.push({type, text, roll, total, rolledAt: Date()})
  localStorage.setItem('roll_log', JSON.stringify(logData));
}

function writeToCharacterStore(character: Character): CharacterStore {
  return Object.keys(character).reduce((prev, curr) => {
    const prop = character[curr as keyof Character] as Character[keyof Character]
    return {
      ...prev,
      [curr]: writable<typeof prop>(prop),
    }
  }, {}) as CharacterStore
}

export function getCharacter(): CharacterStore {
  const character = localStorage.getItem('character')
  // TODO:: Redirect on missing character??
  if (character) {
    return writeToCharacterStore(JSON.parse(character) as Character)
  }

  return writeToCharacterStore({
    info: {
      name: "Lucky Lars",
      description: 'A fucking legend',
      gender: 'Male',
      imageUrl: 'https://d2qp0siotla746.cloudfront.net/img/use-cases/profile-picture/template_3.jpg',
      info: 'https://app.legendkeeper.com/a/worlds/cm1bx72zf0pg90jnf4a1ngvav/cm1i3rxox0014039b82idcchc/',
      conditions: [],
      level: 4,
      inspiration: false,
      hp: {
        current: 36,
        max: 36,
        temporary: 0,
      },
      ac: 15,
      initiative: 5,
      speed: '30 ft',
      proficiencyBonus: 2,
      race: {
        name: 'Human',
        type: "Custom linage",
      },
      class: {
        name: 'Gunslinger',
        hitDice: {
          amount: 1,
          die: 8
        }
      },
      spells: {
        modifier: 'wisdom',
        slots: {
          1: 3,
          2: 2,
          3: 0,
        }
      },
      state: {
        type: 'stable',
      }
    },
    feats: [
      {
        title: 'Bad Medicine',
      }
    ],
    abilities: [
      {id: 'STR', title: 'Strength', score: 11, modifier: 0},
      {id: 'DEX', title: 'Dexterity', score: 20, modifier: 5},
      {id: 'CON', title: 'Constitution', score: 14, modifier: 2},
      {id: 'INT', title: 'Intelligence', score: 10, modifier: 0},
      {id: 'WIS', title: 'Wisdom', score: 14, modifier: 2},
      {id: 'CHA', title: 'Charisma', score: 12, modifier: 1}
    ],
    savingThrows: [
      {title: 'Strength', modifier: 2, proficiency: 2},
      {title: 'Dexterity', modifier: 5, proficiency: 1},
      {title: 'Constitution', modifier: 4, proficiency: 2},
      {title: 'Intelligence', modifier: 0, proficiency: 1},
      {title: 'Wisdom', modifier: 2, proficiency: 1},
      {title: 'Charisma', modifier: 1, proficiency: 1}
    ],
    skills: [
      {name: "Acrobatics", ability: "DEX", modifier: 7, proficiency: 1},
      {name: "Animal Handling", ability: "WIS", modifier: 2, proficiency: 1},
      {name: "Arcana", ability: "INT", modifier: 0, proficiency: 2},
      {name: "Athletics", ability: "STR", modifier: 0, proficiency: 3},
      {name: "Deception", ability: "CHA", modifier: 1, proficiency: 2},
      {name: "History", ability: "INT", modifier: 0, proficiency: 1},
      {name: "Insight", ability: "WIS", modifier: 2, proficiency: 2},
      {name: "Intimidation", ability: "CHA", modifier: 1, proficiency: 1},
      {name: "Investigation", ability: "INT", modifier: 0, proficiency: 1},
      {name: "Medicine", ability: "WIS", modifier: 2, proficiency: 1},
      {name: "Nature", ability: "INT", modifier: 0, proficiency: 1},
      {name: "Perception", ability: "WIS", modifier: 2, proficiency: 1},
      {name: "Performance", ability: "CHA", modifier: 1, proficiency: 1},
      {name: "Persuasion", ability: "CHA", modifier: 3, proficiency: 2},
      {name: "Religion", ability: "INT", modifier: 0, proficiency: 1},
      {name: "Sleight of Hand", ability: "DEX", modifier: 5, proficiency: 1},
      {name: "Stealth", ability: "DEX", modifier: 7, proficiency: 2},
      {name: "Survival", ability: "WIS", modifier: 4, proficiency: 2}
    ],
    senses: [
      {title: 'Passive Perception', score: 12, condition: null},
      {title: 'Passive Investigation', score: 10, condition: null},
      {title: 'Passive insight', score: 12, condition: null},
      {title: 'Dark vision', score: '60 ft.', condition: 'When in an undead territory'},
    ],
    actions: [],
    spells: [],
    proficients: [
      {
        id: 'armor',
        title: 'Armor',
        value: ["Heavy Armor", "Light Armor", "Medium Armor", "Shields"]
      },
      {
        id: 'weapons',
        title: 'Weapons',
        value: ["Firearms", "Martial Weapons", "Simple Weapons"]
      },
      {
        id: 'tools',
        title: 'Tools',
        value: ["Playing Card Set", "Thieves' Tools", "Tinker's Tools"]
      },
      {
        id: 'languages',
        title: 'Languages',
        value: ["Common", "Common Sign Language"]
      }
    ],
    inventory: []
  })
}