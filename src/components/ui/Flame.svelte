<script lang="ts">
  const {
    size = 'md',
    intensity = 'steady',
    sconce = false,
    hung = false
  }: {
    /** Scales the flame and the light it throws. */
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    /** Sets how hard the flame churns and flickers. */
    intensity?: 'calm' | 'steady' | 'roaring'
    /** Draws the wall bracket and the pitch bowl under the flame. */
    sconce?: boolean
    /** Hangs the bowl on a pair of chains that run up out of the view. */
    hung?: boolean
  } = $props()
</script>

<div class="dnd-flame dnd-flame-{size} dnd-flame-{intensity}" aria-hidden="true">
  <span class="dnd-flame-halo"></span>

  {#if hung}
    <svg class="dnd-flame-hanger dnd-flame-hanger-left" fill="none" focusable="false">
      <rect width="100%" height="100%" fill="url(#dnd-pattern-chain)" />
    </svg>
    <svg class="dnd-flame-hanger dnd-flame-hanger-right" fill="none" focusable="false">
      <rect width="100%" height="100%" fill="url(#dnd-pattern-chain)" />
    </svg>
  {/if}

  <svg class="dnd-flame-body" viewBox="0 0 60 104" fill="none" focusable="false">
    <path
      class="dnd-flame-outer"
      d="M30 102C8 90 2 62 13 41 20 28 25 18 22 3c13 11 24 26 26 43 3 22 0 44-18 56Z"
      fill="url(#dnd-grad-flame)"
      filter="url(#dnd-fx-flame-soft)"
    />
    <path
      class="dnd-flame-mid"
      d="M30 98C16 88 13 66 21 50c5-9 7-17 6-27 8 10 13 23 14 35 1 17-2 32-11 40Z"
      fill="url(#dnd-grad-flame)"
      filter="url(#dnd-fx-flame)"
    />
    <path
      class="dnd-flame-core"
      d="M30 94c-7-6-9-19-5-29 3-6 4-11 4-18 5 7 8 16 8 24 0 11-2 19-7 23Z"
      fill="var(--ember-core)"
      filter="url(#dnd-fx-flame)"
    />
  </svg>

  <span class="dnd-flame-spark dnd-flame-spark-1"></span>
  <span class="dnd-flame-spark dnd-flame-spark-2"></span>
  <span class="dnd-flame-spark dnd-flame-spark-3"></span>
  <span class="dnd-flame-spark dnd-flame-spark-4"></span>
  <span class="dnd-flame-spark dnd-flame-spark-5"></span>

  {#if sconce}
    <svg class="dnd-flame-sconce" viewBox="0 0 64 88" fill="none" focusable="false">
      <path
        d="M14 30h36l-6 14H20l-6-14Z"
        fill="url(#dnd-grad-metal)"
        stroke="var(--metal-dim)"
        stroke-width="1.6"
      />
      <path d="M20 44h24l-4 10H24l-4-10Z" fill="var(--ground-deep)" opacity="0.8" />
      <path
        d="M32 54v20M32 74c-8 0-14 5-14 12h28c0-7-6-12-14-12Z"
        stroke="var(--metal)"
        stroke-width="3"
        stroke-linecap="round"
      />
      <path d="M10 30c8-8 36-8 44 0" stroke="var(--metal)" stroke-width="2.4" stroke-linecap="round" />
      <circle cx="32" cy="80" r="3" fill="var(--metal-bright)" />
    </svg>
  {/if}
</div>

<style>
  .dnd-flame {
    position: relative;
    display: inline-flex;
    align-items: flex-end;
    justify-content: center;
    pointer-events: none;
    --flame-w: 44px;
    --flame-h: 76px;
    --flame-churn: 1;
  }

  .dnd-flame-xs {
    --flame-w: 16px;
    --flame-h: 28px;
  }

  .dnd-flame-sm {
    --flame-w: 26px;
    --flame-h: 46px;
  }

  .dnd-flame-md {
    --flame-w: 44px;
    --flame-h: 76px;
  }

  .dnd-flame-lg {
    --flame-w: 72px;
    --flame-h: 124px;
  }

  .dnd-flame-xl {
    --flame-w: 118px;
    --flame-h: 200px;
  }

  .dnd-flame-body {
    position: relative;
    width: var(--flame-w);
    height: var(--flame-h);
    overflow: visible;
    transform-origin: 50% 100%;
    animation: dnd-flame-sway calc(2.6s / var(--flame-churn)) ease-in-out infinite alternate;
  }

  .dnd-flame-calm {
    --flame-churn: 0.6;
  }

  .dnd-flame-roaring {
    --flame-churn: 1.7;
  }

  .dnd-flame-outer {
    opacity: 0.55;
    transform-origin: 50% 100%;
    animation: dnd-flame-breathe calc(1.9s / var(--flame-churn)) ease-in-out infinite alternate;
  }

  .dnd-flame-mid {
    opacity: 0.92;
    transform-origin: 50% 100%;
    animation: dnd-flame-breathe calc(1.3s / var(--flame-churn)) ease-in-out infinite alternate-reverse;
  }

  .dnd-flame-core {
    opacity: 0.95;
    transform-origin: 50% 100%;
    animation: dnd-flame-breathe calc(0.8s / var(--flame-churn)) ease-in-out infinite alternate;
  }

  .dnd-flame-halo {
    position: absolute;
    left: 50%;
    bottom: 0;
    width: calc(var(--flame-w) * 5);
    height: calc(var(--flame-h) * 3);
    transform: translate(-50%, 50%);
    background: radial-gradient(closest-side ellipse at 50% 50%, var(--ember-glow) 0%, transparent 100%);
    animation: dnd-flame-halo calc(3.4s / var(--flame-churn)) ease-in-out infinite alternate;
  }

  .dnd-flame-spark {
    position: absolute;
    bottom: 22%;
    left: 50%;
    width: 3px;
    height: 3px;
    border-radius: var(--radius-pill);
    background: var(--ember-core);
    box-shadow: 0 0 6px var(--ember);
    opacity: 0;
    animation: dnd-flame-spark calc(3.6s / var(--flame-churn)) linear infinite;
  }

  .dnd-flame-spark-1 {
    --spark-x: -22px;
    animation-delay: 0s;
  }

  .dnd-flame-spark-2 {
    --spark-x: 16px;
    animation-delay: 0.7s;
  }

  .dnd-flame-spark-3 {
    --spark-x: -6px;
    animation-delay: 1.4s;
  }

  .dnd-flame-spark-4 {
    --spark-x: 28px;
    animation-delay: 2.1s;
  }

  .dnd-flame-spark-5 {
    --spark-x: -30px;
    animation-delay: 2.8s;
  }

  .dnd-flame-hanger {
    position: absolute;
    bottom: calc(var(--flame-w) * -0.225);
    width: 16px;
    height: 100vh;
  }

  .dnd-flame-hanger-left {
    left: calc(50% - var(--flame-w) * 0.379 - 8px);
  }

  .dnd-flame-hanger-right {
    right: calc(50% - var(--flame-w) * 0.379 - 8px);
  }

  .dnd-flame-sconce {
    position: absolute;
    left: 50%;
    bottom: 0;
    width: calc(var(--flame-w) * 1.35);
    height: auto;
    transform: translate(-50%, 78%);
  }

  @keyframes dnd-flame-sway {
    from {
      transform: rotate(-2.5deg) scaleY(0.97);
    }
    to {
      transform: rotate(2.5deg) scaleY(1.04);
    }
  }

  @keyframes dnd-flame-breathe {
    from {
      transform: scale(0.9, 0.86) translateY(4%);
    }
    to {
      transform: scale(1.06, 1.1) translateY(-3%);
    }
  }

  @keyframes dnd-flame-halo {
    from {
      opacity: 0.55;
      transform: translate(-50%, 50%) scale(0.92);
    }
    to {
      opacity: 0.95;
      transform: translate(-50%, 50%) scale(1.08);
    }
  }

  @keyframes dnd-flame-spark {
    0% {
      opacity: 0;
      transform: translate(-50%, 0) scale(0.6);
    }
    12% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translate(calc(-50% + var(--spark-x)), calc(var(--flame-h) * -1.5)) scale(0.2);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .dnd-flame-body,
    .dnd-flame-outer,
    .dnd-flame-mid,
    .dnd-flame-core,
    .dnd-flame-halo,
    .dnd-flame-spark {
      animation: none;
    }

    .dnd-flame-spark {
      opacity: 0;
    }
  }
</style>
