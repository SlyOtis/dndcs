<script lang="ts">
  import { navigate } from "sly-svelte-location-router";
  import { getCatalogFacts, type CatalogEntry, type CatalogKind } from "$lib/catalog";
  import Panel from "$components/ui/Panel.svelte";
  import Card from "$components/ui/Card.svelte";

  let { loading = false, classes = [] as CatalogEntry[], races = [] as CatalogEntry[] } = $props();

  let search = $state('');

  let shelf = $derived([
    ...classes.map((entry) => ({ kind: 'classes' as CatalogKind, entry })),
    ...races.map((entry) => ({ kind: 'races' as CatalogKind, entry }))
  ]);

  let shown = $derived(shelf.filter((row) =>
    row.entry.name.toLowerCase().includes(search.toLowerCase()) ||
    row.entry.description.toLowerCase().includes(search.toLowerCase())
  ));

  function openSource(kind: CatalogKind, id: string) {
    navigate(`/sources/${kind}/${id}`);
  }
</script>

<Panel title="Catalog" pad="sm">
  {#snippet actions()}
    <input
      type="text"
      class="dnd-search"
      placeholder="Search the shelf..."
      aria-label="Search the catalog"
      bind:value={search}
    />
  {/snippet}

  {#if loading}
    <div class="dnd-loading"><span class="dnd-spinner"></span></div>
  {:else if shelf.length === 0}
    <div class="dnd-empty">
      <span class="dnd-empty-mark">📖</span>
      <span>The shelf holds no lore yet</span>
    </div>
  {:else}
    <p class="shelf-tally">{classes.length} classes, {races.length} races</p>

    {#each shown as row (row.kind + row.entry.id)}
      <Card
        title={row.entry.name}
        sub={row.entry.description}
        image={row.entry.image ? String(row.entry.image) : undefined}
        badge={row.kind === 'classes' ? 'class' : 'race'}
        tone="metal"
        onclick={() => openSource(row.kind, row.entry.id)}
      >
        {#each getCatalogFacts(row.kind, row.entry) as fact (fact.key)}
          <span>{fact.key} {fact.value}</span>
        {/each}
      </Card>
    {/each}
  {/if}
</Panel>

<style>
  .shelf-tally {
    margin: 0;
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--ink-faint);
  }
</style>
