<script lang="ts">
  import { navigate } from "sly-svelte-location-router";
  import { userCharacters } from "$lib/stores/character.store";
  import Rail from "$components/ui/Rail.svelte";
  import Card from "$components/ui/Card.svelte";
  import Sigil from "$components/ui/Sigil.svelte";
  import Glyph from "$components/ui/Glyph.svelte";

  let { loading = false } = $props();

  let search = $state('');

  let shown = $derived($userCharacters.filter((entry) =>
    entry.metadata.name.toLowerCase().includes(search.toLowerCase()) ||
    entry.metadata.class.toLowerCase().includes(search.toLowerCase()) ||
    entry.metadata.race.toLowerCase().includes(search.toLowerCase())
  ));

  function createCharacter() {
    navigate('/main/create/character');
  }

  function openCharacter(characterId: string) {
    navigate(`/character/${characterId}`);
  }
</script>

<Rail
  title="Characters"
  note="{$userCharacters.length} on the roll"
  tone="ember"
  mark="⚔"
  empty="No character carries your name yet"
  count={shown.length}
  {loading}
>
  {#snippet actions()}
    <input
      type="text"
      class="dnd-search"
      placeholder="Search the roll..."
      aria-label="Search characters"
      bind:value={search}
    />
    <Sigil title="Forge a new character" tone="ember" size="sm" onclick={createCharacter} frame="star"><Glyph name="character" size="sm" /></Sigil>
  {/snippet}

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
</Rail>

<style>
  .roll-draft {
    font-family: var(--font-display);
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
    color: var(--state-warn);
  }
</style>
