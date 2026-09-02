<script lang="ts">
  import type { UserProfile } from "$lib/firestore.types";
  import Panel from "$components/ui/Panel.svelte";
  import Card from "$components/ui/Card.svelte";
  import Button from "$components/ui/Button.svelte";

  let { loading = false } = $props();

  let users = $state<UserProfile[]>([]);
  let userSearch = $state('');

  let filteredUsers = $derived(users.filter(user =>
    user.display_name.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearch.toLowerCase())
  ));

  function addFriend(userId: string) {
    console.log('Adding friend:', userId);
  }

  function viewUserCharacters(userId: string) {
    console.log('Viewing characters for user:', userId);
  }
</script>

<Panel title="Company" variant="stone">
  {#snippet actions()}
    <input
      type="text"
      class="dnd-search"
      placeholder="Search the company..."
      aria-label="Search users"
      bind:value={userSearch}
    />
  {/snippet}

  {#if loading}
    <div class="dnd-loading"><span class="dnd-spinner"></span></div>
  {:else if filteredUsers.length === 0}
    <div class="dnd-empty">
      <span class="dnd-empty-mark">👥</span>
      <p>Search for others to ride with</p>
    </div>
  {:else}
    {#each filteredUsers as user (user.uid)}
      <div class="company-entry">
        <Card
          title={user.display_name}
          sub={user.email}
          image={user.photo_url}
          tone="metal"
          onclick={() => viewUserCharacters(user.uid)}
        />
        <div class="company-actions">
          <Button variant="ghost" size="sm" onclick={() => addFriend(user.uid)}>Add Friend</Button>
          <Button variant="ghost" size="sm" onclick={() => viewUserCharacters(user.uid)}>Characters</Button>
        </div>
      </div>
    {/each}
  {/if}
</Panel>

<style>
  .company-entry {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .company-actions {
    display: flex;
    gap: var(--space-2);
    padding-inline-start: var(--space-3);
  }
</style>
