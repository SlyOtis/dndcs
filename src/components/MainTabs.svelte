<script lang="ts">
  import {onDestroy, type Snippet} from "svelte";
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

  initialTab = localStorage.getItem('selectedTab') || initialTab
  const selectedTab = writable(initialTab as Tabs);

  const unsubscribe = selectedTab.subscribe(state => {
    localStorage.setItem('selectedTab', state)
  })

  onDestroy(() => unsubscribe())

  function selectTab(e, tab: Tabs) {
    e.stopPropagation()
    e.preventDefault()
    selectedTab.set(tab)
  }

</script>

<div class="root primary-border">
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
        width: 100%;
        height: 100%;

        display: flex;
        justify-content: start;
        align-items: center;
        flex-direction: column;
        min-height: 500px;
        max-height: 600px;
        overflow: hidden;

        align-self: stretch;
        justify-self: stretch;

        grid-column: 1 / 6;
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
        padding: 8px 16px;
    }

    .selected {
        background-color: var(--color-content-light);
    }

    .content {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: stretch;
        align-items: stretch;
        overflow: hidden;
    }
</style>