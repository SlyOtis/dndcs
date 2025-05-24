<script lang="ts">
  let { onToggleCharacterInfo }: { onToggleCharacterInfo: () => void } = $props();
</script>

<header class="header">
  <button 
    class="burger-btn" 
    onclick={onToggleCharacterInfo}
    title="Character Info"
  >
    <span class="burger-line"></span>
    <span class="burger-line"></span>
    <span class="burger-line"></span>
  </button>
</header>

<style>
  .header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: linear-gradient(135deg, 
      var(--color-content-main) 0%, 
      color-mix(in srgb, var(--color-content-main) 95%, var(--color-primary-main)) 100%);
    border-bottom: 2px solid var(--color-primary-main);
    z-index: 999;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    padding: 0 20px;
  }

  .burger-btn {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 40px;
    height: 40px;
    background: linear-gradient(145deg, 
      var(--color-content-main), 
      color-mix(in srgb, var(--color-content-main) 90%, black));
    border: 2px solid color-mix(in srgb, var(--color-primary-main) 60%, transparent);
    border-radius: 8px;
    cursor: pointer;
    gap: 4px;
    transition: all 0.2s ease;
    box-shadow: 
      0 2px 4px rgba(0, 0, 0, 0.1),
      inset 0 1px 2px rgba(255, 255, 255, 0.1);
  }

  .burger-btn:hover {
    background: linear-gradient(145deg, 
      var(--color-accent), 
      color-mix(in srgb, var(--color-accent) 85%, black));
    border-color: var(--color-secondary-main);
    transform: translateY(-1px);
    box-shadow: 
      0 4px 8px rgba(0, 0, 0, 0.2),
      inset 0 1px 3px rgba(255, 255, 255, 0.2);
  }

  .burger-btn:active {
    transform: translateY(0);
    box-shadow: 
      0 1px 3px rgba(0, 0, 0, 0.1),
      inset 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .burger-line {
    width: 20px;
    height: 2px;
    background: var(--color-primary-text);
    border-radius: 1px;
    transition: all 0.2s ease;
  }

  .burger-btn:hover .burger-line {
    background: var(--color-primary-text);
    box-shadow: 0 0 4px rgba(255, 255, 255, 0.3);
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .header {
      padding: 0 12px;
    }
    
    .burger-btn {
      width: 36px;
      height: 36px;
    }

    .burger-line {
      width: 18px;
    }
  }
</style>