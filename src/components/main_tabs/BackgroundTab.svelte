<script lang="ts">
  import {getContext} from "svelte";
  import type {CharacterContext} from "../../lib/types";

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
                    <ul class="additional">
                        {#each $background?.additional as additional}
                            <li>
                                <h5>{additional.title}</h5>
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

    h4, p, h5 {
        padding: 0;
        margin: 0;
    }

    .sub-title {
        font-size: 0.8em;
        font-weight: 600;
        opacity: 0.75;
        margin-bottom: 8px;
    }

    .additional {
        margin-top: 16px;
        background-color: var(--color-content-main);
        border-radius: 16px;
    }

</style>
