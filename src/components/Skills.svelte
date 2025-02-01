<script lang="ts">
    import type {CharacterSkill} from "../lib/types";
    import {rollSkill} from "../lib/engine";

    let {skills = $bindable()}: {skills: CharacterSkill[]} = $props()

</script>

<div class="root primary-border">
    <div class="skills">
        <span>Prof</span>
        <span>Mod</span>
        <span>Skill</span>
        <span>Bonus</span>
        {#each skills as skill}
            <span>{skill.proficiency}</span>
            <span>{skill.ability}</span>
            <span class="name">{skill.name}</span>
            <button onclick={e => {
                e.preventDefault()
                e.stopPropagation()
                rollSkill(skill.name, skill.modifier, skill.proficiency)
            }}>{skill.modifier}</button>
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
        grid-area: sk;
    }

    .skills {
        position: relative;
        display: grid;
        grid-template-columns: auto auto 1fr auto;
        gap: 4px;
        font-size: 0.8em;
    }

    span {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .name {
        justify-content: end;
    }

    button {
        position: relative;
        cursor: pointer;
    }
</style>

