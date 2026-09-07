<script lang="ts">
  import {onDestroy, untrack, type Snippet} from "svelte";
  import {writable} from "svelte/store";
  import Button from "$components/ui/Button.svelte";

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

  const tabList: { id: Tabs, title: string }[] = [
    {id: 'actionsTab', title: 'Actions'},
    {id: 'inventoryTab', title: 'Inventory'},
    {id: 'featsTab', title: 'Feats'},
    {id: 'backgroundTab', title: 'Background'}
  ]

  function selectTab(e: Event, tab: Tabs) {
    e.stopPropagation()
    e.preventDefault()
    selectedTab.set(tab)
  }

</script>

<div class="root dnd-panel dnd-keyline">
    <div class="header">
        {#each tabList as tab (tab.id)}
            <Button
                variant={$selectedTab === tab.id ? 'primary' : 'ghost'}
                size="sm"
                fill
                title={tab.title}
                onclick={e => selectTab(e, tab.id)}
            >
                {tab.title}
            </Button>
        {/each}
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
        gap: var(--space-1);
        padding: var(--space-1);
        background: linear-gradient(180deg, var(--ground-lift) 0%, var(--ground-deep) 100%);
        border-bottom: var(--border-width) solid var(--metal-dim);
        box-shadow: inset 0 1px 0 var(--metal-edge), 0 3px 12px var(--shade);
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
