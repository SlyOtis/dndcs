<script lang="ts">
  import type { Snippet } from 'svelte'
  import Ornament from './Ornament.svelte'
  import Flame from './Flame.svelte'

  const {
    variant = 'cathedral',
    crest = false,
    torches = false,
    fill = false,
    pad = 'md',
    title,
    children
  }: {
    /** Picks the material and the ornament set drawn around the content. */
    variant?: 'cathedral' | 'dragon' | 'iron' | 'timber' | 'hairline'
    /** Draws the heraldic crest on the top and bottom edge. */
    crest?: boolean
    /** Lights a torch in the upper left and upper right corner. */
    torches?: boolean
    /** Stretches the frame to the full width and height of its container. */
    fill?: boolean
    /** Sets the room between the ornament and the content. */
    pad?: 'none' | 'sm' | 'md' | 'lg'
    /** Reads as the accessible name of the framed region. */
    title?: string
    /** The framed content. */
    children?: Snippet
  } = $props()

  const cornerTone = $derived(variant === 'iron' ? 'ink' : 'metal')
</script>

<section
  class="dnd-frame dnd-frame-{variant} dnd-frame-pad-{pad}"
  class:dnd-frame-fill={fill}
  aria-label={title}
>
  <div class="dnd-frame-ground"></div>
  <div class="dnd-frame-keyline"></div>

  {#if variant !== 'timber'}
    <span class="dnd-frame-corner dnd-frame-corner-tl">
      {#if variant === 'iron'}
        <Ornament name="skull" size="md" tone={cornerTone} />
      {:else}
        <Ornament name="corner" size={variant === 'hairline' ? 'sm' : 'lg'} tone={cornerTone} />
      {/if}
    </span>
    <span class="dnd-frame-corner dnd-frame-corner-tr">
      {#if variant === 'iron'}
        <Ornament name="skull" size="md" tone={cornerTone} />
      {:else}
        <Ornament name="corner" size={variant === 'hairline' ? 'sm' : 'lg'} tone={cornerTone} flip />
      {/if}
    </span>
    <span class="dnd-frame-corner dnd-frame-corner-bl">
      {#if variant === 'iron'}
        <Ornament name="skull" size="md" tone={cornerTone} />
      {:else}
        <Ornament name="corner" size={variant === 'hairline' ? 'sm' : 'lg'} tone={cornerTone} rotate={-90} />
      {/if}
    </span>
    <span class="dnd-frame-corner dnd-frame-corner-br">
      {#if variant === 'iron'}
        <Ornament name="skull" size="md" tone={cornerTone} />
      {:else}
        <Ornament name="corner" size={variant === 'hairline' ? 'sm' : 'lg'} tone={cornerTone} rotate={180} />
      {/if}
    </span>
  {/if}

  {#if variant === 'dragon'}
    <span class="dnd-frame-dragon dnd-frame-dragon-left">
      <Ornament name="dragon" size="xl" tone="verdigris" />
    </span>
    <span class="dnd-frame-dragon dnd-frame-dragon-right">
      <Ornament name="dragon" size="xl" tone="verdigris" flip />
    </span>
  {/if}

  {#if variant === 'iron'}
    <span class="dnd-frame-chain">
      <Ornament name="chain" tone="ink" />
    </span>
  {/if}

  {#if variant === 'timber'}
    <span class="dnd-frame-beam dnd-frame-beam-top"></span>
    <span class="dnd-frame-beam dnd-frame-beam-bottom"></span>
  {/if}

  {#if crest}
    <span class="dnd-frame-crest dnd-frame-crest-top">
      <Ornament name="crest" size="lg" tone="metal" />
    </span>
    <span class="dnd-frame-crest dnd-frame-crest-bottom">
      <Ornament name="rosette" size="md" tone="metal" />
    </span>
  {/if}

  {#if torches}
    <span class="dnd-frame-torch dnd-frame-torch-left">
      <Flame size="md" intensity="steady" sconce />
    </span>
    <span class="dnd-frame-torch dnd-frame-torch-right">
      <Flame size="md" intensity="calm" sconce />
    </span>
  {/if}

  <div class="dnd-frame-body">
    {@render children?.()}
  </div>
</section>

<style>
  .dnd-frame {
    position: relative;
    isolation: isolate;
    border-radius: var(--radius-xl);
  }

  .dnd-frame-fill {
    width: 100%;
    height: 100%;
  }

  .dnd-frame-ground {
    position: absolute;
    inset: 0;
    z-index: 0;
    border-radius: inherit;
    background:
      var(--texture-weave),
      linear-gradient(180deg, var(--ground-raised) 0%, var(--ground) 55%, var(--ground-deep) 100%);
    box-shadow: var(--shadow-lg);
  }

  .dnd-frame-keyline {
    position: absolute;
    inset: 6px;
    z-index: 1;
    border: var(--border-hair) solid var(--metal-dim);
    border-radius: calc(var(--radius-xl) - 4px);
    box-shadow:
      inset 0 0 0 var(--border-hair) var(--metal-edge),
      inset 0 0 40px -14px var(--ember-glow);
    pointer-events: none;
  }

  .dnd-frame-body {
    position: relative;
    z-index: 3;
    height: 100%;
  }

  .dnd-frame-pad-none .dnd-frame-body {
    padding: 0;
  }

  .dnd-frame-pad-sm .dnd-frame-body {
    padding: var(--space-4);
  }

  .dnd-frame-pad-md .dnd-frame-body {
    padding: var(--space-6);
  }

  .dnd-frame-pad-lg .dnd-frame-body {
    padding: var(--space-8);
  }

  .dnd-frame-corner {
    position: absolute;
    z-index: 2;
    display: block;
    pointer-events: none;
  }

  .dnd-frame-corner-tl {
    top: -6px;
    left: -6px;
  }

  .dnd-frame-corner-tr {
    top: -6px;
    right: -6px;
  }

  .dnd-frame-corner-bl {
    bottom: -6px;
    left: -6px;
  }

  .dnd-frame-corner-br {
    bottom: -6px;
    right: -6px;
  }

  .dnd-frame-crest {
    position: absolute;
    left: 50%;
    z-index: 4;
    transform: translateX(-50%);
    pointer-events: none;
    filter: drop-shadow(0 4px 10px var(--shade-hard));
  }

  .dnd-frame-crest-top {
    top: 0;
    transform: translate(-50%, -55%);
  }

  .dnd-frame-crest-bottom {
    bottom: 0;
    transform: translate(-50%, 45%);
  }

  .dnd-frame-torch {
    position: absolute;
    top: var(--space-6);
    z-index: 4;
    pointer-events: none;
  }

  .dnd-frame-torch-left {
    left: var(--space-5);
  }

  .dnd-frame-torch-right {
    right: var(--space-5);
  }

  .dnd-frame-dragon {
    position: absolute;
    top: 12%;
    z-index: 2;
    opacity: 0.85;
    pointer-events: none;
    filter: drop-shadow(0 0 12px var(--shade-hard));
  }

  .dnd-frame-dragon-left {
    left: -34px;
  }

  .dnd-frame-dragon-right {
    right: -34px;
  }

  .dnd-frame-chain {
    position: absolute;
    top: 4px;
    left: 12%;
    right: 12%;
    z-index: 2;
    opacity: 0.5;
    pointer-events: none;
  }

  .dnd-frame-cathedral .dnd-frame-ground {
    background:
      var(--texture-motes),
      radial-gradient(ellipse at 50% 0%, var(--verdigris-dim) 0%, transparent 55%),
      linear-gradient(180deg, var(--ground-raised) 0%, var(--ground-deep) 100%);
  }

  .dnd-frame-dragon .dnd-frame-ground {
    background:
      var(--texture-weave),
      radial-gradient(ellipse at 50% 40%, var(--ground-raised) 0%, var(--ground-deep) 78%);
  }

  .dnd-frame-dragon .dnd-frame-keyline {
    border-color: var(--metal);
    border-radius: calc(var(--radius-xl) * 2) calc(var(--radius-xl) * 2) var(--radius-lg) var(--radius-lg);
  }

  .dnd-frame-iron .dnd-frame-ground {
    background:
      var(--texture-noise),
      linear-gradient(180deg, var(--ground-lift) 0%, var(--ground) 60%, var(--ground-deep) 100%);
    background-blend-mode: overlay, normal;
  }

  .dnd-frame-iron .dnd-frame-keyline {
    border-width: var(--border-heavy);
    border-color: var(--ground-lift);
    border-radius: var(--radius-sm);
  }

  .dnd-frame-timber .dnd-frame-ground {
    background:
      var(--texture-noise),
      repeating-linear-gradient(
        90deg,
        var(--ground-raised) 0px,
        var(--ground-raised) 58px,
        var(--ground) 58px,
        var(--ground) 60px
      );
    background-blend-mode: soft-light, normal;
  }

  .dnd-frame-timber .dnd-frame-keyline {
    inset: 14px;
    border-color: var(--metal-dim);
    border-radius: var(--radius-sm);
  }

  .dnd-frame-beam {
    position: absolute;
    left: 0;
    right: 0;
    height: 14px;
    z-index: 2;
    background: linear-gradient(180deg, var(--ground-lift), var(--ground-deep));
    box-shadow: inset 0 1px 0 var(--metal-edge), var(--shadow-sm);
    pointer-events: none;
  }

  .dnd-frame-beam-top {
    top: 0;
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  }

  .dnd-frame-beam-bottom {
    bottom: 0;
    border-radius: 0 0 var(--radius-xl) var(--radius-xl);
  }

  .dnd-frame-hairline .dnd-frame-ground {
    background: linear-gradient(180deg, var(--ground) 0%, var(--ground-deep) 100%);
    box-shadow: var(--shadow-md);
  }

  .dnd-frame-hairline .dnd-frame-keyline {
    inset: 3px;
    box-shadow: inset 0 0 0 var(--border-hair) var(--metal-edge);
  }

  @media (max-width: 760px) {
    .dnd-frame-dragon,
    .dnd-frame-torch {
      display: none;
    }

    .dnd-frame-pad-lg .dnd-frame-body {
      padding: var(--space-5);
    }
  }
</style>
