<script lang="ts">
  import CharacterInfo from "./components/CharacterInfo.svelte";
  import Abilities from "./components/Abilities.svelte";
  import Stats from "./components/Stats.svelte";
  import SavingThrows from "./components/SavingThrows.svelte";
  import Skills from "./components/Skills.svelte";
  import Actions from "./components/Actions.svelte";
  import Senses from "./components/Senses.svelte";
  import Proficiencies from "./components/Proficiencies.svelte";
  import type {Character} from "./lib/types";

  const character: Character = {
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
      {name: "Acrobatics", ability: "DEX", modifier: 7, proficient: 1},
      {name: "Animal Handling", ability: "WIS", modifier: 2, proficient: 1},
      {name: "Arcana", ability: "INT", modifier: 0, proficient: 2},
      {name: "Athletics", ability: "STR", modifier: 0, proficient: 3},
      {name: "Deception", ability: "CHA", modifier: 1, proficient: 2},
      {name: "History", ability: "INT", modifier: 0, proficient: 1},
      {name: "Insight", ability: "WIS", modifier: 2, proficient: 2},
      {name: "Intimidation", ability: "CHA", modifier: 1, proficient: 1},
      {name: "Investigation", ability: "INT", modifier: 0, proficient: 1},
      {name: "Medicine", ability: "WIS", modifier: 2, proficient: 1},
      {name: "Nature", ability: "INT", modifier: 0, proficient: 1},
      {name: "Perception", ability: "WIS", modifier: 2, proficient: 1},
      {name: "Performance", ability: "CHA", modifier: 1, proficient: 1},
      {name: "Persuasion", ability: "CHA", modifier: 3, proficient: 2},
      {name: "Religion", ability: "INT", modifier: 0, proficient: 1},
      {name: "Sleight of Hand", ability: "DEX", modifier: 5, proficient: 1},
      {name: "Stealth", ability: "DEX", modifier: 7, proficient: 2},
      {name: "Survival", ability: "WIS", modifier: 4, proficient: 2}
    ],
    senses: [
      {title: 'Passive Perception', score: 12, condition: null},
      {title: 'Passive Investigation', score: 10, condition: null},
      {title: 'Passive insight', score: 12, condition: null},
      {title: 'Dark vision', score: '60 ft.', condition: 'When in an undead territory'},
    ],
    actions: [

    ],
    spells: [

    ],
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
  };
</script>

<header>
    <CharacterInfo bind:info={character.info}/>
</header>

<main>
    <Abilities bind:abilities={character.abilities}/>
    <Stats bind:info={character.info}/>
    <SavingThrows bind:savingThrows={character.savingThrows}/>
    <Skills/>
    <Actions/>
    <Senses/>
    <Proficiencies/>
</main>

<style>
    main {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        flex-wrap: wrap;
        gap: 16px;
    }

    header {
        position: relative;
        width: 100%;
        height: auto;
        display: flex;
    }
</style>
