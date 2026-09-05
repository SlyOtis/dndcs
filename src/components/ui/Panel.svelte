<script lang="ts">
  import type { Snippet } from 'svelte'
  import Ornament from './Ornament.svelte'

  const {
    title,
    variant = 'stone',
    corners = true,
    pad = 'md',
    actions,
    children
  }: {
    /** The name written on the header plate. */
    title: string
    /** Picks the material of the panel against the active theme. */
    variant?: 'stone' | 'void' | 'parchment'
    /** Draws the filigree corners on the top edge. */
    corners?: boolean
    /** Sets the room inside the scrolling body. */
    pad?: 'none' | 'sm' | 'md'
    /** Controls placed at the tail of the header. */
    actions?: Snippet
    /** The scrolling body of the panel. */
    children?: Snippet
  } = $props()
</script>

<section class="dnd-panel dnd-panel-{variant} dnd-panelbox dnd-panelbox-pad-{pad}" aria-label={title}>
  <span class="dnd-panelbox-keyline"></span>

  {#if corners}
    <span class="dnd-panelbox-corner dnd-panelbox-corner-start">
      <Ornament name="cusp" size="xs" tone="metal" />
    </span>
    <span class="dnd-panelbox-corner dnd-panelbox-corner-end">
      <Ornament name="cusp" size="xs" tone="metal" flip />
    </span>
  {/if}

  <header class="dnd-panelbox-head">
    <h2 class="dnd-heading dnd-panelbox-title">{title}</h2>
    {#if actions}
      <div class="dnd-panelbox-actions">{@render actions()}</div>
    {/if}
  </header>

  <div class="dnd-scroll dnd-panelbox-body">
    {@render children?.()}
  </div>
</section>

<style>
  .dnd-panelbox {
    --panel-cusp: 18px;
    --panel-dip: 11px;
    --panel-keyline: var(--space-3);
    --panel-arcade: 8px;
    position: relative;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    height: 100%;
    min-height: 0;
    overflow: hidden;
    border: none;
    border-radius: 0;
    box-shadow: var(--shadow-inset);
    filter: drop-shadow(0 12px 26px var(--shade-hard));
    clip-path: polygon(
      var(--panel-cusp) 0,
      calc(100% - var(--panel-cusp)) 0,
      calc(100% - var(--panel-dip)) var(--panel-dip),
      100% var(--panel-cusp),
      100% 100%,
      0 100%,
      0 var(--panel-cusp),
      var(--panel-dip) var(--panel-dip)
    );
    outline: var(--border-width) solid var(--metal-dim);
    outline-offset: calc(var(--border-width) * -1);
  }

  .dnd-panelbox-keyline {
    position: absolute;
    inset: var(--panel-keyline);
    z-index: -1;
    border: var(--border-hair) solid var(--metal-edge);
    box-shadow: inset 0 0 32px -14px var(--ember-glow);
    pointer-events: none;
  }

  .dnd-panelbox-corner {
    position: absolute;
    top: var(--panel-keyline);
    z-index: 2;
    opacity: 0.8;
    pointer-events: none;
  }

  .dnd-panelbox-corner-start {
    left: var(--panel-keyline);
  }

  .dnd-panelbox-corner-end {
    right: var(--panel-keyline);
  }

  .dnd-panelbox-head {
    position: relative;
    isolation: isolate;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: linear-gradient(180deg, var(--ground-lift) 0%, var(--ground-raised) 100%);
    border-bottom: var(--border-hair) solid var(--metal-dim);
    box-shadow:
      inset 0 1px 0 var(--metal-edge),
      0 2px 0 -1px var(--metal-edge),
      0 4px 12px var(--shade);
  }

  .dnd-panelbox-head::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: -1;
    height: var(--panel-arcade);
    background: linear-gradient(0deg, var(--metal-dim) 0%, transparent 100%);
    -webkit-mask-image: var(--mask-arch);
    mask-image: var(--mask-arch);
    -webkit-mask-size: 14px var(--panel-arcade);
    mask-size: 14px var(--panel-arcade);
    -webkit-mask-repeat: repeat-x;
    mask-repeat: repeat-x;
    opacity: 0.45;
    pointer-events: none;
  }

  .dnd-panelbox-title {
    font-size: var(--text-lg);
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
    padding-inline-start: var(--space-5);
  }

  .dnd-panelbox-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .dnd-panelbox-body {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    min-height: 0;
  }

  .dnd-panelbox-pad-none .dnd-panelbox-body {
    padding: 0;
  }

  .dnd-panelbox-pad-sm .dnd-panelbox-body {
    padding: var(--space-3);
  }

  .dnd-panelbox-pad-md .dnd-panelbox-body {
    padding: var(--space-4);
  }
</style>
