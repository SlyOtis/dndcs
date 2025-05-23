<script lang="ts">
    interface Props {
        checked?: boolean;
        disabled?: boolean;
        onclick?: (checked: boolean) => void;
        children?: any;
    }

    let { checked = false, disabled = false, onclick, children }: Props = $props();

    function handleClick(e: MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        
        if (!disabled) {
            const newChecked = !checked;
            onclick?.(newChecked);
        }
    }
</script>

<button 
    class="toggle"
    class:checked={checked}
    class:disabled={disabled}
    onclick={handleClick}
    {disabled}
>
    {#if children}
        {@render children()}
    {:else}
        {checked ? '●' : '○'}
    {/if}
</button>