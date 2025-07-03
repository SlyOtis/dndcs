<script lang="ts">
  import {getContext} from "svelte";
  import type {CharacterContext} from "../lib/types";
  import {decryptMediaUrl} from "../lib/engine.js";

  const characterContext = getContext<CharacterContext>('character')
  const info = characterContext?.info

  let bckSource = $state({type: 'unknown', url: ''})

  $effect.pre(() => {
    if (info && $info.backgroundUrl) {
      decryptMediaUrl($info.backgroundUrl).then(res => {
        bckSource = res
      })
    }
  })

</script>

<div class="root">
    <div class="inner">
        {#if bckSource.type === 'video'}
            <iframe
                    title="Video background"
                    src={bckSource.url}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen>
            </iframe>
        {:else if bckSource.type === 'image'}
            <img src={bckSource.url} alt="Image background"/>
        {/if}
    </div>
</div>

<style>
    .root {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        z-index: 0;
        background: var(--color-background, var(--color-background-dark));

        user-select: none;
        pointer-events: none;
        tab-index: -1;
    }

    .inner {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .inner:after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: var(--color-secondary-main);
        opacity: 0.2;
    }

    iframe, img {
        position: absolute;
        top: 0;
        width: 100%;
        height: 100%;
        border: none;
        outline: none;
        object-fit: cover;
        user-select: none;
        pointer-events: none;
        tab-index: -1;
    }

    iframe {
        left: 50%;
        height: 100vh;
        min-width: 177.77vh; /* 16:9 */
        transform: translateX(-50%);
        border: none;
    }
</style>