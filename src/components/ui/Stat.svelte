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
      <span class="dnd-stat-plate"></span>
      <span class="dnd-stat-sheen"></span>
      <span class="dnd-stat-value">{value}</span>
      {#if sub}<span class="dnd-stat-sub">{sub}</span>{/if}
    </button>
  {:else}
    <span class="dnd-stat-face dnd-stat-face-still" {title}>
      <span class="dnd-stat-plate"></span>
      <span class="dnd-stat-sheen"></span>
      <span class="dnd-stat-value">{value}</span>
      {#if sub}<span class="dnd-stat-sub">{sub}</span>{/if}
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
    --stat-brace: var(--metal);
    --stat-rim: var(--metal);
    --stat-cut: 9px;
    --stat-cusp: 10px;
    --stat-shape: polygon(
      var(--stat-cut) 0,
      calc(100% - var(--stat-cut)) 0,
      100% var(--stat-cut),
      100% calc(100% - var(--stat-cut)),
      calc(100% - var(--stat-cut)) 100%,
      var(--stat-cut) 100%,
      0 calc(100% - var(--stat-cut)),
      0 var(--stat-cut)
    );
    background:
      var(--texture-noise),
      linear-gradient(180deg, var(--ground-raised) 0%, var(--ground-deep) 100%);
    background-blend-mode: overlay, normal;
    border: var(--border-hair) solid var(--metal-dim);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm), inset 0 1px 0 var(--metal-edge);
  }

  .dnd-stat::before,
  .dnd-stat::after {
    content: '';
    position: absolute;
    width: var(--stat-cusp);
    height: var(--stat-cusp);
    border: var(--border-hair) solid var(--stat-brace);
    opacity: 0.7;
    pointer-events: none;
  }

  .dnd-stat::before {
    top: -1px;
    left: -1px;
    border-right: none;
    border-bottom: none;
    border-top-left-radius: var(--radius-md);
  }

  .dnd-stat::after {
    right: -1px;
    bottom: -1px;
    border-left: none;
    border-top: none;
    border-bottom-right-radius: var(--radius-md);
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
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    font-family: var(--font-display);
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
    color: var(--metal);
    text-align: center;
    line-height: 1.2;
  }

  .dnd-stat-label::before,
  .dnd-stat-label::after {
    content: '';
    flex: none;
    width: var(--space-3);
    height: var(--border-hair);
  }

  .dnd-stat-label::before {
    background: linear-gradient(90deg, transparent, var(--metal-dim));
  }

  .dnd-stat-label::after {
    background: linear-gradient(90deg, var(--metal-dim), transparent);
  }

  .dnd-stat-face {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1px;
    min-width: 64px;
    min-height: 44px;
    padding: var(--space-2) var(--space-3);
    border: none;
    background: linear-gradient(180deg, var(--stat-rim) 0%, var(--metal-dim) 100%);
    color: var(--ink);
    clip-path: var(--stat-shape);
    transition: filter 0.15s ease, transform 0.12s ease;
  }

  .dnd-stat-plate {
    position: absolute;
    inset: var(--border-width);
    z-index: 0;
    background: linear-gradient(180deg, var(--ground-lift) 0%, var(--ground-raised) 55%, var(--ground-deep) 100%);
    clip-path: var(--stat-shape);
    box-shadow: inset 0 -10px 16px -12px var(--shade-hard);
    pointer-events: none;
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
    --stat-rim: var(--metal-bright);
    filter: drop-shadow(0 0 8px var(--metal));
  }

  button.dnd-stat-face:focus-visible .dnd-stat-plate {
    box-shadow: inset 0 0 0 var(--border-width) var(--metal-bright);
  }

  .dnd-stat-value {
    position: relative;
    z-index: 2;
    font-family: var(--font-display);
    font-size: var(--text-lg);
    font-weight: 700;
    line-height: 1.1;
    color: var(--ink);
    text-shadow: 0 1px 2px var(--shade-hard);
  }

  .dnd-stat-sub {
    position: relative;
    z-index: 2;
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--ink-faint);
  }

  .dnd-stat-sheen {
    position: absolute;
    top: var(--border-width);
    right: var(--border-width);
    left: var(--border-width);
    z-index: 1;
    height: 34%;
    background: linear-gradient(180deg, var(--sheen-soft) 0%, transparent 100%);
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
    border-radius: var(--radius-sm);
    font-family: var(--font-display);
    font-size: var(--text-sm);
    font-weight: 700;
    letter-spacing: var(--tracking-wide);
    text-align: center;
    color: var(--metal-bright);
    box-shadow: inset 0 0 0 var(--border-hair) var(--ground-deep), var(--shadow-sm);
  }

  .dnd-stat-lit {
    --stat-brace: var(--stat-light);
    --stat-rim: var(--stat-light);
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
