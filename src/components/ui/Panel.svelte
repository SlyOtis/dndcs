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
  {#if corners}
    <span class="dnd-panelbox-corner dnd-panelbox-corner-start">
      <Ornament name="corner" size="sm" tone="metal" />
    </span>
    <span class="dnd-panelbox-corner dnd-panelbox-corner-end">
      <Ornament name="corner" size="sm" tone="metal" flip />
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
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
    overflow: hidden;
  }

  .dnd-panelbox-corner {
    position: absolute;
    top: -2px;
    z-index: 2;
    opacity: 0.75;
    pointer-events: none;
  }

  .dnd-panelbox-corner-start {
    left: -2px;
  }

  .dnd-panelbox-corner-end {
    right: -2px;
  }

  .dnd-panelbox-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: linear-gradient(180deg, var(--ground-lift) 0%, var(--ground-raised) 100%);
    border-bottom: var(--border-hair) solid var(--metal-dim);
    box-shadow: inset 0 1px 0 var(--metal-edge), 0 2px 10px var(--shade);
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
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
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
