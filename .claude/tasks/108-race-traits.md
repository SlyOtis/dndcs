---
id: 108
parent:
depends: []
relations: [107]
title: Author traits for the nine core races
type: task
status: done
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [engine]
commits: [5d96ed82a6ac2a680f0ec2479e5d58e14072ba41]
created_at: 2026-09-05T15:10:52Z
updated_at: 2026-09-06T20:55:46Z
questions: []
base: eb072f02fc2429875246cb253145577d4fa78546
---

## Intent
The nine core races were authored with size, speed, ability bonuses and prose, and `traits: []`. The detail page renders a traits panel and says nothing is written down.

## Scope
`public/sources/races/*.json`. No source, no component.

## Order
1. dndcs: read `public/sources/classes/gunslinger.json` for the feature shape the race traits mirror.
2. dndcs: author the traits for each of the nine races.
3. verify: every file parses and the detail page renders the traits.

## Done when
No race carries an empty `traits` array, and `/sources/races/:id` shows them.

## Summary
Traits authored for the nine core races in the `gunslinger.json` feature shape minus `level`, which a race has no use for: `{ id, name, description, source }` on `traits`, every entry `source: "base"`. This matches the race shape `src/lib/catalog.ts` sends to the AI reader and the `$defs/feature` items the race schema in `src/components/CharacterSourceImport.svelte` declares.

Trait counts per file:

1. `dragonborn.json` 3: draconic_ancestry, breath_weapon, damage_resistance
2. `dwarf.json` 6: darkvision, dwarven_resilience, dwarven_combat_training, tool_proficiency, stonecunning, dwarven_armor_training
3. `elf.json` 4: darkvision, keen_senses, fey_ancestry, trance
4. `gnome.json` 2: darkvision, gnome_cunning
5. `half-elf.json` 3: darkvision, fey_ancestry, skill_versatility
6. `half-orc.json` 4: darkvision, menacing, relentless_endurance, savage_attacks
7. `halfling.json` 3: lucky, brave, halfling_nimbleness
8. `human.json` 2: versatility, extra_language
9. `tiefling.json` 3: darkvision, hellish_resistance, infernal_legacy

A trait that scales with level carries the steps in its description, the way `breath_weapon` and `infernal_legacy` read, because the race branch of `SourcePage.svelte` draws one flat `Panel` and never groups by level. Only `traits` changed in each file; `abilityBonuses` is left as the one place an ability increase is stated, except on `human.json` where `versatility` restates it as the SRD names it.

Every file parses under `jq`, no `traits` array is empty, and no race repeats a trait id within itself. `just check` reports 87 files, 0 errors, 0 warnings. `just build` succeeds. `pnpm dev` serves `/sources/races/tiefling.json` with the three traits and `/sources/races/tiefling` returns 200, so `getCatalogEntry` reaches them and the traits panel has content.

### Findings

`public/sources/races/` is untracked in git in its entirety, `index.json` included, so the nine race documents had no committed listing. The whole directory lands with this task under the `public/sources/races/*.json` glob in `## Scope`.

The `chunks are larger than 500 kB` notice from `just build` is on `index-*.js` and `sources-*.js` and predates this task; a JSON file under `public/` is not bundled.
