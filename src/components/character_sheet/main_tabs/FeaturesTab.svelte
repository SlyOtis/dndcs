<script lang="ts">
  import {getContext} from "svelte";
  import type {CharacterContext} from "$lib/types";
  import Marked from "$components/Marked.svelte";

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
        max-height: 100%;
        display: flex;
        justify-content: start;
        align-items: start;
        flex-direction: column;
        color: var(--ink);
        overflow: hidden;
    }

    .scroll {
        position: relative;
        width: 100%;
        height: 100%;
        max-height: 100%;
        overflow-x: hidden;
        overflow-y: auto;
        flex: 1;
        min-height: 0;
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

    li:not(:last-child) {
        padding-bottom: 16px;
        border-bottom: 1px dashed var(--ink);
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
