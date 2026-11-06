<script lang="ts">
  import { untrack } from 'svelte'
  import type { Condition, OverlayKey, VehicleContext } from '$lib/rules/vehicle.types'
  import { getMapInfo } from '$lib/rules/vehicle'
  import IconBtn from '$components/ui/IconBtn.svelte'
  import Glyph from '$components/ui/Glyph.svelte'

  type Point = [number, number]
  type Box = { x: number; y: number; w: number; h: number }

  const {
    ctx,
    selected,
    overlays,
    onselect,
    movement = null,
    marks = {},
    onslot,
    empty = false,
    draggable = false,
    onmove,
    focus = true
  }: {
    /** The vehicle being drawn: its layout, installed components, their states and the rules system. */
    ctx: VehicleContext
    /** Id of the component that is lit and whose weapon reach is drawn, or null. */
    selected: string | null
    /** Which overlays are drawn over the deck. */
    overlays: Record<OverlayKey, boolean>
    /** Receives the id of a component the viewer picked, or null when the sea was clicked. */
    onselect: (id: string | null) => void
    /** Top speed and changes of facing, drawn as the course ahead and the turn ghosts. */
    movement?: { topSpeed: number; facing: number | null } | null
    /** Slot codes lit as a valid, an invalid or the current home for a component. */
    marks?: Record<string, 'ok' | 'bad' | 'current'>
    /** Receives the code of a slot marker the viewer picked, and makes the markers pressable. */
    onslot?: (code: string) => void
    /** Draws markers on the empty slots even when the locations overlay is off. */
    empty?: boolean
    /** Lets the viewer drag components to a new spot on the deck. */
    draggable?: boolean
    /** Receives a dragged component's id and the deck position it was dropped at, in feet. */
    onmove?: (id: string, x: number, y: number) => void
    /** Frames a selected weapon's close range, or the whole vehicle, whenever the selection changes. */
    focus?: boolean
  } = $props()

  const uid = $props.id()
  const layout = $derived(ctx.layout)
  const bounds = $derived(layout.shape.bounds)
  const pad = 12

  function fitBox(): Box {
    return {
      x: bounds.minX - pad,
      y: bounds.minY - pad,
      w: bounds.maxX - bounds.minX + pad * 2,
      h: bounds.maxY - bounds.minY + pad * 2
    }
  }

  let view = $state(fitBox())
  let sheet = $state<SVGSVGElement>()
  let width = $state(0)
  let height = $state(0)
  let dragging = $state<{
    id: string
    x: number
    y: number
    ox: number
    oy: number
    sx: number
    sy: number
    moved: boolean
  } | null>(null)

  let panning: { x: number; y: number; vx: number; vy: number; moved: boolean } | null = null
  let frame = 0
  let lastFocused: string | null = null

  const slots = $derived(new Map(layout.slots.map((slot) => [slot.code, slot])))
  const categories = $derived(new Map(ctx.system.categories.map((category) => [category.key, category.name])))

  const pieces = $derived(
    ctx.components.map((component) => {
      const slot = component.slot ? slots.get(component.slot) : undefined
      const state = ctx.states[component.id]
      const held = dragging?.id === component.id ? dragging : null
      const cond: Condition = state ? (state.destroyed ? 'broken' : state.condition) : 'functional'
      return {
        component,
        slot,
        cond,
        info: getMapInfo(ctx, component),
        name: component.label ?? component.def.name,
        x: held ? held.x : (component.x ?? slot?.x ?? 0),
        y: held ? held.y : (component.y ?? slot?.y ?? 0),
        rotation: component.rotation ?? slot?.rotation ?? 0,
        destroyed: Boolean(state?.destroyed)
      }
    })
  )

  type Piece = (typeof pieces)[number]

  const isSail = (piece: Piece) =>
    piece.component.def.category === 'propulsion' && /sail|mast/i.test(piece.component.def.name)

  const structure = $derived(pieces.find((piece) => piece.info.isStructure))
  const sails = $derived(pieces.filter((piece) => !piece.info.isStructure && isSail(piece)))
  const items = $derived(
    pieces
      .filter((piece) => !piece.info.isStructure && !isSail(piece))
      .sort((p, q) => q.info.length * q.info.width - p.info.length * p.info.width)
  )
  const chosen = $derived(pieces.find((piece) => piece.component.id === selected) ?? null)
  const occupied = $derived(new Set(ctx.components.map((component) => component.slot)))

  const markers = $derived(
    overlays.locations || empty
      ? layout.slots.filter((slot) => slot.code !== 'HULL' && (overlays.locations || !occupied.has(slot.code)))
      : []
  )

  const points = (poly: number[][]) => poly.map(([x, y]) => `${x},${y}`).join(' ')
  const outline = $derived(points(layout.shape.outline))
  const deck = $derived.by(() => {
    const cx = (bounds.minX + bounds.maxX) / 2
    const cy = layout.lengthFt / 2
    return points(layout.shape.outline.map(([x, y]) => [cx + (x - cx) * 0.86, cy + (y - cy) * 0.955]))
  })

  const pxPerFt = $derived(Math.min(width / view.w, height / view.h) || 1)
  const sea = $derived.by(() => {
    const w = Math.max(view.w, width / pxPerFt) * 1.5
    const h = Math.max(view.h, height / pxPerFt) * 1.5
    return { x: view.x + view.w / 2 - w / 2, y: view.y + view.h / 2 - h / 2, w, h }
  })

  const toneOf = (types: string[]) => (types.length > 1 ? 'miscellaneous' : (types[0] ?? 'none'))

  function polar(cx: number, cy: number, r: number, deg: number): Point {
    const t = (deg * Math.PI) / 180
    return [cx + r * Math.sin(t), cy - r * Math.cos(t)]
  }

  function wedge(cx: number, cy: number, r0: number, r1: number, center: number, widthDeg: number) {
    if (widthDeg >= 360) {
      return (
        `M ${cx - r1} ${cy} a ${r1} ${r1} 0 1 0 ${2 * r1} 0 a ${r1} ${r1} 0 1 0 ${-2 * r1} 0 Z` +
        (r0 > 0 ? ` M ${cx - r0} ${cy} a ${r0} ${r0} 0 1 1 ${2 * r0} 0 a ${r0} ${r0} 0 1 1 ${-2 * r0} 0 Z` : '')
      )
    }
    const large = widthDeg > 180 ? 1 : 0
    const [x1, y1] = polar(cx, cy, r1, center - widthDeg / 2)
    const [x2, y2] = polar(cx, cy, r1, center + widthDeg / 2)
    if (r0 <= 0) return `M ${cx} ${cy} L ${x1} ${y1} A ${r1} ${r1} 0 ${large} 1 ${x2} ${y2} Z`
    const [x3, y3] = polar(cx, cy, r0, center + widthDeg / 2)
    const [x4, y4] = polar(cx, cy, r0, center - widthDeg / 2)
    return `M ${x4} ${y4} L ${x1} ${y1} A ${r1} ${r1} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${r0} ${r0} 0 ${large} 0 ${x4} ${y4} Z`
  }

  const reach = $derived.by(() => {
    if (!chosen?.info.isWeapon) return []
    const { x, y, info } = chosen
    const arc = chosen.slot?.arc ?? { centerDeg: chosen.rotation, widthDeg: 360 }
    const bands: { r0: number; r1: number; kind: 'close' | 'normal' | 'long' }[] = []
    let prev = 0
    for (const kind of ['close', 'normal', 'long'] as const) {
      const far = Math.max(0, ...info.ranges.map((range) => range[kind] ?? 0))
      if (far > prev) {
        bands.push({ r0: prev, r1: far, kind })
        prev = far
      }
    }
    return bands.map((band) => {
      const [lx, ly] = polar(x, y, band.r1, arc.centerDeg)
      return { ...band, arc, lx, ly, d: wedge(x, y, band.r0, band.r1, arc.centerDeg, arc.widthDeg) }
    })
  })

  const arcs = $derived(
    layout.slots.flatMap((slot) =>
      slot.arc ? [{ code: slot.code, d: wedge(slot.x, slot.y, 0, 30, slot.arc.centerDeg, slot.arc.widthDeg) }] : []
    )
  )

  const sternPivot = $derived<Point>([layout.widthFt / 2, layout.lengthFt])
  const bowTip = $derived(
    layout.shape.outline.reduce<Point>((tip, p) => (p[1] < tip[1] ? p : tip), layout.shape.outline[0] ?? [0, 0])
  )
  const sternY = $derived(Math.max(...layout.shape.outline.map((p) => p[1])))

  const turn = $derived(ctx.system.rules.turnDegrees)
  const ghosts = $derived(Array.from({ length: movement?.facing ?? 0 }, (_, i) => i + 1))
  const ticks = $derived.by(() => {
    const step = ctx.system.rules.movementStep
    if (!movement || step <= 0) return []
    return Array.from({ length: Math.floor(movement.topSpeed / step) }, (_, i) => (i + 1) * step)
  })

  const scaleFt = $derived([5, 10, 30, 60, 90, 150, 300, 600, 1200].find((ft) => ft * pxPerFt >= 60) ?? 1200)
  const gridExtent = 3000
  const fontFt = $derived(Math.max(2.4, 11 / pxPerFt))
  const planks = $derived(
    Array.from(
      { length: Math.ceil((bounds.maxX - bounds.minX) / 2.5) + 1 },
      (_, i) => bounds.minX + i * 2.5
    )
  )

  const sailSpan = (piece: Piece) =>
    piece.component.def.size === 'Gargantuan' || piece.component.def.size === 'Huge'
      ? layout.widthFt * 0.9
      : layout.widthFt * 0.62

  function animateTo(target: Box) {
    cancelAnimationFrame(frame)
    const from = { ...view }
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 380)
      const e = 1 - Math.pow(1 - t, 3)
      view = {
        x: from.x + (target.x - from.x) * e,
        y: from.y + (target.y - from.y) * e,
        w: from.w + (target.w - from.w) * e,
        h: from.h + (target.h - from.h) * e
      }
      if (t < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
  }

  function boxAround(spots: Point[], margin: number): Box {
    const xs = spots.map((p) => p[0])
    const ys = spots.map((p) => p[1])
    return {
      x: Math.min(...xs) - margin,
      y: Math.min(...ys) - margin,
      w: Math.max(...xs) - Math.min(...xs) + margin * 2,
      h: Math.max(...ys) - Math.min(...ys) + margin * 2
    }
  }

  function focusBox() {
    const first = reach[0]
    if (!chosen || !first) return fitBox()
    const { centerDeg, widthDeg } = first.arc
    const half = Math.min(widthDeg, 360) / 2
    const spots: Point[] = [
      [bounds.minX, bounds.minY],
      [bounds.maxX, bounds.maxY],
      [chosen.x, chosen.y]
    ]
    for (let a = centerDeg - half; a <= centerDeg + half; a += 15) {
      spots.push(polar(chosen.x, chosen.y, first.r1, a))
    }
    return boxAround(spots, 12)
  }

  $effect(() => {
    const id = chosen?.component.id ?? null
    const weapon = Boolean(chosen?.info.isWeapon) && reach.length > 0
    untrack(() => {
      if (!focus || id === lastFocused) return
      lastFocused = id
      animateTo(weapon ? focusBox() : fitBox())
    })
  })

  function toSvg(clientX: number, clientY: number) {
    const ctm = sheet?.getScreenCTM()
    if (!ctm) return { x: 0, y: 0 }
    const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse())
    return { x: p.x, y: p.y }
  }

  function zoomAt(factor: number, cx = view.x + view.w / 2, cy = view.y + view.h / 2) {
    cancelAnimationFrame(frame)
    const w = Math.min(Math.max(view.w * factor, 20), 4000)
    const k = w / view.w
    view = { x: cx - (cx - view.x) * k, y: cy - (cy - view.y) * k, w, h: view.h * k }
  }

  function onWheel(event: WheelEvent) {
    event.preventDefault()
    const p = toSvg(event.clientX, event.clientY)
    zoomAt(event.deltaY > 0 ? 1.15 : 1 / 1.15, p.x, p.y)
  }

  export function fit() {
    animateTo(fitBox())
  }

  export function fitRanges() {
    const r = Math.max(0, ...reach.map((band) => band.r1))
    if (!chosen || !r) return fit()
    animateTo({ x: chosen.x - r - 20, y: chosen.y - r - 20, w: 2 * r + 40, h: 2 * r + 40 })
  }

  function onBackgroundDown(event: PointerEvent) {
    if (event.button !== 0) return
    cancelAnimationFrame(frame)
    const target = event.currentTarget as Element
    target.setPointerCapture(event.pointerId)
    panning = { x: event.clientX, y: event.clientY, vx: view.x, vy: view.y, moved: false }
  }

  function onPointerMove(event: PointerEvent) {
    if (dragging) {
      const p = toSvg(event.clientX, event.clientY)
      const dx = p.x - dragging.sx
      const dy = p.y - dragging.sy
      if (Math.abs(dx) + Math.abs(dy) > 0.5) dragging.moved = true
      dragging.x = Math.round((dragging.ox + dx) * 2) / 2
      dragging.y = Math.round((dragging.oy + dy) * 2) / 2
      return
    }
    if (!panning) return
    const dx = (event.clientX - panning.x) / pxPerFt
    const dy = (event.clientY - panning.y) / pxPerFt
    if (Math.abs(dx) + Math.abs(dy) > 1) panning.moved = true
    view = { ...view, x: panning.vx - dx, y: panning.vy - dy }
  }

  function onPointerUp() {
    if (dragging) {
      if (dragging.moved) onmove?.(dragging.id, dragging.x, dragging.y)
      else onselect(dragging.id)
      dragging = null
      return
    }
    if (panning && !panning.moved) onselect(null)
    panning = null
  }

  function onPick(event: PointerEvent, act: () => void) {
    event.stopPropagation()
    act()
  }

  function onPieceDown(event: PointerEvent, piece: Piece) {
    event.stopPropagation()
    if (!draggable) return onselect(piece.component.id)
    sheet?.setPointerCapture(event.pointerId)
    const p = toSvg(event.clientX, event.clientY)
    dragging = { id: piece.component.id, x: piece.x, y: piece.y, ox: piece.x, oy: piece.y, sx: p.x, sy: p.y, moved: false }
  }

  function onPress(event: KeyboardEvent, act: () => void) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    act()
  }

  function onMapKey(event: KeyboardEvent) {
    const step = view.w * 0.1
    const moves: Record<string, Point> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step]
    }
    const move = moves[event.key]
    if (move && event.target === event.currentTarget) {
      event.preventDefault()
      view = { ...view, x: view.x + move[0], y: view.y + move[1] }
    } else if (event.key === '+' || event.key === '=') zoomAt(1 / 1.2)
    else if (event.key === '-') zoomAt(1.2)
    else if (event.key === '0') fit()
    else if (event.key === 'Escape') onselect(null)
  }
</script>

<div class="dnd-vehicle-map" bind:clientWidth={width} bind:clientHeight={height}>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
  <svg
    bind:this={sheet}
    class="dnd-vehicle-map-sheet"
    viewBox="{view.x} {view.y} {view.w} {view.h}"
    preserveAspectRatio="xMidYMid meet"
    role="application"
    aria-label="{layout.name} map. Arrow keys pan, plus and minus zoom, 0 resets."
    tabindex="0"
    onwheel={onWheel}
    onpointermove={onPointerMove}
    onpointerup={onPointerUp}
    onkeydown={onMapKey}
    data-testid="vehicle-map"
  >
    <defs>
      <radialGradient id="{uid}-sea" cx="50%" cy="45%" r="75%">
        <stop offset="0" class="sea-light" />
        <stop offset="0.55" class="sea-mid" />
        <stop offset="1" class="sea-deep" />
      </radialGradient>
      <pattern id="{uid}-waves" width="48" height="26" patternUnits="userSpaceOnUse">
        <path d="M0 13 Q6 9 12 13 T24 13 T36 13 T48 13" class="wave" stroke-width="0.5" opacity="0.35" />
        <path d="M-12 26 Q-6 22 0 26 T12 26 T24 26 T36 26" class="wave" stroke-width="0.35" opacity="0.2" />
      </pattern>
      <pattern id="{uid}-grid5" width={layout.gridFt} height={layout.gridFt} patternUnits="userSpaceOnUse">
        <path
          d="M {layout.gridFt} 0 L 0 0 0 {layout.gridFt}"
          class="grid-fine"
          stroke-width="0.12"
          opacity="0.5"
        />
      </pattern>
      <pattern
        id="{uid}-grid30"
        width={layout.navalGridFt}
        height={layout.navalGridFt}
        patternUnits="userSpaceOnUse"
      >
        <path
          d="M {layout.navalGridFt} 0 L 0 0 0 {layout.navalGridFt}"
          class="grid-naval"
          stroke-width="0.5"
          opacity="0.55"
        />
      </pattern>
      <linearGradient id="{uid}-hull" x1="0" x2="1">
        <stop offset="0" class="hull-dark" />
        <stop offset="0.18" class="hull-mid" />
        <stop offset="0.5" class="hull-light" />
        <stop offset="0.82" class="hull-mid" />
        <stop offset="1" class="hull-dark" />
      </linearGradient>
      <linearGradient id="{uid}-deck" x1="0" x2="1">
        <stop offset="0" class="deck-edge" />
        <stop offset="0.5" class="deck-mid" />
        <stop offset="1" class="deck-edge" />
      </linearGradient>
      <linearGradient id="{uid}-bronze" x1="0" x2="1">
        <stop offset="0" class="bronze-dark" />
        <stop offset="0.45" class="bronze-light" />
        <stop offset="1" class="bronze-mid" />
      </linearGradient>
      <linearGradient id="{uid}-steel" x1="0" x2="1">
        <stop offset="0" class="steel-dark" />
        <stop offset="0.5" class="steel-light" />
        <stop offset="1" class="steel-dark" />
      </linearGradient>
      <radialGradient id="{uid}-sail" cx="50%" cy="20%" r="80%">
        <stop offset="0" class="sail-light" />
        <stop offset="1" class="sail-dark" />
      </radialGradient>
      <clipPath id="{uid}-deck-clip"><polygon points={deck} /></clipPath>
      <filter id="{uid}-shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow class="drop" dx="1.5" dy="3" stdDeviation="2.5" />
      </filter>
      <filter id="{uid}-glow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="1.1" result="b" />
        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <filter id="{uid}-foam"><feGaussianBlur stdDeviation="1.4" /></filter>
    </defs>

    <g onpointerdown={onBackgroundDown} role="presentation">
      <rect x={sea.x} y={sea.y} width={sea.w} height={sea.h} fill="url(#{uid}-sea)" />
      <rect x={sea.x} y={sea.y} width={sea.w} height={sea.h} fill="url(#{uid}-waves)" />
    </g>

    {#if overlays.navalGrid}
      <rect
        x={-gridExtent}
        y={-gridExtent}
        width={gridExtent * 2}
        height={gridExtent * 2}
        fill="url(#{uid}-grid30)"
        pointer-events="none"
      />
    {/if}

    <g pointer-events="none">
      {#each [0, 1, 2] as k (k)}
        <path
          d="M {layout.widthFt * 0.12} {sternY - 10 + k * 14} q {-6 - k * 4} 10 {-12 - k * 7} 16 M {layout.widthFt * 0.88} {sternY - 10 + k * 14} q {6 + k * 4} 10 {12 + k * 7} 16"
          class="foam"
          stroke-width={1.2 - k * 0.3}
          stroke-linecap="round"
          opacity={0.35 - k * 0.1}
        />
      {/each}
      <ellipse
        cx={layout.widthFt / 2}
        cy={sternY + 4}
        rx={layout.widthFt * 0.28}
        ry="6"
        class="foam-wash"
        opacity="0.12"
        filter="url(#{uid}-foam)"
      />
    </g>

    {#if movement && overlays.movement}
      <g pointer-events="none" opacity="0.9">
        {#each ghosts as k (k)}
          {#each [-1, 1] as dir (dir)}
            <polygon
              points={outline}
              transform="rotate({dir * turn * k} {sternPivot[0]} {sternPivot[1]})"
              class="course"
              stroke-width="0.4"
              stroke-dasharray="2 2"
              opacity={0.5 / k}
            />
          {/each}
        {/each}
        <line
          x1={bowTip[0]}
          y1={bowTip[1]}
          x2={bowTip[0]}
          y2={bowTip[1] - movement.topSpeed}
          class="course"
          stroke-width="0.6"
          stroke-dasharray="3 2"
        />
        {#each ticks as d (d)}
          <line x1={bowTip[0] - 2} x2={bowTip[0] + 2} y1={bowTip[1] - d} y2={bowTip[1] - d} class="course" stroke-width="0.4" />
          <text x={bowTip[0] + 4} y={bowTip[1] - d + 1.2} font-size="3.2" class="course-text">{d} ft</text>
        {/each}
      </g>
    {/if}

    {#if reach.length}
      <g pointer-events="none" data-testid="weapon-reach">
        {#each reach as band (band.kind)}
          <path d={band.d} class="band band-{band.kind}" stroke-width={Math.max(0.3, 1.2 / pxPerFt)} fill-rule="evenodd" />
        {/each}
        {#each reach as band (band.kind)}
          <g transform="translate({band.lx} {band.ly})">
            <rect
              x={-fontFt * 4.2}
              y={-fontFt * 0.95}
              width={fontFt * 8.4}
              height={fontFt * 1.4}
              rx={fontFt * 0.35}
              class="reach-plate"
              stroke-width={fontFt * 0.06}
            />
            <text text-anchor="middle" font-size={fontFt * 0.85} class="reach-text">
              {band.kind} {band.r1.toLocaleString('en-US')} ft
            </text>
          </g>
        {/each}
      </g>
    {/if}

    {#snippet hull()}
      <polygon points={outline} fill="url(#{uid}-hull)" class="hull-edge" stroke-width="0.9" />
      <polygon points={deck} fill="url(#{uid}-deck)" />
      <g clip-path="url(#{uid}-deck-clip)" pointer-events="none">
        {#each planks as px, i (i)}
          <line x1={px} x2={px} y1={bounds.minY} y2={bounds.maxY} class="plank" stroke-width="0.18" opacity="0.7" />
          {#each Array.from({ length: 6 }, (_, k) => bounds.minY + ((k * 24 + (i % 4) * 7) % (bounds.maxY - bounds.minY))) as jy, k (k)}
            <line x1={px} x2={px + 2.5} y1={jy} y2={jy} class="plank" stroke-width="0.14" opacity="0.6" />
          {/each}
        {/each}
        <rect
          x={bounds.minX}
          y={bounds.minY}
          width={bounds.maxX - bounds.minX}
          height={bounds.maxY - bounds.minY}
          fill="url(#{uid}-hull)"
          opacity="0.18"
        />
      </g>
      <polygon points={deck} class="trim" stroke-width="0.55" opacity="0.85" />
      <polygon points={deck} class="trim-shade" stroke-width="1.6" opacity="0.35" transform="translate(0.4 0.6)" />
      {#if structure && structure.component.id === selected}
        <polygon points={outline} class="hull-on" stroke-width="1" filter="url(#{uid}-glow)" />
      {/if}
      {#if overlays.conditions && structure}
        <polygon points={outline} class="hull-wash" />
      {:else if structure && structure.cond !== 'functional'}
        <polygon points={outline} class="hull-cond" stroke-width="0.9" stroke-dasharray="3 2" />
      {/if}
    {/snippet}

    <polygon points={outline} class="hull-shadow" filter="url(#{uid}-shadow)" pointer-events="none" />
    {#if structure}
      <g
        class={['pick', `state-${structure.cond}`]}
        role="button"
        tabindex="0"
        aria-label="Hull: {structure.component.def.name}"
        onpointerdown={(event) => onPick(event, () => onselect(structure.component.id))}
        onkeydown={(event) => onPress(event, () => onselect(structure.component.id))}
        data-testid="component-{structure.component.id}"
      >
        {@render hull()}
      </g>
    {:else}
      <g role="presentation" onpointerdown={onBackgroundDown}>{@render hull()}</g>
    {/if}

    {#if overlays.boardingGrid}
      <g pointer-events="none">
        {#each layout.shape.traversable as [cx, cy] (`${cx},${cy}`)}
          <rect
            x={cx * layout.gridFt}
            y={cy * layout.gridFt}
            width={layout.gridFt}
            height={layout.gridFt}
            class="walk"
            opacity="0.16"
          />
        {/each}
        <rect
          x={bounds.minX}
          y={bounds.minY}
          width={bounds.maxX - bounds.minX}
          height={bounds.maxY - bounds.minY}
          fill="url(#{uid}-grid5)"
        />
      </g>
    {/if}

    {#if overlays.arcs}
      <g pointer-events="none">
        {#each arcs as arc (arc.code)}
          <path d={arc.d} class="arc" stroke-width="0.4" />
        {/each}
      </g>
    {/if}

    {#each markers as slot (slot.code)}
      {@const mark = marks[slot.code]}
      {@const taken = occupied.has(slot.code)}
      {#snippet socket()}
        <circle
          r="3.4"
          class="slot-ring"
          fill-opacity={taken ? 0.12 : 0.3}
          stroke-width={mark ? 0.9 : 0.4}
          stroke-dasharray={taken ? '0' : '1 0.8'}
        />
        {#if !taken}
          <text y="1" text-anchor="middle" font-size="2.6" font-weight="700" class="slot-code">{slot.code}</text>
        {/if}
      {/snippet}
      <g
        transform="translate({slot.x} {slot.y})"
        class={['slot', `tone-${toneOf(slot.acceptedTypes)}`, mark && `mark-${mark}`]}
      >
        {#if onslot}
          <g
            class="pick"
            role="button"
            tabindex="0"
            aria-label="Slot {slot.code}"
            onpointerdown={(event) => onPick(event, () => onslot(slot.code))}
            onkeydown={(event) => onPress(event, () => onslot(slot.code))}
          >
            {@render socket()}
          </g>
        {:else}
          {@render socket()}
        {/if}
      </g>
    {/each}

    {#snippet piece(p: Piece)}
      {@const on = p.component.id === selected}
      {@const cat = p.component.def.category}
      {@const w = p.info.width}
      {@const l = p.info.length}
      <g
        transform="translate({p.x} {p.y}) rotate({p.rotation})"
        class={['piece', `state-${p.cond}`, draggable ? 'move' : 'pick', on && 'on']}
        role="button"
        tabindex="0"
        aria-label="{p.name}, {categories.get(cat) ?? cat}, {p.destroyed ? 'destroyed' : p.cond}"
        aria-pressed={on}
        onpointerdown={(event) => onPieceDown(event, p)}
        onkeydown={(event) => onPress(event, () => onselect(p.component.id))}
        data-testid="component-{p.component.id}"
        data-label={p.name}
        filter={on ? `url(#${uid}-glow)` : undefined}
      >
        <circle r={Math.max(w, l, 6) / 2 + 1.5} class="hit" />
        {#if on}
          <circle r={Math.max(w, l, 6) / 2 + 1.8} class="spin" stroke-width="0.35" stroke-dasharray="1.2 0.8" />
        {/if}
        {#if cat === 'artillery'}
          <rect
            x={-w / 2 - 0.4}
            y={-l / 4}
            width={w + 0.8}
            height={l * 0.62}
            rx="0.8"
            class="timber edge"
            stroke-width={on ? 0.7 : 0.4}
          />
          <circle cx={-w / 2 + 0.2} cy={l * 0.3} r="0.75" class="axle" />
          <circle cx={w / 2 - 0.2} cy={l * 0.3} r="0.75" class="axle" />
          <rect
            x={-w * 0.2}
            y={-l / 2 - 3.2}
            width={w * 0.4}
            height={l * 0.85}
            rx={w * 0.2}
            fill="url(#{uid}-bronze)"
            class="barrel"
            stroke-width="0.25"
          />
          <rect x={-w * 0.26} y={-l / 2 - 3.6} width={w * 0.52} height="0.9" rx="0.4" class="brass" />
          <circle cy={l * 0.18} r={w * 0.17} class="sight" />
        {:else if cat === 'propulsion'}
          <circle r={w / 2 + 1} class="timber edge" stroke-width={on ? 0.7 : 0.45} />
          <circle r={w / 2 - 0.6} class="bearing" />
          <circle r="0.8" class="brass" />
        {:else if cat === 'ram'}
          <path
            d="M 0 {-l / 2 - 5} L {w / 2 + 0.8} {l / 2} L {-w / 2 - 0.8} {l / 2} Z"
            fill="url(#{uid}-steel)"
            class="edge"
            stroke-width={on ? 0.7 : 0.4}
          />
          <path d="M {-w / 2} {l / 4} L {w / 2} {l / 4} M {-w / 3} 0 L {w / 3} 0" class="steel-line" stroke-width="0.4" />
        {:else if cat === 'control'}
          <circle r={w / 2 + 0.3} fill="none" stroke="url(#{uid}-bronze)" stroke-width="0.9" />
          {#each [0, 45, 90, 135] as a (a)}
            <line
              x1="0"
              y1={-w / 2 - 1.2}
              x2="0"
              y2={w / 2 + 1.2}
              transform="rotate({a})"
              class="spoke"
              stroke-width="0.45"
              stroke-linecap="round"
            />
          {/each}
          <circle r="1.1" class="hub" stroke-width="0.3" />
          {#if on || p.cond !== 'functional'}
            <circle r={w / 2 + 1.2} fill="none" class="edge" stroke-width="0.45" />
          {/if}
        {:else if cat === 'miscellaneous'}
          <rect x={-w / 2} y={-w / 2} width={w} height={w} rx="1.2" class="crate edge" stroke-width={on ? 0.7 : 0.4} />
          <circle r={w / 3} class="crate-core" />
          {#each [[-1, -1], [1, -1], [-1, 1], [1, 1]] as [sx, sy] (`${sx},${sy}`)}
            <circle cx={(sx * w) / 3.2} cy={(sy * w) / 3.2} r="0.45" class="stud" />
          {/each}
        {:else}
          <rect x={-w / 2} y={-l / 2} width={w} height={l} rx="0.9" class="plain edge" stroke-width={on ? 0.7 : 0.4} />
        {/if}
        {#if overlays.conditions || p.cond !== 'functional'}
          <circle
            r={Math.max(w, l, 5) / 2 + 1.4}
            class={['ring', overlays.conditions && 'ring-wash']}
            stroke-width="0.4"
            pointer-events="none"
          />
        {/if}
        {#if p.destroyed}
          <path d="M -3 -3 L 3 3 M 3 -3 L -3 3" class="wreck" stroke-width="0.8" />
        {/if}
      </g>
    {/snippet}

    {#each sails as p (p.component.id)}
      {@const span = sailSpan(p)}
      {@const belly = span * 0.32}
      <g transform="translate({p.x} {p.y})" pointer-events="none" opacity={p.cond === 'broken' ? 0.35 : 0.88}>
        <line x1={-span / 2} x2={span / 2} y1="0" y2="0" class="yard" stroke-width="1" stroke-linecap="round" />
        <path
          d="M {-span / 2} 0 Q 0 {-belly * 2} {span / 2} 0 Q 0 {-belly * 0.5} {-span / 2} 0 Z"
          fill="url(#{uid}-sail)"
          class="sail"
          stroke-width="0.3"
        />
        {#each [-0.25, 0, 0.25] as f (f)}
          <path
            d="M {span * f} {-Math.abs(f) * 2} Q {span * f} {-belly * (1.3 - Math.abs(f))} {span * f * 1.05} {-belly * (1 - Math.abs(f) * 1.6)}"
            class="seam"
            stroke-width="0.2"
          />
        {/each}
      </g>
    {/each}
    {#each sails as p (p.component.id)}{@render piece(p)}{/each}
    {#each items as p (p.component.id)}{@render piece(p)}{/each}

    {#each [...sails, ...items] as p (p.component.id)}
      {@const offset = Math.max(p.info.width, p.info.length, 6) / 2 + fontFt * 1.1}
      <g transform="translate({p.x} {p.y + offset})" class={['label', p.component.id === selected && 'on']} pointer-events="none">
        <rect
          x={-fontFt * 1.6}
          y={-fontFt * 0.85}
          width={fontFt * 3.2}
          height={fontFt * 1.25}
          rx={fontFt * 0.4}
          class="label-plate"
        />
        <text text-anchor="middle" font-size={fontFt * 0.82} font-weight="700" class="label-text">{p.info.shortLabel}</text>
      </g>
    {/each}
  </svg>

  <div class="dnd-vehicle-map-top">
    <span class="dnd-vehicle-map-plate">Bow ▲</span>
    <div class="dnd-vehicle-map-tools">
      <IconBtn title="Zoom in (+)" onclick={() => zoomAt(1 / 1.3)}><Glyph name="zoomin" size="sm" /></IconBtn>
      <IconBtn title="Zoom out (−)" onclick={() => zoomAt(1.3)}><Glyph name="zoomout" size="sm" /></IconBtn>
      <IconBtn title="Fit vehicle (0)" onclick={fit}><Glyph name="unfold" size="sm" /></IconBtn>
      {#if reach.length}
        <IconBtn title="Show full weapon range" tone="verdigris" onclick={fitRanges}><Glyph name="weapon" size="sm" /></IconBtn>
      {/if}
    </div>
  </div>

  <div class="dnd-vehicle-map-plate dnd-vehicle-map-scale">
    <span class="dnd-vehicle-map-ruler">
      <span class="dnd-vehicle-map-bar" style:inline-size="{scaleFt * pxPerFt}px"></span>
      <span>{scaleFt} ft</span>
    </span>
    {#if layout.approximate}<span class="dnd-vehicle-map-warn">· approximate schematic</span>{/if}
  </div>

  {#if reach.length}
    <div class="dnd-vehicle-map-plate dnd-vehicle-map-legend">
      <span><span class="dnd-vehicle-map-swatch dnd-vehicle-map-swatch-close"></span> close</span>
      <span><span class="dnd-vehicle-map-swatch dnd-vehicle-map-swatch-normal"></span> normal</span>
      <span><span class="dnd-vehicle-map-swatch dnd-vehicle-map-swatch-long"></span> long (disadvantage)</span>
    </div>
  {:else if overlays.conditions}
    <div class="dnd-vehicle-map-plate dnd-vehicle-map-legend">
      <span><span class="dnd-vehicle-map-dot dnd-vehicle-map-dot-functional"></span> Functional</span>
      <span><span class="dnd-vehicle-map-dot dnd-vehicle-map-dot-impaired"></span> Impaired</span>
      <span><span class="dnd-vehicle-map-dot dnd-vehicle-map-dot-broken"></span> Broken</span>
    </div>
  {/if}
</div>

<style>
  .dnd-vehicle-map {
    position: relative;
    inline-size: 100%;
    block-size: 100%;
    border-radius: var(--radius-lg);
    background: var(--ground-deep);
  }

  .dnd-vehicle-map::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: var(--rim-thin);
    pointer-events: none;
  }

  .dnd-vehicle-map-sheet {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    border-radius: inherit;
    touch-action: none;
    user-select: none;
  }

  .dnd-vehicle-map-sheet:focus-visible {
    outline: var(--border-width) solid var(--metal-bright);
    outline-offset: calc(var(--space-2) * -1);
  }

  .dnd-vehicle-map-sheet text {
    font-family: var(--font-figures);
    font-variant-numeric: lining-nums tabular-nums;
  }

  .sea-light {
    stop-color: var(--verdigris-dim);
  }

  .sea-mid {
    stop-color: color-mix(in srgb, var(--verdigris-dim) 50%, var(--ground-deep));
  }

  .sea-deep {
    stop-color: var(--ground-deep);
  }

  .wave,
  .grid-fine {
    fill: none;
    stroke: var(--verdigris);
  }

  .grid-naval {
    fill: none;
    stroke: var(--metal);
  }

  .hull-dark {
    stop-color: var(--wood-dark);
  }

  .hull-mid {
    stop-color: var(--wood);
  }

  .hull-light {
    stop-color: color-mix(in srgb, var(--wood) 75%, var(--stone-light));
  }

  .deck-edge {
    stop-color: color-mix(in srgb, var(--stone-light) 55%, var(--wood));
  }

  .deck-mid {
    stop-color: color-mix(in srgb, var(--stone-light) 85%, var(--metal-dim));
  }

  .bronze-dark {
    stop-color: var(--metal-dim);
  }

  .bronze-light {
    stop-color: var(--metal-bright);
  }

  .bronze-mid {
    stop-color: color-mix(in srgb, var(--metal-dim) 75%, var(--metal));
  }

  .steel-dark {
    stop-color: var(--stone);
  }

  .steel-light {
    stop-color: var(--stone-light);
  }

  .sail-light {
    stop-color: var(--ink);
  }

  .sail-dark {
    stop-color: var(--ink-dim);
  }

  .drop {
    flood-color: var(--keyline);
    flood-opacity: 0.65;
  }

  .foam {
    fill: none;
    stroke: var(--ink);
  }

  .foam-wash {
    fill: var(--ink);
  }

  .course {
    fill: none;
    stroke: var(--verdigris);
  }

  .course-text {
    fill: var(--verdigris);
  }

  .band {
    stroke: color-mix(in srgb, var(--verdigris) 55%, transparent);
  }

  .band-close {
    fill: color-mix(in srgb, var(--verdigris) 26%, transparent);
  }

  .band-normal {
    fill: color-mix(in srgb, var(--verdigris) 15%, transparent);
  }

  .band-long {
    fill: color-mix(in srgb, var(--verdigris) 10%, transparent);
  }

  .reach-plate {
    fill: color-mix(in srgb, var(--ground-deep) 80%, transparent);
    stroke: color-mix(in srgb, var(--verdigris) 50%, transparent);
  }

  .reach-text {
    fill: color-mix(in srgb, var(--verdigris) 35%, var(--ink));
  }

  .hull-shadow {
    fill: var(--keyline);
  }

  .hull-edge {
    stroke: var(--keyline);
  }

  .plank {
    stroke: var(--wood-dark);
  }

  .trim {
    fill: none;
    stroke: var(--metal);
  }

  .trim-shade {
    fill: none;
    stroke: var(--wood-dark);
  }

  .hull-on {
    fill: none;
    stroke: var(--metal-bright);
  }

  .hull-wash {
    fill: var(--cond-wash);
  }

  .hull-cond {
    fill: none;
    stroke: var(--cond-line);
  }

  .walk {
    fill: var(--metal);
  }

  .arc {
    fill: color-mix(in srgb, var(--ember) 10%, transparent);
    stroke: color-mix(in srgb, var(--ember) 35%, transparent);
  }

  .state-functional {
    --edge: var(--keyline);
    --cond-line: none;
    --cond-wash: color-mix(in srgb, var(--state-good) 20%, transparent);
  }

  .state-impaired {
    --edge: var(--state-warn);
    --cond-line: var(--state-warn);
    --cond-wash: color-mix(in srgb, var(--state-warn) 33%, transparent);
  }

  .state-broken {
    --edge: var(--state-bad);
    --cond-line: var(--state-bad);
    --cond-wash: color-mix(in srgb, var(--state-bad) 40%, transparent);
  }

  .piece.on {
    --edge: var(--metal-bright);
  }

  .pick {
    cursor: pointer;
  }

  .move {
    cursor: move;
  }

  .pick:focus-visible,
  .move:focus-visible {
    outline: var(--border-width) solid var(--metal-bright);
  }

  .slot {
    --tone: var(--ink-faint);
    --ring: var(--tone);
  }

  .tone-artillery {
    --tone: var(--ember);
  }

  .tone-propulsion {
    --tone: var(--verdigris);
  }

  .tone-control {
    --tone: var(--metal);
  }

  .tone-ram {
    --tone: var(--stone-light);
  }

  .tone-miscellaneous {
    --tone: var(--state-good);
  }

  .tone-hull {
    --tone: var(--wood);
  }

  .mark-ok {
    --ring: var(--state-good);
  }

  .mark-current {
    --ring: var(--metal-bright);
  }

  .mark-bad {
    opacity: 0.35;
  }

  .slot-ring {
    fill: var(--tone);
    stroke: var(--ring);
  }

  .slot-code {
    fill: var(--ink);
  }

  .hit {
    fill: none;
    pointer-events: all;
  }

  .spin {
    fill: none;
    stroke: var(--metal-bright);
    transform-box: fill-box;
    transform-origin: center;
    animation: dnd-vehicle-map-spin 12s linear infinite;
  }

  .edge {
    stroke: var(--edge);
  }

  .timber {
    fill: var(--wood);
  }

  .axle {
    fill: var(--wood-dark);
  }

  .barrel {
    stroke: var(--wood);
  }

  .brass {
    fill: var(--metal-bright);
  }

  .sight {
    fill: var(--verdigris);
    opacity: 0.85;
  }

  .bearing {
    fill: color-mix(in srgb, var(--wood) 60%, var(--stone-light));
  }

  .steel-line {
    stroke: var(--stone);
  }

  .spoke {
    stroke: var(--metal);
  }

  .hub {
    fill: var(--metal-bright);
    stroke: var(--metal-dim);
  }

  .crate {
    fill: color-mix(in srgb, var(--state-good) 22%, var(--ground-deep));
  }

  .crate-core {
    fill: color-mix(in srgb, var(--state-good) 70%, transparent);
  }

  .stud {
    fill: color-mix(in srgb, var(--ink) 70%, transparent);
  }

  .plain {
    fill: var(--ground-raised);
  }

  .ring {
    fill: none;
    stroke: var(--cond-line);
  }

  .ring-wash {
    fill: var(--cond-wash);
  }

  .wreck {
    stroke: var(--state-bad);
  }

  .yard {
    stroke: var(--wood);
  }

  .sail {
    stroke: var(--ink-faint);
  }

  .seam {
    fill: none;
    stroke: var(--ink-faint);
  }

  .label-plate {
    fill: color-mix(in srgb, var(--ground-deep) 70%, transparent);
  }

  .label-text {
    fill: var(--ink);
  }

  .label.on .label-plate {
    fill: color-mix(in srgb, var(--metal-bright) 95%, transparent);
  }

  .label.on .label-text {
    fill: var(--keyline);
  }

  .dnd-vehicle-map-top {
    position: absolute;
    inset-block-start: 0;
    inset-inline: 0;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: var(--space-3);
    pointer-events: none;
  }

  .dnd-vehicle-map-tools {
    display: grid;
    grid-template-columns: var(--space-6);
    grid-auto-rows: var(--space-6);
    gap: var(--space-1);
    pointer-events: auto;
  }

  .dnd-vehicle-map-plate {
    padding: var(--space-0) var(--space-2);
    border: var(--border-hair) solid color-mix(in srgb, var(--metal-dim) 70%, transparent);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--ground-deep) 75%, transparent);
    font-family: var(--font-display);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
    color: var(--metal);
    pointer-events: none;
  }

  .dnd-vehicle-map-scale {
    position: absolute;
    inset-block-end: var(--space-3);
    inset-inline-start: var(--space-3);
    display: flex;
    align-items: flex-end;
    gap: var(--space-2);
  }

  .dnd-vehicle-map-ruler {
    display: flex;
    flex-direction: column;
  }

  .dnd-vehicle-map-bar {
    display: block;
    block-size: var(--space-1);
    border: var(--border-hair) solid var(--metal);
    border-block-start: none;
  }

  .dnd-vehicle-map-warn {
    color: var(--state-warn);
  }

  .dnd-vehicle-map-legend {
    position: absolute;
    inset-block-end: var(--space-3);
    inset-inline-end: var(--space-3);
    display: flex;
    gap: var(--space-2);
  }

  .dnd-vehicle-map-swatch,
  .dnd-vehicle-map-dot {
    display: inline-block;
    inline-size: var(--space-2);
    block-size: var(--space-2);
    border-radius: var(--space-0);
  }

  .dnd-vehicle-map-dot {
    border-radius: var(--radius-pill);
  }

  .dnd-vehicle-map-swatch-close {
    background: color-mix(in srgb, var(--verdigris) 70%, transparent);
  }

  .dnd-vehicle-map-swatch-normal {
    background: color-mix(in srgb, var(--verdigris) 45%, transparent);
  }

  .dnd-vehicle-map-swatch-long {
    background: color-mix(in srgb, var(--verdigris) 22%, transparent);
  }

  .dnd-vehicle-map-dot-functional {
    background: var(--state-good);
  }

  .dnd-vehicle-map-dot-impaired {
    background: var(--state-warn);
  }

  .dnd-vehicle-map-dot-broken {
    background: var(--state-bad);
  }

  @keyframes dnd-vehicle-map-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .spin {
      animation: none;
    }
  }
</style>
