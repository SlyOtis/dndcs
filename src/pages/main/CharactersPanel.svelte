<script lang="ts">
  import { navigate } from "sly-svelte-location-router";
  import { userCharacters } from "$lib/stores/character.store";
  import Card from "$components/ui/Card.svelte";

  let { loading = false, search = '' } = $props();

  let shown = $derived($userCharacters.filter((entry) =>
    entry.metadata.name.toLowerCase().includes(search.toLowerCase()) ||
    entry.metadata.class.toLowerCase().includes(search.toLowerCase()) ||
    entry.metadata.race.toLowerCase().includes(search.toLowerCase())
  ));

  function openCharacter(characterId: string) {
    navigate(`/character/${characterId}`);
  }
</script>

{#if loading}
  <div class="dnd-loading"><span class="dnd-spinner"></span></div>
{:else if shown.length === 0}
  <div class="dnd-empty">
    <span class="dnd-empty-mark">⚔</span>
    <span>No character carries your name yet</span>
  </div>
{:else}
  <div class="roll-grid">
    {#each shown as entry (entry.id)}
      <Card
        layout="tile"
        title={entry.metadata.name}
        sub="Level {entry.metadata.level} {entry.metadata.race} {entry.metadata.class}"
        image={entry.character.info?.imageUrl}
        badge={entry.metadata.status === 'draft' ? 'Draft' : String(entry.metadata.level)}
        tone="ember"
        onclick={() => openCharacter(entry.id)}
      >
        {#if entry.metadata.status === 'draft'}
          <span class="roll-draft">Not finished</span>
        {:else}
          <span>HP {entry.character.info?.hp?.current ?? 0}/{entry.character.info?.hp?.max ?? 0}</span>
          <span>AC {entry.character.info?.ac ?? 10}</span>
        {/if}
      </Card>
    {/each}
  </div>
{/if}

<style>
  .roll-grid {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4);
    min-width: 0;
  }

  .roll-draft {
    font-family: var(--font-display);
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
    color: var(--state-warn);
  }
</style>
