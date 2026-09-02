<script lang="ts">
  import Ornament from '$components/ui/Ornament.svelte';

  let { onToggleCharacterInfo }: { onToggleCharacterInfo: () => void } = $props();
</script>

<header class="header">
  <button
    class="burger-btn"
    onclick={onToggleCharacterInfo}
    title="Character Info"
    aria-label="Toggle character info"
  >
    <span class="burger-line"></span>
    <span class="burger-line"></span>
    <span class="burger-line"></span>
  </button>

  <span class="header-run">
    <Ornament name="vine" tone="metal" />
  </span>
</header>

<style>
  .header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 60px;
    display: flex;
    align-items: center;
    gap: var(--space-5);
    padding: 0 var(--space-5);
    background:
      var(--texture-noise),
      linear-gradient(180deg, var(--ground-lift) 0%, var(--ground) 70%, var(--ground-deep) 100%);
    background-blend-mode: overlay, normal;
    border-bottom: var(--border-hair) solid var(--metal-dim);
    box-shadow: 0 4px 16px var(--shade), inset 0 1px 0 var(--metal-edge);
    z-index: 999;
  }

  .header-run {
    flex: 1;
    min-width: 0;
    opacity: 0.35;
  }

  .burger-btn {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: none;
    gap: 4px;
    width: 40px;
    height: 40px;
    cursor: pointer;
    background: linear-gradient(135deg, var(--metal-dim) 0%, var(--ground-lift) 55%, var(--metal-dim) 100%);
    border: none;
    clip-path: polygon(
      8px 0,
      calc(100% - 8px) 0,
      100% 8px,
      100% calc(100% - 8px),
      calc(100% - 8px) 100%,
      8px 100%,
      0 calc(100% - 8px),
      0 8px
    );
    transition: filter 0.15s ease, transform 0.15s ease;
  }

  .burger-btn:hover {
    transform: translateY(-1px);
    filter: drop-shadow(0 0 10px var(--ember-glow));
  }

  .burger-btn:active {
    transform: translateY(0);
  }

  .burger-btn:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  .burger-line {
    width: 20px;
    height: 2px;
    background: var(--metal-bright);
    box-shadow: 0 0 6px var(--metal-edge);
  }

  .burger-btn:hover .burger-line {
    background: var(--ember-core);
  }

  @media (max-width: 768px) {
    .header {
      padding: 0 var(--space-3);
    }

    .header-run {
      display: none;
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
