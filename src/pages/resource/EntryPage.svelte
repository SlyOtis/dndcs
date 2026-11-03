<script lang="ts">
  import ResourceShell from '$components/campaign/ResourceShell.svelte'
  import type { Entry } from '$lib/resources'
</script>

<ResourceShell kind="entries">
  {#snippet facts(one)}
    {@const it = one as unknown as Entry}
    {#if it.description}<dt>What it is</dt><dd>{it.description}</dd>{/if}
  {/snippet}

</ResourceShell>
