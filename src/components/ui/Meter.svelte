<script lang="ts">
  import Ornament from './Ornament.svelte'

  const {
    value,
    max = 100,
    tone = 'life',
    label,
    rune = false,
    segments = 0,
    size = 'md',
    showValue = false
  }: {
    /** The filled amount, clamped between zero and max. */
    value: number
    /** The amount that fills the whole track. */
    max?: number
    /** Colours the fill against the active theme. */
    tone?: 'life' | 'mana' | 'stamina' | 'ember' | 'metal'
    /** Text written across the track. */
    label?: string
    /** Draws the rune medallion at the head of the track. */
    rune?: boolean
    /** Cuts the track into this many notches. Zero draws a smooth fill. */
    segments?: number
    /** Sets the height of the track. */
    size?: 'sm' | 'md' | 'lg'
    /** Writes the value over the max at the tail of the track. */
    showValue?: boolean
  } = $props()

  const span = $derived(max > 0 ? max : 1)
  const clamped = $derived(Math.max(0, Math.min(value, span)))
  const percent = $derived((clamped / span) * 100)
</script>

<div class="dnd-meter dnd-meter-{tone} dnd-meter-{size}">
  {#if rune}
    <span class="dnd-meter-rune">
      <Ornament name="rune" size="sm" tone="metal" />
    </span>
  {/if}

  <div
    class="dnd-meter-track"
    role="meter"
    aria-valuenow={clamped}
    aria-valuemin="0"
    aria-valuemax={span}
    aria-label={label ?? 'meter'}
  >
    <span class="dnd-meter-fill" style="width: {percent}%"></span>
    <span class="dnd-meter-sheen" style="width: {percent}%"></span>
    {#if segments > 0}
      <span class="dnd-meter-notches" style="--notch: {100 / segments}%"></span>
    {/if}
    {#if label}
      <span class="dnd-meter-label">{label}</span>
    {/if}
    {#if showValue}
      <span class="dnd-meter-value">{clamped}<span class="dnd-meter-slash">/</span>{span}</span>
    {/if}
  </div>

  <span class="dnd-meter-cap dnd-meter-cap-start"></span>
  <span class="dnd-meter-cap dnd-meter-cap-end"></span>
</div>

<style>
  .dnd-meter {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    --meter-h: 20px;
    --meter-fill: var(--state-bad);
    --meter-fill-bright: var(--ember-core);
  }

  .dnd-meter-sm {
    --meter-h: 12px;
  }

  .dnd-meter-md {
    --meter-h: 20px;
  }

  .dnd-meter-lg {
    --meter-h: 30px;
  }

  .dnd-meter-life {
    --meter-fill: var(--state-bad);
  }

  .dnd-meter-mana {
    --meter-fill: var(--verdigris);
  }

  .dnd-meter-stamina {
    --meter-fill: var(--state-good);
  }

  .dnd-meter-ember {
    --meter-fill: var(--ember);
  }

  .dnd-meter-metal {
    --meter-fill: var(--metal);
  }

  .dnd-meter-rune {
    flex: none;
    filter: drop-shadow(0 0 6px var(--ember-glow));
  }

  .dnd-meter-track {
    position: relative;
    flex: 1;
    height: var(--meter-h);
    min-width: 0;
    overflow: hidden;
    background: linear-gradient(180deg, var(--ground-deep) 0%, var(--ground) 100%);
    border: var(--border-hair) solid var(--metal-dim);
    box-shadow: inset 0 2px 5px var(--shade-hard);
    clip-path: polygon(
      8px 0,
      calc(100% - 8px) 0,
      100% 50%,
      calc(100% - 8px) 100%,
      8px 100%,
      0 50%
    );
  }

  .dnd-meter-fill {
    position: absolute;
    inset: 0 auto 0 0;
    background: linear-gradient(180deg, var(--meter-fill-bright) 0%, var(--meter-fill) 40%, var(--meter-fill) 100%);
    filter: saturate(1.2);
    box-shadow: 0 0 12px var(--meter-fill);
    transition: width 320ms ease-out;
  }

  .dnd-meter-sheen {
    position: absolute;
    top: 0;
    left: 0;
    height: 45%;
    background: linear-gradient(180deg, var(--sheen-strong), transparent);
    transition: width 320ms ease-out;
    pointer-events: none;
  }

  .dnd-meter-notches {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      90deg,
      transparent 0,
      transparent calc(var(--notch) - 2px),
      var(--ground-deep) calc(var(--notch) - 2px),
      var(--ground-deep) var(--notch)
    );
    pointer-events: none;
  }

  .dnd-meter-label {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    padding-inline-start: var(--space-3);
    font-family: var(--font-display);
    font-size: var(--text-xs);
    font-weight: 600;
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
    color: var(--ink);
    text-shadow: 0 1px 2px var(--shade-hard);
    pointer-events: none;
  }

  .dnd-meter-value {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-inline-end: var(--space-3);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--ink);
    text-shadow: 0 1px 2px var(--shade-hard);
    pointer-events: none;
  }

  .dnd-meter-slash {
    color: var(--ink-faint);
    padding: 0 2px;
  }

  .dnd-meter-cap {
    position: absolute;
    top: 50%;
    width: 12px;
    height: 12px;
    transform: translateY(-50%) rotate(45deg);
    background: linear-gradient(135deg, var(--metal-bright), var(--metal-dim));
    box-shadow: var(--glow-metal);
    pointer-events: none;
  }

  .dnd-meter-cap-start {
    left: -6px;
  }

  .dnd-meter-cap-end {
    right: -6px;
  }

  .dnd-meter-rune ~ .dnd-meter-cap-start {
    display: none;
  }
</style>
