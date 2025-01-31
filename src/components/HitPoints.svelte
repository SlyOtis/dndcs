<script lang="ts">
  import type {CharacterHitPoints} from "../lib/types";

  let {hp = $bindable()}: { hp: CharacterHitPoints } = $props()

</script>

<div class="root primary-border">
    <div class="health">
        <div class="points">
            <span>Current</span>
            <span class="value">{hp.current}</span>
        </div>
        <span class="divider">/</span>
        <div class="points">
            <span>Max</span>
            <span class="value">{hp.max}</span>
        </div>
    </div>
    <div class="points">
        <span>Temp</span>
        <span class="value">{#if hp.temporary === 0}--{:else}{hp.temporary}{/if}</span>
    </div>
</div>

<style>
    .root {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: row;
        width: auto;
        height: auto;
        gap: 16px;
        padding: 8px 12px;
    }

    .health {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: row;
        gap: 12px;
    }

    .points {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
    }

    .divider {
        font-size: 2em;
    }

    .value {
        font-weight: 600;
    }
</style>

