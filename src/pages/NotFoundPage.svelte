<script lang="ts">
  import { navigate, type RouteComponentProps } from 'sly-svelte-location-router'
  import Button from '$components/ui/Button.svelte'
  import Ornament from '$components/ui/Ornament.svelte'
  import Shell from '$components/ui/Shell.svelte'

  const { route }: { route?: RouteComponentProps } = $props()

  const path = $derived(route?.error?.path ?? '')
</script>

<Shell title="Lost" back={() => navigate('/main')}>
  <div class="lost">
    <span class="lost-crest"><Ornament name="crest" size="md" tone="metal" /></span>
    <h1 class="dnd-heading dnd-heading-hero lost-name">No such page</h1>
    <span class="lost-rule"><Ornament name="divider" tone="metal" /></span>

    {#if path}
      <p class="lost-path">{path}</p>
    {/if}

    <p class="lost-note">Nothing is charted at that address.</p>

    <Button variant="primary" onclick={() => navigate('/main')}>Back to the hearth</Button>
  </div>
</Shell>

<style>
  .lost {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-8) var(--space-5);
    text-align: center;
  }

  .lost-crest {
    display: block;
    filter: drop-shadow(0 4px 10px var(--shade-hard));
  }

  .lost-name {
    font-size: var(--text-2xl);
  }

  .lost-rule {
    display: block;
    width: min(420px, 70%);
  }

  .lost-path {
    margin: 0;
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--metal);
    overflow-wrap: anywhere;
  }

  .lost-note {
    margin: 0 0 var(--space-3);
    font-size: var(--text-sm);
    color: var(--ink-dim);
  }
</style>
