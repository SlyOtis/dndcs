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
        <h4>{action.name}</h4>
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
        <button class="medieval-button primary-border" 
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
            <div class="debug-info">
                <div class="ammo-warning">No ammo!</div>
            </div>
        {/if}
    </div>
    <div class="attack">
        <button class="medieval-button primary-border" 
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
            <div class="debug-info">
                <div class="ammo-warning">No ammo!</div>
            </div>
        {/if}
    </div>
    <div class="properties">
        <span>{(action.properties || ['None']).join(', ')}</span>
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

    h4 {
        position: relative;
        margin: 0;
        padding: 0;
    }

    .sub {
        font-size: 0.8em;
    }

    button {
        position: relative;
        justify-content: center;
        align-items: center;
        background-color: var(--color-content-main);
        color: var(--color-primary-text);
        cursor: pointer;
        outline: none;
        width: 100%;
        height: 100%;
    }
    
    .medieval-button {
        position: relative;
        cursor: pointer;
        background: linear-gradient(145deg, var(--color-accent), var(--color-content-main));
        border: 2px solid var(--color-primary-main);
        border-radius: 8px;
        padding: 8px 12px;
        min-height: 40px;
        transition: all 0.15s ease;
        box-shadow: 
            inset 1px 1px 3px color-mix(in srgb, var(--color-primary-main) 30%, transparent),
            inset -1px -1px 3px rgba(0, 0, 0, 0.4),
            0 2px 4px rgba(0, 0, 0, 0.3);
        font-family: 'Cinzel', serif;
        font-weight: 600;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
        color: var(--color-primary-text);
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .medieval-button:hover {
        background: linear-gradient(145deg, var(--color-secondary-main), var(--color-accent));
        border-color: var(--color-primary-main);
        box-shadow: 
            inset 1px 1px 4px color-mix(in srgb, var(--color-primary-main) 40%, transparent),
            inset -1px -1px 4px rgba(0, 0, 0, 0.5),
            0 3px 6px rgba(0, 0, 0, 0.4);
        transform: translateY(-1px);
        filter: brightness(1.1);
    }
    
    .medieval-button:active,
    
    .button-content {
        position: relative;
        z-index: 2;
        display: block;
        font-size: 0.9em;
        letter-spacing: 0.5px;
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
                color-mix(in srgb, var(--color-primary-main) 10%, transparent) 0%, 
                transparent 60%),
            conic-gradient(from 0deg at center,
                transparent 0deg,
                color-mix(in srgb, var(--color-primary-main) 5%, transparent) 45deg,
                transparent 90deg,
                color-mix(in srgb, var(--color-primary-main) 5%, transparent) 135deg,
                transparent 180deg,
                color-mix(in srgb, var(--color-primary-main) 5%, transparent) 225deg,
                transparent 270deg,
                color-mix(in srgb, var(--color-primary-main) 5%, transparent) 315deg,
                transparent 360deg);
        pointer-events: none;
        opacity: 0.6;
    }
    
    .medieval-button::before {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        right: 2px;
        bottom: 2px;
        background: linear-gradient(45deg, 
            color-mix(in srgb, var(--color-primary-main) 10%, transparent) 0%,
            transparent 50%,
            color-mix(in srgb, var(--color-primary-main) 5%, transparent) 100%);
        border-radius: 6px;
        pointer-events: none;
        z-index: 1;
    }
    
    .medieval-button::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: 
            linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--color-primary-main) 10%, transparent) 50%, transparent 100%);
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
        z-index: 3;
    }
    
    .medieval-button:hover::after {
        opacity: 1;
        animation: shimmer 1.5s ease-in-out infinite;
    }
    
    @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
    }

    .properties {
        position: relative;
        width: 100%;
        font-size: 0.6em;
        opacity: 0.75;
    }

    .medieval-button.disabled,
    .medieval-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background: linear-gradient(145deg, #666, #333);
        border-color: #555;
        color: #888;
        pointer-events: none;
    }

    .medieval-button.disabled:hover,
    .medieval-button:disabled:hover {
        transform: none;
        filter: none;
        box-shadow: 
            inset 1px 1px 3px rgba(255, 255, 255, 0.1),
            inset -1px -1px 3px rgba(0, 0, 0, 0.4),
            0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .ammo-warning {
        position: absolute;
        top: -20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(255, 0, 0, 0.8);
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.7em;
        font-weight: 600;
        white-space: nowrap;
        z-index: 10;
        animation: pulse 1s ease-in-out infinite;
    }

    @keyframes pulse {
        0%, 100% { opacity: 0.8; }
        50% { opacity: 1; }
    }

    .hit, .attack {
        position: relative;
    }

    .debug-info {
        position: absolute;
        top: -25px;
        left: 50%;
        transform: translateX(-50%);
        white-space: nowrap;
        z-index: 10;
        font-size: 0.7em;
        font-weight: 600;
    }
</style>
