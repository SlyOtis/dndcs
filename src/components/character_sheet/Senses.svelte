<script lang="ts">
  import type {CharacterContext} from "$lib/types";
  import type {RulesState} from "$lib/rules/store";
  import {getSkillId} from "$lib/rules/sheet";
  import {rollPassive} from "$lib/engine";
  import {getContext} from "svelte";
  import type {Readable} from "svelte/store";
  import Button from "$components/ui/Button.svelte";

  const {senses} = getContext<CharacterContext>('character')
  const rules = getContext<Readable<RulesState>>('rules')

  const resolved = $derived.by(() =>
    $senses.map((sense) => {
      const derivedSense = $rules.resolved?.senses.find((entry) => entry.id === getSkillId(sense.title))
      if (!derivedSense) return sense
      return {...sense, score: derivedSense.value}
    })
  )

  async function rollSense(event: MouseEvent, title: string, score: number | string) {
    event.preventDefault()
    event.stopPropagation()
    window.dispatchEvent(new CustomEvent('playButtonClick'))
    await rollPassive(title, Number(score))
  }
</script>


<div class="root dnd-panel dnd-keyline">
    <div class="senses">
        {#each resolved as sense}
            <div class="sense dnd-panel dnd-keyline">
                <Button
                    variant="secondary"
                    size="sm"
                    title="Roll {sense.title}"
                    onclick={event => rollSense(event, sense.title, sense.score)}
                >
                    {sense.score}
                </Button>
                <span class="title">{sense.title}</span>
            </div>
        {/each}
    </div>
    <span class="dnd-caption">Senses</span>
</div>

<style>
    .root {
        position: relative;
        gap: 16px;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        width: auto;
        height: auto;
        padding: 4px 8px;
        grid-column: 1;
    }

    .senses {
        position: relative;
        display: flex;
        align-items: center;
        flex-direction: column;
        gap: 8px;
        width: 100%;
        height: auto;
    }

    .sense {
        position: relative;
        display: flex;
        align-items: center;
        flex-direction: row;
        width: 100%;
        height: auto;
    }

    .title {
        position: relative;
        padding-left: 16px;
    }
</style>
