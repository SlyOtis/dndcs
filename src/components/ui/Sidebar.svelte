<script lang="ts">
  import type { Snippet } from 'svelte'

  const {
    side = 'start',
    open = false,
    run = '400px',
    children
  }: {
    /** Which edge the drawer slides in from. */
    side?: 'start' | 'end'
    /** Whether the drawer is showing. */
    open?: boolean
    /** The width the content is laid out at, whatever the drawer is squeezed to. */
    run?: string
    /** What the drawer holds. */
    children?: Snippet
  } = $props()
</script>

<aside
  class="dnd-sidebar dnd-sidebar-{side}"
  class:dnd-sidebar-open={open}
  style:--sidebar-run={run}
  aria-hidden={!open}
>
  <div class="dnd-sidebar-inner">{@render children?.()}</div>
</aside>

<style>
  .dnd-sidebar {
    --sidebar-edge: 0.75rem;
    position: relative;
    overflow: hidden;
    z-index: 10;
    background:
      var(--seam) var(--seam-at) top / var(--sidebar-edge) 100% no-repeat border-box,
      var(--texture-noise),
      linear-gradient(180deg, var(--ground-raised) 0%, var(--ground-deep) 100%);
    background-clip: border-box;
    box-shadow: 0 0 24px var(--shade-hard);
    transform: translateX(var(--translate-x, 0));
    transition: transform 250ms ease-in-out;
  }

  .dnd-sidebar-inner {
    position: absolute;
    inset-block: 0;
    width: min(calc(var(--sidebar-run) - var(--sidebar-edge)), calc(100vw - var(--sidebar-edge)));
  }

  .dnd-sidebar-start {
    --seam-at: right;
    --seam: linear-gradient(90deg, var(--keyline) 0%, color-mix(in srgb, var(--wood) 70%, var(--ember-core) 12%) 10%, var(--wood) 26%, var(--wood-dark) 34%, var(--wood) 44%, var(--wood-dark) 56%, var(--keyline) 62%, var(--metal-dim) 68%, var(--metal-bright) 76%, var(--metal) 84%, var(--metal-dim) 90%, var(--keyline) 100%);
    border-right: var(--sidebar-edge) solid transparent;
    --translate-x: calc(-100% - 2px);
  }

  .dnd-sidebar-start > .dnd-sidebar-inner {
    inset-inline-end: 0;
  }

  .dnd-sidebar-end {
    --seam-at: left;
    --seam: linear-gradient(270deg, var(--keyline) 0%, color-mix(in srgb, var(--wood) 70%, var(--ember-core) 12%) 10%, var(--wood) 26%, var(--wood-dark) 34%, var(--wood) 44%, var(--wood-dark) 56%, var(--keyline) 62%, var(--metal-dim) 68%, var(--metal-bright) 76%, var(--metal) 84%, var(--metal-dim) 90%, var(--keyline) 100%);
    border-left: var(--sidebar-edge) solid transparent;
    --translate-x: calc(100% + 2px);
  }

  .dnd-sidebar-end > .dnd-sidebar-inner {
    inset-inline-start: 0;
  }

  .dnd-sidebar-open {
    --translate-x: 0;
    transform: none;
  }
</style>
