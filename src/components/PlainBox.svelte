<script lang="ts">
  let {value = $bindable(), title, subTitle, prefix}: { value: any, title: string, subTitle?: string, prefix?: string} = $props()

</script>

<div class="root primary-border">
    <span>{title}</span>
    <span class="value">{#if prefix}{prefix}{/if}{value}</span>
    {#if subTitle}
        <span>{subTitle}</span>
    {/if}
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
        background-color: var(--color-content-dark);
    }

    .value {
        font-size: 1.2em;
        font-weight: 500;
    }
</style>