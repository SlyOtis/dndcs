<script lang="ts">
  const {
    variant = 'motes',
    tone = 'ember',
    density = 'normal'
  }: {
    /** Picks which magical layer is drawn. */
    variant?: 'motes' | 'runes' | 'wisps' | 'veil'
    /** Colours the effect against the active theme. */
    tone?: 'ember' | 'verdigris' | 'metal'
    /** Sets how much of the effect is drawn. */
    density?: 'sparse' | 'normal' | 'thick'
  } = $props()

  const motes = $derived(density === 'sparse' ? 8 : density === 'thick' ? 28 : 16)
  const seeds = $derived(
    Array.from({ length: motes }, (_, index) => ({
      left: ((index * 37) % 100) + 0.5,
      delay: (index * 1.31) % 12,
      span: 9 + ((index * 7) % 11),
      drift: ((index * 23) % 60) - 30,
      scale: 0.5 + ((index * 13) % 9) / 10
    }))
  )
</script>

<div class="dnd-aura dnd-aura-{variant} dnd-aura-{tone}" aria-hidden="true">
  {#if variant === 'motes'}
    {#each seeds as seed (seed.left + seed.delay)}
      <span
        class="dnd-aura-mote"
        style="left: {seed.left}%; animation-delay: -{seed.delay}s; animation-duration: {seed.span}s; --mote-drift: {seed.drift}px; --mote-scale: {seed.scale}"
      ></span>
    {/each}
  {:else if variant === 'runes'}
    <svg class="dnd-aura-ring" viewBox="0 0 200 200" fill="none" focusable="false">
      <circle cx="100" cy="100" r="92" stroke="currentColor" stroke-width="1" opacity="0.35" />
      <circle
        cx="100"
        cy="100"
        r="76"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-dasharray="4 10"
        opacity="0.7"
      />
      <circle cx="100" cy="100" r="58" stroke="currentColor" stroke-width="0.8" opacity="0.4" />
      <g class="dnd-aura-glyphs" filter="url(#dnd-fx-glow)">
        <path d="M100 14v16M100 170v16M14 100h16M170 100h16" stroke="currentColor" stroke-width="2.4" />
        <path d="M39 39l11 11M161 39l-11 11M39 161l11-11M161 161l-11-11" stroke="currentColor" stroke-width="1.8" />
        <path d="M100 30l-8 12h16l-8-12ZM100 170l-8-12h16l-8 12Z" fill="currentColor" />
      </g>
    </svg>
  {:else if variant === 'wisps'}
    <svg class="dnd-aura-wisps" viewBox="0 0 400 300" preserveAspectRatio="none" fill="none" focusable="false">
      <path
        d="M-20 260C60 250 90 180 150 176s90 54 150 40 90-80 130-96"
        stroke="currentColor"
        stroke-width="26"
        stroke-linecap="round"
        opacity="0.16"
        filter="url(#dnd-fx-smoke)"
      />
      <path
        d="M-20 200C60 210 110 130 170 126s80 44 140 30 80-70 120-86"
        stroke="currentColor"
        stroke-width="14"
        stroke-linecap="round"
        opacity="0.2"
        filter="url(#dnd-fx-arcane)"
      />
    </svg>
  {:else}
    <span class="dnd-aura-veil"></span>
  {/if}
</div>

<style>
  .dnd-aura {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    z-index: 0;
  }

  .dnd-aura-ember {
    color: var(--ember);
  }

  .dnd-aura-verdigris {
    color: color-mix(in srgb, var(--verdigris) 35%, var(--ember));
  }

  .dnd-aura-metal {
    color: var(--metal);
  }

  .dnd-aura-mote {
    position: absolute;
    bottom: -0.5rem;
    width: 0.25rem;
    height: 0.25rem;
    border-radius: var(--radius-pill);
    background: radial-gradient(circle, var(--ember-core) 0%, currentColor 60%);
    box-shadow: 0 0 0.5rem currentColor, 0 0 1rem var(--ember-glow);
    opacity: 0;
    animation-name: dnd-aura-rise;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
  }

  .dnd-aura-ring {
    position: absolute;
    top: 50%;
    left: 50%;
    width: min(88%, 40rem);
    height: auto;
    transform: translate(-50%, -50%);
    opacity: 0.5;
    animation: dnd-aura-spin 46s linear infinite;
  }

  .dnd-aura-glyphs {
    transform-origin: 100px 100px;
    animation: dnd-aura-spin-back 32s linear infinite;
  }

  .dnd-aura-wisps {
    position: absolute;
    inset: -10%;
    width: 120%;
    height: 120%;
    animation: dnd-aura-slide 26s ease-in-out infinite alternate;
  }

  .dnd-aura-veil {
    position: absolute;
    inset: -20%;
    background:
      radial-gradient(ellipse at 20% 15%, currentColor 0%, transparent 42%),
      radial-gradient(ellipse at 82% 78%, currentColor 0%, transparent 46%);
    opacity: 0.1;
    animation: dnd-aura-breathe 12s ease-in-out infinite alternate;
  }

  @keyframes dnd-aura-rise {
    0% {
      opacity: 0;
      transform: translate(0, 0) scale(var(--mote-scale));
    }
    14% {
      opacity: 0.9;
    }
    76% {
      opacity: 0.55;
    }
    100% {
      opacity: 0;
      transform: translate(var(--mote-drift), -105vh) scale(calc(var(--mote-scale) * 0.4));
    }
  }

  @keyframes dnd-aura-spin {
    to {
      transform: translate(-50%, -50%) rotate(360deg);
    }
  }

  @keyframes dnd-aura-spin-back {
    to {
      transform: rotate(-360deg);
    }
  }

  @keyframes dnd-aura-slide {
    from {
      transform: translate3d(-3%, 2%, 0);
    }
    to {
      transform: translate3d(3%, -2%, 0);
    }
  }

  @keyframes dnd-aura-breathe {
    from {
      opacity: 0.06;
    }
    to {
      opacity: 0.16;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .dnd-aura-mote,
    .dnd-aura-ring,
    .dnd-aura-glyphs,
    .dnd-aura-wisps,
    .dnd-aura-veil {
      animation: none;
    }

    .dnd-aura-mote {
      opacity: 0.35;
    }
  }
</style>
