<script lang="ts">
  import ResourceShell from '$components/campaign/ResourceShell.svelte'
  import type { Quest } from '$lib/resources'
</script>

<ResourceShell kind="quests">
  {#snippet facts(one)}
    {@const it = one as unknown as Quest}
    <dt>State</dt>
    <dd>{it.state}</dd>
    {#if it.level}<dt>Level</dt><dd>{it.level}</dd>{/if}
    {#if it.giver}<dt>Given by</dt><dd>{it.giver}</dd>{/if}
  {/snippet}

  {#snippet form(one)}
    <dt><label for="quest-state">State</label></dt>
    <dd>
      <select id="quest-state" bind:value={one.state}>
        <option value="active">active</option>
        <option value="done">done</option>
        <option value="abandoned">abandoned</option>
      </select>
    </dd>
    <dt><label for="quest-level">Level</label></dt>
    <dd>
      <input id="quest-level" type="number" bind:value={one.level} />
    </dd>
    <dt><label for="quest-giver">Given by</label></dt>
    <dd>
      <input id="quest-giver" type="text" bind:value={one.giver} />
    </dd>
  {/snippet}
</ResourceShell>
