<script lang="ts">
  import type {CharacterSense} from "../lib/types";

  let {senses = $bindable()}: { senses: CharacterSense[] } = $props()
</script>


<div class="root primary-border">
    <div class="saves">
        {#each senses as sense}
            <span class="primary-border">
                {sense.title}
            </span>
            <span class="title">{sense.title}</span>
        {/each}
    </div>
    <span>Saving Throws</span>
</div>

<style>
    .root {
        position: relative;
        gap: 16px;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        width: auto;
        height: auto;
        padding: 4px 8px;
    }

    .saves {
        position: relative;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        width: auto;
        height: auto;
    }
</style>