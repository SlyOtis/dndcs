<script lang="ts">
  import ResourceShell from '$components/campaign/ResourceShell.svelte'
  import type { Chart } from '$lib/resources'
</script>

<ResourceShell kind="maps">
  {#snippet facts(one)}
    {@const it = one as unknown as Chart}
    <dt>Charts</dt>
    <dd>{it.title}</dd>
  {/snippet}

</ResourceShell>
