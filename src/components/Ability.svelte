<script lang="ts">
  import type {CharacterAbility} from "../lib/types";
  import {rollAbility} from "../lib/engine";

  let {ability = $bindable()}: { ability: CharacterAbility } = $props()

</script>

<div class="root primary-border">
    <label for={`btn-${ability.title}`}>{ability.title}</label>
    <button
            id={`btn-${ability.title}`}
            name={`btn-${ability.title}`}
            class="primary-border"
            onclick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                rollAbility(ability.title, ability.modifier)
            }}
    >
        {#if ability.modifier >= 0}+{:else}-{/if}{ability.modifier}
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