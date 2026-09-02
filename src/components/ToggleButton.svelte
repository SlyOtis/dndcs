<script lang="ts">
    import type { Snippet } from 'svelte';

    const {
        checked = false,
        disabled = false,
        onclick,
        children
    }: {
        /** Lights the rune to mark the toggle as set. */
        checked?: boolean
        /** Blocks interaction and dims the toggle. */
        disabled?: boolean
        /** Runs with the next state when the toggle is pressed. */
        onclick?: (checked: boolean) => void
        /** The mark drawn inside the toggle. */
        children?: Snippet
    } = $props();

    function handleClick(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();

        if (!disabled) {
            onclick?.(!checked);
        }
    }
</script>

<button
    type="button"
    class="dnd-toggle"
    class:dnd-toggle-checked={checked}
    aria-pressed={checked}
    onclick={handleClick}
    {disabled}
>
    {#if children}
        {@render children()}
    {:else}
        <span class="dnd-toggle-rune">{checked ? '◆' : '◇'}</span>
    {/if}
</button>

<style>
    .dnd-toggle {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        flex: none;
        width: 30px;
        height: 30px;
        padding: 0;
        cursor: pointer;
        background: linear-gradient(135deg, var(--metal-dim) 0%, var(--ground-lift) 55%, var(--metal-dim) 100%);
        border: none;
        color: var(--ink-faint);
        font-size: var(--text-sm);
        line-height: 1;
        clip-path: polygon(
            6px 0,
            calc(100% - 6px) 0,
            100% 6px,
            100% calc(100% - 6px),
            calc(100% - 6px) 100%,
            6px 100%,
            0 calc(100% - 6px),
            0 6px
        );
        transition: color 0.15s ease, filter 0.15s ease;
    }

    .dnd-toggle::before {
        content: '';
        position: absolute;
        inset: 2px;
        background: radial-gradient(circle at 40% 28%, var(--ground-raised) 0%, var(--ground-deep) 84%);
        box-shadow: inset 0 2px 6px var(--shade-hard);
        clip-path: inherit;
    }

    .dnd-toggle-rune {
        position: relative;
        z-index: 1;
    }

    .dnd-toggle-checked {
        color: var(--ember);
        filter: drop-shadow(0 0 8px var(--ember-glow));
    }

    .dnd-toggle:hover:not(:disabled) {
        color: var(--metal-bright);
    }

    .dnd-toggle:disabled {
        cursor: not-allowed;
        opacity: 0.4;
    }

    .dnd-toggle:focus-visible {
        outline: none;
        box-shadow: var(--focus-ring);
    }
</style>
