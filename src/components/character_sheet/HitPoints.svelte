<script lang="ts">

  import type {CharacterHitPoints} from "$lib/character.types";

  let {hp = $bindable()}: { hp: CharacterHitPoints } = $props()

  function updateCurrent(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value) || 0;
    const oldValue = hp.current;
    hp.current = Math.max(0, value);
    
    // Trigger healing sound and text if HP increased
    if (value > oldValue && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('playHealSpell'));
      window.dispatchEvent(new CustomEvent('showFunnyText', {
        detail: { text: 'Health restored!', category: 'healing' }
      }));
    }
  }

  function updateMax(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value) || 0;
    hp.max = Math.max(1, value);
  }

  function updateTemporary(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value) || 0;
    hp.temporary = Math.max(0, value);
  }

</script>

<div class="root primary-border">
    <div class="title">Hit Points</div>
    <div class="health-row">
        <div class="points">
            <span>Current</span>
            <input 
                type="number" 
                class="value-input" 
                value={hp.current} 
                oninput={updateCurrent}
                min="0"
            />
        </div>
        <span class="divider">/</span>
        <div class="points">
            <span>Max</span>
            <input 
                type="number" 
                class="value-input" 
                value={hp.max} 
                oninput={updateMax}
                min="1"
            />
        </div>
        <div class="points temp-section">
            <span>Temp</span>
            <input 
                type="number" 
                class="value-input temp-input" 
                value={hp.temporary === 0 ? '' : hp.temporary} 
                oninput={updateTemporary}
                placeholder="--"
                min="0"
            />
        </div>
    </div>
</div>

<style>
    .root {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        width: auto;
        height: 100px;
        min-height: 100px;
        max-height: 100px;
        gap: 4px;
        padding: 6px 12px;

        align-self: stretch;
        justify-self: stretch;

        grid-column: 4 / 6;
        background-color: var(--color-content-dark);
    }

    .title {
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--color-primary-text);
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 0;
        line-height: 1;
    }

    .health-row {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: row;
        gap: 6px;
        width: 100%;
    }

    .temp-section {
        margin-left: 8px;
        padding-left: 8px;
        border-left: 1px solid rgba(255, 255, 255, 0.2);
    }

    .points {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        gap: 2px;
    }

    .points span {
        font-size: 0.7em;
        white-space: nowrap;
    }

    .divider {
        font-size: 1.5em;
        margin: 0 2px;
    }

    .value-input {
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 4px;
        color: var(--color-primary-text);
        font-weight: 600;
        font-size: 1em;
        text-align: center;
        width: 65px;
        padding: 4px;
        transition: all 0.2s ease;
        -moz-appearance: textfield;
        appearance: textfield;
    }

    /* Remove spinner arrows in Webkit browsers (Chrome, Safari, Edge) */
    .value-input::-webkit-outer-spin-button,
    .value-input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    .value-input:focus {
        outline: none;
        border-color: var(--color-primary-main);
        box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
        background: rgba(0, 0, 0, 0.2);
    }

    .value-input:hover {
        border-color: var(--color-secondary-main);
    }

    .temp-input {
        width: 60px;
        font-size: 0.9em;
    }

    .temp-input::placeholder {
        color: var(--color-content-light);
        opacity: 0.7;
    }
</style>

