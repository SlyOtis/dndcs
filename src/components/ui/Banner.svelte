<script lang="ts">
  import type { Snippet } from 'svelte'
  import Ornament from './Ornament.svelte'

  const {
    text,
    sub,
    tone = 'metal',
    size = 'md',
    children
  }: {
    /** The name written across the plate. */
    text: string
    /** A smaller line written under the name. */
    sub?: string
    /** Colours the plate against the active theme. */
    tone?: 'metal' | 'iron' | 'timber'
    /** Sets the height of the plate. */
    size?: 'sm' | 'md' | 'lg'
    /** Extra content placed at the tail of the plate. */
    children?: Snippet
  } = $props()
</script>

<div class="dnd-banner dnd-banner-{tone} dnd-banner-{size}">
  <span class="dnd-banner-tail dnd-banner-tail-start"></span>
  <span class="dnd-banner-plate">
    <span class="dnd-banner-cusp dnd-banner-cusp-start">
      <Ornament name="cusp" size="xs" tone="metal" rotate={180} flip />
    </span>
    <span class="dnd-banner-cusp dnd-banner-cusp-end">
      <Ornament name="cusp" size="xs" tone="metal" rotate={180} />
    </span>
    <span class="dnd-banner-text">{text}</span>
    {#if sub}<span class="dnd-banner-sub">{sub}</span>{/if}
    {@render children?.()}
  </span>
  <span class="dnd-banner-tail dnd-banner-tail-end"></span>
</div>

<style>
  .dnd-banner {
    --banner-h: 44px;
    --banner-head: 34%;
    --banner-line: var(--metal);
    position: relative;
    display: inline-flex;
    align-items: flex-end;
    filter: drop-shadow(0 4px 10px var(--shade-hard));
  }

  .dnd-banner-sm {
    --banner-h: 30px;
  }

  .dnd-banner-md {
    --banner-h: 44px;
  }

  .dnd-banner-lg {
    --banner-h: 64px;
  }

  .dnd-banner-plate {
    position: relative;
    isolation: isolate;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    min-height: var(--banner-h);
    padding: calc(var(--banner-h) * 0.34) var(--space-5) var(--space-2);
  }

  .dnd-banner-plate::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: linear-gradient(180deg, var(--ground-lift) 0%, var(--ground-raised) 50%, var(--ground-deep) 100%);
    clip-path: polygon(0 100%, 0 var(--banner-head), 50% 0, 100% var(--banner-head), 100% 100%);
    filter:
      drop-shadow(var(--border-hair) 0 0 var(--banner-line))
      drop-shadow(calc(var(--border-hair) * -1) 0 0 var(--banner-line))
      drop-shadow(0 var(--border-hair) 0 var(--banner-line))
      drop-shadow(0 calc(var(--border-hair) * -1) 0 var(--banner-line));
  }

  .dnd-banner-cusp {
    position: absolute;
    bottom: var(--space-1);
    opacity: 0.7;
    pointer-events: none;
  }

  .dnd-banner-cusp-start {
    left: var(--space-1);
  }

  .dnd-banner-cusp-end {
    right: var(--space-1);
  }

  .dnd-banner-text {
    font-family: var(--font-display);
    font-size: var(--text-sm);
    font-weight: 700;
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
    color: var(--metal-bright);
    text-shadow: 0 1px 2px var(--shade-hard);
    white-space: nowrap;
  }

  .dnd-banner-lg .dnd-banner-text {
    font-size: var(--text-lg);
  }

  .dnd-banner-sm .dnd-banner-text {
    font-size: var(--text-xs);
  }

  .dnd-banner-sub {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wide);
    color: var(--ink-faint);
    white-space: nowrap;
  }

  .dnd-banner-tail {
    width: calc(var(--banner-h) * 0.45);
    height: calc(var(--banner-h) * 0.62);
    background: linear-gradient(180deg, var(--banner-line) 0%, var(--ground-deep) 100%);
    box-shadow: inset 0 1px 0 var(--metal-edge);
  }

  .dnd-banner-tail-start {
    clip-path: polygon(100% 0, 100% 100%, 0 100%, 45% 50%, 0 0);
  }

  .dnd-banner-tail-end {
    clip-path: polygon(0 0, 100% 0, 55% 50%, 100% 100%, 0 100%);
  }

  .dnd-banner-iron {
    --banner-line: var(--ink-faint);
  }

  .dnd-banner-iron .dnd-banner-plate::before {
    background: linear-gradient(180deg, var(--ground-lift) 0%, var(--ground) 100%);
  }

  .dnd-banner-iron .dnd-banner-text {
    color: var(--ink);
  }

  .dnd-banner-timber {
    --banner-line: var(--metal-dim);
  }

  .dnd-banner-timber .dnd-banner-plate::before {
    background:
      var(--texture-noise),
      linear-gradient(180deg, var(--ground-raised) 0%, var(--ground-deep) 100%);
    background-blend-mode: soft-light, normal;
  }
</style>
