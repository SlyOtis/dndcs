<script lang="ts">
  import type { Snippet } from 'svelte'

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
    <span class="dnd-banner-text">{text}</span>
    {#if sub}<span class="dnd-banner-sub">{sub}</span>{/if}
    {@render children?.()}
  </span>
  <span class="dnd-banner-tail dnd-banner-tail-end"></span>
</div>

<style>
  .dnd-banner {
    position: relative;
    display: inline-flex;
    align-items: stretch;
    --banner-h: 44px;
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
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: var(--banner-h);
    padding: var(--space-1) var(--space-5);
    background: linear-gradient(180deg, var(--ground-lift) 0%, var(--ground-raised) 50%, var(--ground-deep) 100%);
    border-top: var(--border-hair) solid var(--metal);
    border-bottom: var(--border-hair) solid var(--metal-dim);
    box-shadow: inset 0 1px 0 var(--metal-edge);
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
    background: linear-gradient(180deg, var(--metal-dim) 0%, var(--ground-deep) 100%);
    box-shadow: inset 0 1px 0 var(--metal-edge);
  }

  .dnd-banner-tail-start {
    clip-path: polygon(100% 0, 100% 100%, 0 100%, 45% 50%, 0 0);
  }

  .dnd-banner-tail-end {
    clip-path: polygon(0 0, 100% 0, 55% 50%, 100% 100%, 0 100%);
  }

  .dnd-banner-iron .dnd-banner-plate {
    background: linear-gradient(180deg, var(--ground-lift) 0%, var(--ground) 100%);
    border-color: var(--ink-faint);
  }

  .dnd-banner-iron .dnd-banner-text {
    color: var(--ink);
  }

  .dnd-banner-iron .dnd-banner-tail {
    background: linear-gradient(180deg, var(--ink-faint) 0%, var(--ground-deep) 100%);
  }

  .dnd-banner-timber .dnd-banner-plate {
    background:
      var(--texture-noise),
      linear-gradient(180deg, var(--ground-raised) 0%, var(--ground-deep) 100%);
    background-blend-mode: soft-light, normal;
    border-radius: var(--radius-sm);
  }
</style>
