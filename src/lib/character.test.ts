import type {Character} from "./character.types";

const character: Character = {
  info: {
    name: "Lucky Lars",
    description: "A tough and intimidating gunslinger who serves as an enforcer",
    gender: "Male",
    imageUrl: "https://i.pinimg.com/736x/b5/45/fa/b545fa7ec2cae918bf35c90247b47fc1--cowboy-cowboy-cowgirl.jpg",
    infoUrl: "https://app.legendkeeper.com/a/worlds/cm1bx72zf0pg90jnf4a1ngvav/cm1i3rxox0014039b82idcchc/",
    backgroundUrl: "https://www.youtube.com/watch?v=RfBgmw_xCVY",
    inspiration: false,
    level: 4,
    hp: {
      current: 34,
      max: 34,
      temporary: 0
    },
    ac: 15,
    initiative: 4,
    speed: "30 ft",
    proficiencyBonus: 2,
    weight: 0,
    carry_capacity: 165, // 11 STR x 15
    race: {
      name: "Custom Lineage",
      type: "Human"
    },
    class: {
      name: "Gunslinger",
      hitDice: {
        amount: 4,
        die: 8
      }
    },
    conditions: [],
    defences: [],
    state: {
      type: "Normal"
    }
  },
  spells: [],
  proficients: [
    {
      id: "armor",
      title: "Armor",
      value: ["Light Armor"]
    },
    {
      id: "weapons",
      title: "Weapons",
      value: ["Simple Weapons", "Firearms", "Whips"]
    },
    {
      id: "tools",
      title: "Tools",
      value: ["Thieves' Tools", "One Gaming Set"]
    },
    {
      id: "languages",
      title: "Languages",
      value: ["Common"]
    }
  ],
  feats: [
    {
      id: "deadeye",
      level: 1,
      source: "base",
      title: "Deadeye",
      description: "In combat, critical threshold reduces by 1 on hits. Resets on miss or end of turn without attack."
    },
    {
      id: "bad-medicine",
      level: 1,
      source: "base",
      title: "Bad Medicine",
      description: "Roll one additional weapon damage die when determining critical hit damage with firearms."
    },
    {
      id: "grit",
      level: 2,
      source: "base",
      title: "Grit",
      description: "3 grit points to fuel various features. Regain 1 point on critical hits or all points on rest."
    },
    {
      id: "quickdraw",
      level: 2,
      source: "base",
      title: "Quickdraw",
      description: "Advantage on initiative rolls. Can draw/stow any number of weapons as part of the same action."
    },
    {
      id: "bloodhound",
      level: 3,
      source: "subclass",
      title: "Bloodhound",
      description: "Gain proficiency in Insight. Double proficiency bonus for Insight checks on Humanoids."
    },
    {
      id: "double-tough",
      level: 3,
      source: "subclass",
      title: "Double Tough",
      description: "When regaining HP in combat, gain equal temporary HP until end of next turn."
    },
    {
      id: "unforgiven",
      level: 3,
      source: "subclass",
      title: "Unforgiven",
      description: "Extra damage die on first hit against creatures that attacked you since your last turn."
    },
    {
      id: "bully",
      level: 1,
      source: "optional",
      title: "Bully",
      description: "No disadvantage on ranged attacks within 5ft. Can push and prone targets within 10ft (DC 14 STR save)."
    },
    {
      id: "pistolero",
      level: 4,
      source: "optional",
      title: "Pistolero",
      description: "Bonus action attack with pistol when attacking with one-handed weapon. Can act normally if surprised when using pistol first."
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
    {
      title: "Strength",
      modifier: 0,
      proficiency: 0
    },
    {
      title: "Dexterity",
      modifier: 6, // +4 DEX, +2 proficiency
      proficiency: 1
    },
    {
      title: "Constitution",
      modifier: 2,
      proficiency: 0
    },
    {
      title: "Intelligence",
      modifier: 0,
      proficiency: 0
    },
    {
      title: "Wisdom",
      modifier: 2,
      proficiency: 0
    },
    {
      title: "Charisma",
      modifier: 3, // +1 CHA, +2 proficiency
      proficiency: 1
    }
  ],
  skills: [
    {
      name: "Acrobatics",
      ability: "Dexterity",
      modifier: 4,
      proficiency: 0
    },
    {
      name: "Animal Handling",
      ability: "Wisdom",
      modifier: 2,
      proficiency: 0
    },
    {
      name: "Arcana",
      ability: "Intelligence",
      modifier: 0,
      proficiency: 0
    },
    {
      name: "Athletics",
      ability: "Strength",
      modifier: 0,
      proficiency: 0
    },
    {
      name: "Deception",
      ability: "Charisma",
      modifier: 3,
      proficiency: 1
    },
    {
      name: "History",
      ability: "Intelligence",
      modifier: 0,
      proficiency: 0
    },
    {
      name: "Insight",
      ability: "Wisdom",
      modifier: 4,
      proficiency: 1
    },
    {
      name: "Intimidation",
      ability: "Charisma",
      modifier: 3,
      proficiency: 1
    },
    {
      name: "Investigation",
      ability: "Intelligence",
      modifier: 0,
      proficiency: 0
    },
    {
      name: "Medicine",
      ability: "Wisdom",
      modifier: 2,
      proficiency: 0
    },
    {
      name: "Nature",
      ability: "Intelligence",
      modifier: 0,
      proficiency: 0
    },
    {
      name: "Perception",
      ability: "Wisdom",
      modifier: 4,
      proficiency: 1
    },
    {
      name: "Performance",
      ability: "Charisma",
      modifier: 1,
      proficiency: 0
    },
    {
      name: "Persuasion",
      ability: "Charisma",
      modifier: 1,
      proficiency: 0
    },
    {
      name: "Religion",
      ability: "Intelligence",
      modifier: 0,
      proficiency: 0
    },
    {
      name: "Sleight of Hand",
      ability: "Dexterity",
      modifier: 6,
      proficiency: 1
    },
    {
      name: "Stealth",
      ability: "Dexterity",
      modifier: 6,
      proficiency: 1
    },
    {
      name: "Survival",
      ability: "Wisdom",
      modifier: 2,
      proficiency: 0
    }
  ],
  senses: [
    {
      title: "Passive Perception",
      score: 14 // 10 + 4 (proficiency)
    },
    {
      title: "Passive Investigation",
      score: 10 // 10 + 0 (no proficiency)
    },
    {
      title: "Passive Insight",
      score: 14 // 10 + 4 (proficiency)
    },
    {
      title: "Darkvision",
      score: "60 ft",
      condition: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light."
    }
  ],
  actions: [
    {
      name: "Hand Cannon Attack",
      layout: "Attack",
      type: "Action",
      range: { normal: 60, max: 180 },
      damage: [{
        amount: 1,
        dice: 8,
        type: "piercing",
        bonus: 4
      }],
      toHit: 6,
      properties: ["ammunition", "kick (12)", "loud", "reload (6)"]
    },
    {
      name: "Buck Up",
      description: "Spend Hit Dice to heal (max 2 dice)",
      layout: "Special",
      type: "Bonus",
    },
    {
      name: "Bullet Time",
      description: "Spend 1 grit to impose disadvantage on ranged attack against you",
      layout: "Special",
      type: "Other",
    },
    {
      name: "Covering Fire",
      description: "Spend 1 grit to impose disadvantage on attack against ally within 60ft",
      layout: "Special",
      type: "Reaction",
    },
    {
      name: "Dodge Roll",
      description: "Spend 1 grit to move 10ft without opportunity attacks",
      layout: "Special",
      type: "Bonus",
    },
    {
      name: "Pistolero Extra Attack",
      description: "When taking Attack action with one-handed weapon, bonus action attack with pistol",
      layout: "Special",
      type: "Bonus"
    },
    {
      name: "Bully Shove",
      description: "On hit with firearm within 10ft, force STR save (DC 14) or push 5ft and prone",
      layout: "Special",
      type: "Other"
    }
  ],
  inventory: [
    {
      id: "hand-cannon",
      title: "Hand Cannon",
      type: "weapon",
      subtype: "firearm",
      rarity: "common",
      attributes: ["ammunition", "kick", "loud", "reload"],
      description: "A heavy pistol that deals 1d8 piercing damage",
      value: { amount: 85, currency: "gp" },
      weight: 3,
      quantity: 1,
      equippable: true,
      equipped: true,
      properties: {
        damage: {
          amount: 1,
          dice: 8,
          type: "piercing",
          bonus: 4
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
      description: "Light armor made of leather",
      value: { amount: 10, currency: "gp" },
      weight: 10,
      quantity: 1,
      equippable: true,
      equipped: true,
      properties: {
        ac: {
          base: 11,
          bonus: 0,
          dexModifier: true,
          maxDexBonus: 0
        }
      }
    },
    {
      id: "ammunition",
      title: "Ammunition",
      type: "consumable",
      subtype: "rounds",
      rarity: "common",
      attributes: [],
      description: "Firearm ammunition",
      value: { amount: 3, currency: "gp" },
      weight: 1,
      quantity: 20,
      equippable: false,
      equipped: false
    },
    {
      id: "explorers-pack",
      title: "Explorer's Pack",
      type: "container",
      rarity: "common",
      attributes: [],
      description: "Includes a backpack, bedroll, mess kit, tinderbox, 10 torches, 10 days of rations, waterskin, 50 feet of hempen rope",
      value: { amount: 10, currency: "gp" },
      weight: 59,
      quantity: 1,
      equippable: false,
      equipped: false
    },
    {
      id: "thieves-tools",
      title: "Thieves' Tools",
      type: "tool",
      rarity: "common",
      attributes: [],
      description: "Set of tools for picking locks and disarming traps",
      value: { amount: 25, currency: "gp" },
      weight: 1,
      quantity: 1,
      equippable: false,
      equipped: false
    }
  ],
  currency: {
    cp: 0,
    sp: 0,
    gp: 31,
    pp: 0
  },
  background: {
    title: "Criminal",
    subTitle: "Enforcer",
    description: "As a ruthless enforcer, Lucky Lars made his name through intimidation and violence, working for various criminal organizations to collect debts and maintain order. His reputation for efficiency with a firearm preceded him in the underworld.",
    additional: [
      {
        title: "Criminal Contact",
        type: "feature",
        description: "You have reliable criminal contacts who can provide information about the local underworld."
      },
      {
        title: "Equipment",
        type: "equipment",
        description: "Dark common clothes with hood, gaming set, thieves' tools"
      },
      {
        title: "Specialty",
        type: "information",
        description: "Enforcer - You serve as muscle for thieves' guilds and criminal organizations"
      }
    ]
  }
}

export default character