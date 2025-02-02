<script lang="ts">
  import {getContext} from "svelte";
  import type {CharacterContext, CharacterCurrency} from "../lib/types";
  import {addCurrencies, asGold} from "../lib/engine";

  const {background} = getContext<CharacterContext>('character')

</script>

<div class="root">
    <div class="scroll">
        <ul>
            <li>
                <h4>{$background.title}</h4>
                {#if $background?.subTitle}
                    <span class="sub-title">{$background.subTitle}</span>
                {/if}
                <p>{$background.description}</p>
                {#if $background?.additional?.length}
                    <ul>
                        {#each $background?.additional as additional}
                            <li>
                                <h6>{additional.title}</h6>
                                <span>{additional.type}</span>
                                {#if additional.description}
                                    <p>{additional.description}</p>
                                {/if}
                            </li>
                        {/each}
                    </ul>
                {/if}
            </li>
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

</style>
