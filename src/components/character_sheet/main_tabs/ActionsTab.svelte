<script lang="ts">
  import {getContext} from "svelte";
  import type {CharacterContext} from "$lib/types";
  import type {CharacterAction} from "$lib/character.types";
  import ActionAttack from "./ActionAttack.svelte";
  import ActionSpecial from "./ActionSpecial.svelte";

  const {actions} = getContext<CharacterContext>('character')

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
    }, {attack: [] as CharacterAction[], special: [] as CharacterAction[]})
  }

  let primary = $derived(groupActions($actions.filter(a => a.type === 'Action')))
  let bonus = $derived(groupActions($actions.filter(a => a.type === 'Bonus')))
  let reaction = $derived(groupActions($actions.filter(a => a.type === 'Reaction')))
  let other = $derived(groupActions($actions.filter(a => a.type === 'Other')))

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
        max-height: 100%;
        display: flex;
        justify-content: start;
        align-items: start;
        flex-direction: column;
        overflow: hidden;
        background-color: var(--color-content-dark);
    }

    .actions {
        position: relative;
        width: 100%;
        height: auto;
        flex: 1;
        min-height: 0;
        display: flex;
        justify-content: start;
        align-items: start;
        flex-direction: column;
        overflow-y: auto;
    }

    .divider {
        position: relative;
        width: 100%;
        height: auto;

        padding: 4px 12px;
        font-size: 0.8em;
        font-weight: 600;

        border-bottom: 1px dashed var(--color-primary-main);
    }

    .divider:not(:first-of-type) {
        margin-top: 16px;
        border-top: 1px solid var(--color-primary-main);
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

    .attack, .special {
        padding-top: 16px;
    }
</style>
