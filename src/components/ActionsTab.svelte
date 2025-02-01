<script lang="ts">
  import type {CharacterAction} from "../lib/types";
  import ActionAttack from "./ActionAttack.svelte";
  import ActionSpecial from "./ActionSpecial.svelte";

  let {actions = $bindable()}: { actions: CharacterAction[] } = $props()

  const groupActions = (items: CharacterAction[]): { attack: CharacterAction[], special: CharacterAction[] } => {
    return items.reduce((prev, curr) => {
      if (curr.layout === 'Attack') {
        return {
          ...prev,
          attack: [...prev.attack, curr],
        }
      }

      return {
        ...prev,
        special: [...prev.special, curr],
      }
    }, {attack: [], special: []})
  }

  let primary = $derived(groupActions(actions.filter(a => a.type === 'Action')))
  let bonus = $derived(groupActions(actions.filter(a => a.type === 'Bonus')))
  let reaction = $derived(groupActions(actions.filter(a => a.type === 'Reaction')))
  let other = $derived(groupActions(actions.filter(a => a.type === 'Other')))

  $inspect(primary, bonus)

</script>

<div class="root">
    <div class="actions">
        {#if primary.attack.length || primary.special.length}
            <div class="divider">
                <span>Actions</span>
            </div>
        {/if}
        {#if primary.attack.length}
            <ul class="attack">
                <li class="attack-header">
                    <span>Name</span>
                    <span>Range</span>
                    <span>Hit/Dc</span>
                    <span>Damage</span>
                    <span>Properties</span>
                </li>
                {#each primary.attack as action}
                    <ActionAttack {action}/>
                {/each}
            </ul>
        {/if}
        {#if primary.special.length}
            <ul class="special">
                {#each primary.special as action}
                    <ActionSpecial {action}/>
                {/each}
            </ul>
        {/if}
        {#if bonus.attack.length || bonus.special.length}
            <div class="divider">
                <span>Bonus Actions</span>
            </div>
        {/if}
        {#if bonus.attack.length}
            <ul class="attack">
                <li class="attack-header">
                    <span>Name</span>
                    <span>Range</span>
                    <span>Hit/Dc</span>
                    <span>Damage</span>
                    <span>Properties</span>
                </li>
                {#each bonus.attack as action}
                    <ActionAttack {action}/>
                {/each}
            </ul>
        {/if}
        {#if bonus.special.length}
            <ul class="special">
                {#each bonus.special as action}
                    <ActionSpecial {action}/>
                {/each}
            </ul>
        {/if}
        {#if bonus.attack.length || bonus.special.length}
            <div class="divider">
                <span>Reactions</span>
            </div>
        {/if}
        {#if reaction.attack.length}
            <ul class="attack">
                <li class="attack-header">
                    <span>Name</span>
                    <span>Range</span>
                    <span>Hit/Dc</span>
                    <span>Damage</span>
                    <span>Properties</span>
                </li>
                {#each reaction.attack as action}
                    <ActionAttack {action}/>
                {/each}
            </ul>
        {/if}
        {#if bonus.special.length}
            <ul class="special">
                {#each reaction.special as action}
                    <ActionSpecial {action}/>
                {/each}
            </ul>
        {/if}
        {#if other.attack.length || other.special.length}
            <div class="divider">
                <span>Other</span>
            </div>
        {/if}
        {#if other.attack.length}
            <ul class="attack">
                <li class="attack-header">
                    <span>Name</span>
                    <span>Range</span>
                    <span>Hit/Dc</span>
                    <span>Damage</span>
                    <span>Properties</span>
                </li>
                {#each other.attack as action}
                    <ActionAttack {action}/>
                {/each}
            </ul>
        {/if}
        {#if other.special.length}
            <ul class="special">
                {#each other.special as action}
                    <ActionSpecial {action}/>
                {/each}
            </ul>
        {/if}
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
        overflow-y: scroll;
        overflow-x: hidden;
    }

    .actions {
        position: relative;
        width: 100%;
        height: auto;
        display: flex;
        justify-content: start;
        align-items: start;
        flex-direction: column;
    }

    .divider {
        position: relative;
        width: 100%;
        height: auto;
        border-bottom: 1px solid var(--color-primary-main);
        padding: 4px 12px;
        font-size: 0.8em;
        font-weight: 600;
    }

    .divider:not(:first-of-type) {
        margin-top: 16px;
    }

    ul {
        position: relative;
        width: 100%;
        height: auto;
        margin: 0;
        padding: 0 12px;
        list-style: none;
    }

    .attack {
        position: relative;
        display: grid;
        grid-template-columns: auto auto auto auto 1fr;
        grid-column-gap: 16px;
        grid-row-gap: 4px;
        grid-auto-rows: auto;

        align-items: center;
        justify-content: start;
    }

    .attack-header {
        display: contents;
        height: auto;
        font-size: 0.8em;
        opacity: 0.75;
    }

    .special {
        position: relative;
        display: flex;
        justify-content: start;
        align-items: start;
        flex-direction: column;
    }
</style>
