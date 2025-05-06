<script lang="ts">
  import {getContext} from "svelte";
  import type {CharacterContext} from "../../lib/types";
  import Marked from "../Marked.svelte";

  const {feats} = getContext<CharacterContext>('character')

  let orderFeats = $derived($feats.sort((a, b) => a.level - b.level));


</script>

<div class="root">
    <div class="scroll">
        <ul>
            {#each orderFeats as feat}
                <li class="feat">
                    <h4>{feat.title} - <i>lvl {feat.level}</i></h4>
                    <span class="source">{feat.source}</span>
                    <Marked content={feat.description} />
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

    .source {
        font-size: 0.7em;
        font-weight: 600;
        opacity: 0.75;
        text-transform: uppercase;
        margin-bottom: 16px;
    }

</style>
