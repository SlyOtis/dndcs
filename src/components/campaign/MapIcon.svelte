<script lang="ts">
  import type { MapMarkerKind } from '$lib/firestore.types'

  const {
    kind,
    size = 18
  }: {
    /** Picks the glyph drawn for this marker. */
    kind: MapMarkerKind
    /** Edge length in pixels. */
    size?: number
  } = $props()

  const PATHS: Record<MapMarkerKind, string> = {
    region: 'M3 18l5-12 5 5 3-4 5 11z',
    city: 'M3 21V9l5-3 5 3v3h8v9zM7 12h2v3H7zm9 3h2v3h-2z',
    town: 'M4 21v-8l6-4 6 4v8zm5-5h2v5H9z',
    keep: 'M4 21V7h3V4h3v3h4V4h3v3h3v14h-6v-6h-4v6z',
    dungeon: 'M12 2l9 6v12H3V8zm0 6a4 4 0 00-4 4v8h8v-8a4 4 0 00-4-4z',
    inn: 'M6 3v7a6 6 0 0012 0V3h-2v6a4 4 0 01-8 0V3zM5 19h14v2H5z',
    temple: 'M12 2l8 5H4zM5 9h14v10h-4v-6h-6v6H5z',
    npc: 'M12 12a4 4 0 100-8 4 4 0 000 8zm-8 9a8 8 0 0116 0z',
    quest: 'M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',
    danger: 'M12 2l10 19H2zm-1 7v6h2V9zm0 8v2h2v-2z',
    treasure: 'M3 8h18v12H3zm0-4h18v3H3zm8 6h2v5h-2z',
    note: 'M5 3h11l3 3v15H5zm3 5h8v2H8zm0 4h8v2H8zm0 4h5v2H8z'
  }
</script>

<svg
  class="dnd-map-icon"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="currentColor"
  aria-hidden="true"
>
  <path d={PATHS[kind]} />
</svg>

<style>
  .dnd-map-icon {
    display: block;
    flex: none;
  }
</style>
