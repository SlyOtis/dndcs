<script lang="ts">
  import type { LevelUpData } from '$lib/character.types';
  import type {CharacterContext} from '$lib/types';
  import {getContext} from 'svelte';
  import BaseDialog from './BaseDialog.svelte';
  import Button from '$components/ui/Button.svelte';
  import Ornament from '$components/ui/Ornament.svelte';

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


{#if levelUpData}
  <BaseDialog
    isOpen={isOpen}
    onClose={closeDialog}
    title="Level Up to {levelUpData.level}!"
    width="700px"
    maxWidth="95vw"
    maxHeight="90vh"
    zIndex={9999}
  >
    <div class="ledger">
      <section class="gains">
        <div class="gain">
          <span class="gain-label">Hit Die</span>
          <span class="gain-value">+1d{levelUpData.hitDiceGain.die}</span>
        </div>
        <div class="gain">
          <span class="gain-label">Proficiency Bonus</span>
          <span class="gain-value">+{levelUpData.proficiencyBonus}</span>
        </div>
      </section>

      {#if levelUpData.spellSlotChanges}
        <section class="ward">
          <h3 class="ward-title">
            <span class="ward-mark"><Ornament name="quatrefoil" size="xs" tone="metal" /></span>
            Spell Slot Progression
          </h3>
          <div class="slots">
            {#each Object.entries(levelUpData.spellSlotChanges) as [level, slots]}
              <div class="slot">
                <span class="slot-level">{level}{level === '1' ? 'st' : level === '2' ? 'nd' : level === '3' ? 'rd' : 'th'} Level</span>
                <span class="slot-count">{slots} slots</span>
              </div>
            {/each}
          </div>
        </section>
      {/if}

      {#if levelUpData.newFeatures.length > 0}
        <section class="ward ward-boon">
          <h3 class="ward-title">
            <span class="ward-mark"><Ornament name="rosette" size="xs" tone="verdigris" /></span>
            New Features Gained
          </h3>
          <ul class="boons">
            {#each levelUpData.newFeatures as feature}
              <li class="boon">
                <strong class="boon-name">{feature.title}</strong>
                <p class="boon-note">{feature.description}</p>
              </li>
            {/each}
          </ul>
        </section>
      {/if}

      {#if levelUpData.choices.length > 0}
        <section class="ward">
          <h3 class="ward-title">
            <span class="ward-mark"><Ornament name="rune" size="xs" tone="metal" /></span>
            Make Your Choices
          </h3>

          {#each levelUpData.choices as choice, choiceIndex}
            <div class="choice">
              <div class="choice-head">
                <h4 class="choice-title">{choice.title}</h4>
                <span class="choice-count">
                  {selections[`choice_${choiceIndex}`]?.length || 0} / {choice.maxSelections}
                </span>
              </div>
              <p class="choice-note">{choice.description}</p>

              <div class="options">
                {#each choice.options as option}
                  <button
                    type="button"
                    class="option"
                    class:option-lit={isOptionSelected(choiceIndex, option)}
                    aria-pressed={isOptionSelected(choiceIndex, option)}
                    disabled={!canSelectMore(choiceIndex) && !isOptionSelected(choiceIndex, option)}
                    onclick={() => handleChoiceSelection(choiceIndex, option, !isOptionSelected(choiceIndex, option))}
                  >
                    <span class="option-mark" aria-hidden="true"></span>
                    <span class="option-text">{option}</span>
                  </button>
                {/each}
              </div>
            </div>
          {/each}
        </section>
      {/if}

      {#if errors.length > 0}
        <section class="ward ward-bane" role="alert">
          <h3 class="ward-title">Please complete the following</h3>
          <ul class="banes">
            {#each errors as error}
              <li>{error}</li>
            {/each}
          </ul>
        </section>
      {/if}

      <span class="key">
        <Ornament name="divider" tone="metal" />
      </span>

      <footer class="actions">
        <Button variant="ghost" onclick={closeDialog}>Cancel</Button>
        <Button variant="primary" onclick={confirmLevelUp}>Level Up!</Button>
      </footer>
    </div>
  </BaseDialog>
{/if}

<style>
  .ledger {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    padding: var(--space-5) var(--space-6) var(--space-6);
  }

  .gains {
    display: flex;
    gap: var(--space-6);
    justify-content: center;
    padding: var(--space-4);
    background: linear-gradient(180deg, var(--ground-deep) 0%, var(--ground) 100%);
    border: var(--border-hair) solid var(--metal-dim);
    border-radius: var(--radius-md);
    box-shadow: inset 0 2px 6px var(--shade-hard);
  }

  .gain {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-1);
  }

  .gain-label {
    font-family: var(--font-display);
    font-size: var(--text-xs);
    font-weight: 600;
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
    color: var(--metal);
  }

  .gain-value {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    font-weight: 700;
    color: var(--ink);
  }

  .ward {
    --ward-rim: var(--metal-dim);
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-4);
    background:
      var(--texture-weave),
      linear-gradient(180deg, var(--ground-raised) 0%, var(--ground) 100%);
    border: var(--border-hair) solid var(--ward-rim);
    border-radius: var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-sm);
    box-shadow: inset 0 1px 0 var(--metal-edge);
  }

  .ward-title {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-md);
    font-weight: 700;
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
    color: var(--metal-bright);
  }

  .ward-mark {
    display: flex;
    flex: none;
  }

  .ward-boon {
    --ward-rim: var(--verdigris-dim);
  }

  .ward-boon .ward-title {
    color: var(--verdigris);
  }

  .ward-bane {
    --ward-rim: var(--state-bad);
  }

  .ward-bane .ward-title {
    color: var(--state-bad);
  }

  .slots {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: var(--space-2);
  }

  .slot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    background: linear-gradient(180deg, var(--ground-deep) 0%, var(--ground) 100%);
    border: var(--border-hair) solid var(--metal-dim);
    border-radius: var(--radius-sm);
  }

  .slot-level {
    font-size: var(--text-xs);
    color: var(--ink-dim);
  }

  .slot-count {
    font-family: var(--font-display);
    font-weight: 700;
    color: var(--metal);
  }

  .boons {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .boon {
    padding: var(--space-3);
    background: linear-gradient(180deg, var(--ground-lift) 0%, var(--ground-raised) 100%);
    border: var(--border-hair) solid var(--verdigris-dim);
    border-radius: var(--radius-sm);
  }

  .boon-name {
    display: block;
    margin-bottom: var(--space-1);
    font-family: var(--font-display);
    letter-spacing: var(--tracking-wide);
    color: var(--ink);
  }

  .boon-note {
    margin: 0;
    color: var(--ink-dim);
    font-size: var(--text-sm);
    line-height: 1.4;
  }

  .choice {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-3);
    background: linear-gradient(180deg, var(--ground-deep) 0%, var(--ground) 100%);
    border: var(--border-hair) solid var(--metal-dim);
    border-radius: var(--radius-md);
  }

  .choice-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-3);
  }

  .choice-title {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-sm);
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
    color: var(--ink);
  }

  .choice-count {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--metal);
  }

  .choice-note {
    margin: 0;
    color: var(--ink-dim);
    font-style: italic;
    font-size: var(--text-xs);
  }

  .options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--space-2);
  }

  .option {
    --option-rim: var(--metal-dim);
    --option-light: transparent;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3);
    background: linear-gradient(180deg, var(--ground-lift) 0%, var(--ground-raised) 100%);
    border: var(--border-hair) solid var(--option-rim);
    border-radius: var(--radius-md) var(--radius-sm) var(--radius-sm) var(--radius-md);
    color: var(--ink);
    text-align: left;
    cursor: pointer;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .option:hover:not(:disabled) {
    --option-rim: var(--metal);
    --option-light: var(--metal);
  }

  .option-lit {
    --option-rim: var(--metal);
    --option-light: var(--ember);
    box-shadow: inset 0 0 20px -8px var(--ember-glow);
  }

  .option:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  .option:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .option-mark {
    flex: none;
    width: 9px;
    height: 9px;
    transform: rotate(45deg);
    background: var(--option-light);
    border: var(--border-hair) solid var(--metal-dim);
    box-shadow: 0 0 8px var(--option-light);
    transition: background 0.15s ease;
  }

  .option-text {
    flex: 1;
    font-size: var(--text-sm);
  }

  .banes {
    margin: 0;
    padding-inline-start: var(--space-5);
    color: var(--state-bad);
    font-size: var(--text-sm);
  }

  .key {
    display: block;
    width: 220px;
    margin: 0 auto;
    opacity: 0.75;
    pointer-events: none;
  }

  .actions {
    display: flex;
    gap: var(--space-3);
    justify-content: flex-end;
  }

  @media (max-width: 640px) {
    .ledger {
      padding: var(--space-4);
    }

    .gains {
      flex-direction: column;
      gap: var(--space-3);
    }

    .options {
      grid-template-columns: 1fr;
    }

    .actions {
      flex-direction: column;
    }
  }
</style>
