<script lang="ts">
  import {getContext} from "svelte";
  import type {CharacterContext} from "../lib/types";
  import {addCurrencies, asGold} from "../lib/engine";
  import type {CharacterCurrency} from "../lib/character.types";

  const {inventory, info, currency} = getContext<CharacterContext>('character')

  let carriedWeight = $derived($inventory.reduce((prev, curr) => {
    return prev += curr.weight
  }, 0))

  let carryCapacity = $derived($info.carry_capacity)
  let encumbered = $derived(carriedWeight > carryCapacity)
  let inventoryValue = $derived($inventory.reduce((prev, curr) => {
    return {
      ...prev,
      [curr.value.currency]: curr.value.amount + prev?.[curr.value.currency] || 0,
    }
  }, {}) as CharacterCurrency)

  let totalValuables = $derived(addCurrencies(inventoryValue, $currency))
  let searchInput = $state('')

  let filteredItems = $derived.by(() => $inventory.filter(val => val.attributes.find(attr => attr.includes(searchInput)) ||
    val.description.includes(searchInput) ||
    val.enchantments?.find(ench => ench.name.includes(searchInput) || ench.description.includes(searchInput)) ||
    val.rarity?.includes(searchInput) ||
    val.subtype?.includes(searchInput) ||
    val.type?.includes(searchInput) ||
    val.id?.includes(searchInput) ||
    val.title?.includes(searchInput)))

</script>

<div class="root">
    <div class="header">
        <div class="weight">
            <span><b>Weight carried:</b> {carryCapacity}/{carryCapacity} .lb</span>
            <span class="encumbered">
                {#if encumbered}
                    ENCUMBERED
                {:else}
                    UNENCUMBERED
                {/if}
            </span>
        </div>
        <div class="currency">
            <span><b>Currency carried:</b> {$currency.gp}gp, {$currency.sp}sp, {$currency.pp}pp, {$currency.cp}
                cp, or {asGold($currency)}gp</span>
            <span><b>Total valuables:</b> {asGold(totalValuables)}gp</span>
        </div>
    </div>
    <div class="search">
        <input placeholder="search" bind:value={searchInput}/>
        <button onclick={e => {
            e.preventDefault()
            e.stopPropagation()
        }}>Search
        </button>
    </div>
    <div class="scroll">
        <ul>
            <li class="items-header">
                <span>Active</span>
                <span>Name</span>
                <span>Weight</span>
                <span>Qty</span>
                <span>Cost (gp)</span>
                <span>Notes</span>
            </li>
            {#each filteredItems as item}
                <li class="item">
                    <div class="equippable center">
                        {#if item.equippable}
                            <button class="toggle"
                                    class:equipped={item.equipped}
                                    onclick={e => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    inventory.update(curr => {
                                        const i = curr.findIndex(val => val.id === item.id)
                                        const currItem = curr[i]
                                        curr[i] = {
                                            ...curr[i],
                                            equipped: !currItem.equipped
                                        }
                                        return curr
                                    })

                                }}
                            >-
                            </button>
                        {:else}
                            <span class="empty">-</span>
                        {/if}
                    </div>
                    <div class="name">
                        <h4>{item.title}</h4>
                        <span>{item.type}</span>
                    </div>
                    <div class="weight center">
                        <span><b>{item.weight}</b> lb.</span>
                    </div>
                    <div class="qty center">
                        <span><b>{item.quantity}</b></span>
                    </div>
                    <div class="cost center">
                        <span><b>{item.value.amount}</b> {item.value.currency}</span>
                    </div>
                    <div class="notes">
                        <p>{item.description}</p>
                    </div>
                </li>
            {/each}
        </ul>
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
        background-color: var(--color-content-dark);
    }

    .header {
        position: relative;
        width: 100%;
        height: auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-direction: row;
        padding: 8px 16px;
    }

    .weight {
        font-size: 0.8em;
        display: flex;
        flex-direction: column;
        justify-content: start;
        align-items: start;
    }

    .currency {
        font-size: 0.8em;
        display: flex;
        flex-direction: column;
        align-items: end;
        justify-content: center;
    }

    .search {
        position: relative;
        width: 100%;
        height: auto;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: row;
    }

    .search > input {
        position: relative;
        width: 100%;
        height: 100%;
        border: none;
        outline: none;
        padding: 8px;
    }

    .search > button {
        position: relative;
        width: auto;
        height: 100%;
        padding: 8px;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    ul {
        position: relative;
        width: 100%;
        height: auto;
        padding: 8px 12px;
        margin: 0;
        list-style: none;
        display: grid;
        align-items: center;
        justify-items: start;
        grid-template-columns: auto auto auto auto auto auto;
        grid-auto-rows: auto;
        grid-column-gap: 8px;
        grid-row-gap: 8px;
    }

    li {
        position: relative;
        width: 100%;
        height: auto;
        display: contents;
    }

    .items-header {
        position: sticky;
        top: 0;
    }

    .scroll {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        overflow-y: scroll;
    }

    .center {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        width: 100%;
        height: 100%;
    }

    .name {
        position: relative;
    }

    .name > * {
        margin: 0;
        padding: 0;
    }

    .notes {
        font-size: 0.6em;
    }

    .toggle, .empty {
        position: relative;
        width: 32px;
        height: 32px;
        min-height: 32px;
        min-width: 32px;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
        justify-self: center;
        align-self: center;
        text-align: center;
        background-color: transparent;
    }

    .toggle {
        content: ' ';
        background-color: var(--color-content-main);
        border: 2px solid var(--color-primary-main);
        border-radius: 8px;
        color: transparent;
    }

    .equipped {
        background-color: var(--color-primary-main);
    }

</style>
