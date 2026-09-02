<script lang="ts">
  const {
    name,
    size = 'md',
    tone = 'metal',
    flip = false,
    rotate = 0
  }: {
    /** Picks which vector is drawn. */
    name: 'corner' | 'crest' | 'rosette' | 'divider' | 'vine' | 'skull' | 'chain' | 'rune' | 'dragon' | 'arch'
    /** Scales the vector against the type scale. */
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    /** Colours the vector against the active theme. */
    tone?: 'metal' | 'verdigris' | 'ember' | 'ink'
    /** Mirrors the vector horizontally. */
    flip?: boolean
    /** Turns the vector by whole degrees. */
    rotate?: number
  } = $props()

  const boxes: Record<string, string> = {
    corner: '0 0 120 120',
    crest: '0 0 180 96',
    rosette: '0 0 64 64',
    divider: '0 0 260 28',
    vine: '0 0 260 44',
    skull: '0 0 64 64',
    chain: '0 0 260 24',
    rune: '0 0 48 48',
    dragon: '0 0 128 176',
    arch: '0 0 160 200'
  }

  const box = $derived(boxes[name])
  const spin = $derived(`rotate(${rotate}deg)${flip ? ' scaleX(-1)' : ''}`)
</script>

<svg
  class="dnd-ornament dnd-ornament-{name} dnd-ornament-{size} dnd-ornament-{tone}"
  viewBox={box}
  style="transform: {spin}"
  fill="none"
  aria-hidden="true"
  focusable="false"
>
  {#if name === 'corner'}
    <path d="M3 118V22C3 11 11 3 22 3h96" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
    <path d="M13 118V28C13 19 19 13 28 13h90" stroke="currentColor" stroke-width="1" opacity="0.55" />
    <path
      d="M13 74c0-30 22-52 52-52"
      stroke="currentColor"
      stroke-width="1.6"
      opacity="0.7"
      stroke-linecap="round"
    />
    <path
      d="M26 28c19 0 30 10 30 25 0 12-9 20-19 18-8-2-11-10-6-15 5-5 13-1 12 6"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
    />
    <path
      d="M56 53c17-3 30-16 36-38"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
    />
    <path
      d="M70 44c9 3 17 0 21-9-9-4-17-1-21 9Z"
      fill="currentColor"
      opacity="0.85"
    />
    <path
      d="M28 92c14 2 24-4 27-18-14-3-24 4-27 18Z"
      class="dnd-ornament-accent"
      opacity="0.9"
    />
    <path
      d="M18 108c9 1 15-3 17-11-9-2-15 2-17 11Z"
      class="dnd-ornament-accent"
      opacity="0.6"
    />
    <circle cx="22" cy="22" r="5" stroke="currentColor" stroke-width="2" />
    <circle cx="22" cy="22" r="1.8" fill="currentColor" />
    <path d="M3 118h10M118 3v10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
  {:else if name === 'crest'}
    <path
      d="M90 6 78 20h24L90 6Z"
      fill="currentColor"
    />
    <path
      d="M90 18c-10 0-18 6-18 16 0 14 10 24 18 34 8-10 18-20 18-34 0-10-8-16-18-16Z"
      fill="url(#dnd-grad-metal)"
      stroke="currentColor"
      stroke-width="1.6"
    />
    <path d="M90 30v22M82 40h16" stroke="var(--ground-deep)" stroke-width="2.4" stroke-linecap="round" />
    <path
      d="M72 34C52 30 34 38 18 58c18 4 32 0 42-10"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
    />
    <path
      d="M108 34c20-4 38 4 54 24-18 4-32 0-42-10"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
    />
    <path
      d="M60 48c-14 6-26 4-38-6 14-8 28-6 38 6Z"
      class="dnd-ornament-accent"
    />
    <path
      d="M120 48c14 6 26 4 38-6-14-8-28-6-38 6Z"
      class="dnd-ornament-accent"
    />
    <path
      d="M46 70c12 10 26 15 44 16 18-1 32-6 44-16"
      stroke="currentColor"
      stroke-width="1.4"
      opacity="0.6"
      stroke-linecap="round"
    />
    <circle cx="90" cy="86" r="4" fill="currentColor" />
    <path d="M74 86h-10M106 86h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
  {:else if name === 'rosette'}
    <g stroke="currentColor" stroke-width="1.8">
      <circle cx="32" cy="32" r="26" opacity="0.5" />
      <circle cx="32" cy="32" r="19" />
      <circle cx="32" cy="32" r="6" fill="currentColor" />
    </g>
    <g class="dnd-ornament-accent">
      <path d="M32 6c5 9 5 17 0 26-5-9-5-17 0-26Z" />
      <path d="M32 58c-5-9-5-17 0-26 5 9 5 17 0 26Z" />
      <path d="M6 32c9-5 17-5 26 0-9 5-17 5-26 0Z" />
      <path d="M58 32c-9 5-17 5-26 0 9-5 17-5 26 0Z" />
    </g>
    <g stroke="currentColor" stroke-width="1.4" opacity="0.75">
      <path d="M14 14 24 24M50 14 40 24M14 50l10-10M50 50 40 40" />
    </g>
  {:else if name === 'divider'}
    <path d="M4 14h96M160 14h96" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
    <path d="M20 14h72M168 14h72" stroke="currentColor" stroke-width="3" opacity="0.35" stroke-linecap="round" />
    <path
      d="M100 14c8-8 16-8 22 0-6 8-14 8-22 0ZM160 14c-8-8-16-8-22 0 6 8 14 8 22 0Z"
      fill="currentColor"
      opacity="0.8"
    />
    <path d="M130 4 140 14 130 24 120 14 130 4Z" fill="url(#dnd-grad-metal)" stroke="currentColor" stroke-width="1.4" />
    <circle cx="130" cy="14" r="2.6" class="dnd-ornament-accent-fill" />
    <circle cx="8" cy="14" r="3" fill="currentColor" />
    <circle cx="252" cy="14" r="3" fill="currentColor" />
  {:else if name === 'vine'}
    <path
      d="M2 22C40 22 48 6 84 6s44 32 82 32 52-22 90-22"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
    />
    <path
      d="M46 16c10-8 22-8 32 2-12 8-24 6-32-2Z"
      class="dnd-ornament-accent"
    />
    <path
      d="M124 28c12-6 24-2 30 10-14 4-25-1-30-10Z"
      class="dnd-ornament-accent"
    />
    <path
      d="M196 24c10-9 22-10 33-2-11 9-24 10-33 2Z"
      class="dnd-ornament-accent"
    />
    <path
      d="M84 6c-6-6-4-14 4-16 4 8 2 14-4 16Z"
      fill="currentColor"
      opacity="0.7"
    />
    <path
      d="M166 38c6 6 4 14-4 16-4-8-2-14 4-16Z"
      fill="currentColor"
      opacity="0.7"
    />
  {:else if name === 'skull'}
    <path
      d="M32 4C17 4 6 15 6 30c0 9 4 15 8 19 2 2 2 5 2 8 0 2 2 3 4 3h24c2 0 4-1 4-3 0-3 0-6 2-8 4-4 8-10 8-19C58 15 47 4 32 4Z"
      fill="url(#dnd-grad-stone)"
      stroke="currentColor"
      stroke-width="1.8"
    />
    <ellipse cx="22" cy="29" rx="7" ry="8" fill="var(--ground-deep)" />
    <ellipse cx="42" cy="29" rx="7" ry="8" fill="var(--ground-deep)" />
    <circle cx="22" cy="30" r="2" class="dnd-ornament-accent-fill" />
    <circle cx="42" cy="30" r="2" class="dnd-ornament-accent-fill" />
    <path d="M32 36l-4 8h8l-4-8Z" fill="var(--ground-deep)" />
    <path d="M22 50v8M32 50v9M42 50v8" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
  {:else if name === 'chain'}
    <g stroke="currentColor" stroke-width="2" fill="none">
      <ellipse cx="16" cy="12" rx="12" ry="7" />
      <ellipse cx="40" cy="12" rx="12" ry="7" />
      <ellipse cx="64" cy="12" rx="12" ry="7" />
      <ellipse cx="88" cy="12" rx="12" ry="7" />
      <ellipse cx="112" cy="12" rx="12" ry="7" />
      <ellipse cx="136" cy="12" rx="12" ry="7" />
      <ellipse cx="160" cy="12" rx="12" ry="7" />
      <ellipse cx="184" cy="12" rx="12" ry="7" />
      <ellipse cx="208" cy="12" rx="12" ry="7" />
      <ellipse cx="232" cy="12" rx="12" ry="7" />
    </g>
  {:else if name === 'rune'}
    <circle cx="24" cy="24" r="21" stroke="currentColor" stroke-width="2" />
    <circle cx="24" cy="24" r="16" stroke="currentColor" stroke-width="0.9" opacity="0.5" />
    <path
      d="M24 10v28M24 16l9-6M24 24l9-6M24 24l-9 6M24 32l-9 6"
      stroke="currentColor"
      stroke-width="2.4"
      stroke-linecap="round"
      class="dnd-ornament-accent-stroke"
    />
    <path d="M24 1v5M24 42v5M1 24h5M42 24h5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
  {:else if name === 'dragon'}
    <path
      d="M100 12c-22-6-46 4-58 24-10 17-8 36 4 50 10 12 12 24 6 36-4 8-12 14-22 16 20 6 40-2 50-20 8-14 6-30-4-42-8-10-10-20-4-30 6-11 18-16 30-14"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
    />
    <path
      d="M100 12c14 2 22 12 22 26 0 12-8 20-20 20-8 0-14-4-16-12"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
    />
    <path
      d="M104 22c8 0 12 6 10 14-2 6-8 8-14 6"
      stroke="currentColor"
      stroke-width="2"
      opacity="0.7"
    />
    <circle cx="112" cy="30" r="3.4" class="dnd-ornament-accent-fill" />
    <path
      d="M86 58c-14 6-22 20-20 36 12-6 20-18 20-36Z"
      class="dnd-ornament-accent"
    />
    <path
      d="M62 108c-14 4-22 16-22 32 12-6 20-18 22-32Z"
      class="dnd-ornament-accent"
    />
    <path d="M92 6l10 8-14 4 4-12Z" fill="currentColor" />
    <path d="M76 20c-8-4-16-2-22 6 8 4 17 2 22-6Z" fill="currentColor" opacity="0.8" />
  {:else if name === 'arch'}
    <path
      d="M12 198V78C12 36 42 6 80 6s68 30 68 72v120"
      stroke="currentColor"
      stroke-width="2.6"
    />
    <path
      d="M24 198V80c0-34 24-60 56-60s56 26 56 60v118"
      stroke="currentColor"
      stroke-width="1"
      opacity="0.55"
    />
    <path
      d="M80 20c-18 0-32 16-32 38v140h64V58c0-22-14-38-32-38Z"
      fill="url(#dnd-grad-verdigris)"
      opacity="0.35"
    />
    <path d="M80 20v178M48 74h64M48 122h64M48 170h64" stroke="currentColor" stroke-width="1.2" opacity="0.65" />
    <path d="M80 6 70 20h20L80 6Z" fill="currentColor" />
    <circle cx="80" cy="52" r="7" stroke="currentColor" stroke-width="1.6" />
    <circle cx="80" cy="52" r="2.6" class="dnd-ornament-accent-fill" />
  {/if}
</svg>

<style>
  .dnd-ornament {
    display: block;
    flex: none;
    overflow: visible;
    pointer-events: none;
  }

  .dnd-ornament-metal {
    color: var(--metal);
  }

  .dnd-ornament-verdigris {
    color: var(--verdigris);
  }

  .dnd-ornament-ember {
    color: var(--ember);
  }

  .dnd-ornament-ink {
    color: var(--ink-dim);
  }

  .dnd-ornament-accent {
    fill: var(--verdigris);
  }

  .dnd-ornament-accent-fill {
    fill: var(--ember);
  }

  .dnd-ornament-accent-stroke {
    stroke: var(--ember);
  }

  .dnd-ornament-ember .dnd-ornament-accent,
  .dnd-ornament-ember .dnd-ornament-accent-fill {
    fill: var(--metal);
  }

  .dnd-ornament-xs {
    width: auto;
    height: 16px;
  }

  .dnd-ornament-sm {
    width: auto;
    height: 28px;
  }

  .dnd-ornament-md {
    width: auto;
    height: 48px;
  }

  .dnd-ornament-lg {
    width: auto;
    height: 88px;
  }

  .dnd-ornament-xl {
    width: auto;
    height: 150px;
  }

  .dnd-ornament-divider,
  .dnd-ornament-chain,
  .dnd-ornament-vine {
    width: 100%;
    height: auto;
  }
</style>
