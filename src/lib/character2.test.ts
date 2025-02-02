import type {Character} from "./types";

const character: Character = {
  info: {
    name: "Lucky Lars",
    description: "A tough and intimidating gunslinger who serves as an enforcer",
    gender: "Male",
    imageUrl: "https://i.pinimg.com/736x/b5/45/fa/b545fa7ec2cae918bf35c90247b47fc1--cowboy-cowboy-cowgirl.jpg",
    infoUrl: "https://app.legendkeeper.com/a/worlds/cm1bx72zf0pg90jnf4a1ngvav/cm1i3rxox0014039b82idcchc/",
    level: 4,
    inspiration: false,
    hp: {
      current: 34,
      max: 34,
      temporary: 0
    },
    ac: 15,
    initiative: 4,
    speed: "30 ft.",
    proficiencyBonus: 2,
    weight: 180,
    carry_capacity: 165,
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
    spells: {
      modifier: "none",
      slots: {}
    },
    slots: {
      amount: 2,
      title: "Grit Points",
      description: "What are grit points?",
      expended: 0,
    },
    conditions: [],
    defences: [],
    state: {
      type: "normal"
    }
  },
  spells: [],
  proficients: [
    {
      id: "weapons",
      title: "Weapon Proficiencies",
      value: ["Simple weapons", "Firearms", "Whips"]
    },
    {
      id: "armor",
      title: "Armor Proficiencies",
      value: ["Light armor"]
    },
    {
      id: "tools",
      title: "Tool Proficiencies",
      value: ["Gaming set", "Thieves' tools"]
    },
    {
      id: "languages",
      title: "Languages",
      value: ["Common"]
    }
  ],
  feats: [],
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
      modifier: 6,
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
      modifier: 3,
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
      score: 14
    },
    {
      title: "Darkvision",
      score: "60 ft"
    }
  ],
  actions: [
    {
      name: "Hand Cannon",
      description: "Ranged weapon attack with firearm",
      layout: "Attack",
      type: "Action",
      range: {
        normal: 60,
        max: 180
      },
      damage: [
        {
          amount: 1,
          dice: 8,
          type: "piercing",
          bonus: 4
        }
      ]
    },
    {
      name: "Buck Up",
      description: "Spend 1 grit point as a bonus action to spend Hit Dice to heal",
      layout: "Special",
      type: "Bonus"
    },
    {
      name: "Bullet Time",
      description: "Spend 1 grit point to impose disadvantage on ranged attack against you",
      layout: "Special",
      type: "Reaction"
    },
    {
      name: "Covering Fire",
      description: "While holding a firearm, spend 1 grit point as a reaction to impose disadvantage on an attack against another creature",
      layout: "Special",
      type: "Reaction"
    },
    {
      name: "Dodge Roll",
      description: "Spend 1 grit point as a bonus action to move 10 feet without provoking opportunity attacks",
      layout: "Special",
      type: "Bonus"
    }
  ],
  inventory: [
    {
      id: "hand-cannon",
      title: "Hand Cannon",
      type: "weapon",
      subtype: "firearm",
      rarity: "common",
      attunement: {
        required: false,
        attuned: false
      },
      value: {
        amount: 85,
        currency: "gp"
      },
      weight: 3,
      quantity: 1,
      attributes: ["ammunition", "loud", "reload"],
      description: "1d8 piercing, range 60/180 ft, reload (6 shots)",
      equippable: true,
      equipped: true
    },
    {
      id: "leather-armor",
      title: "Leather Armor",
      type: "armor",
      subtype: "light",
      rarity: "common",
      value: {
        amount: 10,
        currency: "gp"
      },
      weight: 10,
      quantity: 1,
      attributes: [],
      description: "11 + Dex modifier AC",
      equippable: true,
      equipped: true
    },
    {
      id: "ammunition",
      title: "Firearm Ammunition",
      type: "consumable",
      subtype: "ammunition",
      rarity: "common",
      value: {
        amount: 3,
        currency: "gp"
      },
      weight: 1,
      quantity: 20,
      attributes: [],
      description: "Bullets for firearms",
      equippable: false,
      equipped: false
    }
  ],
  currency: {
    cp: 0,
    sp: 0,
    gp: 25,
    pp: 0
  },
  background: {
    title: "Criminal Enforcer",
    description: "You made your living working for a criminal organization, using intimidation and force to collect debts and maintain order. Your experience has given you a keen eye for deception and a reputation for reliability in enforcing the will of your employers."
  }
}

export default character