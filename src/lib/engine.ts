import type {Character, CharacterCurrency, CharacterStore} from "./types";
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
  writeRollLog('attack', `Rolled ${name} attack ${amount}d${die}`, res, res + bonus);
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

  return writeToCharacterStore({
    info: {
      name: "Lucky Lars",
      description: "A tough enforcer with a keen eye and quick trigger finger",
      gender: "Male",
      imageUrl: "https://cdn.pixabay.com/photo/2018/11/10/18/00/chicken-3807161_1280.jpg",
      info: "Custom Lineage Human Gunslinger (Enforcer) 4",
      level: 4,
      inspiration: false,
      hp: {
        current: 34,
        max: 34,
        temporary: 0
      },
      ac: 15,
      initiative: 4,
      weight: 100,
      carry_capacity: 100,
      speed: "30 ft",
      proficiencyBonus: 2,
      race: {
        name: "Custom Lineage",
        type: "Humanoid"
      },
      class: {
        name: "Gunslinger",
        hitDice: {
          amount: 4,
          die: 8
        }
      },
      slots: {
        title: "Grit Points",
        description: "Spend to perform special actions. Regain on critical hits or rest.",
        amount: 3,
        expended: 0,
        regainedAt: "Critical hit or rest"
      },
      conditions: [],
      defences: [],
      state: {
        type: "Normal",
        effects: []
      }
    },
    feats: [
      {
        id: "bully",
        title: "Bully",
        description: "No disadvantage on ranged attacks within 5 feet. Can push and knock prone on hit."
      },
      {
        id: "pistolero",
        title: "Pistolero",
        description: "Bonus action attack with pistol when using one-handed weapon. Can act if surprised when using pistol first."
      }
    ],
    abilities: [
      {
        id: "str",
        title: "Strength",
        score: 11,
        modifier: 0
      },
      {
        id: "dex",
        title: "Dexterity",
        score: 18,
        modifier: 4
      },
      {
        id: "con",
        title: "Constitution",
        score: 14,
        modifier: 2
      },
      {
        id: "int",
        title: "Intelligence",
        score: 10,
        modifier: 0
      },
      {
        id: "wis",
        title: "Wisdom",
        score: 14,
        modifier: 2
      },
      {
        id: "cha",
        title: "Charisma",
        score: 12,
        modifier: 1
      }
    ],
    savingThrows: [
      {title: "Strength", modifier: 0, proficiency: 0},
      {title: "Dexterity", modifier: 6, proficiency: 1},
      {title: "Constitution", modifier: 2, proficiency: 0},
      {title: "Intelligence", modifier: 0, proficiency: 0},
      {title: "Wisdom", modifier: 2, proficiency: 0},
      {title: "Charisma", modifier: 3, proficiency: 1}
    ],
    skills: [
      {name: "Acrobatics", ability: "dex", modifier: 4, proficiency: 0},
      {name: "Animal Handling", ability: "wis", modifier: 2, proficiency: 0},
      {name: "Arcana", ability: "int", modifier: 0, proficiency: 0},
      {name: "Athletics", ability: "str", modifier: 0, proficiency: 0},
      {name: "Deception", ability: "cha", modifier: 3, proficiency: 1},
      {name: "History", ability: "int", modifier: 0, proficiency: 0},
      {name: "Insight", ability: "wis", modifier: 4, proficiency: 1},
      {name: "Intimidation", ability: "cha", modifier: 3, proficiency: 1},
      {name: "Investigation", ability: "int", modifier: 0, proficiency: 0},
      {name: "Medicine", ability: "wis", modifier: 2, proficiency: 0},
      {name: "Nature", ability: "int", modifier: 0, proficiency: 0},
      {name: "Perception", ability: "wis", modifier: 4, proficiency: 1},
      {name: "Performance", ability: "cha", modifier: 1, proficiency: 0},
      {name: "Persuasion", ability: "cha", modifier: 1, proficiency: 0},
      {name: "Religion", ability: "int", modifier: 0, proficiency: 0},
      {name: "Sleight of Hand", ability: "dex", modifier: 6, proficiency: 1},
      {name: "Stealth", ability: "dex", modifier: 6, proficiency: 1},
      {name: "Survival", ability: "wis", modifier: 2, proficiency: 0}
    ],
    senses: [
      {title: "Passive Perception", score: 14}, // 10 + Perception modifier (4)
      {title: "Passive Investigation", score: 10}, // 10 + Investigation modifier (0)
      {title: "Passive Insight", score: 14}, // 10 + Insight modifier (4)
      {title: "Passive Stealth", score: 16}, // 10 + Stealth modifier (6)
      {title: "Blindsight", score: 0},
      {title: "Darkvision", score: "60 ft"},
      {title: "Tremorsense", score: 0},
      {title: "Truesight", score: 0}
    ],
    actions: [
      {
        name: "Hand Cannon",
        type: "Action",
        layout: "Attack",
        range: {normal: 60, max: 180},
        toHit: 6,
        damage: [{
          amount: 1,
          dice: 8,
          type: "piercing",
          bonus: 4
        }],
        properties: ["ammunition", "kick (12)", "loud", "reload (6)"]
      },
      {
        name: "Buck Up",
        type: "Bonus",
        layout: "Special",
        description: "Spend 1 grit to use up to 2 Hit Dice to heal",
        usesSlots: true,
      },
      {
        name: "Dodge Roll",
        type: "Bonus",
        layout: "Special",
        description: "Spend 1 grit to move 10 feet without provoking opportunity attacks",
        usesSlots: true,
      },
      {
        name: "Covering Fire",
        type: "Reaction",
        layout: "Special",
        description: "Spend 1 grit to impose disadvantage on attack against ally within 60 feet",
        usesSlots: true,
      },
      {
        name: "Bullet Time",
        type: "Reaction",
        layout: "Special",
        description: "Spend 1 grit to impose disadvantage on ranged attack targeting you",
        usesSlots: true,
      }
    ],
    spells: [],
    proficients: [
      {
        id: "armor",
        title: "Armor",
        value: ["Light armor"]
      },
      {
        id: "weapons",
        title: "Weapons",
        value: ["Simple weapons", "Firearms", "Whips"]
      },
      {
        id: "tools",
        title: "Tools",
        value: ["Gaming set", "Thieves' tools"]
      }
    ],
    currency: {
      gp: 85,
      sp: 0,
      cp: 0,
      pp: 0
    },
    inventory: [
      {
        id: "hand-cannon",
        title: "Hand Cannon",
        type: "weapon",
        subtype: "firearm",
        rarity: "common",
        attributes: ["ammunition", "kick", "loud", "reload"],
        description: "A powerful pistol that packs a serious punch",
        value: {amount: 85, currency: "gp"},
        weight: 3,
        quantity: 1,
        equippable: true,
        equipped: true,
        attunement: {required: false, attuned: false},
        properties: {
          damage: {
            amount: 1,
            dice: 8,
            type: "piercing",
            bonus: 0
          },
          range: {
            normal: 60,
            max: 180
          }
        }
      },
      {
        id: "leather-armor",
        title: "Leather Armor",
        type: "armor",
        rarity: "common",
        attributes: ["light"],
        description: "A sturdy leather armor suit",
        value: {amount: 10, currency: "gp"},
        weight: 10,
        quantity: 1,
        equippable: true,
        equipped: true,
        attunement: {required: false, attuned: false},
        properties: {
          ac: {
            base: 11,
            bonus: 0,
            dexModifier: true,
            maxDexBonus: 999
          }
        }
      },
      {
        id: "ammunition",
        title: "Ammunition",
        type: "consumable",
        rarity: "common",
        attributes: [],
        description: "Rounds for firearms",
        value: {amount: 3, currency: "gp"},
        weight: 1,
        quantity: 20,
        equippable: false,
        equipped: false,
        attunement: {required: false, attuned: false}
      },
      {
        id: "explorers-pack",
        title: "Explorer's Pack",
        type: "container",
        rarity: "common",
        attributes: [],
        description: "Includes a backpack, bedroll, mess kit, tinderbox, 10 torches, 10 days of rations, and a waterskin",
        value: {amount: 10, currency: "gp"},
        weight: 59,
        quantity: 1,
        equippable: true,
        equipped: true,
        attunement: {required: false, attuned: false},
        container: {
          capacity: {
            weight: 100,
            items: 20
          },
          contents: []
        }
      },
      {
        id: "thieves-tools",
        title: "Thieves' Tools",
        type: "tool",
        rarity: "common",
        attributes: [],
        description: "A set of tools for picking locks and disarming traps",
        value: {amount: 25, currency: "gp"},
        weight: 1,
        quantity: 1,
        equippable: false,
        equipped: false,
        attunement: {required: false, attuned: false}
      },
      {
        id: "gaming-set",
        title: "Gaming Set",
        type: "tool",
        rarity: "common",
        attributes: [],
        description: "A set of dice or cards for gaming",
        value: {amount: 5, currency: "gp"},
        weight: 1,
        quantity: 1,
        equippable: false,
        equipped: false,
        attunement: {required: false, attuned: false}
      }
    ]
  })
}