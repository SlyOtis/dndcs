<script lang="ts">
  import type { LevelUpData, LevelUpChoice } from '$lib/character.types';
  import type {CharacterContext} from '$lib/types';
  import {getContext} from 'svelte';

  let { isOpen = $bindable(false), levelUpData = $bindable(), onComplete }: {
    isOpen: boolean;
    levelUpData?: LevelUpData;
    onComplete?: () => void;
  } = $props();
  
  const {info, abilities} = getContext<CharacterContext>('character');

  let selections = $state<Record<string, string[]>>({});
  let errors = $state<string[]>([]);

  function closeDialog() {
    isOpen = false;
    selections = {};
    errors = [];
    onComplete?.();
  }
  
  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeDialog();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeDialog();
    }
  }

  function handleChoiceSelection(choiceIndex: number, option: string, isSelected: boolean) {
    const choice = levelUpData?.choices[choiceIndex];
    if (!choice) return;

    const choiceKey = `choice_${choiceIndex}`;
    
    if (!selections[choiceKey]) {
      selections[choiceKey] = [];
    }

    if (isSelected) {
      if (selections[choiceKey].length < choice.maxSelections) {
        selections[choiceKey] = [...selections[choiceKey], option];
      }
    } else {
      selections[choiceKey] = selections[choiceKey].filter(s => s !== option);
    }
  }

  function validateSelections(): boolean {
    errors = [];
    
    if (!levelUpData) return false;

    for (let i = 0; i < levelUpData.choices.length; i++) {
      const choice = levelUpData.choices[i];
      const choiceKey = `choice_${i}`;
      const selected = selections[choiceKey] || [];

      if (selected.length < choice.maxSelections) {
        errors.push(`${choice.title}: Please select ${choice.maxSelections} option(s)`);
      }
    }

    return errors.length === 0;
  }

  function confirmLevelUp() {
    if (!validateSelections()) {
      return;
    }

    if (!levelUpData) return;

    // Apply level up changes to character
    console.log('Level up confirmed:', {
      level: levelUpData.level,
      selections
    });
    
    // Update character level
    $info.level = levelUpData.level;
    
    // Update proficiency bonus
    $info.proficiencyBonus = levelUpData.proficiencyBonus;
    
    // Close dialog immediately
    closeDialog();
    
    // Trigger level up celebration
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('playLevelUp'));
      window.dispatchEvent(new CustomEvent('showFunnyText', {
        detail: { text: `Level ${levelUpData.level} achieved! Glory awaits!`, category: 'levelUp' }
      }));
      // Trigger super extravagant level up animation
      window.dispatchEvent(new CustomEvent('showLevelUpAnimation', {
        detail: { level: levelUpData.level }
      }));
    }
    
    // Add hit points (for now, add the average + CON modifier)
    const conModifier = Math.floor(($abilities.find((a) => a.title === 'Constitution')?.score || 10) - 10) / 2;
    const hitPointGain = Math.floor(levelUpData.hitDiceGain.die / 2) + 1 + Math.floor(conModifier);
    $info.hp.max += hitPointGain;
    $info.hp.current += hitPointGain;
    
    // Process ability score improvements from selections
    for (const [choiceKey, selectedOptions] of Object.entries(selections)) {
      const choiceIndex = parseInt(choiceKey.replace('choice_', ''));
      const choice = levelUpData.choices[choiceIndex];
      
      if (choice && choice.type === 'abilityScore') {
        for (const option of selectedOptions) {
          if (option.includes('+2')) {
            const abilityName = option.split(' +2')[0];
            const ability = $abilities.find((a) => a.title === abilityName);
            if (ability) {
              ability.score = Math.min(20, ability.score + 2);
              ability.modifier = Math.floor((ability.score - 10) / 2);
            }
          } else if (option === 'Two different abilities +1 each') {
            // For simplicity, we'll prompt for this later
            console.log('Two ability +1 selected - would need additional UI');
          }
        }
      }
    }
    
    // Add new features to character (this would need a proper feat/feature system)
    // For now, just log them
    if (levelUpData.newFeatures.length > 0) {
      console.log('New features gained:', levelUpData.newFeatures);
    }
    
    // Save character data to localStorage
    localStorage.setItem('character_data', JSON.stringify($info));
  }

  function isOptionSelected(choiceIndex: number, option: string): boolean {
    const choiceKey = `choice_${choiceIndex}`;
    return selections[choiceKey]?.includes(option) || false;
  }

  function canSelectMore(choiceIndex: number): boolean {
    const choice = levelUpData?.choices[choiceIndex];
    if (!choice) return false;
    
    const choiceKey = `choice_${choiceIndex}`;
    const selected = selections[choiceKey] || [];
    return selected.length < choice.maxSelections;
  }
</script>

{#if isOpen && levelUpData}
  <div class="backdrop" onclick={handleBackdropClick} onkeydown={handleKeydown} role="dialog" aria-modal="true" tabindex="-1">
    <div class="dialog">
      <div class="header">
        <h2>Level Up to {levelUpData.level}!</h2>
        <button class="close-btn" onclick={closeDialog} aria-label="Close dialog">×</button>
      </div>
      
      <div class="content">
        <div class="level-info">
          <div class="stat-gains">
            <div class="stat-item">
              <span class="label">Hit Die:</span>
              <span class="value">+1d{levelUpData.hitDiceGain.die}</span>
            </div>
            <div class="stat-item">
              <span class="label">Proficiency Bonus:</span>
              <span class="value">+{levelUpData.proficiencyBonus}</span>
            </div>
          </div>

          {#if levelUpData.spellSlotChanges}
            <div class="spell-slots">
              <h4>Spell Slot Progression:</h4>
              <div class="spell-slot-grid">
                {#each Object.entries(levelUpData.spellSlotChanges) as [level, slots]}
                  <div class="spell-slot-item">
                    <span class="slot-level">{level}{level === '1' ? 'st' : level === '2' ? 'nd' : level === '3' ? 'rd' : 'th'} Level:</span>
                    <span class="slot-count">{slots} slots</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          {#if levelUpData.newFeatures.length > 0}
            <div class="new-features">
              <h3>New Features Gained:</h3>
              <ul>
                {#each levelUpData.newFeatures as feature}
                  <li>
                    <strong>{feature.title}</strong>
                    <p>{feature.description}</p>
                  </li>
                {/each}
              </ul>
            </div>
          {/if}
        </div>

        {#if levelUpData.choices.length > 0}
          <div class="choices-section">
            <h3>Make Your Choices:</h3>
            
            {#each levelUpData.choices as choice, choiceIndex}
              <div class="choice-group">
                <div class="choice-header">
                  <h4>{choice.title}</h4>
                  <span class="selection-count">
                    {selections[`choice_${choiceIndex}`]?.length || 0} / {choice.maxSelections}
                  </span>
                </div>
                <p class="choice-description">{choice.description}</p>
                
                <div class="options-grid">
                  {#each choice.options as option}
                    <button
                      class="option-button"
                      class:selected={isOptionSelected(choiceIndex, option)}
                      class:disabled={!canSelectMore(choiceIndex) && !isOptionSelected(choiceIndex, option)}
                      onclick={() => handleChoiceSelection(choiceIndex, option, !isOptionSelected(choiceIndex, option))}
                    >
                      <span class="option-check">
                        {isOptionSelected(choiceIndex, option) ? '✓' : '○'}
                      </span>
                      <span class="option-text">{option}</span>
                    </button>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        {/if}

        {#if errors.length > 0}
          <div class="errors">
            <h4>Please complete the following:</h4>
            <ul>
              {#each errors as error}
                <li>{error}</li>
              {/each}
            </ul>
          </div>
        {/if}

        <div class="actions">
          <button class="cancel-btn" onclick={closeDialog}>Cancel</button>
          <button class="confirm-btn" onclick={confirmLevelUp}>Level Up!</button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--shade-hard);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    backdrop-filter: blur(5px);
  }

  .dialog {
    background: linear-gradient(145deg, var(--ground-raised), var(--ground-deep));
    border: 2px solid var(--metal);
    border-radius: 20px;
    max-width: 700px;
    max-height: 90vh;
    width: 95%;
    overflow: hidden;
    box-shadow: 
      0 25px 50px var(--shade-hard),
      inset 0 1px 0 var(--sheen-soft);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem;
    border-bottom: 1px solid color-mix(in srgb, var(--metal) 32%, transparent);
    background: linear-gradient(90deg, color-mix(in srgb, var(--metal) 12%, transparent), transparent);
  }

  .header h2 {
    margin: 0;
    color: var(--metal);
    font-size: 1.8rem;
    font-weight: 700;
    text-shadow: 0 2px 4px var(--shade);
  }

  .close-btn {
    background: none;
    border: none;
    color: var(--metal);
    font-size: 2rem;
    cursor: pointer;
    padding: 0;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .close-btn:hover {
    background: color-mix(in srgb, var(--metal) 22%, transparent);
    transform: scale(1.1);
  }

  .content {
    padding: 2rem;
    overflow-y: auto;
    max-height: calc(90vh - 120px);
  }

  .level-info {
    margin-bottom: 2rem;
  }

  .stat-gains {
    display: flex;
    gap: 2rem;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: var(--shade-soft);
    border-radius: 8px;
    border: 1px solid var(--sheen-soft);
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .stat-item .label {
    font-size: 0.9rem;
    color: var(--ink-dim);
  }

  .stat-item .value {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--metal);
  }

  .new-features {
    background: var(--shade-soft);
    border-radius: 8px;
    padding: 1.5rem;
    border: 1px solid color-mix(in srgb, var(--state-good) 26%, transparent);
  }

  .new-features h3 {
    margin: 0 0 1rem 0;
    color: var(--state-good);
    font-size: 1.2rem;
  }

  .new-features ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .new-features li {
    margin-bottom: 1rem;
    padding: 1rem;
    background: color-mix(in srgb, var(--state-good) 26%, transparent);
    border-radius: 6px;
    border: var(--border-hair) solid color-mix(in srgb, var(--state-good) 50%, transparent);
  }

  .new-features li:last-child {
    margin-bottom: 0;
  }

  .new-features strong {
    color: var(--ink);
    display: block;
    margin-bottom: 0.5rem;
  }

  .new-features p {
    margin: 0;
    color: var(--ink-dim);
    font-size: 0.9rem;
    line-height: 1.4;
  }

  .choices-section {
    margin-bottom: 2rem;
  }

  .choices-section > h3 {
    margin: 0 0 1.5rem 0;
    color: var(--metal);
    font-size: 1.3rem;
  }

  .choice-group {
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: var(--shade-soft);
    border-radius: 12px;
    border: 1px solid var(--sheen-soft);
  }

  .choice-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .choice-header h4 {
    margin: 0;
    color: var(--ink);
    font-size: 1.1rem;
  }

  .selection-count {
    color: var(--metal);
    font-weight: 600;
    font-size: 0.9rem;
  }

  .choice-description {
    margin: 0 0 1.5rem 0;
    color: var(--ink-dim);
    font-style: italic;
    font-size: 0.9rem;
  }

  .options-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.5rem;
  }

  .option-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: var(--ground-lift);
    border: 2px solid var(--sheen-soft);
    border-radius: 8px;
    color: var(--ink);
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
  }

  .option-button:hover:not(.disabled) {
    border-color: var(--metal);
    background: color-mix(in srgb, var(--metal) 12%, transparent);
  }

  .option-button.selected {
    border-color: var(--metal);
    background: color-mix(in srgb, var(--metal) 22%, transparent);
  }

  .option-button.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .option-check {
    color: var(--metal);
    font-weight: 600;
    font-size: 1.1rem;
  }

  .option-text {
    flex: 1;
    font-size: 0.9rem;
  }

  .errors {
    background: color-mix(in srgb, var(--state-bad) 32%, transparent);
    border: 1px solid color-mix(in srgb, var(--state-bad) 32%, transparent);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 2rem;
  }

  .errors h4 {
    margin: 0 0 0.5rem 0;
    color: var(--state-bad);
    font-size: 1rem;
  }

  .errors ul {
    margin: 0;
    padding-left: 1.5rem;
  }

  .errors li {
    color: var(--state-bad);
    font-size: 0.9rem;
    margin-bottom: 0.25rem;
  }

  .spell-slots {
    background: var(--shade-soft);
    border-radius: 8px;
    padding: 1rem;
    border: 1px solid var(--sheen-soft);
    margin-bottom: 1.5rem;
  }

  .spell-slots h4 {
    margin: 0 0 0.75rem 0;
    color: var(--metal);
    font-size: 1.1rem;
  }

  .spell-slot-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.75rem;
  }

  .spell-slot-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    background: var(--sheen-soft);
    border-radius: 4px;
    border: 1px solid color-mix(in srgb, var(--metal) 22%, transparent);
  }

  .slot-level {
    font-size: 0.85rem;
    color: var(--ink-dim);
  }

  .slot-count {
    font-weight: 600;
    color: var(--metal);
  }

  .actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    padding-top: 1rem;
    border-top: 1px solid var(--sheen-soft);
  }

  .cancel-btn,
  .confirm-btn {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
  }

  .cancel-btn {
    background: var(--ground-lift);
    color: var(--ink);
    border: 1px solid var(--sheen-strong);
  }

  .cancel-btn:hover {
    background: var(--ground-lift);
  }

  .confirm-btn {
    background: linear-gradient(45deg, var(--ember), var(--ember));
    color: white;
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .confirm-btn:hover {
    background: linear-gradient(45deg, var(--ember), var(--ember));
    transform: translateY(-2px);
    box-shadow: 0 8px 25px var(--ember-glow);
  }

  @media (max-width: 640px) {
    .dialog {
      width: 95%;
      max-height: 95vh;
    }
    
    .header {
      padding: 1rem;
    }
    
    .content {
      padding: 1rem;
    }
    
    .stat-gains {
      flex-direction: column;
      gap: 1rem;
    }
    
    .options-grid {
      grid-template-columns: 1fr;
    }
    
    .actions {
      flex-direction: column;
    }
  }
</style>
