<script lang="ts">
  import type {CharacterSavingThrow} from "../lib/types";
  import {rollSave} from "../lib/engine";

  let {save = $bindable()}: { save: CharacterSavingThrow } = $props()
</script>

<div class="root primary-border">
    <span class="title">{save.title}</span>
    <button class="primary-border"
            onclick={e => {
                e.preventDefault()
                e.stopPropagation()
                rollSave(save.title, save.modifier, save.proficiency)
            }}
    >
        {#if save.modifier > 0}+{:else if save.modifier < 0}-{/if}{save.modifier}
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
</style>



