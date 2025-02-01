<script lang="ts">
  import type {CharacterAction} from "../lib/types";

  let {actions = $bindable()}: {actions: CharacterAction[]} = $props()

  let primary = $derived(actions.filter)

</script>

<div class="root">
    <div class="actions">
        <div class="divider">
            <span>Actions</span>
        </div>
        <div class="items">
            {#each actions as action}
        </div>
        <div class="divider">
            <span>Bonus Actions</span>
        </div>

        <div class="divider">
            <span>Reactions</span>
        </div>

        <div class="divider">
            <span>Other</span>
        </div>
    </div>
</div>

<style>
    .root {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: start;
        align-items: start;
        flex-direction: column;
        overflow-y: scroll;
        overflow-x: hidden;
    }

    .actions {
        position: relative;
        width: 100%;
        height: auto;
    }

    .divider {
        position: relative;
        width: 100%;
        height: auto;
        border-bottom: 1px solid var(--color-primary-main);
        padding: 4px 16px;
    }
</style>
