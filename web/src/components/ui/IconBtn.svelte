<script lang="ts">
  import type { Snippet } from 'svelte'

  const {
    title,
    tone = 'metal',
    active = false,
    disabled = false,
    onclick,
    onpointerdown,
    children
  }: {
    /** Reads as the accessible name and the native tooltip. */
    title: string
    /** Colours the glyph. */
    tone?: 'metal' | 'ember' | 'verdigris' | 'ink'
    /** Lights the glyph to mark it as chosen. */
    active?: boolean
    /** Blocks the press and dims the glyph. */
    disabled?: boolean
    /** Runs when the button is pressed. */
    onclick?: (event: MouseEvent) => void
    /** Runs when the pointer lands, for a control that drags. */
    onpointerdown?: (event: PointerEvent) => void
    /** The glyph the button carries and nothing else. */
    children?: Snippet
  } = $props()
</script>

<button
  type="button"
  class="dnd-iconbtn dnd-iconbtn-{tone}"
  class:dnd-iconbtn-on={active}
  aria-pressed={active || undefined}
  aria-label={title}
  {title}
  {disabled}
  {onclick}
  {onpointerdown}
>
  {@render children?.()}
</button>

<style>
  .dnd-iconbtn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    height: 100%;
    aspect-ratio: 1;
    padding: 0;
    border: none;
    border-radius: var(--radius-sm);
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--stone-light) 20%, transparent) 0%, color-mix(in srgb, #000 45%, transparent) 60%, color-mix(in srgb, #000 65%, transparent) 100%),
      var(--texture-stone),
      var(--stone);
    box-shadow:
      inset 0 0 0 1px var(--keyline),
      inset 0 0 0 2px var(--metal-dim),
      inset 0 0 0 3px var(--keyline),
      inset 0 0.25rem 0 -1px var(--sheen),
      inset 0 -0.25rem 0 -1px var(--shade-hard),
      0 1px 2px var(--shade-hard);
    color: var(--icon-tone);
    filter: drop-shadow(0 1px 0 #000);
    cursor: pointer;
    --icon-tone: var(--metal);
    transition: color 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease;
  }

  .dnd-iconbtn-metal {
    --icon-tone: var(--metal);
  }

  .dnd-iconbtn-ember {
    --icon-tone: var(--ember);
  }

  .dnd-iconbtn-verdigris {
    --icon-tone: var(--verdigris);
  }

  .dnd-iconbtn-ink {
    --icon-tone: var(--ink-dim);
  }

  .dnd-iconbtn:hover:not(:disabled) {
    color: var(--metal-bright);
    box-shadow:
      inset 0 0 0 1px var(--keyline),
      inset 0 0 0 2px var(--metal),
      inset 0 0 0 3px var(--keyline),
      inset 0 0.25rem 0 -1px var(--sheen),
      inset 0 -0.25rem 0 -1px var(--shade-hard),
      inset 0 0 10px var(--ember-glow),
      0 1px 2px var(--shade-hard);
    filter: drop-shadow(0 0 4px var(--ember-glow));
  }

  .dnd-iconbtn:active:not(:disabled) {
    box-shadow:
      inset 0 0 0 1px var(--keyline),
      inset 0 0 0 2px var(--metal-dim),
      inset 0 0 0 3px var(--keyline),
      inset 0 3px 5px var(--shade-hard);
    filter: brightness(0.85);
  }

  .dnd-iconbtn-on {
    color: var(--metal-bright);
    box-shadow:
      inset 0 0 0 1px var(--keyline),
      inset 0 0 0 2px var(--metal-bright),
      inset 0 0 0 3px var(--keyline),
      inset 0 0 12px var(--ember-glow),
      0 0 8px var(--ember-glow);
  }

  .dnd-iconbtn:disabled {
    cursor: not-allowed;
    opacity: 0.4;
    filter: grayscale(0.85);
  }

  .dnd-iconbtn:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
</style>
