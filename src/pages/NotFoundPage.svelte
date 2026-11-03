<script lang="ts">
  import { navigate } from 'sly-svelte-location-router'
  import { onMount } from 'svelte'

  onMount(() => {
    navigate('/main')
  })
</script>
