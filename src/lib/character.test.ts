import type {Character} from "./types";

export default {
  "info": {
    "name": "Lucky Lars",
    "description": "A rugged enforcer with a keen eye and quick trigger finger",
    "gender": "Male",
    "imageUrl": "",
    "infoUrl": "Criminal enforcer turned adventurer",
    "level": 4,
    "inspiration": false,
    "hp": {
      "current": 34,
      "max": 34,
      "temporary": 0
    },
    "ac": 15,
    "initiative": 4,
    "speed": "30 ft",
    "proficiencyBonus": 2,
    "weight": 160,
    "carry_capacity": 165,
    "race": {
      "name": "Custom Lineage",
      "type": "Human Variant"
    },
    "class": {
      "name": "Gunslinger (Enforcer)",
      "hitDice": {
        "amount": 4,
        "die": 8
      }
    },
    "conditions": [],
    "defences": [],
    "state": {
      "type": "normal"
    }
  },
  "abilities": [
    {
      "id": "str",
      "title": "Strength",
      "score": 11,
      "modifier": 0
    },
    {
      "id": "dex",
      "title": "Dexterity",
      "score": 18,
      "modifier": 4
    },
    {
      "id": "con",
      "title": "Constitution",
      "score": 14,
      "modifier": 2
    },
    {
      "id": "int",
      "title": "Intelligence",
      "score": 10,
      "modifier": 0
    },
    {
      "id": "wis",
      "title": "Wisdom",
      "score": 14,
      "modifier": 2
    },
    {
      "id": "cha",
      "title": "Charisma",
      "score": 12,
      "modifier": 1
    }
  ],
  "savingThrows": [
    {
      "title": "Strength",
      "modifier": 0,
      "proficiency": 0
    },
    {
      "title": "Dexterity",
      "modifier": 6,
      "proficiency": 1
    },
    {
      "title": "Constitution",
      "modifier": 2,
      "proficiency": 0
    },
    {
      "title": "Intelligence",
      "modifier": 0,
      "proficiency": 0
    },
    {
      "title": "Wisdom",
      "modifier": 2,
      "proficiency": 0
    },
    {
      "title": "Charisma",
      "modifier": 3,
      "proficiency": 1
    }
  ],
  "skills": [
    {
      "name": "Deception",
      "ability": "CHA",
      "modifier": 3,
      "proficiency": 1
    },
    {
      "name": "Insight",
      "ability": "WIS",
      "modifier": 4,
      "proficiency": 1
    },
    {
      "name": "Intimidation",
      "ability": "CHA",
      "modifier": 3,
      "proficiency": 1
    },
    {
      "name": "Perception",
      "ability": "WIS",
      "modifier": 4,
      "proficiency": 1
    },
    {
      "name": "Sleight of Hand",
      "ability": "DEX",
      "modifier": 6,
      "proficiency": 1
    },
    {
      "name": "Stealth",
      "ability": "DEX",
      "modifier": 6,
      "proficiency": 1
    }
  ],
  "senses": [
    {
      "title": "Passive Perception",
      "score": 14
    },
    {
      "title": "Darkvision",
      "score": "60 feet"
    }
  ],
  "actions": [
    {
      "name": "Hand Cannon Attack",
      "layout": "Attack",
      "type": "Action",
      "range": {
        "normal": 60,
        "max": 180
      },
      "damage": [
        {
          "amount": 1,
          "dice": 8,
          "type": "piercing",
          "bonus": 4
        }
      ],
      "toHit": 6,
      "properties": ["ammunition", "kick (12)", "loud", "reload (6 shots)"]
    },
    {
      "name": "Buck Up",
      "description": "Spend 1 grit point to use Hit Dice as a bonus action",
      "layout": "Special",
      "type": "Bonus"
    },
    {
      "name": "Bullet Time",
      "description": "Spend 1 grit point to impose disadvantage on ranged attacks against you",
      "layout": "Special",
      "type": "Reaction"
    },
    {
      "name": "Covering Fire",
      "description": "Spend 1 grit point to impose disadvantage on attacks against allies",
      "layout": "Special",
      "type": "Reaction"
    },
    {
      "name": "Dodge Roll",
      "description": "Spend 1 grit point to move 10 feet without provoking opportunity attacks",
      "layout": "Special",
      "type": "Bonus"
    }
  ],
  "spells": [],
  "proficients": [
    {
      "id": "armor",
      "title": "Armor",
      "value": ["Light armor"]
    },
    {
      "id": "weapons",
      "title": "Weapons",
      "value": ["Simple weapons", "Firearms", "Whips"]
    },
    {
      "id": "tools",
      "title": "Tools",
      "value": ["Gaming set", "Thieves' tools"]
    },
    {
      "id": "languages",
      "title": "Languages",
      "value": ["Common"]
    }
  ],
  "inventory": [
    {
      "id": "hand-cannon",
      "title": "Hand Cannon",
      "type": "weapon",
      "subtype": "firearm",
      "rarity": "common",
      "attributes": ["ammunition", "kick (12)", "loud", "reload (6 shots)"],
      "description": "A powerful single-handed firearm",
      "value": {
        "amount": 85,
        "currency": "gp"
      },
      "weight": 3,
      "quantity": 1,
      "equippable": true,
      "equipped": true,
      "attunement": {
        "required": false,
        "attuned": false
      },
      "properties": {
        "damage": {
          "amount": 1,
          "dice": 8,
          "type": "piercing",
          "bonus": 0
        },
        "range": {
          "normal": 60,
          "max": 180
        }
      }
    },
    {
      "id": "leather-armor",
      "title": "Leather Armor",
      "type": "armor",
      "rarity": "common",
      "attributes": ["light"],
      "description": "Basic leather armor",
      "value": {
        "amount": 10,
        "currency": "gp"
      },
      "weight": 10,
      "quantity": 1,
      "equippable": true,
      "equipped": true,
      "attunement": {
        "required": false,
        "attuned": false
      },
      "properties": {
        "ac": {
          "base": 11,
          "bonus": 0,
          "dexModifier": true,
          "maxDexBonus": 999
        }
      }
    }
  ],
  "currency": {
    "cp": 0,
    "sp": 0,
    "gp": 15,
    "pp": 0
  },
  "background": {
    "title": "Criminal",
    "description": "You are an experienced criminal with a specific contact who acts as your liaison to a network of other criminals."
  },
  "feats": [
    {
      "id": "bully",
      "title": "Bully",
      "description": "No disadvantage on ranged attacks within 5 feet. Can push and knock prone creatures within 10 feet on hit (DC 14 STR save)."
    },
    {
      "id": "pistolero",
      "title": "Pistolero",
      "description": "Can make bonus action attack with pistol when attacking with one-handed weapon. Can act normally if surprised when attacking with pistol first."
    },
    {
      "id": "deadeye",
      "title": "Deadeye",
      "description": "Critical hit threshold reduces by 1 when hitting with ranged attacks."
    },
    {
      "id": "bad-medicine",
      "title": "Bad Medicine",
      "description": "Roll one additional weapon damage die for critical hits with firearms."
    },
    {
      "id": "quickdraw",
      "title": "Quickdraw",
      "description": "Advantage on initiative rolls. Can draw/stow multiple weapons as part of the same action."
    }
  ]
} as Character