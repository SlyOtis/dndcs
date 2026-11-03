<script lang="ts">
  const {
    size = 'lg',
    lit = true
  }: {
    /** Sets the height of the window. */
    size?: 'md' | 'lg' | 'xl'
    /** Lets light bleed through the panes and breathe. */
    lit?: boolean
  } = $props()
</script>

<div class="dnd-glass dnd-glass-{size}" class:dnd-glass-lit={lit} aria-hidden="true">
  <span class="dnd-glass-shine"></span>

  <svg class="dnd-glass-panes" viewBox="0 0 200 320" fill="none" focusable="false">
    <defs>
      <clipPath id="dnd-glass-clip">
        <path d="M20 316V96C20 50 56 14 100 14s80 36 80 82v220H20Z" />
      </clipPath>
    </defs>

    <g clip-path="url(#dnd-glass-clip)">
      <rect x="0" y="0" width="200" height="320" fill="var(--ground-deep)" />
      <path d="M20 96C20 50 56 14 100 14v130L20 96Z" fill="var(--verdigris)" opacity="0.38" />
      <path d="M180 96C180 50 144 14 100 14v130l80-48Z" fill="var(--ember)" opacity="0.4" />
      <path d="M20 96v88h80v-40L20 96Z" fill="var(--ember)" opacity="0.3" />
      <path d="M180 96v88h-80v-40l80-48Z" fill="var(--metal)" opacity="0.32" />
      <path d="M20 184h80v132H20V184Z" fill="var(--metal-dim)" opacity="0.5" />
      <path d="M100 184h80v132h-80V184Z" fill="var(--ember)" opacity="0.22" />
      <circle cx="100" cy="112" r="30" fill="var(--metal)" opacity="0.4" />
      <circle cx="100" cy="112" r="16" fill="var(--ember-core)" opacity="0.55" />
      <path d="M100 220m-26 0a26 26 0 1 0 52 0a26 26 0 1 0-52 0" fill="var(--metal-bright)" opacity="0.2" />
    </g>

    <g stroke="var(--ground-deep)" stroke-width="5" fill="none">
      <path d="M100 14v302M20 96h160M20 144h160M20 184h160M20 240h160M60 184v132M140 184v132" />
    </g>

    <path
      d="M20 316V96C20 50 56 14 100 14s80 36 80 82v220"
      stroke="url(#dnd-grad-metal)"
      stroke-width="7"
      fill="none"
    />
    <path
      d="M32 316V98C32 58 62 26 100 26s68 32 68 72v218"
      stroke="var(--metal-dim)"
      stroke-width="1.6"
      fill="none"
    />
    <path d="M100 2 88 20h24L100 2Z" fill="var(--metal-bright)" />
  </svg>
</div>

<style>
  .dnd-glass {
    position: relative;
    display: inline-block;
    --glass-h: 20rem;
    height: var(--glass-h);
    pointer-events: none;
  }

  .dnd-glass-md {
    --glass-h: 12.5rem;
  }

  .dnd-glass-lg {
    --glass-h: 20rem;
  }

  .dnd-glass-xl {
    --glass-h: 32.5rem;
  }

  .dnd-glass-panes {
    position: relative;
    z-index: 1;
    height: 100%;
    width: auto;
    filter: drop-shadow(0 0 1.5rem var(--shade-hard));
  }

  .dnd-glass-shine {
    position: absolute;
    top: -13%;
    left: 50%;
    width: 260%;
    height: 130%;
    transform: translateX(-50%);
    background: radial-gradient(closest-side ellipse at 50% 50%, var(--ember-glow) 0%, transparent 100%);
    opacity: 0.5;
  }

  .dnd-glass-lit .dnd-glass-shine {
    animation: dnd-glass-breathe 9s ease-in-out infinite alternate;
  }

  .dnd-glass-lit .dnd-glass-panes {
    animation: dnd-glass-warm 9s ease-in-out infinite alternate;
  }

  @keyframes dnd-glass-breathe {
    from {
      opacity: 0.35;
      transform: translateX(-50%) scale(0.95);
    }
    to {
      opacity: 0.75;
      transform: translateX(-50%) scale(1.05);
    }
  }

  @keyframes dnd-glass-warm {
    from {
      filter: drop-shadow(0 0 1.5rem var(--shade-hard)) brightness(0.92);
    }
    to {
      filter: drop-shadow(0 0 2.1rem var(--shade-hard)) brightness(1.12);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .dnd-glass-lit .dnd-glass-shine,
    .dnd-glass-lit .dnd-glass-panes {
      animation: none;
    }
  }
</style>
