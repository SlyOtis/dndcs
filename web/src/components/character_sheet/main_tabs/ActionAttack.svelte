<script lang="ts">

  import type {CharacterAction, Damage} from "$lib/character.types";
  import {rollAttack, rollDamage, rollAttackWithAmmo, rollDamageWithAmmo} from "$lib/engine";
  import {getContext} from "svelte";
  import type {CharacterContext} from "$lib/types";
  import Button from "$components/ui/Button.svelte";

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

  async function rollToHit() {
    window.dispatchEvent(new CustomEvent('playButtonClick'))
    if (isRanged && equippedAmmo) {
      await rollAttackWithAmmo(action.name, action.toHit || 0, equippedAmmo.id)
    } else {
      await rollAttack(action.name, action.toHit || 0)
    }
  }

  async function rollAttackDamage() {
    const damage = action.damage?.[0]
    if (!damage) return
    window.dispatchEvent(new CustomEvent('playButtonClick'))
    if (isRanged && equippedAmmo) {
      await rollDamageWithAmmo(action.name, damage.dice, damage.amount, damage.bonus, equippedAmmo.id)
    } else {
      await rollDamage(action.name, damage.dice, damage.amount, damage.bonus)
    }
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
        <Button
            variant="secondary"
            size="sm"
            fill
            disabled={buttonsDisabled}
            title="Roll {action.name} to hit"
            onclick={rollToHit}
        >
            +{action.toHit || 0}
        </Button>
        {#if isRanged && buttonsDisabled}
            <span class="ammo-warning">No ammo!</span>
        {/if}
    </div>
    <div class="attack">
        <Button
            variant="secondary"
            size="sm"
            fill
            disabled={buttonsDisabled || !action.damage?.[0]}
            title="Roll {action.name} damage"
            onclick={rollAttackDamage}
        >
            {action.damage?.[0] ? renderDamage(action.damage[0]) : 'No damage'}
        </Button>
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

    li > div {
        align-self: stretch;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: var(--space-1);
        border-radius: var(--radius-sm);
        transition: background-color 0.15s ease;
    }

    li:hover > div {
        background-color: color-mix(in srgb, var(--ember) 9%, transparent);
    }

    li:hover h4 {
        color: var(--metal-bright);
        text-shadow: var(--glow-text);
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
        font-family: var(--font-display);
        font-size: var(--text-sm);
        font-weight: 700;
        color: var(--metal-bright);
        text-shadow: 0 1px 0 #000;
    }

    .sub {
        font-size: var(--text-xs);
        font-style: italic;
        white-space: nowrap;
        color: var(--ink-dim);
    }

    .range {
        white-space: nowrap;
        font-size: var(--text-xs);
        color: var(--ink-dim);
    }

    .range b {
        font-family: var(--font-figures);
        font-size: var(--text-sm);
        color: var(--ink);
    }

    .properties {
        position: relative;
        min-width: 0;
        overflow: hidden;
        font-size: var(--text-xs);
        font-style: italic;
        color: var(--ink-faint);
    }

    .properties > span {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .ammo-warning {
        background: linear-gradient(180deg, color-mix(in srgb, var(--state-bad) 70%, var(--ground-deep)), color-mix(in srgb, var(--state-bad) 40%, var(--ground-deep)));
        box-shadow: inset 0 0 0 1px var(--keyline), var(--bevel-up);
        color: var(--ink);
        padding: var(--space-0) var(--space-1);
        border-radius: var(--radius-sm);
        font-family: var(--font-display);
        font-size: var(--text-xs);
        font-weight: 700;
        letter-spacing: var(--tracking-wide);
        text-shadow: 0 1px 0 #000;
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
        gap: var(--space-1);
    }
</style>
