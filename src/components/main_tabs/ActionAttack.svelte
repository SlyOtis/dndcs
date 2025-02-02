<script lang="ts">

  import type {CharacterAction, Damage} from "../../lib/character.types";
  import {rollAttack, rollDamage} from "../../lib/engine";

  let {action}: { action: CharacterAction } = $props()

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
        <button class="primary-border" onclick={e => {
            e.preventDefault()
            e.stopPropagation()
            rollAttack(action.name, action.toHit || 0)
        }}>+{action.toHit || 0}</button>
    </div>
    <div class="attack">
        <button class="primary-border" onclick={e => {
            e.preventDefault()
            e.stopPropagation()
            // TODO:: Fix the array here? how to render this shi?
            const damage = action.damage[0]
            rollDamage(action.name, damage.dice, damage.amount, damage.bonus)
        }}>{renderDamage(action.damage[0])}</button>
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

    .properties {
        position: relative;
        width: 100%;
        font-size: 0.6em;
        opacity: 0.75;
    }
</style>
