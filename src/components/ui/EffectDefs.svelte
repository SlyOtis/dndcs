<svg class="dnd-effectdefs" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="dnd-grad-metal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="var(--metal-bright)" />
      <stop offset="45%" stop-color="var(--metal)" />
      <stop offset="100%" stop-color="var(--metal-dim)" />
    </linearGradient>

    <linearGradient id="dnd-grad-metal-sheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="var(--metal-dim)" />
      <stop offset="35%" stop-color="var(--metal-bright)" />
      <stop offset="55%" stop-color="var(--metal)" />
      <stop offset="100%" stop-color="var(--metal-dim)" />
    </linearGradient>

    <linearGradient id="dnd-grad-verdigris" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="var(--verdigris)" />
      <stop offset="100%" stop-color="var(--verdigris-dim)" />
    </linearGradient>

    <linearGradient id="dnd-grad-ember" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="var(--ember)" />
      <stop offset="60%" stop-color="var(--ember-core)" />
      <stop offset="100%" stop-color="var(--ember)" />
    </linearGradient>

    <linearGradient id="dnd-grad-flame" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="var(--ember)" stop-opacity="0.1" />
      <stop offset="18%" stop-color="var(--ember)" stop-opacity="0.95" />
      <stop offset="55%" stop-color="var(--ember-core)" />
      <stop offset="88%" stop-color="var(--ember-core)" stop-opacity="0.6" />
      <stop offset="100%" stop-color="var(--ember-core)" stop-opacity="0" />
    </linearGradient>

    <radialGradient id="dnd-grad-orb" cx="35%" cy="28%" r="78%">
      <stop offset="0%" stop-color="var(--ember-core)" />
      <stop offset="42%" stop-color="var(--ember)" />
      <stop offset="100%" stop-color="var(--ground-deep)" />
    </radialGradient>

    <radialGradient id="dnd-grad-halo" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="var(--ember-core)" stop-opacity="0.55" />
      <stop offset="55%" stop-color="var(--ember)" stop-opacity="0.18" />
      <stop offset="100%" stop-color="var(--ember)" stop-opacity="0" />
    </radialGradient>

    <linearGradient id="dnd-grad-stone" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="var(--ground-lift)" />
      <stop offset="55%" stop-color="var(--ground-raised)" />
      <stop offset="100%" stop-color="var(--ground)" />
    </linearGradient>

    <pattern id="dnd-pattern-chain" width="16" height="24" patternUnits="userSpaceOnUse">
      <ellipse
        cx="8"
        cy="12"
        rx="6"
        ry="12"
        fill="none"
        stroke="var(--metal)"
        stroke-width="2"
        stroke-opacity="0.8"
      />
    </pattern>

    <filter id="dnd-fx-flame" x="-60%" y="-30%" width="220%" height="180%">
      <feTurbulence type="fractalNoise" baseFrequency="0.022 0.06" numOctaves="3" seed="7" result="churn">
        <animate attributeName="seed" from="0" to="48" dur="2.4s" repeatCount="indefinite" />
      </feTurbulence>
      <feDisplacementMap in="SourceGraphic" in2="churn" scale="26" xChannelSelector="R" yChannelSelector="G" />
      <feGaussianBlur stdDeviation="1.4" />
    </filter>

    <filter id="dnd-fx-flame-soft" x="-80%" y="-40%" width="260%" height="200%">
      <feTurbulence type="fractalNoise" baseFrequency="0.014 0.038" numOctaves="2" seed="21" result="churn">
        <animate attributeName="seed" from="48" to="0" dur="3.9s" repeatCount="indefinite" />
      </feTurbulence>
      <feDisplacementMap in="SourceGraphic" in2="churn" scale="38" xChannelSelector="R" yChannelSelector="G" />
      <feGaussianBlur stdDeviation="4" />
    </filter>

    <filter id="dnd-fx-smoke" x="-100%" y="-60%" width="300%" height="240%">
      <feTurbulence type="fractalNoise" baseFrequency="0.008 0.016" numOctaves="4" seed="3" result="churn">
        <animate attributeName="seed" from="0" to="64" dur="11s" repeatCount="indefinite" />
      </feTurbulence>
      <feDisplacementMap in="SourceGraphic" in2="churn" scale="58" xChannelSelector="R" yChannelSelector="G" />
      <feGaussianBlur stdDeviation="9" />
    </filter>

    <filter id="dnd-fx-glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="3.5" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <filter id="dnd-fx-forged" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" result="grain" />
      <feDisplacementMap in="SourceGraphic" in2="grain" scale="1.6" xChannelSelector="R" yChannelSelector="G" />
    </filter>

    <filter id="dnd-fx-arcane" x="-70%" y="-70%" width="240%" height="240%">
      <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="11" result="churn">
        <animate attributeName="seed" from="0" to="32" dur="7s" repeatCount="indefinite" />
      </feTurbulence>
      <feDisplacementMap in="SourceGraphic" in2="churn" scale="12" xChannelSelector="R" yChannelSelector="G" />
      <feGaussianBlur stdDeviation="1.2" />
    </filter>
  </defs>
</svg>

<style>
  .dnd-effectdefs {
    position: absolute;
    width: 0;
    height: 0;
    overflow: hidden;
    pointer-events: none;
  }
</style>
