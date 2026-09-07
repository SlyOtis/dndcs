<script lang="ts">
  import type { UserProfile } from "$lib/firestore.types";
  import Card from "$components/ui/Card.svelte";

  let { loading = false, friends = [] as UserProfile[] } = $props();
</script>

{#if loading}
  <div class="dnd-loading"><span class="dnd-spinner"></span></div>
{:else if friends.length === 0}
  <div class="dnd-empty friends-empty">
    <span class="dnd-empty-mark">🤝</span>
    <span>No friend has answered the call yet</span>
  </div>
{:else}
  <div class="dnd-stack">
    {#each friends as entry (entry.uid)}
      <Card
        title={entry.display_name || entry.email}
        sub={entry.email}
        image={entry.photo_url}
        tone="metal"
      />
    {/each}
  </div>
{/if}

<style>
  .friends-empty {
    flex: none;
  }
</style>
