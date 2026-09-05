<script lang="ts">
  import type { Snippet } from 'svelte'
  import Ornament from './Ornament.svelte'

  const {
    title,
    note,
    tone = 'metal',
    empty = 'Nothing here yet',
    mark = '✦',
    loading = false,
    count = 0,
    actions,
    children
  }: {
    /** The name written on the header of the rail. */
    title: string
    /** A smaller line written beside the name. */
    note?: string
    /** Colours the header rule and the glow against the active theme. */
    tone?: 'metal' | 'ember' | 'verdigris'
    /** The line written when the rail holds nothing. */
    empty?: string
    /** The glyph drawn above the empty line. */
    mark?: string
    /** Shows a spinner in place of the track. */
    loading?: boolean
    /** How many entries the track holds. The empty state shows when it is zero. */
    count?: number
    /** Controls placed at the tail of the header. */
    actions?: Snippet
    /** The tiles laid along the track. */
    children?: Snippet
  } = $props()

  let track = $state<HTMLDivElement | null>(null)

  function scrollBack() {
    track?.scrollBy({ left: -track.clientWidth * 0.8, behavior: 'smooth' })
  }

  function scrollOn() {
    track?.scrollBy({ left: track.clientWidth * 0.8, behavior: 'smooth' })
  }
</script>

<section class="dnd-rail dnd-rail-{tone}" aria-label={title}>
  <header class="dnd-rail-head">
    <span class="dnd-rail-crest"><Ornament name="tracery" size="xs" tone="metal" /></span>
    <h2 class="dnd-heading dnd-rail-title">{title}</h2>
    {#if note}<span class="dnd-rail-note">{note}</span>{/if}
    <span class="dnd-rail-run"></span>

    {#if actions}
      <div class="dnd-rail-actions">{@render actions()}</div>
    {/if}

    <div class="dnd-rail-steps">
      <button type="button" class="dnd-rail-step" title="Scroll back" aria-label="Scroll {title} back" onclick={scrollBack}>‹</button>
      <button type="button" class="dnd-rail-step" title="Scroll on" aria-label="Scroll {title} on" onclick={scrollOn}>›</button>
    </div>
  </header>

  {#if loading}
    <div class="dnd-loading"><span class="dnd-spinner"></span></div>
  {:else if count === 0}
    <div class="dnd-rail-empty">
      <span class="dnd-empty-mark">{mark}</span>
      <p>{empty}</p>
    </div>
  {:else}
    <div class="dnd-scroll dnd-rail-track" bind:this={track}>
      {@render children?.()}
    </div>
  {/if}
</section>

<style>
  .dnd-rail {
    --rail-light: var(--metal);
    --rail-arcade: 7px;
    position: relative;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: var(--space-3);
    min-height: 0;
  }

  .dnd-rail-ember {
    --rail-light: var(--ember);
  }

  .dnd-rail-verdigris {
    --rail-light: var(--verdigris);
  }

  .dnd-rail-head {
    position: relative;
    isolation: isolate;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding-bottom: var(--space-2);
    border-bottom: var(--border-hair) solid var(--metal-dim);
    box-shadow: 0 2px 0 -1px var(--metal-edge);
  }

  .dnd-rail-head::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: -1;
    height: var(--rail-arcade);
    background: linear-gradient(0deg, var(--metal-dim) 0%, transparent 100%);
    -webkit-mask-image: var(--mask-arch);
    mask-image: var(--mask-arch);
    -webkit-mask-size: 13px var(--rail-arcade);
    mask-size: 13px var(--rail-arcade);
    -webkit-mask-repeat: repeat-x;
    mask-repeat: repeat-x;
    opacity: 0.4;
    pointer-events: none;
  }

  .dnd-rail-crest {
    display: flex;
    flex: none;
    opacity: 0.8;
  }

  .dnd-rail-title {
    flex: none;
    font-size: var(--text-md);
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
    color: var(--metal-bright);
    text-shadow: 0 0 14px color-mix(in srgb, var(--rail-light) 45%, transparent);
  }

  .dnd-rail-note {
    flex: none;
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--ink-faint);
  }

  .dnd-rail-run {
    flex: 1;
    min-width: var(--space-4);
    height: 3px;
    background:
      linear-gradient(90deg, var(--metal-dim), transparent) 0 0 / 100% var(--border-hair) no-repeat,
      linear-gradient(90deg, var(--metal-edge), transparent) 0 100% / 100% var(--border-hair) no-repeat;
  }

  .dnd-rail-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .dnd-rail-steps {
    display: flex;
    flex: none;
    gap: var(--space-1);
  }

  .dnd-rail-step {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    padding: 0;
    background: linear-gradient(180deg, var(--ground-lift) 0%, var(--ground-deep) 100%);
    border: var(--border-hair) solid var(--metal-dim);
    border-radius: var(--radius-sm);
    box-shadow: inset 0 0 0 var(--border-hair) var(--metal-edge);
    color: var(--metal);
    font-family: var(--font-display);
    font-size: var(--text-md);
    line-height: 1;
    cursor: pointer;
    transition: color 0.15s ease, border-color 0.15s ease;
  }

  .dnd-rail-step:hover {
    color: var(--metal-bright);
    border-color: var(--rail-light);
  }

  .dnd-rail-step:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  .dnd-rail-track {
    display: flex;
    gap: var(--space-3);
    overflow-x: auto;
    overflow-y: hidden;
    padding: var(--space-1) var(--space-1) var(--space-3);
    scroll-snap-type: x proximity;
  }

  .dnd-rail-track > :global(*) {
    flex: none;
    scroll-snap-align: start;
  }

  .dnd-rail-empty {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-5);
    border: var(--border-hair) solid var(--metal-dim);
    border-radius: 0;
    clip-path: polygon(
      var(--space-3) 0,
      calc(100% - var(--space-3)) 0,
      calc(100% - var(--space-2)) var(--space-2),
      100% var(--space-3),
      100% 100%,
      0 100%,
      0 var(--space-3),
      var(--space-2) var(--space-2)
    );
    color: var(--ink-faint);
    font-size: var(--text-sm);
  }

  .dnd-rail-empty::before {
    content: '';
    position: absolute;
    inset: var(--space-3);
    border: var(--border-hair) solid var(--metal-edge);
    opacity: 0.6;
    pointer-events: none;
  }

  .dnd-rail-empty p {
    margin: 0;
  }
</style>
