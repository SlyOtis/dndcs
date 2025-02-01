<script lang="ts">
  import type {CharacterInfo} from "../lib/types"
  import PlainBox from "./PlainBox.svelte"
  import Initiative from "./Initiative.svelte"
  import HitPoints from "./HitPoints.svelte"

  let {info = $bindable()}: { info: CharacterInfo } = $props()

</script>


<div class="root">

</div>

<style>
    .root {
        position: relative;
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
        width: auto;
        height: auto;
        gap: 6px;
        padding: 4px 8px;
        border-radius: 16px;
        z-index: 1;
    }
</style>