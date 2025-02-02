<script lang="ts">
  import {getContext} from "svelte";
  import type {CharacterContext} from "../lib/types";

  const {feats} = getContext<CharacterContext>('character')


</script>

<div class="root">
    <div class="scroll">
        <ul>
            {#each $feats as feat}
                <li class="feat">
                    <h4>{feat.title} - lvl {feat.level}</h4>
                    <span class="source">{feat.source}</span>
                    <p>{feat.description}</p>
                </li>
            {/each}
        </ul>
    </div>
</div>

<style>
    .root {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: start;
        align-items: start;
        flex-direction: column;
        color: var(--color-content-text);
        background-color: var(--color-content-dark);
    }

    .scroll {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        overflow-y: scroll;
    }

    ul, li {
        position: relative;
        list-style: none;
        padding: 0;
        margin: 0;
        width: 100%;
        height: auto;
    }

    ul {
        padding: 8px 12px;
    }

    li {
        margin-bottom: 12px;
    }

    h4, p {
        padding: 0;
        margin: 0;
    }

    li:not(:last-child) {
        padding-bottom: 16px;
        border-bottom: 1px dashed var(--color-content-text);
        margin-bottom: 16px;
    }

</style>
