<script lang="ts">
  import { getContext, type Snippet } from 'svelte';
  import Ornament from '$components/ui/Ornament.svelte';
  
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
    <span class="dialog-corner dialog-corner-start">
      <Ornament name="corner" size="sm" tone="metal" />
    </span>
    <span class="dialog-corner dialog-corner-end">
      <Ornament name="corner" size="sm" tone="metal" flip />
    </span>

    {#if title || showCloseButton}
      <div class="dialog-header">
        {#if title}
          <h2 id="dialog-title" class="dialog-title">{title}</h2>
        {/if}
        {#if showCloseButton}
          <button class="close-button" onclick={closeDialog} aria-label="Close dialog">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
            </svg>
          </button>
        {/if}
      </div>
    {/if}
    
    <div class="dialog-content">
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
    background: radial-gradient(ellipse at 50% 50%, var(--shade) 0%, var(--shade-hard) 100%);
    backdrop-filter: blur(5px) saturate(0.6);
    cursor: default;
    animation: dialog-veil 0.2s ease-out;
  }

  .dialog {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    background:
      var(--texture-weave),
      linear-gradient(180deg, var(--ground-raised) 0%, var(--ground) 60%, var(--ground-deep) 100%);
    border: var(--border-width) solid var(--metal-dim);
    border-radius: var(--radius-lg);
    box-shadow:
      var(--shadow-lg),
      inset 0 0 0 var(--border-hair) var(--metal-edge),
      inset 0 0 50px -18px var(--ember-glow);
    overflow: hidden;
    outline: none;
    animation: dialog-enter 0.22s ease-out;
  }

  .dialog-corner {
    position: absolute;
    top: -3px;
    z-index: 3;
    opacity: 0.8;
    pointer-events: none;
  }

  .dialog-corner-start {
    left: -3px;
  }

  .dialog-corner-end {
    right: -3px;
  }

  .dialog-header {
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-4) var(--space-5);
    background: linear-gradient(180deg, var(--ground-lift) 0%, var(--ground-raised) 100%);
    border-bottom: var(--border-hair) solid var(--metal-dim);
    box-shadow: inset 0 1px 0 var(--metal-edge), 0 3px 12px var(--shade);
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

  .close-button {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 32px;
    height: 32px;
    padding: 0;
    background: linear-gradient(180deg, var(--ground-lift), var(--ground-deep));
    border: var(--border-hair) solid var(--metal-dim);
    border-radius: var(--radius-pill);
    color: var(--metal);
    cursor: pointer;
    transition: color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .close-button:hover {
    color: var(--state-bad);
    border-color: var(--state-bad);
    box-shadow: 0 0 12px color-mix(in srgb, var(--state-bad) 45%, transparent);
  }

  .close-button:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  .close-button svg {
    width: 18px;
    height: 18px;
  }

  .dialog-content {
    position: relative;
    z-index: 1;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--metal-dim) transparent;
  }

  .dialog-content::-webkit-scrollbar {
    width: 10px;
  }

  .dialog-content::-webkit-scrollbar-track {
    background: var(--ground-deep);
  }

  .dialog-content::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, var(--metal-dim), var(--ground-lift));
    border-radius: var(--radius-pill);
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
