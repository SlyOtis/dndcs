<script lang="ts">
  import {onDestroy, untrack, type Snippet} from "svelte";
  import {writable} from "svelte/store";

  let {
    initialTab,
    ...tabs
  }: {
    inventoryTab: Snippet,
    actionsTab: Snippet,
    featsTab: Snippet,
    backgroundTab: Snippet,
    initialTab: string,
  } = $props();

  type Tabs = keyof typeof tabs

  const selectedTab = writable((localStorage.getItem('selectedTab') || untrack(() => initialTab)) as Tabs);

  const unsubscribe = selectedTab.subscribe(state => {
    localStorage.setItem('selectedTab', state)
  })

  onDestroy(() => unsubscribe())

  function selectTab(e: Event, tab: Tabs) {
    e.stopPropagation()
    e.preventDefault()
    selectedTab.set(tab)
  }

</script>

<div class="root dnd-panel dnd-keyline">
    <div class="header">
        <button onclick={e => selectTab(e, 'actionsTab')} class:selected={$selectedTab === 'actionsTab'}>
            Actions
        </button>
        <button onclick={e => selectTab(e, 'inventoryTab')} class:selected={$selectedTab === 'inventoryTab'}>
            Inventory
        </button>
        <button onclick={e => selectTab(e, 'featsTab')} class:selected={$selectedTab === 'featsTab'}>
            Feats
        </button>
        <button onclick={e => selectTab(e, 'backgroundTab')} class:selected={$selectedTab === 'backgroundTab'}>
            Background
        </button>
    </div>
    <div class="content">
        {@render tabs[$selectedTab]()}
    </div>
</div>

<style>
    .root {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: start;
        align-items: center;
        gap: 12px;
        padding: 4px 8px;
        overflow: hidden;
        height: 100%;
        flex: 1;

        align-self: stretch;
        justify-self: stretch;

    }

    .header {
        position: relative;
        display: grid;
        width: 100%;
        height: auto;
        grid-template-columns: repeat(4, 1fr);
        background: linear-gradient(180deg, var(--ground-lift) 0%, var(--ground-deep) 100%);
        border-bottom: var(--border-width) solid var(--metal-dim);
        box-shadow: inset 0 1px 0 var(--metal-edge), 0 3px 12px var(--shade);
    }

    button {
        position: relative;
        padding: var(--space-3) var(--space-4);
        background: transparent;
        border: none;
        border-right: var(--border-hair) solid var(--ground-deep);
        cursor: pointer;
        font-family: var(--font-display);
        font-size: var(--text-xs);
        font-weight: 700;
        letter-spacing: var(--tracking-caps);
        text-transform: uppercase;
        color: var(--ink-faint);
        transition: color 0.15s ease, background 0.15s ease;
    }

    button:last-child {
        border-right: none;
    }

    button:hover {
        color: var(--metal-bright);
        background: linear-gradient(180deg, transparent, var(--ground-veil));
    }

    button:focus-visible {
        outline: none;
        box-shadow: var(--focus-ring);
    }

    .selected {
        color: var(--ember-core);
        background: linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--ember) 22%, transparent) 100%);
        text-shadow: 0 0 10px var(--ember-glow);
    }

    .selected::after {
        content: '';
        position: absolute;
        left: 12%;
        right: 12%;
        bottom: -2px;
        height: 2px;
        background: linear-gradient(90deg, transparent, var(--ember-core), transparent);
        box-shadow: 0 0 10px var(--ember);
    }

    .content {
        position: relative;
        width: 100%;
        flex: 1;
        display: flex;
        justify-content: stretch;
        align-items: stretch;
        overflow-y: auto;
        overflow-x: hidden;
        min-height: 0;
        max-height: 540px; /* Reserve space for header */
    }
</style>
