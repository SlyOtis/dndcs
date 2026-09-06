<script lang="ts">
  import { getContext, type Snippet } from 'svelte';
  import Ornament from '$components/ui/Ornament.svelte';
  import Sigil from '$components/ui/Sigil.svelte'
  import Glyph from '$components/ui/Glyph.svelte';

  let {
    isOpen = $bindable(false),
    onClose,
    title = '',
    width = '600px',
    maxWidth = '90vw',
    maxHeight = '80vh',
    showCloseButton = true,
    backdrop = true,
    closeOnBackdropClick = true,
    closeOnEscape = true,
    zIndex = 1000,
    children
  }: {
    isOpen: boolean;
    onClose?: () => void;
    title?: string;
    width?: string;
    maxWidth?: string;
    maxHeight?: string;
    showCloseButton?: boolean;
    backdrop?: boolean;
    closeOnBackdropClick?: boolean;
    closeOnEscape?: boolean;
    zIndex?: number;
    children?: Snippet;
  } = $props();

  let dialogElement = $state<HTMLDivElement>();

  const dialogContext = getContext('dialogState') as {
    setDialogState: (isOpen: boolean) => void;
  } | undefined;

  function closeDialog() {
    if (onClose) {
      onClose();
    } else {
      isOpen = false;
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (closeOnBackdropClick && event.target === event.currentTarget) {
      closeDialog();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (closeOnEscape && event.key === 'Escape') {
      event.preventDefault();
      closeDialog();
    }
  }

  $effect(() => {
    if (dialogContext) {
      dialogContext.setDialogState(isOpen);
    }
  });

  $effect(() => {
    if (isOpen && dialogElement) {
      dialogElement.focus();
    }
  });
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  {#if backdrop}
    <button
      type="button"
      class="backdrop"
      aria-label="Close dialog"
      onclick={handleBackdropClick}
      style="z-index: {zIndex};"
    ></button>
  {/if}

  <div
    bind:this={dialogElement}
    class="dialog"
    style="width: {width}; max-width: {maxWidth}; max-height: {maxHeight}; z-index: {zIndex + 1};"
    tabindex="-1"
    role="dialog"
    aria-modal="true"
    aria-labelledby={title ? 'dialog-title' : undefined}
  >
    <span class="dialog-crown">
      <Ornament name="tracery" size="sm" tone="metal" />
    </span>

    <span class="dialog-corner dialog-corner-head-start">
      <Ornament name="corner" size="sm" tone="metal" />
    </span>
    <span class="dialog-corner dialog-corner-head-end">
      <Ornament name="corner" size="sm" tone="metal" flip />
    </span>
    <span class="dialog-corner dialog-corner-foot-start">
      <Ornament name="cusp" size="xs" tone="metal" rotate={180} flip />
    </span>
    <span class="dialog-corner dialog-corner-foot-end">
      <Ornament name="cusp" size="xs" tone="metal" rotate={180} />
    </span>

    {#if title || showCloseButton}
      <div class="dialog-header">
        {#if title}
          <h2 id="dialog-title" class="dialog-title">{title}</h2>
        {/if}
        {#if showCloseButton}
          <Sigil title="Close dialog" tone="bane" size="sm" frame="cusped" onclick={closeDialog}>
            <Glyph name="close" size="sm" />
          </Sigil>
        {/if}
      </div>
      <span class="dialog-key">
        <Ornament name="divider" tone="metal" />
      </span>
    {/if}

    <div class="dialog-content dnd-scroll">
      {@render children?.()}
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    border: none;
    padding: 0;
    background:
      var(--texture-motes),
      radial-gradient(ellipse at 50% 50%, var(--shade) 0%, var(--shade-hard) 100%);
    backdrop-filter: blur(5px) saturate(0.6);
    cursor: default;
    animation: dialog-veil 0.2s ease-out;
  }

  .dialog {
    --dialog-rim: var(--metal-dim);
    --dialog-key: var(--metal-edge);
    --dialog-head: linear-gradient(180deg, var(--ground-lift) 0%, var(--ground-raised) 100%);
    --dialog-glass:
      var(--texture-weave),
      linear-gradient(180deg, var(--ground-raised) 0%, var(--ground) 60%, var(--ground-deep) 100%);
    --dialog-arch: var(--radius-xl);
    --dialog-foot: var(--radius-lg);
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    background: var(--dialog-glass);
    border: var(--border-width) solid var(--dialog-rim);
    border-radius: var(--dialog-arch) var(--dialog-arch) var(--dialog-foot) var(--dialog-foot);
    box-shadow:
      var(--shadow-lg),
      inset 0 0 0 var(--border-hair) var(--dialog-key),
      inset 0 0 50px -18px var(--ember-glow);
    outline: none;
    animation: dialog-enter 0.22s ease-out;
  }

  .dialog::before {
    content: '';
    position: absolute;
    inset: 5px;
    z-index: 4;
    border: var(--border-hair) solid var(--dialog-key);
    border-radius: calc(var(--dialog-arch) - 5px) calc(var(--dialog-arch) - 5px) calc(var(--dialog-foot) - 5px)
      calc(var(--dialog-foot) - 5px);
    pointer-events: none;
  }

  .dialog-crown {
    position: absolute;
    top: 0;
    left: 50%;
    z-index: 5;
    display: flex;
    transform: translate(-50%, -58%);
    padding: var(--space-1);
    border-radius: var(--radius-pill);
    background: radial-gradient(circle at 50% 40%, var(--ground-raised) 55%, var(--ground-deep) 100%);
    pointer-events: none;
    filter: drop-shadow(0 2px 8px var(--shade-hard));
  }

  .dialog-corner {
    position: absolute;
    z-index: 3;
    opacity: 0.8;
    pointer-events: none;
  }

  .dialog-corner-head-start {
    top: -3px;
    left: -3px;
  }

  .dialog-corner-head-end {
    top: -3px;
    right: -3px;
  }

  .dialog-corner-foot-start {
    bottom: -2px;
    left: -2px;
  }

  .dialog-corner-foot-end {
    bottom: -2px;
    right: -2px;
  }

  .dialog-header {
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-4) var(--space-5);
    background: var(--dialog-head);
    border-bottom: var(--border-hair) solid var(--dialog-rim);
    border-radius: calc(var(--dialog-arch) - var(--border-width)) calc(var(--dialog-arch) - var(--border-width)) 0 0;
    box-shadow: inset 0 1px 0 var(--dialog-key), 0 3px 12px var(--shade);
  }

  .dialog-title {
    margin: 0;
    padding-inline-start: var(--space-5);
    font-family: var(--font-display);
    font-size: var(--text-lg);
    font-weight: 700;
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
    color: var(--metal-bright);
    text-shadow: 0 1px 2px var(--shade-hard);
  }

  .dialog-key {
    position: relative;
    z-index: 3;
    display: block;
    width: 220px;
    margin: calc(var(--space-3) * -1) auto var(--space-1);
    opacity: 0.85;
    pointer-events: none;
  }

  .dialog-content {
    position: relative;
    z-index: 1;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    border-radius: 0 0 calc(var(--dialog-foot) - var(--border-width)) calc(var(--dialog-foot) - var(--border-width));
  }

  @keyframes dialog-veil {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes dialog-enter {
    from {
      opacity: 0;
      transform: translate(-50%, -46%) scale(0.96);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }
</style>
