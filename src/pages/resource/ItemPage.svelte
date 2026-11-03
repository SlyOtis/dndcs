<script lang="ts">
  import ResourceShell from '$components/campaign/ResourceShell.svelte'
  import type { Item } from '$lib/resources'
</script>

<ResourceShell kind="items">
  {#snippet facts(one)}
    {@const it = one as unknown as Item}
    <dt>Rarity</dt>
    <dd>{it.rarity}</dd>
    {#if it.category}<dt>Kind</dt><dd>{it.category}</dd>{/if}
    <dt>Attunement</dt>
    <dd>{it.attunement ? "Needed" : "Not needed"}</dd>
    {#if it.weight}<dt>Weight</dt><dd>{it.weight}</dd>{/if}
    {#if it.value}<dt>Worth</dt><dd>{it.value} gp</dd>{/if}
  {/snippet}

  {#snippet form(one)}
    <dt><label for="item-category">Kind</label></dt>
    <dd>
      <input id="item-category" type="text" bind:value={one.category} />
    </dd>
    <dt><label for="item-rarity">Rarity</label></dt>
    <dd>
      <select id="item-rarity" bind:value={one.rarity}>
        {#each ["common", "uncommon", "rare", "very rare", "legendary", "artifact"] as choice (choice)}
          <option value={choice}>{choice}</option>
        {/each}
      </select>
    </dd>
    <dt><label for="item-attunement">Needs attunement</label></dt>
    <dd>
      <select id="item-attunement" bind:value={one.attunement}>
        <option value={false}>No</option>
        <option value={true}>Yes</option>
      </select>
    </dd>
    <dt><label for="item-weight">Weight</label></dt>
    <dd>
      <input id="item-weight" type="number" bind:value={one.weight} />
    </dd>
    <dt><label for="item-value">Worth in gold</label></dt>
    <dd>
      <input id="item-value" type="number" bind:value={one.value} />
    </dd>
  {/snippet}
</ResourceShell>
