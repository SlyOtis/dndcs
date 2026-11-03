<script lang="ts">
  import ResourceShell from '$components/campaign/ResourceShell.svelte'
  import type { Weapon } from '$lib/resources'
</script>

<ResourceShell kind="weapons">
  {#snippet facts(one)}
    {@const it = one as unknown as Weapon}
    <dt>Damage</dt>
    <dd>{it.damage} {it.damage_kind}</dd>
    <dt>Rarity</dt>
    <dd>{it.rarity}</dd>
    {#if it.reach}<dt>Reach</dt><dd>{it.reach} ft</dd>{/if}
    <dt>Attunement</dt>
    <dd>{it.attunement ? "Needed" : "Not needed"}</dd>
    {#if it.weight}<dt>Weight</dt><dd>{it.weight}</dd>{/if}
  {/snippet}

  {#snippet form(one)}
    <dt><label for="weapon-damage">Damage</label></dt>
    <dd>
      <input id="weapon-damage" type="text" bind:value={one.damage} />
    </dd>
    <dt><label for="weapon-damage-kind">Damage kind</label></dt>
    <dd>
      <select id="weapon-damage-kind" bind:value={one.damage_kind}>
        {#each ["bludgeoning", "piercing", "slashing", "fire", "cold", "lightning", "necrotic", "radiant"] as choice (choice)}
          <option value={choice}>{choice}</option>
        {/each}
      </select>
    </dd>
    <dt><label for="weapon-rarity">Rarity</label></dt>
    <dd>
      <select id="weapon-rarity" bind:value={one.rarity}>
        {#each ["common", "uncommon", "rare", "very rare", "legendary", "artifact"] as choice (choice)}
          <option value={choice}>{choice}</option>
        {/each}
      </select>
    </dd>
    <dt><label for="weapon-reach">Reach in feet</label></dt>
    <dd>
      <input id="weapon-reach" type="number" bind:value={one.reach} />
    </dd>
    <dt><label for="weapon-attunement">Needs attunement</label></dt>
    <dd>
      <select id="weapon-attunement" bind:value={one.attunement}>
        <option value={false}>No</option>
        <option value={true}>Yes</option>
      </select>
    </dd>
    <dt><label for="weapon-weight">Weight</label></dt>
    <dd>
      <input id="weapon-weight" type="number" bind:value={one.weight} />
    </dd>
  {/snippet}
</ResourceShell>
