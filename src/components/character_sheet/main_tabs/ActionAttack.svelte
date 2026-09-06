<script lang="ts">

  import type {CharacterAction, Damage} from "$lib/character.types";
  import {rollAttack, rollDamage, rollAttackWithAmmo, rollDamageWithAmmo} from "$lib/engine";
  import {getContext} from "svelte";
  import type {CharacterContext} from "$lib/types";

  let {action}: { action: CharacterAction } = $props()

  const {inventory, equipped} = getContext<CharacterContext>('character')

  // Check if action is ranged and requires ammunition
  let isRanged = $derived(!!action.range)
  
  // Find equipped ammunition using the equipped store
  let equippedAmmo = $derived.by(() => {
    if (!isRanged) return null;
    
    // Ensure equipped is an array
    if (!$equipped || !Array.isArray($equipped)) {
      console.warn('Equipped is not an array:', $equipped);
      return null;
    }
    
    // Find any equipped item that is ammunition (more flexible search)
    const equippedAmmoItem = $equipped.find(equippedItem => {
      if (!equippedItem) return false;
      
      // Check by ID (ammunition item)
      if (equippedItem.id === 'ammunition') return true;
      
      // Check by title containing "ammunition"
      if (equippedItem.title && equippedItem.title.toLowerCase().includes('ammunition')) return true;
      
      // Check by type containing "ammunition"
      if (equippedItem.type) {
        const types = equippedItem.type.split(',').map(t => t.trim().toLowerCase());
        if (types.includes('ammunition')) return true;
      }
      
      return false;
    });
    
    if (!equippedAmmoItem) return null;
    
    // Find the actual ammunition item in inventory
    const ammo = $inventory.find(item => 
      item.id === equippedAmmoItem.id && 
      item.quantity > 0
    );
    
    // Debug logging
    console.log('=== AMMO CHECK (ARRAY SYSTEM) ===', action.name, {
      isRanged,
      actionRange: action.range,
      equippedItems: $equipped,
      equippedItemsWithTypes: $equipped.map(item => ({ 
        id: item.id, 
        title: item.title, 
        type: item.type,
        typesArray: item.type.split(',').map(t => t.trim().toLowerCase())
      })),
      equippedAmmoItem,
      inventoryAmmoItems: $inventory.filter(item => item.type === 'ammunition').map(item => ({
        id: item.id,
        title: item.title,
        type: item.type,
        quantity: item.quantity
      })),
      foundAmmo: ammo ? { id: ammo.id, title: ammo.title, quantity: ammo.quantity } : null,
      buttonsWillBeDisabled: isRanged && !ammo
    });
    
    return ammo;
  })

  // Disable buttons if ranged weapon but no ammo
  let buttonsDisabled = $derived(isRanged && !equippedAmmo)

  let properties = $derived((action.properties || ['None']).join(', '))

  const renderDamage = (dmg: Damage) => {
    const die = `${dmg.amount}d${dmg.dice}`
    if (dmg.bonus > 0) {
      return die + ` + ${dmg.bonus}`
    }

    return die
  }

</script>

<li>
    <div class="title">
        <h4 title={action.name}>{action.name}</h4>
        {#if action.range}
            <span class="sub">Ranged Attack</span>
        {:else}
            <span class="sub">Melee Attack</span>
        {/if}
    </div>
    <div class="range">
        {#if action.range}
            <span><b>{action.range.normal}</b> ({action.range.max})</span>
        {:else}
            <span><b>5ft.</b> reach</span>
        {/if}
    </div>
    <div class="hit">
        <button class="dnd-plate dnd-plate-chamfer" 
                class:disabled={buttonsDisabled}
                disabled={buttonsDisabled}
                onclick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (buttonsDisabled) return;
                    const button = e.target as HTMLButtonElement;
                    button.classList.add('pressed');
                    setTimeout(() => button.classList.remove('pressed'), 150);
                    if (isRanged && equippedAmmo) {
                        rollAttackWithAmmo(action.name, action.toHit || 0, equippedAmmo.id)
                    } else {
                        rollAttack(action.name, action.toHit || 0)
                    }
                }}>
            <span class="button-content">+{action.toHit || 0}</span>
            <div class="button-ornament"></div>
        </button>
        {#if isRanged && buttonsDisabled}
            <span class="ammo-warning">No ammo!</span>
        {/if}
    </div>
    <div class="attack">
        <button class="dnd-plate dnd-plate-chamfer" 
                class:disabled={buttonsDisabled}
                disabled={buttonsDisabled}
                onclick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (buttonsDisabled) return;
                    const button = e.target as HTMLButtonElement;
                    button.classList.add('pressed');
                    setTimeout(() => button.classList.remove('pressed'), 150);
                    const damage = action.damage?.[0]
                    if (damage) {
                        if (isRanged && equippedAmmo) {
                            rollDamageWithAmmo(action.name, damage.dice, damage.amount, damage.bonus, equippedAmmo.id)
                        } else {
                            rollDamage(action.name, damage.dice, damage.amount, damage.bonus)
                        }
                    }
                }}>
            <span class="button-content">{action.damage?.[0] ? renderDamage(action.damage[0]) : 'No damage'}</span>
            <div class="button-ornament"></div>
        </button>
        {#if isRanged && buttonsDisabled}
            <span class="ammo-warning">No ammo!</span>
        {/if}
    </div>
    <div class="properties">
        <span title={properties}>{properties}</span>
    </div>
</li>

<style>
    li {
        display: contents;
        width: 100%;
        list-style: none;
        margin: 0;
        padding: 0;
    }

    .title {
        position: relative;
        min-width: 0;
        overflow: hidden;
    }

    h4 {
        position: relative;
        margin: 0;
        padding: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .sub {
        font-size: 0.8em;
        white-space: nowrap;
    }

    .range {
        white-space: nowrap;
    }

    button {
        position: relative;
        justify-content: center;
        align-items: center;
        color: var(--ink);
        cursor: pointer;
        outline: none;
        width: 100%;
        height: 100%;
    }
    
    
    
    
    .button-ornament {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100%;
        height: 100%;
        background: 
            radial-gradient(ellipse at center, 
                color-mix(in srgb, var(--metal) 10%, transparent) 0%, 
                transparent 60%),
            conic-gradient(from 0deg at center,
                transparent 0deg,
                color-mix(in srgb, var(--metal) 5%, transparent) 45deg,
                transparent 90deg,
                color-mix(in srgb, var(--metal) 5%, transparent) 135deg,
                transparent 180deg,
                color-mix(in srgb, var(--metal) 5%, transparent) 225deg,
                transparent 270deg,
                color-mix(in srgb, var(--metal) 5%, transparent) 315deg,
                transparent 360deg);
        pointer-events: none;
        opacity: 0.6;
    }
    
    
    
    
    @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
    }

    .properties {
        position: relative;
        min-width: 0;
        overflow: hidden;
        font-size: 0.6em;
        opacity: 0.75;
    }

    .properties > span {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .ammo-warning {
        background: var(--state-bad);
        color: var(--ink);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.7em;
        font-weight: 600;
        white-space: nowrap;
        text-align: center;
        animation: pulse 1s ease-in-out infinite;
    }

    @keyframes pulse {
        0%, 100% { opacity: 0.8; }
        50% { opacity: 1; }
    }

    .hit, .attack {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 4px;
    }
</style>
