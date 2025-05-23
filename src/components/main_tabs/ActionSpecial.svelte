<script lang="ts">
  import AdditionalSlots from "./AdditionalSlots.svelte";
  import type {CharacterAction} from "../../lib/character.types";

  let {action}: { action: CharacterAction } = $props()

  // TODO:: Use context instead

</script>

<li class="root">
    <div class="title">
        <h4>{action.name} {action?.level ? '- lvl ' + action.level : ''}</h4>
    </div>
    <div class="content">
        <p>{action.description}</p>
    </div>
    {#if action.usesSlots}
        <AdditionalSlots/>
    {/if}
</li>

<style>
    li {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: start;
        align-items: start;
        flex-direction: column;
        margin-bottom: 16px;
    }

    h4, p {
        margin: 0;
        padding: 0;
    }

    .content {
        position: relative;
        width: 100%;
        height: auto;
    }
</style>
