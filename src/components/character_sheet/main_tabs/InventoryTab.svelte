<script lang="ts">
  import {getContext} from "svelte";
  import type {CharacterContext} from "$lib/types";
  import type {CharacterCurrency} from "$lib/character.types";
  import {addCurrencies, asGold} from "$lib/engine";

  const {inventory, info, currency, equipped} = getContext<CharacterContext>('character')

  let carriedWeight = $derived($inventory.reduce((prev, curr) => {
    return prev += curr.weight
  }, 0))

  let carryCapacity = $derived($info.carry_capacity)
  let encumbered = $derived(carriedWeight > carryCapacity)
  let inventoryValue = $derived($inventory.reduce((prev, curr) => {
    return {
      ...prev,
      [curr.value.currency]: curr.value.amount + (prev as any)?.[curr.value.currency] || 0,
    }
  }, {} as CharacterCurrency))

  let totalValuables = $derived(addCurrencies(inventoryValue, $currency))
  let searchInput = $state('')

  let filteredItems = $derived.by(() => {
    const items = $inventory.filter(val => val.attributes.find(attr => attr.includes(searchInput)) ||
      val.description.includes(searchInput) ||
      val.enchantments?.find(ench => ench.name.includes(searchInput) || ench.description.includes(searchInput)) ||
      val.rarity?.includes(searchInput) ||
      val.subtype?.includes(searchInput) ||
      val.type?.includes(searchInput) ||
      val.id?.includes(searchInput) ||
      val.title?.includes(searchInput))
    
    // Debug: Log items that are marked as consumable but might be ammunition
    items.forEach(item => {
      if (item.type === 'consumable' && (
        item.title.toLowerCase().includes('ammunition') ||
        item.title.toLowerCase().includes('rounds') ||
        item.title.toLowerCase().includes('bullets') ||
        item.title.toLowerCase().includes('shotshells') ||
        item.title.toLowerCase().includes('arrows') ||
        item.description.toLowerCase().includes('firearm')
      )) {
        console.warn('🔍 FOUND AMMUNITION MARKED AS CONSUMABLE:', {
          title: item.title,
          type: item.type,
          description: item.description,
          id: item.id
        });
      }
    });
    
    return items;
  })

  function getEquipIcon(itemType: string): string {
    const icons: {[key: string]: string} = {
      weapon: '⚔️',
      armor: '🛡️',
      ammunition: '🏹',
      tool: '🔨',
      consumable: '🧪',
      treasure: '💎',
      container: '📦',
      misc: '📄'
    }
    return icons[itemType] || '⚙️'
  }

  function isAmmunition(item: any): boolean {
    return item.type === 'ammunition' || (
      item.type === 'consumable' && (
        item.title.toLowerCase().includes('ammunition') ||
        item.title.toLowerCase().includes('rounds') ||
        item.title.toLowerCase().includes('bullets') ||
        item.title.toLowerCase().includes('shotshells') ||
        item.title.toLowerCase().includes('arrows') ||
        item.description.toLowerCase().includes('firearm')
      )
    );
  }

  function getDisplayType(item: any): string {
    // If item is actually ammunition but marked as consumable, show "ammunition"
    if (isAmmunition(item)) {
      return 'ammunition';
    }
    
    return item.type;
  }

  function isItemEquipped(itemId: string): boolean {
    if (!$equipped || !Array.isArray($equipped)) {
      console.warn('Equipped is not an array:', $equipped);
      return false;
    }
    return $equipped.some(equippedItem => equippedItem.id === itemId);
  }

  function equipItem(item: any) {
    equipped.update(curr => {
      // Ensure curr is an array
      if (!Array.isArray(curr)) {
        console.warn('Current equipped is not an array, initializing as empty array:', curr);
        curr = [];
      }
      
      const isCurrentlyEquipped = curr.some(equippedItem => equippedItem.id === item.id);
      
      if (isCurrentlyEquipped) {
        // Unequip the item
        const newEquipped = curr.filter(equippedItem => equippedItem.id !== item.id);
        console.log('Equipment change - UNEQUIPPED:', {
          itemType: item.type,
          itemId: item.id,
          itemTitle: item.title,
          newEquipped
        });
        return newEquipped;
      } else {
        // Equip the item - first remove any items of the same primary type
        const primaryType = item.type; // Use the primary type to avoid conflicts
        const newEquipped = curr.filter(equippedItem => {
          // Remove items that have the same primary type
          const equippedTypes = equippedItem.type.split(',').map(t => t.trim());
          return !equippedTypes.includes(primaryType);
        });
        
        // Add the new equipped item
        newEquipped.push({
          id: item.id,
          title: item.title,
          type: item.type // This could be comma-separated types
        });
        
        console.log('Equipment change - EQUIPPED:', {
          itemType: item.type,
          itemId: item.id,
          itemTitle: item.title,
          newEquipped,
          equippedItemCreated: {
            id: item.id,
            title: item.title,
            type: item.type
          }
        });
        
        return newEquipped;
      }
    });
  }

  function consumeItem(item: any) {
    inventory.update(curr => {
      return curr.map(invItem => {
        if (invItem.id === item.id) {
          const newQuantity = Math.max(0, invItem.quantity - 1);
          console.log('Item consumed:', {
            itemId: item.id,
            itemTitle: item.title,
            oldQuantity: invItem.quantity,
            newQuantity
          });
          return {
            ...invItem,
            quantity: newQuantity
          };
        }
        return invItem;
      }).filter(invItem => invItem.quantity > 0); // Remove items with 0 quantity
    });
  }

  // Debug function to fix ammunition type - call from browser console: window.fixAmmunitionType()
  function fixAmmunitionType() {
    inventory.update(curr => {
      return curr.map(invItem => {
        if (invItem.type === 'consumable' && (
          invItem.title.toLowerCase().includes('ammunition') ||
          invItem.title.toLowerCase().includes('rounds') ||
          invItem.title.toLowerCase().includes('bullets') ||
          invItem.title.toLowerCase().includes('shotshells') ||
          invItem.title.toLowerCase().includes('arrows') ||
          invItem.description.toLowerCase().includes('firearm')
        )) {
          console.log('🔧 FIXING ammunition item:', invItem.title, 'from consumable to ammunition');
          return {
            ...invItem,
            type: 'ammunition'
          };
        }
        return invItem;
      });
    });
  }

  // Expose function to window for debugging
  if (typeof window !== 'undefined') {
    (window as any).fixAmmunitionType = fixAmmunitionType;
  }

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
                        {#if item.type === 'consumable' && !isAmmunition(item)}
                            <button class="consume"
                                    onclick={e => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    consumeItem(item)
                                }}
                            >🧪
                            </button>
                        {:else}
                            <button class="toggle"
                                    class:equipped={isItemEquipped(item.id)}
                                    onclick={e => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    equipItem(item)
                                }}
                            >{isAmmunition(item) ? '🏹' : getEquipIcon(item.type)}
                            </button>
                        {/if}
                    </div>
                    <div class="name">
                        <h4>{item.title}</h4>
                        <span>{getDisplayType(item)}</span>
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
        max-height: 100%;
        display: flex;
        justify-content: start;
        align-items: start;
        flex-direction: column;
        overflow: hidden;
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
        flex: 1;
        min-height: 0;
        overflow: hidden;
        overflow-y: auto;
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

    .toggle:hover, .consume:hover {
        background: linear-gradient(145deg, var(--metal-dim), var(--ground-raised));
        border-color: var(--ember);
        transform: translateY(-1px);
        box-shadow: 
            inset 1px 1px 3px color-mix(in srgb, var(--metal) 30%, transparent),
            inset -1px -1px 3px var(--shade-soft),
            0 2px 4px var(--shade-soft);
    }

    .toggle:active, .consume:active {
        transform: translateY(0);
        box-shadow: 
            inset 2px 2px 4px var(--shade-soft),
            inset -1px -1px 2px color-mix(in srgb, var(--metal) 15%, transparent),
            0 1px 2px var(--shade-soft);
    }

    .equipped {
        background: linear-gradient(145deg, var(--metal), var(--ember));
        border-color: var(--ink);
        color: var(--ground-raised);
        font-weight: bold;
        box-shadow: 
            inset 1px 1px 3px color-mix(in srgb, var(--ink) 20%, transparent),
            inset -1px -1px 3px var(--shade),
            0 0 8px color-mix(in srgb, var(--metal) 40%, transparent);
        animation: equipped-glow 2s ease-in-out infinite;
    }

    .equipped:hover {
        background: linear-gradient(145deg, var(--ember), var(--metal));
        transform: translateY(-1px);
    }

    .consume {
        background: linear-gradient(145deg, var(--metal-dim), var(--metal-dim));
        border-color: var(--metal-dim);
        color: white;
    }

    .consume:hover {
        background: linear-gradient(145deg, var(--metal-dim), var(--metal-dim));
        border-color: var(--metal);
        transform: translateY(-1px);
        box-shadow: 
            inset 1px 1px 3px color-mix(in srgb, var(--metal) 32%, transparent),
            inset -1px -1px 3px var(--shade-soft),
            0 2px 4px var(--shade-soft);
    }

    @keyframes equipped-glow {
        0%, 100% { 
            box-shadow: 
                inset 1px 1px 3px color-mix(in srgb, var(--ink) 20%, transparent),
                inset -1px -1px 3px var(--shade),
                0 0 8px color-mix(in srgb, var(--metal) 40%, transparent);
        }
        50% { 
            box-shadow: 
                inset 1px 1px 3px color-mix(in srgb, var(--ink) 30%, transparent),
                inset -1px -1px 3px var(--shade),
                0 0 12px color-mix(in srgb, var(--metal) 60%, transparent);
        }
    }

</style>
