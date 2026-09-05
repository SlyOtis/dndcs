<script lang="ts">
  import BaseDialog from './BaseDialog.svelte';
  import Ornament from '$components/ui/Ornament.svelte';
  import Portrait, { PORTRAIT_FRAMES, type PortraitFrame } from '$components/ui/Portrait.svelte';

  let {
    isOpen = $bindable(false),
    frame = $bindable(),
    src,
    alt
  }: {
    /** Whether the dialog is showing. */
    isOpen: boolean;
    /** The frame the portrait is traced in. */
    frame?: string;
    /** The picture to preview in every frame. */
    src?: string;
    /** Alternative text for the picture. */
    alt: string;
  } = $props();

  const taken = $derived((frame as PortraitFrame) ?? 'lancet');
</script>

<BaseDialog bind:isOpen title="Choose Your Frame" width="600px" zIndex={9999}>
  <div class="content">
    <div class="crest">
      <Ornament name="crest" size="md" tone="metal" />
    </div>

    <p class="description">Select the surround your portrait is traced in</p>

    <div class="traces">
      {#each PORTRAIT_FRAMES as choice (choice.id)}
        <button
          type="button"
          class="trace"
          class:trace-lit={taken === choice.id}
          aria-pressed={taken === choice.id}
          onclick={() => (frame = choice.id)}
        >
          <Portrait {src} {alt} frame={choice.id} size="sm" />
          <span class="trace-name">{choice.title}</span>

          {#if taken === choice.id}
            <span class="trace-mark">
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

  .traces {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: var(--space-4);
  }

  .trace {
    --trace-rim: var(--metal-dim);
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-4) var(--space-3) var(--space-3);
    background:
      var(--texture-weave),
      linear-gradient(180deg, var(--ground-lift) 0%, var(--ground-raised) 55%, var(--ground) 100%);
    border: var(--border-hair) solid var(--trace-rim);
    border-radius: var(--radius-xl) var(--radius-xl) var(--radius-sm) var(--radius-sm);
    box-shadow: var(--shadow-sm), inset 0 1px 0 var(--metal-edge);
    color: var(--ink);
    cursor: pointer;
    transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
  }

  .trace:hover {
    --trace-rim: var(--metal);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md), inset 0 1px 0 var(--metal-edge);
  }

  .trace:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  .trace-lit {
    --trace-rim: var(--metal);
    box-shadow: var(--shadow-md), inset 0 0 26px -8px var(--ember-glow), var(--glow-metal);
  }

  .trace-name {
    font-family: var(--font-display);
    font-size: var(--text-sm);
    font-weight: 700;
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
    color: var(--metal-bright);
  }

  .trace-mark {
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
  }
</style>
