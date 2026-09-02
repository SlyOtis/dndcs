<script lang="ts">
  const {
    value,
    max = 100,
    tone = 'life',
    label,
    size = 'md',
    showValue = true
  }: {
    /** The filled amount, clamped between zero and max. */
    value: number
    /** The amount that fills the whole orb. */
    max?: number
    /** Colours the liquid against the active theme. */
    tone?: 'life' | 'mana' | 'ember' | 'metal'
    /** Reads as the accessible name of the orb. */
    label?: string
    /** Sets the diameter of the orb. */
    size?: 'sm' | 'md' | 'lg'
    /** Writes the value in the middle of the orb. */
    showValue?: boolean
  } = $props()

  const span = $derived(max > 0 ? max : 1)
  const clamped = $derived(Math.max(0, Math.min(value, span)))
  const percent = $derived((clamped / span) * 100)
</script>

<div
  class="dnd-orb dnd-orb-{tone} dnd-orb-{size}"
  role="meter"
  aria-valuenow={clamped}
  aria-valuemin="0"
  aria-valuemax={span}
  aria-label={label ?? 'orb'}
>
  <span class="dnd-orb-well">
    <span class="dnd-orb-liquid" style="height: {percent}%">
      <span class="dnd-orb-wave"></span>
    </span>
    <span class="dnd-orb-gloss"></span>
  </span>

  <svg class="dnd-orb-rim" viewBox="0 0 100 100" fill="none" focusable="false" aria-hidden="true">
    <circle cx="50" cy="50" r="47" stroke="url(#dnd-grad-metal)" stroke-width="5" />
    <circle cx="50" cy="50" r="42" stroke="var(--metal-dim)" stroke-width="1.4" />
    <path d="M50 3 44 12h12L50 3Z" fill="var(--metal-bright)" />
    <path d="M50 97 44 88h12l-6 9Z" fill="var(--metal-bright)" />
    <circle cx="9" cy="50" r="3.4" fill="var(--metal)" />
    <circle cx="91" cy="50" r="3.4" fill="var(--metal)" />
  </svg>

  {#if showValue}
    <span class="dnd-orb-value">{clamped}</span>
  {/if}
</div>

<style>
  .dnd-orb {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    --orb-d: 84px;
    --orb-liquid: var(--state-bad);
    width: var(--orb-d);
    height: var(--orb-d);
    filter: drop-shadow(0 6px 14px var(--shade));
  }

  .dnd-orb-sm {
    --orb-d: 52px;
  }

  .dnd-orb-md {
    --orb-d: 84px;
  }

  .dnd-orb-lg {
    --orb-d: 132px;
  }

  .dnd-orb-life {
    --orb-liquid: var(--state-bad);
  }

  .dnd-orb-mana {
    --orb-liquid: var(--verdigris);
  }

  .dnd-orb-ember {
    --orb-liquid: var(--ember);
  }

  .dnd-orb-metal {
    --orb-liquid: var(--metal);
  }

  .dnd-orb-well {
    position: absolute;
    inset: 8%;
    border-radius: var(--radius-pill);
    overflow: hidden;
    background: radial-gradient(circle at 34% 26%, var(--ground-lift) 0%, var(--ground-deep) 78%);
    box-shadow: inset 0 4px 12px var(--shade-hard);
  }

  .dnd-orb-liquid {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(180deg, var(--orb-liquid) 0%, color-mix(in srgb, var(--orb-liquid) 55%, black) 100%);
    box-shadow: 0 0 20px var(--orb-liquid);
    transition: height 400ms ease-out;
  }

  .dnd-orb-wave {
    position: absolute;
    top: -6px;
    left: -50%;
    width: 200%;
    height: 12px;
    border-radius: var(--radius-pill);
    background: color-mix(in srgb, var(--orb-liquid) 70%, white);
    opacity: 0.7;
    animation: dnd-orb-wave 4.5s ease-in-out infinite alternate;
  }

  .dnd-orb-gloss {
    position: absolute;
    inset: 0;
    border-radius: var(--radius-pill);
    background:
      radial-gradient(ellipse at 32% 22%, var(--sheen-strong) 0%, transparent 42%),
      radial-gradient(ellipse at 62% 88%, var(--sheen-soft) 0%, transparent 40%);
    pointer-events: none;
  }

  .dnd-orb-rim {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .dnd-orb-value {
    position: relative;
    z-index: 1;
    font-family: var(--font-display);
    font-size: calc(var(--orb-d) * 0.26);
    font-weight: 700;
    color: var(--ink);
    text-shadow: 0 2px 4px var(--shade-hard);
  }

  @keyframes dnd-orb-wave {
    from {
      transform: translateX(-12%) rotate(-1.2deg);
    }
    to {
      transform: translateX(12%) rotate(1.2deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .dnd-orb-wave {
      animation: none;
    }
  }
</style>
