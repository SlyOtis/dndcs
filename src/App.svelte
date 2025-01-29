<script lang="ts">
  let character = {
    name: "Lucky Lars",
    level: 4,
    class: "Maleish Custom Lineage Fighter",
    
    // Ability Scores and Modifiers
    abilities: {
      strength: { score: 11, modifier: 0 },
      dexterity: { score: 20, modifier: 5 },
      constitution: { score: 14, modifier: 2 },
      intelligence: { score: 10, modifier: 0 },
      wisdom: { score: 14, modifier: 2 },
      charisma: { score: 12, modifier: 1 }
    },
    
    // Combat Stats
    hp: {
      current: 36,
      max: 36
    },
    ac: 15,
    initiative: 5,
    speed: "30 ft.",
    
    proficiencyBonus: 2,
    
    // Saving Throws
    savingThrows: {
      strength: { modifier: 2, proficient: true },
      dexterity: { modifier: 5, proficient: false },
      constitution: { modifier: 4, proficient: true },
      intelligence: { modifier: 0, proficient: false },
      wisdom: { modifier: 2, proficient: false },
      charisma: { modifier: 1, proficient: false }
    },

    // Skills
    skills: [
      { name: "Acrobatics", ability: "DEX", modifier: 7, proficient: true },
      { name: "Animal Handling", ability: "WIS", modifier: 2, proficient: false },
      { name: "Arcana", ability: "INT", modifier: 0, proficient: false },
      { name: "Athletics", ability: "STR", modifier: 0, proficient: false },
      { name: "Deception", ability: "CHA", modifier: 1, proficient: false },
      { name: "History", ability: "INT", modifier: 0, proficient: false },
      { name: "Insight", ability: "WIS", modifier: 2, proficient: false },
      { name: "Intimidation", ability: "CHA", modifier: 1, proficient: false },
      { name: "Investigation", ability: "INT", modifier: 0, proficient: false },
      { name: "Medicine", ability: "WIS", modifier: 2, proficient: false },
      { name: "Nature", ability: "INT", modifier: 0, proficient: false },
      { name: "Perception", ability: "WIS", modifier: 2, proficient: false },
      { name: "Performance", ability: "CHA", modifier: 1, proficient: false },
      { name: "Persuasion", ability: "CHA", modifier: 3, proficient: true },
      { name: "Religion", ability: "INT", modifier: 0, proficient: false },
      { name: "Sleight of Hand", ability: "DEX", modifier: 5, proficient: false },
      { name: "Stealth", ability: "DEX", modifier: 7, proficient: true },
      { name: "Survival", ability: "WIS", modifier: 4, proficient: true }
    ],

    // Senses
    senses: {
      passivePerception: 12,
      passiveInvestigation: 10,
      passiveInsight: 12,
      darkvision: "60 ft."
    },

    // Actions
    actions: [
      {
        name: "Empty Promises",
        type: "Ranged Weapon",
        range: "30 (120)",
        toHit: "+9",
        damage: "1d6+5",
        notes: "Martial, Ammunition, Range, Light, Loading, Vex, Range (30/120)"
      },
      {
        name: "Little Tickle",
        type: "Ranged Weapon",
        range: "40 (120)",
        toHit: "+9",
        damage: "2d8+5",
        notes: "Firearms, Ammunition (Firearms), Range, Reload, Slip, Range (40/120)"
      },
      {
        name: "Vicious Revolver",
        type: "Ranged Weapon",
        range: "40 (120)",
        toHit: "+9",
        damage: "2d8+5",
        notes: "Firearms, Ammunition (Firearms), Range, Reload, Slip, Range (40/120)"
      }
    ],

    // Equipment
    equipment: {
      armor: ["Heavy Armor", "Light Armor", "Medium Armor", "Shields"],
      weapons: ["Firearms", "Martial Weapons", "Simple Weapons"],
      tools: ["Playing Card Set", "Thieves' Tools", "Tinker's Tools"],
      languages: ["Common", "Common Sign Language"]
    }
  };
</script>

<main class="character-sheet">
  <header class="character-header">
    <div class="character-name">
      <h1>{character.name}</h1>
      <div class="character-subtitle">
        Level {character.level} {character.class}
      </div>
    </div>
  </header>

  <div class="stats-container">
    <!-- Ability Scores -->
    <div class="ability-scores">
      {#each Object.entries(character.abilities) as [ability, {score, modifier}]}
        <div class="ability-score">
          <div class="ability-label">{ability.toUpperCase()}</div>
          <div class="ability-value">{score}</div>
          <div class="ability-modifier">{modifier >= 0 ? '+' : ''}{modifier}</div>
        </div>
      {/each}
    </div>

    <!-- Combat Stats -->
    <div class="combat-stats">
      <div class="stat-block">
        <label>HP</label>
        <div class="hp-container">
          <span>{character.hp.current}</span>
          <span>/</span>
          <span>{character.hp.max}</span>
        </div>
      </div>
      
      <div class="stat-block">
        <label>AC</label>
        <div>{character.ac}</div>
      </div>

      <div class="stat-block">
        <label>Initiative</label>
        <div>+{character.initiative}</div>
      </div>

      <div class="stat-block">
        <label>Speed</label>
        <div>{character.speed}</div>
      </div>
    </div>
  </div>

  <div class="character-sections">
    <!-- Saving Throws -->
    <div class="section saving-throws">
      <h2>Saving Throws</h2>
      <div class="saves-grid">
        {#each Object.entries(character.savingThrows) as [ability, {modifier, proficient}]}
          <div class="save-item">
            <span class="proficient-dot">{proficient ? '●' : '○'}</span>
            <span class="save-ability">{ability.toUpperCase()}</span>
            <span class="save-modifier">{modifier >= 0 ? '+' : ''}{modifier}</span>
          </div>
        {/each}
      </div>
    </div>

    <!-- Skills -->
    <div class="section skills">
      <h2>Skills</h2>
      <div class="skills-grid">
        {#each character.skills as skill}
          <div class="skill-item">
            <span class="proficient-dot">{skill.proficient ? '●' : '○'}</span>
            <span class="skill-ability">{skill.ability}</span>
            <span class="skill-name">{skill.name}</span>
            <span class="skill-modifier">{skill.modifier >= 0 ? '+' : ''}{skill.modifier}</span>
          </div>
        {/each}
      </div>
    </div>

    <!-- Senses -->
    <div class="section senses">
      <h2>Senses</h2>
      <div class="senses-grid">
        <div class="sense-item">
          <span>Passive Perception</span>
          <span>{character.senses.passivePerception}</span>
        </div>
        <div class="sense-item">
          <span>Passive Investigation</span>
          <span>{character.senses.passiveInvestigation}</span>
        </div>
        <div class="sense-item">
          <span>Passive Insight</span>
          <span>{character.senses.passiveInsight}</span>
        </div>
        <div class="sense-item">
          <span>Darkvision</span>
          <span>{character.senses.darkvision}</span>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="section actions">
      <h2>Actions</h2>
      <div class="actions-grid">
        {#each character.actions as action}
          <div class="action-item">
            <div class="action-header">
              <span class="action-name">{action.name}</span>
              <span class="action-type">{action.type}</span>
            </div>
            <div class="action-stats">
              <span>Range: {action.range}</span>
              <span>To Hit: {action.toHit}</span>
              <span>Damage: {action.damage}</span>
            </div>
            <div class="action-notes">{action.notes}</div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Equipment -->
    <div class="section equipment">
      <h2>Equipment</h2>
      <div class="equipment-grid">
        <div class="equipment-category">
          <h3>Armor</h3>
          <div class="equipment-list">
            {character.equipment.armor.join(', ')}
          </div>
        </div>
        <div class="equipment-category">
          <h3>Weapons</h3>
          <div class="equipment-list">
            {character.equipment.weapons.join(', ')}
          </div>
        </div>
        <div class="equipment-category">
          <h3>Tools</h3>
          <div class="equipment-list">
            {character.equipment.tools.join(', ')}
          </div>
        </div>
        <div class="equipment-category">
          <h3>Languages</h3>
          <div class="equipment-list">
            {character.equipment.languages.join(', ')}
          </div>
        </div>
      </div>
    </div>
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    background-color: #1a1a1a;
    color: #ffffff;
  }

  .character-sheet {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: system-ui, -apple-system, sans-serif;
    background-color: #2a2a2a;
  }

  .character-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .character-name h1 {
    margin: 0;
    font-size: 2rem;
  }

  .character-subtitle {
    color: #666;
  }

  .stats-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
  }

  .ability-scores {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 1rem;
  }

  .ability-score {
    text-align: center;
    padding: 1rem;
    border: 2px solid #c4a000;
    border-radius: 8px;
    background-color: #1a1a1a;
    position: relative;
    overflow: hidden;
  }

  .ability-score::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #c4a000, #ffd700, #c4a000);
  }

  .ability-label {
    font-weight: bold;
    font-size: 0.8rem;
  }

  .ability-value {
    font-size: 1.5rem;
    font-weight: bold;
    margin: 0.5rem 0;
  }

  .ability-modifier {
    font-size: 1.2rem;
    color: #ffd700;
    font-weight: bold;
  }

  .combat-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .stat-block {
    text-align: center;
    padding: 1rem;
    border: 2px solid #c4a000;
    border-radius: 8px;
    background-color: #1a1a1a;
    position: relative;
    overflow: hidden;
  }

  .stat-block::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #c4a000, #ffd700, #c4a000);
  }

  .stat-block label {
    font-weight: bold;
    font-size: 0.8rem;
    display: block;
    margin-bottom: 0.5rem;
  }

  .hp-container {
    font-size: 1.5rem;
    font-weight: bold;
  }

  .character-sections {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
  }

  .section {
    background-color: #1a1a1a;
    border: 2px solid #c4a000;
    border-radius: 8px;
    padding: 1rem;
    position: relative;
    overflow: hidden;
  }

  .section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #c4a000, #ffd700, #c4a000);
  }

  .section h2 {
    color: #ffd700;
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.2rem;
  }

  .saves-grid, .skills-grid {
    display: grid;
    gap: 0.5rem;
  }

  .save-item, .skill-item {
    display: grid;
    grid-template-columns: auto auto 1fr auto;
    align-items: center;
    gap: 0.5rem;
  }

  .proficient-dot {
    color: #ffd700;
    font-size: 1.2rem;
  }

  .save-ability, .skill-ability {
    color: #c4a000;
    font-weight: bold;
  }

  .save-modifier, .skill-modifier {
    color: #ffd700;
    justify-self: end;
  }

  .senses-grid {
    display: grid;
    gap: 0.5rem;
  }

  .sense-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .actions-grid {
    display: grid;
    gap: 1rem;
  }

  .action-item {
    border: 1px solid #c4a000;
    border-radius: 4px;
    padding: 0.5rem;
  }

  .action-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .action-name {
    color: #ffd700;
    font-weight: bold;
  }

  .action-type {
    color: #c4a000;
    font-size: 0.9rem;
  }

  .action-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .action-notes {
    font-size: 0.9rem;
    color: #999;
  }

  .equipment-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .equipment-category h3 {
    color: #c4a000;
    margin-top: 0;
    margin-bottom: 0.5rem;
    font-size: 1rem;
  }

  .equipment-list {
    padding: 0.5rem;
    border: 1px solid #333;
    border-radius: 4px;
    background-color: #1a1a1a;
    line-height: 1.4;
  }
</style>
