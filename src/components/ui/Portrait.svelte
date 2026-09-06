<script lang="ts">
  import StoredImage from './StoredImage.svelte'
  import { isDeadFile } from '$lib/storage.service'

  const {
    src,
    alt,
    frame = 'lancet',
    size = 'md',
    initial
  }: {
    /** The picture to show. A hosted address, a file: record or a local: reference. */
    src?: string
    /** Alternative text for the picture. */
    alt: string
    /** Picks which traced surround the picture sits in. */
    frame?: PortraitFrame
    /** Sets the height of the portrait. */
    size?: 'sm' | 'md' | 'lg'
    /** The letter drawn when there is no picture. */
    initial?: string
  } = $props()

  const shape = $derived(SHAPES[frame])
  const picture = $derived(src && !isDeadFile(src) ? src : '')
</script>

<script lang="ts" module>
  export type PortraitFrame = 'lancet' | 'ogee' | 'trefoil' | 'shield' | 'round'

  /** Every frame the player may choose, in the order a picker should show them. */
  export const PORTRAIT_FRAMES: { id: PortraitFrame; title: string }[] = [
    { id: 'lancet', title: 'Lancet' },
    { id: 'ogee', title: 'Ogee' },
    { id: 'trefoil', title: 'Trefoil' },
    { id: 'shield', title: 'Shield' },
    { id: 'round', title: 'Round' }
  ]

  const SHAPES: Record<PortraitFrame, string> = {
    lancet: 'M4 136V46C4 22 24 4 50 4s46 18 46 42v90Z',
    ogee: 'M4 136V54c0-14 12-20 20-28C34 16 40 4 50 4s16 12 26 22c8 8 20 14 20 28v82Z',
    trefoil: 'M4 136V56c0-11 7-19 17-21 1-17 12-31 29-31s28 14 29 31c10 2 17 10 17 21v80Z',
    shield: 'M4 4h92v74c0 28-22 43-46 54C26 121 4 106 4 78Z',
    round: 'M50 4c26 0 46 20 46 46v40c0 26-20 46-46 46S4 116 4 90V50C4 24 24 4 50 4Z'
  }
</script>

<span class="dnd-portrait dnd-portrait-{size}">
  <svg class="dnd-portrait-art" viewBox="0 0 100 140" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <defs>
      <clipPath id="dnd-portrait-{frame}" clipPathUnits="objectBoundingBox">
        <path d={shape} transform="scale(0.01, 0.0071428)" />
      </clipPath>
    </defs>
  </svg>

  <span class="dnd-portrait-glass" style="clip-path: url(#dnd-portrait-{frame})">
    {#if picture}
      <StoredImage src={picture} {alt} />
    {:else}
      <span class="dnd-portrait-initial">{initial ?? alt.charAt(0).toUpperCase()}</span>
    {/if}
  </span>

  <svg class="dnd-portrait-trace" viewBox="0 0 100 140" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <path d={shape} class="dnd-portrait-rim" />
    <path d={shape} class="dnd-portrait-key" />
  </svg>
</span>

<style>
  .dnd-portrait {
    position: relative;
    display: inline-block;
    flex: none;
    aspect-ratio: 100 / 140;
    height: var(--portrait-h);
    --portrait-h: 96px;
  }

  .dnd-portrait-sm {
    --portrait-h: 68px;
  }

  .dnd-portrait-md {
    --portrait-h: 96px;
  }

  .dnd-portrait-lg {
    --portrait-h: 168px;
  }

  .dnd-portrait-art {
    position: absolute;
    width: 0;
    height: 0;
  }

  .dnd-portrait-glass {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: radial-gradient(circle at 38% 26%, var(--ground-lift) 0%, var(--ground-deep) 84%);
  }

  .dnd-portrait-glass :global(img) {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .dnd-portrait-initial {
    font-family: var(--font-display);
    font-size: calc(var(--portrait-h) * 0.34);
    font-weight: 700;
    color: var(--metal-dim);
  }

  .dnd-portrait-trace {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
  }

  .dnd-portrait-rim {
    fill: none;
    stroke: var(--metal);
    stroke-width: 3;
    vector-effect: non-scaling-stroke;
    filter: drop-shadow(0 0 5px var(--ember-glow));
  }

  .dnd-portrait-key {
    fill: none;
    stroke: var(--metal-edge);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
    transform: scale(0.93);
    transform-origin: center;
  }
</style>
