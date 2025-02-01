<script lang="ts">
  let {inspiration = $bindable()}: {inspiration: boolean} = $props()
</script>

<div class="root primary-border">
    <label for={`btn-inspiration`}>Inspiration</label>
    <button
            id={`input-inspiration`}
            name={`input-inspiration`}
            class="primary-border"
            onclick={(e) => {
                e.stopPropagation()
                e.preventDefault()
            }}
    >
        {#if inspiration}+{:else}-{/if}
    </button>
</div>

<style>
    .root {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: auto;
        height: auto;
        gap: 6px;
        padding: 4px 8px;
        border-radius: 16px;
        z-index: 1;
    }

    button {
        position: relative;
        width: auto;
        height: auto;
        display: flex;
        justify-content: center;
        align-items: center;
        color: var(--color-primary-text);
        background: transparent;
        padding: 4px 8px;
        cursor: pointer;
        font-size: 1.5em;
    }

    .score-container {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        height: auto;
        z-index: 2;
        margin-bottom: -20px;
        border-radius: 16px;
        width: 50%;
        background: var(--color-content-main);
        color: var(--color-content-text);
    }
</style>