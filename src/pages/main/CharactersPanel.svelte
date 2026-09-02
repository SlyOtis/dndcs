<script lang="ts">
  import { navigate } from "sly-svelte-location-router";
  import { userCharacters } from "$lib/stores/character.store";
  import Panel from "$components/ui/Panel.svelte";
  import Card from "$components/ui/Card.svelte";
  import Sigil from "$components/ui/Sigil.svelte";

  let { loading = false } = $props();

  let characterSearch = $state('');

  let filteredCharacters = $derived($userCharacters.filter(char =>
    char.metadata.name.toLowerCase().includes(characterSearch.toLowerCase()) ||
    char.metadata.class.toLowerCase().includes(characterSearch.toLowerCase()) ||
    char.metadata.race.toLowerCase().includes(characterSearch.toLowerCase())
  ));

  function createNewCharacter() {
    navigate('/main/create/character');
  }

  function openCharacter(characterId: string) {
    navigate(`/character/${characterId}`);
  }
</script>

<Panel title="Characters" variant="stone">
  {#snippet actions()}
    <input
      type="text"
      class="dnd-search"
      placeholder="Search the roll..."
      aria-label="Search characters"
      bind:value={characterSearch}
    />
    <Sigil title="Forge a new character" tone="ember" size="sm" onclick={createNewCharacter}>⚔</Sigil>
  {/snippet}

  {#if loading}
    <div class="dnd-loading"><span class="dnd-spinner"></span></div>
  {:else if filteredCharacters.length === 0}
    <div class="dnd-empty">
      <span class="dnd-empty-mark">🎲</span>
      <p>No characters answer that name</p>
    </div>
  {:else}
    {#each filteredCharacters as character (character.id)}
      <Card
        title={character.metadata.name}
        sub="Level {character.metadata.level} {character.metadata.race} {character.metadata.class}"
        image={character.character.info?.imageUrl}
        tone="ember"
        onclick={() => openCharacter(character.id)}
      >
        <span>HP {character.character.info?.hp?.current || 0}/{character.character.info?.hp?.max || 0}</span>
        <span>AC {character.character.info?.ac || 10}</span>
      </Card>
    {/each}
  {/if}
</Panel>

