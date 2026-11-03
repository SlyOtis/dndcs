<script lang="ts">
  import ResourceShell from '$components/campaign/ResourceShell.svelte'
  import type { Place } from '$lib/resources'
</script>

<ResourceShell kind="places">
  {#snippet facts(one)}
    {@const it = one as unknown as Place}
    <dt>Kind</dt>
    <dd>{it.category}</dd>
    {#if it.map_id}<dt>On the map</dt><dd>{it.map_id}</dd>{/if}
  {/snippet}

  {#snippet form(one)}
    <dt><label for="place-category">Kind</label></dt>
    <dd>
      <select id="place-category" bind:value={one.category}>
        {#each ["region", "city", "town", "village", "keep", "tower", "dungeon", "cave", "ruin", "temple", "inn"] as choice (choice)}
          <option value={choice}>{choice}</option>
        {/each}
      </select>
    </dd>
    <dt><label for="place-map">On the map</label></dt>
    <dd>
      <input id="place-map" type="text" bind:value={one.map_id} />
    </dd>
  {/snippet}
</ResourceShell>
