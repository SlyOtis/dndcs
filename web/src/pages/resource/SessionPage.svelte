<script lang="ts">
  import ResourceShell from '$components/campaign/ResourceShell.svelte'
  import type { Session } from '$lib/resources'
</script>

<ResourceShell kind="sessions">
  {#snippet facts(one)}
    {@const it = one as unknown as Session}
    <dt>Number</dt>
    <dd>{it.number}</dd>
    {#if it.played_at}<dt>Played on</dt><dd>{it.played_at}</dd>{/if}
  {/snippet}

  {#snippet form(one)}
    <dt><label for="session-number">Number</label></dt>
    <dd>
      <input id="session-number" type="number" bind:value={one.number} />
    </dd>
    <dt><label for="session-played">Played on</label></dt>
    <dd>
      <input id="session-played" type="text" bind:value={one.played_at} />
    </dd>
  {/snippet}
</ResourceShell>
