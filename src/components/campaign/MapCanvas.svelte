<script lang="ts">
  import { untrack } from 'svelte'
  import type { CampaignMap, MapMarker } from '$lib/firestore.types'
  import MapIcon from './MapIcon.svelte'

  const {
    map,
    canEdit = false,
    placing = null,
    onPlace,
    onSelect
  }: {
    /** The map being drawn, with its layers and markers. */
    map: CampaignMap
    /** Turns clicking into placing and shows markers the players cannot see. */
    canEdit?: boolean
    /** The marker kind the next click places, or null to pan only. */
    placing?: MapMarker['kind'] | null
    /** Receives the relative coordinates of a placing click. */
    onPlace?: (x: number, y: number) => void
    /** Receives a marker the viewer clicked. */
    onSelect?: (marker: MapMarker) => void
  } = $props()

  let zoom = $state(untrack(() => map.min_zoom))
  let panX = $state(0)
  let panY = $state(0)
  let dragging = $state(false)
  let moved = $state(false)
  let viewport = $state<HTMLDivElement>()

  let lastX = 0
  let lastY = 0

  const layer = $derived(
    [...map.layers]
      .filter((entry) => zoom >= entry.min_zoom && zoom <= entry.max_zoom)
      .sort((a, b) => b.min_zoom - a.min_zoom)[0] ?? null
  )

  const image = $derived(layer?.image_url ?? map.image_url)

  const markers = $derived(
    map.markers.filter(
      (marker) =>
        (canEdit || marker.is_visible) && zoom >= marker.min_zoom && zoom <= marker.max_zoom
    )
  )

  function clampZoom(value: number): number {
    return Math.min(Math.max(value, map.min_zoom), map.max_zoom)
  }

  function onWheel(event: WheelEvent) {
    event.preventDefault()
    const box = viewport?.getBoundingClientRect()
    if (!box) return

    const next = clampZoom(zoom * (event.deltaY < 0 ? 1.15 : 1 / 1.15))
    const ratio = next / zoom

    const pointerX = event.clientX - box.left - box.width / 2
    const pointerY = event.clientY - box.top - box.height / 2

    panX = pointerX - (pointerX - panX) * ratio
    panY = pointerY - (pointerY - panY) * ratio
    zoom = next
  }

  function onPointerDown(event: PointerEvent) {
    dragging = true
    moved = false
    lastX = event.clientX
    lastY = event.clientY
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: PointerEvent) {
    if (!dragging) return
    const dx = event.clientX - lastX
    const dy = event.clientY - lastY
    if (Math.abs(dx) + Math.abs(dy) > 3) moved = true
    panX += dx
    panY += dy
    lastX = event.clientX
    lastY = event.clientY
  }

  function onPointerUp(event: PointerEvent) {
    dragging = false
    ;(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId)
  }

  function onClick(event: MouseEvent) {
    if (moved || !onPlace) return

    const surface = viewport?.querySelector('.dnd-map-plane')
    const box = surface?.getBoundingClientRect()
    if (!box) return

    onPlace((event.clientX - box.left) / box.width, (event.clientY - box.top) / box.height)
  }

  function reset() {
    zoom = map.min_zoom
    panX = 0
    panY = 0
  }

  function step(factor: number) {
    zoom = clampZoom(zoom * factor)
  }
</script>

<div class="dnd-map">
  <div
    class="dnd-map-viewport"
    class:dnd-map-placing={canEdit && Boolean(placing)}
    bind:this={viewport}
    role="group"
    aria-label="{map.title} map, zoom {zoom.toFixed(1)} times"
    onwheel={onWheel}
    onpointerdown={onPointerDown}
    onpointermove={onPointerMove}
    onpointerup={onPointerUp}
    onpointercancel={onPointerUp}
  >
    <div class="dnd-map-plane" style="transform: translate({panX}px, {panY}px) scale({zoom})">
      <img src={image} alt={layer?.title ?? map.title} draggable="false" />

      {#each markers as marker (marker.id)}
        <button
          type="button"
          class="dnd-map-pin dnd-map-pin-{marker.kind}"
          class:dnd-map-pin-hidden={!marker.is_visible}
          style="left: {marker.x * 100}%; top: {marker.y * 100}%; transform: translate(-50%, -100%) scale({1 / zoom})"
          title={marker.description ?? marker.title}
          onclick={(event) => { event.stopPropagation(); onSelect?.(marker) }}
        >
          <MapIcon kind={marker.kind} />
          <span class="dnd-map-pin-label">{marker.title}</span>
        </button>
      {/each}
    </div>

    {#if canEdit && placing}
      <button
        type="button"
        class="dnd-map-catcher"
        aria-label="Place a {placing} pin"
        onclick={onClick}
      ></button>
    {/if}
  </div>

  <div class="dnd-map-bar">
    <button type="button" class="dnd-map-step" onclick={() => step(1 / 1.4)} aria-label="Zoom out">&minus;</button>
    <input
      class="dnd-map-slider"
      type="range"
      min={map.min_zoom}
      max={map.max_zoom}
      step="0.1"
      bind:value={zoom}
      aria-label="Zoom level"
    />
    <button type="button" class="dnd-map-step" onclick={() => step(1.4)} aria-label="Zoom in">+</button>
    <span class="dnd-map-level">{zoom.toFixed(1)}x</span>
    <button type="button" class="dnd-map-step" onclick={reset}>Reset</button>
    {#if layer}<span class="dnd-map-layer">{layer.title}</span>{/if}
  </div>
</div>

<style>
  .dnd-map {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .dnd-map-viewport {
    position: relative;
    height: 60vh;
    min-height: 320px;
    overflow: hidden;
    border: var(--border-width) solid var(--metal);
    border-radius: var(--radius-lg);
    background: var(--ground);
    cursor: grab;
    touch-action: none;
  }

  .dnd-map-viewport:active {
    cursor: grabbing;
  }

  .dnd-map-placing {
    cursor: crosshair;
  }

  .dnd-map-plane {
    position: absolute;
    inset: 0;
    transform-origin: center center;
    will-change: transform;
  }

  .dnd-map-plane img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    user-select: none;
    pointer-events: none;
  }

  .dnd-map-pin {
    position: absolute;
    transform-origin: bottom center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: var(--space-1) var(--space-2);
    border: var(--border-width) solid var(--metal);
    border-radius: var(--radius-md);
    background: var(--ground);
    color: var(--metal);
    cursor: pointer;
    white-space: nowrap;
  }

  .dnd-map-pin:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  .dnd-map-pin-hidden {
    border-style: dashed;
    opacity: 0.55;
  }

  .dnd-map-pin-label {
    font-size: var(--text-xs);
    color: var(--ink);
  }

  .dnd-map-pin-danger {
    color: var(--state-bad);
    border-color: var(--state-bad);
  }

  .dnd-map-pin-quest {
    color: var(--state-warn);
    border-color: var(--state-warn);
  }

  .dnd-map-pin-treasure {
    color: var(--metal);
  }

  .dnd-map-pin-npc {
    color: var(--ember);
    border-color: var(--ember);
  }

  .dnd-map-catcher {
    position: absolute;
    inset: 0;
    border: 0;
    background: transparent;
    cursor: crosshair;
  }

  .dnd-map-catcher:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  .dnd-map-bar {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .dnd-map-step {
    min-width: 32px;
    padding: var(--space-1) var(--space-2);
    border: var(--border-width) solid var(--metal);
    border-radius: var(--radius-md);
    background: var(--ground-raised);
    color: var(--ink);
    font-family: inherit;
    font-size: var(--text-sm);
    cursor: pointer;
  }

  .dnd-map-step:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  .dnd-map-slider {
    flex: 1;
    min-width: 120px;
    accent-color: var(--metal);
  }

  .dnd-map-level,
  .dnd-map-layer {
    font-size: var(--text-xs);
    color: var(--ink-dim);
  }
</style>
