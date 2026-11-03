<script lang="ts">
  import type { Snippet } from 'svelte'
  import Sigil, { type SigilFrame } from './Sigil.svelte'

  const {
    title,
    frame = 'ring',
    tone = 'metal',
    size = 'md',
    count,
    active = false,
    disabled = false,
    onclick,
    children
  }: {
    /** Reads as the accessible name and the native tooltip. */
    title: string
    /** Picks the traced surround the glyph sits in. */
    frame?: SigilFrame
    /** Colours the rim and the light behind the glyph. */
    tone?: 'metal' | 'ember' | 'verdigris' | 'arcane' | 'bane'
    /** Sets the diameter of the frame. */
    size?: 'sm' | 'md' | 'lg'
    /** Draws a charge count in the lower right of the rim. */
    count?: number
    /** Lights the rim to mark it as chosen. */
    active?: boolean
    /** Blocks the press and dims it. */
    disabled?: boolean
    /** Runs when the button is pressed. */
    onclick?: (event: MouseEvent) => void
    /** The glyph inside the frame. */
    children?: Snippet
  } = $props()
</script>

<Sigil {title} {frame} {tone} {size} {count} {active} {disabled} {onclick}>
  {@render children?.()}
</Sigil>
