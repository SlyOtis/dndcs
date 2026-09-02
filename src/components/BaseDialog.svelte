<script lang="ts">
  import { getContext, type Snippet } from 'svelte';
  
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
  
  // Context for dialog state management
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
  
  // Update global dialog state
  $effect(() => {
    if (dialogContext) {
      dialogContext.setDialogState(isOpen);
    }
  });
  
  // Focus trap - focus the dialog when it opens
  $effect(() => {
    if (isOpen && dialogElement) {
      dialogElement.focus();
    }
  });
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  {#if backdrop}
    <!-- Backdrop -->
    <button
      type="button"
      class="backdrop"
      aria-label="Close dialog"
      onclick={handleBackdropClick}
      style="z-index: {zIndex};"
    ></button>
  {/if}
  
  <!-- Dialog -->
  <div 
    bind:this={dialogElement}
    class="dialog"
    style="width: {width}; max-width: {maxWidth}; max-height: {maxHeight}; z-index: {zIndex + 1};"
    tabindex="-1"
    role="dialog"
    aria-modal="true"
    aria-labelledby={title ? 'dialog-title' : undefined}
  >
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
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
  }
  
  .dialog {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--color-content-dark);
    border: 2px solid var(--color-primary-main);
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    outline: none;
    animation: dialog-enter 0.2s ease-out;
  }
  
  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--color-primary-main);
    background: var(--color-content-main);
  }
  
  .dialog-title {
    margin: 0;
    color: var(--color-primary-text);
    font-size: 1.25rem;
    font-weight: 600;
  }
  
  .close-button {
    background: none;
    border: none;
    color: var(--color-secondary-text);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .close-button:hover {
    background: var(--color-content-light);
    color: var(--color-primary-text);
  }
  
  .close-button svg {
    width: 20px;
    height: 20px;
  }
  
  .dialog-content {
    overflow-y: auto;
    max-height: calc(80vh - 80px); /* Account for header */
  }
  
  @keyframes dialog-enter {
    from {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }
</style>