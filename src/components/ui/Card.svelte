<script lang="ts">
  import type { Snippet } from 'svelte'

  const {
    title,
    sub,
    image,
    badge,
    tone = 'metal',
    onclick,
    children
  }: {
    /** The name written on the card. */
    title: string
    /** A smaller line written under the name. */
    sub?: string
    /** Portrait shown in the medallion. The first letter of the title stands in when it is missing. */
    image?: string
    /** Short mark drawn in the upper right of the card. */
    badge?: string
    /** Colours the rim against the active theme. */
    tone?: 'metal' | 'ember' | 'verdigris'
    /** Runs when the card is pressed. */
    onclick?: (event: MouseEvent) => void
    /** The stat row written under the sub line. */
    children?: Snippet
  } = $props()

  const initial = $derived(title.charAt(0).toUpperCase())
</script>

<button type="button" class="dnd-card dnd-card-{tone}" {onclick}>
  <span class="dnd-card-medallion">
    {#if image}
      <img class="dnd-card-portrait" src={image} alt="" />
    {:else}
      <span class="dnd-card-initial">{initial}</span>
    {/if}
    <span class="dnd-card-rim"></span>
  </span>

  <span class="dnd-card-body">
    <span class="dnd-card-title">{title}</span>
    {#if sub}<span class="dnd-card-sub">{sub}</span>{/if}
    {#if children}<span class="dnd-card-stats">{@render children()}</span>{/if}
  </span>

  {#if badge}
    <span class="dnd-card-badge">{badge}</span>
  {/if}
</button>

<style>
  .dnd-card {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--space-4);
    width: 100%;
    padding: var(--space-3);
    text-align: start;
    cursor: pointer;
    --card-light: var(--metal);
    background:
      var(--texture-weave),
      linear-gradient(180deg, var(--ground-raised) 0%, var(--ground) 100%);
    border: var(--border-hair) solid var(--metal-dim);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm), inset 0 1px 0 var(--metal-edge);
    transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .dnd-card-ember {
    --card-light: var(--ember);
  }

  .dnd-card-verdigris {
    --card-light: var(--verdigris);
  }

  .dnd-card:hover {
    transform: translateX(3px);
    border-color: var(--card-light);
    box-shadow: var(--shadow-md), 0 0 16px color-mix(in srgb, var(--card-light) 35%, transparent);
  }

  .dnd-card:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  .dnd-card-medallion {
    position: relative;
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: var(--radius-pill);
    overflow: hidden;
    background: radial-gradient(circle at 38% 26%, var(--ground-lift) 0%, var(--ground-deep) 84%);
  }

  .dnd-card-portrait {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .dnd-card-initial {
    font-family: var(--font-display);
    font-size: var(--text-xl);
    font-weight: 700;
    color: var(--card-light);
    text-shadow: 0 0 10px var(--card-light);
  }

  .dnd-card-rim {
    position: absolute;
    inset: 0;
    border-radius: var(--radius-pill);
    box-shadow: inset 0 0 0 2px var(--metal-dim), inset 0 0 12px var(--shade-hard);
    pointer-events: none;
  }

  .dnd-card-body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    flex: 1;
  }

  .dnd-card-title {
    font-family: var(--font-display);
    font-size: var(--text-md);
    font-weight: 600;
    color: var(--metal-bright);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dnd-card-sub {
    font-size: var(--text-xs);
    color: var(--ink-dim);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dnd-card-stats {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    margin-top: var(--space-1);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--ink-faint);
  }

  .dnd-card-badge {
    position: absolute;
    top: var(--space-2);
    right: var(--space-2);
    padding: 1px var(--space-2);
    border: var(--border-hair) solid var(--metal-dim);
    border-radius: var(--radius-pill);
    background: var(--ground-deep);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--metal);
  }
</style>
