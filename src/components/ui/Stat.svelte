<script lang="ts">
  const {
    label,
    value,
    score,
    sub,
    tone = 'metal',
    lit = false,
    title,
    onclick
  }: {
    /** The caps line written above the plate. */
    label: string
    /** The figure shown on the face of the plate. */
    value: string | number
    /** A second figure shown in the cap under the plate. */
    score?: string | number
    /** A small line written under the figure. */
    sub?: string
    /** Colours the plate against the active theme. */
    tone?: 'metal' | 'ember' | 'verdigris' | 'bane'
    /** Lights the plate to mark it as spent or charged. */
    lit?: boolean
    /** Native tooltip text and the accessible name when the plate is pressable. */
    title?: string
    /** Makes the plate pressable and runs when it is pressed. */
    onclick?: (event: MouseEvent) => void
  } = $props()
</script>

<div class="dnd-stat dnd-stat-{tone}" class:dnd-stat-lit={lit}>
  <span class="dnd-stat-label">{label}</span>

  {#if onclick}
    <button type="button" class="dnd-stat-face" aria-label={title ?? label} title={title ?? label} {onclick}>
      <span class="dnd-stat-value">{value}</span>
      {#if sub}<span class="dnd-stat-sub">{sub}</span>{/if}
      <span class="dnd-stat-sheen"></span>
    </button>
  {:else}
    <span class="dnd-stat-face dnd-stat-face-still" {title}>
      <span class="dnd-stat-value">{value}</span>
      {#if sub}<span class="dnd-stat-sub">{sub}</span>{/if}
      <span class="dnd-stat-sheen"></span>
    </span>
  {/if}

  {#if score !== undefined}
    <span class="dnd-stat-score">{score}</span>
  {/if}
</div>

<style>
  .dnd-stat {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-2) var(--space-4);
    --stat-light: var(--metal);
    background:
      var(--texture-noise),
      linear-gradient(180deg, var(--ground-raised) 0%, var(--ground-deep) 100%);
    background-blend-mode: overlay, normal;
    border: var(--border-hair) solid var(--metal-dim);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm), inset 0 1px 0 var(--metal-edge);
  }

  .dnd-stat-ember {
    --stat-light: var(--ember);
  }

  .dnd-stat-verdigris {
    --stat-light: var(--verdigris);
  }

  .dnd-stat-bane {
    --stat-light: var(--state-bad);
  }

  .dnd-stat-label {
    font-family: var(--font-display);
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
    color: var(--metal);
    text-align: center;
    line-height: 1.2;
  }

  .dnd-stat-face {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1px;
    min-width: 60px;
    min-height: 42px;
    padding: var(--space-2) var(--space-3);
    border: none;
    background: linear-gradient(180deg, var(--ground-lift) 0%, var(--ground-raised) 55%, var(--ground-deep) 100%);
    color: var(--ink);
    overflow: hidden;
    clip-path: polygon(
      8px 0,
      calc(100% - 8px) 0,
      100% 8px,
      100% calc(100% - 8px),
      calc(100% - 8px) 100%,
      8px 100%,
      0 calc(100% - 8px),
      0 8px
    );
    outline: var(--border-hair) solid var(--metal-dim);
    outline-offset: -1px;
    transition: filter 0.15s ease, transform 0.12s ease;
  }

  button.dnd-stat-face {
    cursor: pointer;
  }

  button.dnd-stat-face:hover {
    transform: translateY(-1px);
    filter: brightness(1.15) drop-shadow(0 0 10px var(--stat-light));
  }

  button.dnd-stat-face:active {
    transform: translateY(1px);
    filter: brightness(0.92);
  }

  button.dnd-stat-face:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  .dnd-stat-value {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    font-weight: 700;
    line-height: 1.1;
    color: var(--ink);
    text-shadow: 0 1px 2px var(--shade-hard);
  }

  .dnd-stat-sub {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--ink-faint);
  }

  .dnd-stat-sheen {
    position: absolute;
    inset: 0 0 auto 0;
    height: 45%;
    background: linear-gradient(180deg, var(--sheen) 0%, transparent 100%);
    pointer-events: none;
  }

  .dnd-stat-score {
    position: absolute;
    bottom: -14px;
    left: 50%;
    transform: translateX(-50%);
    min-width: 40px;
    padding: 1px var(--space-3);
    background: linear-gradient(180deg, var(--ground-lift), var(--ground-deep));
    border: var(--border-hair) solid var(--metal-dim);
    border-radius: var(--radius-pill);
    font-family: var(--font-display);
    font-size: var(--text-sm);
    font-weight: 700;
    text-align: center;
    color: var(--metal-bright);
    box-shadow: var(--shadow-sm);
  }

  .dnd-stat-lit {
    border-color: var(--stat-light);
    box-shadow: var(--shadow-sm), 0 0 18px color-mix(in srgb, var(--stat-light) 45%, transparent);
    animation: dnd-stat-glow 2.6s ease-in-out infinite alternate;
  }

  .dnd-stat-lit .dnd-stat-value {
    color: var(--stat-light);
    text-shadow: 0 0 12px var(--stat-light);
  }

  @keyframes dnd-stat-glow {
    from {
      box-shadow: var(--shadow-sm), 0 0 12px color-mix(in srgb, var(--stat-light) 30%, transparent);
    }
    to {
      box-shadow: var(--shadow-sm), 0 0 26px color-mix(in srgb, var(--stat-light) 60%, transparent);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .dnd-stat-lit {
      animation: none;
    }
  }
</style>
