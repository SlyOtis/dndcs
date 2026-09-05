<script lang="ts">
  const {
    name,
    size = 'md'
  }: {
    /** Picks which mark is drawn. */
    name: GlyphName
    /** Scales the mark against the type scale. */
    size?: 'sm' | 'md' | 'lg'
  } = $props()
</script>

<script lang="ts" module>
  export type GlyphName =
    | 'menu'
    | 'chat'
    | 'send'
    | 'export'
    | 'levelup'
    | 'sources'
    | 'theme'
    | 'reveal'
    | 'conceal'
    | 'sound'
    | 'search'
    | 'close'
    | 'character'
    | 'campaign'
</script>

<svg
  class="dnd-glyph dnd-glyph-{size}"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.6"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  focusable="false"
>
  {#if name === 'menu'}
    <path d="M4 7h16M4 12h16M4 17h16" />
    <path d="M12 3.5 13.4 5 12 6.5 10.6 5 12 3.5Z" fill="currentColor" stroke="none" />

  {:else if name === 'chat'}
    <path d="M4 9c0-2.2 1.8-4 4-4h8c2.2 0 4 1.8 4 4v4c0 2.2-1.8 4-4 4h-4l-4 3v-3c-2.2 0-4-1.8-4-4Z" />
    <path d="M9 11h6" opacity="0.7" />

  {:else if name === 'send'}
    <path d="M4 12 20 6l-4 6 4 6Z" />
    <path d="M4 12h9" opacity="0.75" />

  {:else if name === 'export'}
    <path d="M12 4v10" />
    <path d="M8.5 10.5 12 14l3.5-3.5" />
    <path d="M5 16v2c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-2" />

  {:else if name === 'levelup'}
    <path d="M12 3.5 15 8h-2.2v5h-1.6V8H9L12 3.5Z" fill="currentColor" stroke="none" />
    <path d="M6 16h12M7.5 19.5h9" />

  {:else if name === 'sources'}
    <path d="M6 4h8l4 4v12H6Z" />
    <path d="M14 4v4h4" opacity="0.8" />
    <path d="M9 13h6M9 16.5h4" opacity="0.7" />

  {:else if name === 'theme'}
    <circle cx="12" cy="12" r="8" />
    <path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor" stroke="none" opacity="0.85" />

  {:else if name === 'reveal'}
    <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" />

  {:else if name === 'conceal'}
    <path d="M2.5 12S6 6.5 12 6.5c1.6 0 3 .4 4.2 1" />
    <path d="M21.5 12s-2 3.2-5.6 4.6" opacity="0.8" />
    <path d="M4 4l16 16" />

  {:else if name === 'sound'}
    <path d="M5 10v4h3l4 3V7l-4 3Z" fill="currentColor" stroke="none" />
    <path d="M15.5 9.5a3.5 3.5 0 0 1 0 5" />
    <path d="M18 7a7 7 0 0 1 0 10" opacity="0.7" />

  {:else if name === 'search'}
    <circle cx="10.5" cy="10.5" r="6" />
    <path d="M15 15l5 5" />

  {:else if name === 'close'}
    <path d="M7 7l10 10M17 7 7 17" />

  {:else if name === 'character'}
    <path d="M12 3 14.4 8.2 20 9l-4 4 .9 5.6L12 16l-4.9 2.6L8 13 4 9l5.6-.8L12 3Z" />
    <path d="M12 7.5 13 10l2.6.4-1.9 1.8.5 2.6-2.2-1.2-2.2 1.2.5-2.6L8.4 10.4 11 10l1-2.5Z" fill="currentColor" stroke="none" opacity="0.8" />

  {:else if name === 'campaign'}
    <path d="M4 20V9l4-3 4 3 4-3 4 3v11Z" />
    <path d="M8 20v-5h3v5M13 20v-5h3v5" opacity="0.75" />
    <path d="M12 3v3" />
  {/if}
</svg>

<style>
  .dnd-glyph {
    display: block;
    width: var(--glyph-d);
    height: var(--glyph-d);
    --glyph-d: 20px;
  }

  .dnd-glyph-sm {
    --glyph-d: 15px;
  }

  .dnd-glyph-md {
    --glyph-d: 20px;
  }

  .dnd-glyph-lg {
    --glyph-d: 26px;
  }
</style>
