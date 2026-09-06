<script lang="ts">
  import { onDestroy } from 'svelte'
  import { deleteFilePlace, getFileUrl, isDeadFile, isStoredFile } from '$lib/storage.service'

  const {
    src,
    alt,
    draggable
  }: {
    /** A hosted address, a file: record or a local: reference. A blob: address is dead and draws the missing mark. */
    src: string
    /** Alternative text for the image. */
    alt: string
    /** Passed straight to the img element. */
    draggable?: boolean
  } = $props()

  let resolved = $state('')
  let looked = $state(false)
  let objectUrl = ''

  function release() {
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    objectUrl = ''
  }

  $effect(() => {
    const address = src
    let stale = false

    looked = false

    if (!isStoredFile(address)) {
      release()
      resolved = isDeadFile(address) ? '' : address
      return
    }

    getFileUrl(address)
      .catch(() => '')
      .then((url) => {
        if (stale) {
          if (url) URL.revokeObjectURL(url)
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

  async function relook() {
    if (looked || !isStoredFile(src)) {
      resolved = ''
      return
    }

    looked = true
    await deleteFilePlace(src).catch(() => undefined)
    release()
    resolved = await getFileUrl(src).catch(() => '')
  }

  onDestroy(release)
</script>

{#if resolved}
  <img src={resolved} {alt} draggable={draggable} onerror={relook} />
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
