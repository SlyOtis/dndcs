<script lang="ts">
  import { onDestroy } from 'svelte'
  import { getFileUrl, isLocalFile } from '$lib/storage.service'

  const {
    src,
    alt,
    draggable
  }: {
    /** A hosted address, or a local: reference held in this browser. */
    src: string
    /** Alternative text for the image. */
    alt: string
    /** Passed straight to the img element. */
    draggable?: boolean
  } = $props()

  let resolved = $state('')
  let objectUrl = ''

  function release() {
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    objectUrl = ''
  }

  $effect(() => {
    const address = src
    let stale = false

    if (!isLocalFile(address)) {
      release()
      resolved = address
      return
    }

    getFileUrl(address).then((url) => {
      if (stale) {
        URL.revokeObjectURL(url)
        return
      }
      release()
      objectUrl = url
      resolved = url
    })

    return () => {
      stale = true
    }
  })

  onDestroy(release)
</script>

{#if resolved}
  <img src={resolved} {alt} draggable={draggable} />
{:else}
  <span class="dnd-stored-image-missing" aria-label="{alt}, not on this device"></span>
{/if}

<style>
  .dnd-stored-image-missing {
    display: block;
    width: 100%;
    height: 100%;
    background:
      repeating-linear-gradient(
        45deg,
        var(--ground-raised) 0 8px,
        var(--ground-lift) 8px 16px
      );
  }
</style>
