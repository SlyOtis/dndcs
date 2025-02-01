<script lang="ts">
  import type {Snippet} from "svelte";

  let {
    initialTab,
    ...tabs
  }: {
    inventory: Snippet,
    actions: Snippet,
    feats: Snippet,
    background: Snippet,
    initialTab: string,
  } = $props();

  type Tabs = keyof typeof tabs
  let selectedTab = $state(initialTab as Tabs);

  function selectTab(e, tab: Tabs) {
    e.stopPropagation()
    e.preventDefault()
    selectedTab = tab;
  }

</script>

<div class="root primary-border">
    <div class="header">
        <button onclick={e => selectTab(e, 'actions')} class:selected={selectedTab === 'actions'}>
            Actions
        </button>
        <button onclick={e => selectTab(e, 'inventory')} class:selected={selectedTab === 'inventory'}>
            Inventory
        </button>
        <button onclick={e => selectTab(e, 'feats')} class:selected={selectedTab === 'feats'}>
            Feats
        </button>
        <button onclick={e => selectTab(e, 'background')} class:selected={selectedTab === 'background'}>
            Background
        </button>
    </div>
    <div class="content">
        {@render tabs[selectedTab]()}
    </div>
</div>

<style>
    .root {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: start;
        align-items: center;
        flex-direction: column;
        min-height: 500px;
        grid-area: a;
    }

    .header {
        position: relative;
        display: grid;
        width: 100%;
        height: auto;
        grid-template-columns: repeat(4, 1fr);
        border-bottom: 2px solid var(--color-primary-main);
    }

    button {
        position: relative;
        outline: none;
        border: none;
        cursor: pointer;
        background-color: var(--color-content-main);
    }

    .selected {
        background-color: var(--color-content-light);
    }
</style>