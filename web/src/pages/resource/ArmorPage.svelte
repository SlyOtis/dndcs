<script lang="ts">
  import ResourceShell from '$components/campaign/ResourceShell.svelte'
  import type { Armor } from '$lib/resources'
</script>

<ResourceShell kind="armor">
  {#snippet facts(one)}
    {@const it = one as unknown as Armor}
    <dt>Armor class</dt>
    <dd>{it.armor_class}</dd>
    <dt>Weight class</dt>
    <dd>{it.category}</dd>
    <dt>Rarity</dt>
    <dd>{it.rarity}</dd>
    <dt>Stealth</dt>
    <dd>{it.stealth_penalty ? "Hindered" : "Unhindered"}</dd>
    {#if it.weight}<dt>Weight</dt><dd>{it.weight}</dd>{/if}
  {/snippet}

  {#snippet form(one)}
    <dt><label for="armor-class">Armor class</label></dt>
    <dd>
      <input id="armor-class" type="number" bind:value={one.armor_class} />
    </dd>
    <dt><label for="armor-category">Weight class</label></dt>
    <dd>
      <select id="armor-category" bind:value={one.category}>
        {#each ["light", "medium", "heavy", "shield"] as choice (choice)}
          <option value={choice}>{choice}</option>
        {/each}
      </select>
    </dd>
    <dt><label for="armor-rarity">Rarity</label></dt>
    <dd>
      <select id="armor-rarity" bind:value={one.rarity}>
        {#each ["common", "uncommon", "rare", "very rare", "legendary", "artifact"] as choice (choice)}
          <option value={choice}>{choice}</option>
        {/each}
      </select>
    </dd>
    <dt><label for="armor-stealth">Hinders stealth</label></dt>
    <dd>
      <select id="armor-stealth" bind:value={one.stealth_penalty}>
        <option value={false}>No</option>
        <option value={true}>Yes</option>
      </select>
    </dd>
    <dt><label for="armor-weight">Weight</label></dt>
    <dd>
      <input id="armor-weight" type="number" bind:value={one.weight} />
    </dd>
  {/snippet}
</ResourceShell>
