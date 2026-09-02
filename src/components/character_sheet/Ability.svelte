<script lang="ts">
  import type {CharacterAbility} from "$lib/types";
  import {rollAbility} from "$lib/engine";

  let {ability = $bindable()}: { ability: CharacterAbility } = $props()

</script>

<div class="root primary-border">
    <label for={`btn-${ability.title}`}>{ability.title}</label>
    <button
            id={`btn-${ability.title}`}
            name={`btn-${ability.title}`}
            class="medieval-button primary-border"
            onclick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                const button = e.target as HTMLButtonElement;
                button.classList.add('pressed');
                setTimeout(() => button.classList.remove('pressed'), 150);
                
                // Play button click sound
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('playButtonClick'));
                }
                
                rollAbility(ability.title, ability.modifier)
            }}
    >
        <span class="button-content">
            {#if ability.modifier >= 0}+{:else}-{/if}{ability.modifier}
        </span>
        <div class="button-ornament"></div>
    </button>
    <div class="score-container primary-border">
        <span>{ability.score}</span>
    </div>
</div>

<style>
    .root {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: auto;
        height: auto;
        gap: 6px;
        padding: 4px 8px;
        border-radius: 16px;
        z-index: 1;
        background-color: var(--color-content-dark);
    }

    button {
        position: relative;
        width: auto;
        height: auto;
        display: flex;
        justify-content: center;
        align-items: center;
        color: var(--color-primary-text);
        background: transparent;
        padding: 4px 8px;
        cursor: pointer;
        font-size: 1.5em;
    }
    
    .medieval-button {
        background: linear-gradient(145deg, var(--color-accent), var(--color-content-main));
        border: 2px solid var(--color-primary-main);
        border-radius: 12px;
        padding: 8px 12px;
        min-width: 48px;
        min-height: 36px;
        transition: all 0.15s ease;
        box-shadow: 
            inset 1px 1px 3px color-mix(in srgb, var(--color-primary-main) 30%, transparent),
            inset -1px -1px 3px rgba(0, 0, 0, 0.4),
            0 2px 4px rgba(0, 0, 0, 0.3);
        font-family: 'Cinzel', serif;
        font-weight: 600;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
        color: var(--color-primary-text);
        overflow: hidden;
        font-size: 1.4em;
    }
    
    .medieval-button:hover {
        background: linear-gradient(145deg, var(--color-secondary-main), var(--color-accent));
        border-color: var(--color-primary-main);
        box-shadow: 
            inset 1px 1px 4px color-mix(in srgb, var(--color-primary-main) 40%, transparent),
            inset -1px -1px 4px rgba(0, 0, 0, 0.5),
            0 3px 6px rgba(0, 0, 0, 0.4);
        transform: translateY(-1px);
        filter: brightness(1.1);
    }
    
    .medieval-button:active,
    
    .button-content {
        position: relative;
        z-index: 2;
        display: block;
        font-size: 1em;
        letter-spacing: 0.5px;
    }
    
    .button-ornament {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100%;
        height: 100%;
        background: 
            radial-gradient(ellipse at center, 
                color-mix(in srgb, var(--color-primary-main) 10%, transparent) 0%, 
                transparent 60%),
            conic-gradient(from 0deg at center,
                transparent 0deg,
                color-mix(in srgb, var(--color-primary-main) 5%, transparent) 45deg,
                transparent 90deg,
                color-mix(in srgb, var(--color-primary-main) 5%, transparent) 135deg,
                transparent 180deg,
                color-mix(in srgb, var(--color-primary-main) 5%, transparent) 225deg,
                transparent 270deg,
                color-mix(in srgb, var(--color-primary-main) 5%, transparent) 315deg,
                transparent 360deg);
        pointer-events: none;
        opacity: 0.6;
    }
    
    .medieval-button::before {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        right: 2px;
        bottom: 2px;
        background: linear-gradient(45deg, 
            color-mix(in srgb, var(--color-primary-main) 10%, transparent) 0%,
            transparent 50%,
            color-mix(in srgb, var(--color-primary-main) 5%, transparent) 100%);
        border-radius: 10px;
        pointer-events: none;
        z-index: 1;
    }
    
    .medieval-button::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: 
            linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--color-primary-main) 10%, transparent) 50%, transparent 100%);
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
        z-index: 3;
    }
    
    .medieval-button:hover::after {
        opacity: 1;
        animation: shimmer 1.5s ease-in-out infinite;
    }
    
    @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
    }

    .score-container {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        height: auto;
        z-index: 2;
        margin-bottom: -20px;
        border-radius: 16px;
        width: 50%;
        background: var(--color-content-main);
        color: var(--color-content-text);
    }
</style>