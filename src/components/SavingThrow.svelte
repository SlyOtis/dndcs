<script lang="ts">
  import type {CharacterSavingThrow} from "../lib/types";
  import {rollSave} from "../lib/engine";

  let {save = $bindable()}: { save: CharacterSavingThrow } = $props()
</script>

<div class="root primary-border">
    <span class="title">{save.title}</span>
    <button class="medieval-button primary-border"
            onclick={e => {
                e.preventDefault()
                e.stopPropagation()
                const button = e.target as HTMLButtonElement;
                button.classList.add('pressed');
                setTimeout(() => button.classList.remove('pressed'), 150);
                
                // Play button click sound
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('playButtonClick'));
                }
                
                rollSave(save.title, save.modifier, save.proficiency)
            }}
    >
        <span class="button-content">
            {#if save.modifier > 0}+{:else if save.modifier < 0}-{/if}{save.modifier}
        </span>
        <div class="button-ornament"></div>
    </button>
</div>

<style>
    .root {
        position: relative;
        display: flex;
        flex-direction: row;
        justify-content: end;
        align-items: center;
        width: auto;
        height: auto;
        gap: 4px;
        border-radius: 8px;
        background-color: var(--color-content-dark);
    }

    .title {
        position: relative;
        display: flex;
        padding: 4px;
        font-size: 0.8em;
    }

    button {
        position: relative;
        width: min-content;
        height: calc(100% + 8px);
        display: flex;
        justify-content: center;
        align-items: center;
        color: var(--color-content-text);
        background: var(--color-content-main);
        padding: 4px;
        min-width: 32px;
        cursor: pointer;
        margin: -4px;
        border-radius: 16px;
    }
    
    .medieval-button {
        background: linear-gradient(145deg, var(--color-accent), var(--color-content-main));
        border: 2px solid var(--color-primary-main);
        border-radius: 16px;
        padding: 6px 10px;
        min-width: 36px;
        height: calc(100% + 8px);
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
    .medieval-button.pressed {
        background: linear-gradient(145deg, var(--color-content-dark), var(--color-content-main));
        border-color: color-mix(in srgb, var(--color-primary-main) 70%, transparent);
        box-shadow: 
            inset 2px 2px 6px rgba(0, 0, 0, 0.6),
            inset -1px -1px 3px color-mix(in srgb, var(--color-primary-main) 20%, transparent),
            0 1px 2px rgba(0, 0, 0, 0.2);
        transform: translateY(1px);
    }
    
    .button-content {
        position: relative;
        z-index: 2;
        display: block;
        font-size: 0.9em;
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
        border-radius: 14px;
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
</style>



