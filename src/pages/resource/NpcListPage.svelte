<script lang="ts">
  import ResourceRoll from '$components/campaign/ResourceRoll.svelte'
  import { navigate } from 'sly-svelte-location-router'
  import Row from '$components/ui/Row.svelte'
  import { RESOURCES, type Character, type Hero } from '$lib/resources'
</script>

<ResourceRoll kind="characters" lead="heroes">
  {#snippet leadRow(one, under, peek)}
    {@const it = one as unknown as Hero}
    <Row
      title={one.title}
      sub={one.description}
      mark={RESOURCES.heroes.mark(one) || undefined}
      tone="ember"
      image={one.image}
      onclick={() => peek(one)}
      onopen={() => navigate(`${under}/${one.id}`)}
    >
      {#if one.tags.length > 0}
        <span class="roll-tags">
          {#each one.tags as tag (tag)}<span class="roll-tag">#{tag}</span>{/each}
        </span>
      {/if}
      <span>Level {it.level}</span>
      {#if it.class}<span>{it.class}</span>{/if}
      {#if it.player}<span>Played by {it.player}</span>{/if}
    </Row>
  {/snippet}

  {#snippet row(one, under, peek)}
    {@const it = one as unknown as Character}
    <Row
      title={one.title}
      sub={one.description}
      mark={RESOURCES.characters.mark(one) || undefined}
      tone="ember"
      image={one.image}
      onclick={() => peek(one)}
      onopen={() => navigate(`${under}/${one.id}`)}
    >
      {#if one.tags.length > 0}
        <span class="roll-tags">
          {#each one.tags as tag (tag)}<span class="roll-tag">#{tag}</span>{/each}
        </span>
      {/if}
      {#if it.role}<span>{it.role}</span>{/if}
      <span>{it.disposition}</span>
      {#if it.species}<span>{it.species}</span>{/if}
    </Row>
  {/snippet}
</ResourceRoll>

<style>
  .roll-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .roll-tag {
    font-family: var(--font-display);
    letter-spacing: var(--tracking-wide);
    color: var(--metal);
    text-shadow: 0 1px 0 #000;
  }
</style>
