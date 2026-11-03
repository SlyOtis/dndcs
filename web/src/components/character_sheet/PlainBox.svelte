<script lang="ts">
  import Stat from "$components/ui/Stat.svelte";

  let {value = $bindable(), title, subTitle, prefix}: { value: string | number, title: string, subTitle?: string, prefix?: string } = $props()
</script>

<Stat label={title} value="{prefix ?? ''}{value}" sub={subTitle} tone="metal" />
