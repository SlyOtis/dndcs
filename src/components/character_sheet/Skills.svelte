<script lang="ts">
  import type {CharacterContext, CharacterSkill} from "$lib/types";
    import type {RulesState} from "$lib/rules/store";
    import {getSkillId} from "$lib/rules/sheet";
    import {rollSkill} from "$lib/engine";
    import {getContext} from "svelte";
    import type {Readable} from "svelte/store";
    import Button from "$components/ui/Button.svelte";

    const {skills} = getContext<CharacterContext>('character')
    const rules = getContext<Readable<RulesState>>('rules')

    const resolved = $derived.by(() =>
        $skills.map((skill) => {
            const derivedSkill = $rules.resolved?.skills.find((entry) => entry.id === getSkillId(skill.name))
            if (!derivedSkill) return skill
            return {...skill, modifier: derivedSkill.value}
        })
    )

    async function rollSkillCheck(event: MouseEvent, skill: CharacterSkill) {
        event.preventDefault();
        event.stopPropagation();

        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        window.dispatchEvent(new CustomEvent('playButtonClick'));

        await rollSkill(skill.name, skill.modifier, skill.proficiency, rect.left + rect.width / 2, rect.top + rect.height / 2);
    }

</script>

<div class="root dnd-panel dnd-keyline">
    <div class="skills">
        <span>Prof</span>
        <span>Mod</span>
        <span>Skill</span>
        <span>Bonus</span>
        {#each resolved as skill}
            <span>{skill.proficiency}</span>
            <span>{skill.ability}</span>
            <span class="name">{skill.name}</span>
            <Button
                variant={skill.proficiency ? 'secondary' : 'ghost'}
                size="sm"
                fill
                title="Roll {skill.name}"
                onclick={event => rollSkillCheck(event, skill)}
            >
                {skill.modifier}
            </Button>
        {/each}
    </div>
    <span>Skills</span>
</div>

<style>
    .root {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 12px;
        padding: 4px 8px;

        grid-column: 2;
        grid-row: span 4;

        align-self: stretch;
        justify-self: stretch;

    }

    .skills {
        position: relative;
        display: grid;
        grid-template-columns: auto auto 1fr auto;
        align-items: center;
        gap: 4px;
        font-size: 0.8em;
        width: 100%;
        height: 100%;
    }

    span {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .name {
        justify-content: end;
    }
</style>
