---
id: 107
parent:
depends: []
relations: [108, 109]
title: Author level features for the thirteen core classes
type: task
status: review
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [engine]
commits: [1031c428f1d4ed52cf88518710643b3dc39ffd8e]
created_at: 2026-09-05T15:10:52Z
updated_at: 2026-09-05T15:30:06Z
questions: []
base: 9c6454279d0caeb611188943bc943798452fdb7b
---

## Intent
The thirteen core classes were authored with identity, hit die, primary ability, saving throws and prose, and `features: []`. The detail page at `/sources/classes/:id` groups features into a panel per level and says plainly that nothing is written down. Gunslinger is the worked example of a full document.

## Scope
`public/sources/classes/artificer.json`, `public/sources/classes/barbarian.json`, `public/sources/classes/bard.json`, `public/sources/classes/cleric.json`, `public/sources/classes/druid.json`, `public/sources/classes/fighter.json`, `public/sources/classes/monk.json`, `public/sources/classes/paladin.json`, `public/sources/classes/ranger.json`, `public/sources/classes/rogue.json`, `public/sources/classes/sorcerer.json`, `public/sources/classes/warlock.json`, `public/sources/classes/wizard.json`, `public/sources/classes/index.json`. Not `gunslinger.json`. No source, no component.
## Order
1. dndcs: read `public/sources/classes/gunslinger.json` for the feature shape and `.claude/rules/engine.md` for what a system document may declare.
2. dndcs: author the level features for each of the thirteen classes in that shape, with the level each arrives at.
3. verify: every file parses and the detail page renders a panel per level.

## Done when
No core class carries an empty `features` array, and `/sources/classes/:id` shows features grouped by level for each.

## Summary
Level features authored for the thirteen core classes in the `gunslinger.json` shape: `{ id, name, description, level, source }` on `features`, matching `ClassFeature` in `src/lib/class.types.ts`. Every entry carries `source: "base"`; subclass features are not authored, each class instead carries the subclass-choice feature at the level it arrives.

Feature counts and the levels they land on:

1. `artificer.json` 13, levels 1, 2, 3, 4, 6, 7, 10, 11, 14, 18, 20
2. `barbarian.json` 14, levels 1, 2, 3, 4, 5, 7, 9, 11, 15, 18, 20
3. `bard.json` 11, levels 1, 2, 3, 4, 5, 6, 10, 20
4. `cleric.json` 7, levels 1, 2, 4, 5, 10
5. `druid.json` 8, levels 1, 2, 4, 18, 20
6. `fighter.json` 9, levels 1, 2, 3, 4, 5, 9, 11, 20
7. `monk.json` 22, levels 1, 2, 3, 4, 5, 6, 7, 10, 13, 14, 15, 18, 20
8. `paladin.json` 13, levels 1, 2, 3, 4, 5, 6, 10, 11, 14
9. `ranger.json` 13, levels 1, 2, 3, 4, 5, 8, 10, 14, 18, 20
10. `rogue.json` 13, levels 1, 2, 3, 4, 5, 7, 11, 14, 15, 18, 20
11. `sorcerer.json` 6, levels 1, 2, 3, 4, 20
12. `warlock.json` 7, levels 1, 2, 3, 4, 11, 20
13. `wizard.json` 6, levels 1, 2, 4, 18, 20

A feature that repeats at higher levels is one entry at the level it first arrives, with the later steps in its description, the way `ability_score_improvement` and `bad_medicine` read in `gunslinger.json`. Fighter is the exception: its extra attacks are separate entries at 5, 11 and 20 because each changes the attack count.

`SourcePage.svelte` groups `entry.features` by `trait.level ?? 0` and draws one `Panel` per distinct level, so the thirteen files render a panel per level with no component change. Every file parses under `jq`, no `features` array is empty, and no class repeats a feature id. `just check` reports 87 files, 0 errors, 0 warnings; `just build` succeeds.

### Findings

`public/sources/classes/index.json` was untracked in git, so the thirteen class documents had no committed index listing them. It is unchanged in content and landed with this task, which is why it is named in `## Scope`.

`## Scope` read `public/sources/classes/*.json` except `gunslinger.json`. `scope_of` in `task.sh` resolves a glob to the directory, so `land` would have swept the uncommitted `gunslinger.json` edit another session left in the tree. The section now names the fourteen paths one by one and the exclusion holds.

`gunslinger.json` carries uncommitted changes from another session and was left alone.

`just build` warns that two chunks exceed 500 kB. It is pre-existing and unrelated: these documents are static assets under `public/` and are never bundled.
