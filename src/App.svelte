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
    
    proficiencyBonus: 2
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
</style>
