<script lang="ts">
</script>

<main>

</main>

<style>

</style>
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
  .character-sheet {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: system-ui, -apple-system, sans-serif;
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
    border: 2px solid #ccc;
    border-radius: 8px;
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
    color: #666;
  }

  .combat-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .stat-block {
    text-align: center;
    padding: 1rem;
    border: 2px solid #ccc;
    border-radius: 8px;
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
