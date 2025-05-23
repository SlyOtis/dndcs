<script lang="ts">
  import type {CharacterContext} from "../lib/types";
  import {getContext} from "svelte";

  const {special} = getContext<CharacterContext>('character')

  function togglePoint(index: number) {
    special.update(curr => {
      const newCurrent = index < curr.current ? index : index + 1;
      return {
        ...curr,
        current: Math.max(0, Math.min(curr.max, newCurrent))
      };
    });
  }

</script>

<div class="root primary-border">
    <div class="header">
        <div class="title">
            <span>{$special.name}</span>
            <span>{$special.regain}</span>
        </div>
        <div class="counter">
            {$special.current}/{$special.max}
        </div>
    </div>
    <div class="points">
        {#each Array.from({ length: $special.max }, (_, i) => i) as index}
            <button 
                class="point-toggle"
                class:used={index >= $special.current}
                onclick={() => togglePoint(index)}
                aria-label={`Toggle ${$special.name} point ${index + 1}`}
            >
                {index >= $special.current ? '○' : '●'}
            </button>
        {/each}
    </div>
</div>

<style>
    .root {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        padding: 4px 8px;

        grid-column: 1 / 3;
        grid-row: 2;

        align-self: stretch;
        justify-self: stretch;

        background-color: var(--color-content-dark);
    }

    .header {
        position: relative;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        width: 100%;
    }

    .title {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: flex-start;
        font-weight: 600;
        color: var(--color-primary-text);
    }

    .title span:first-child {
        font-size: 0.9rem;
        color: var(--color-primary-text);
    }

    .title span:last-child {
        font-size: 0.7rem;
        font-style: italic;
        opacity: 0.8;
        color: var(--color-primary-text);
    }

    .points {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        gap: 6px;
        width: auto;
    }

    .point-toggle {
        background: none;
        border: none;
        color: var(--color-primary-main);
        font-size: 1.2rem;
        cursor: pointer;
        padding: 2px;
        margin: 0 2px;
        transition: all 0.2s ease;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .point-toggle:hover {
        background: rgba(255, 215, 0, 0.2);
        transform: scale(1.1);
    }

    .point-toggle.used {
        color: var(--color-content-light);
        opacity: 0.5;
    }

    .counter {
        font-size: 0.8rem;
        color: var(--color-primary-text);
        font-weight: 600;
        text-align: right;
        opacity: 0.9;
    }
</style>

