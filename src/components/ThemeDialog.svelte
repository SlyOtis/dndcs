<script lang="ts">
  import { onMount } from 'svelte';
  import BaseDialog from './BaseDialog.svelte';
  import Ornament from '$components/ui/Ornament.svelte';
  import { availableThemes, getTheme, setTheme } from '$lib/dialogs/theme';

  let { isOpen = $bindable(false) } = $props();

  let currentTheme = $state(getTheme());

  const themes = availableThemes;

  onMount(() => {
    applyTheme(getTheme());
  });

  function applyTheme(themeId: string) {
    setTheme(themeId);
    currentTheme = getTheme();
  }
</script>

<BaseDialog bind:isOpen title="Choose Your Realm" width="600px" zIndex={9999}>
  <div class="content">
    <div class="crest">
      <Ornament name="crest" size="md" tone="metal" />
    </div>

    <p class="description">Select a mystical theme for your character sheet</p>

    <div class="realms">
      {#each themes as theme}
        <button
          type="button"
          class="realm"
          class:realm-lit={currentTheme === theme.id}
          aria-pressed={currentTheme === theme.id}
          onclick={() => applyTheme(theme.id)}
        >
          <span class="realm-cusp">
            <Ornament name="cusp" size="xs" tone="metal" />
          </span>

          <span class="realm-glass">
            {#each theme.colors as color}
              <span class="realm-hue" style="background-color: {color}"></span>
            {/each}
          </span>

          <span class="realm-name">{theme.name}</span>
          <span class="realm-note">{theme.description}</span>

          {#if currentTheme === theme.id}
            <span class="realm-mark">
              <Ornament name="quatrefoil" size="xs" tone="ember" />
            </span>
          {/if}
        </button>
      {/each}
    </div>
  </div>
</BaseDialog>

<style>
  .content {
    padding: var(--space-5) var(--space-6) var(--space-6);
  }

  .crest {
    display: flex;
    justify-content: center;
    opacity: 0.9;
  }

  .description {
    margin: var(--space-2) 0 var(--space-5);
    text-align: center;
    color: var(--ink-dim);
    font-style: italic;
    font-size: var(--text-sm);
    letter-spacing: var(--tracking-wide);
  }

  .realms {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--space-4);
  }

  .realm {
    --realm-rim: var(--metal-dim);
    --realm-light: transparent;
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-5) var(--space-4) var(--space-4);
    background:
      var(--texture-weave),
      linear-gradient(180deg, var(--ground-lift) 0%, var(--ground-raised) 55%, var(--ground) 100%);
    border: var(--border-hair) solid var(--realm-rim);
    border-radius: var(--radius-xl) var(--radius-xl) var(--radius-sm) var(--radius-sm);
    box-shadow: var(--shadow-sm), inset 0 1px 0 var(--metal-edge);
    color: var(--ink);
    text-align: left;
    cursor: pointer;
    transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
  }

  .realm::before {
    content: '';
    position: absolute;
    inset: 4px;
    border: var(--border-hair) solid var(--metal-edge);
    border-radius: calc(var(--radius-xl) - 4px) calc(var(--radius-xl) - 4px) var(--radius-sm) var(--radius-sm);
    opacity: 0.6;
    pointer-events: none;
  }

  .realm:hover {
    --realm-rim: var(--metal);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md), inset 0 1px 0 var(--metal-edge);
  }

  .realm:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  .realm-lit {
    --realm-rim: var(--metal);
    --realm-light: var(--ember-glow);
    box-shadow: var(--shadow-md), inset 0 0 26px -8px var(--realm-light), var(--glow-metal);
  }

  .realm-cusp {
    position: absolute;
    top: -1px;
    left: -1px;
    opacity: 0.7;
    pointer-events: none;
  }

  .realm-glass {
    display: flex;
    gap: var(--space-2);
    justify-content: center;
    margin-bottom: var(--space-2);
  }

  .realm-hue {
    width: 30px;
    height: 30px;
    border-radius: var(--radius-pill);
    border: var(--border-width) solid var(--metal-dim);
    box-shadow: inset 0 -6px 10px -6px var(--shade-hard), 0 0 10px -2px var(--realm-light);
  }

  .realm-name {
    font-family: var(--font-display);
    font-size: var(--text-md);
    font-weight: 700;
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
    color: var(--metal-bright);
  }

  .realm-note {
    color: var(--ink-faint);
    font-size: var(--text-xs);
    line-height: 1.4;
  }

  .realm-mark {
    position: absolute;
    top: var(--space-2);
    right: var(--space-2);
    display: flex;
    pointer-events: none;
  }

  @media (max-width: 640px) {
    .content {
      padding: var(--space-4);
    }

    .realms {
      grid-template-columns: 1fr;
    }
  }
</style>
