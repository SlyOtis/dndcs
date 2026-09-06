---
id: 105
parent:
depends: [104]
relations: []
title: Encounter tracker in the left drawer, reading the model
type: feature
status: done
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: [3cf6da750caec237da664614d9cf2b1a7c0936a1]
created_at: 2026-09-05T15:10:52Z
updated_at: 2026-09-06T21:58:05Z
questions: []
base: ff1be73afc233d4fecff3f48b1d791bb1f22e3ba
---

## Intent
The Encounter tracker section of the left drawer renders an empty state explaining it needs a data model. With the model landed it becomes the live turn order the table plays from.

## Scope
`src/components/MainMenu.svelte` only. The drawer's `--menu-*` variables, its head, body and actions grid and its whole-row list sizing are already in place and this section adopts them.

## Order
1. dndcs: read the campaign's encounters through the service and render the combatants in initiative order with hit points, conditions and whose turn it is.
2. dndcs: honour the reveal rule so a player does not see what the DM has not revealed.
3. verify: `just gate`.

## Done when
The Encounter section lists a real encounter's combatants in initiative order, the empty state shows only when there is no encounter, and `just gate` is clean.

## Summary
`src/components/MainMenu.svelte` only.

The Encounter tracker section reads the campaign's encounters through `campaignService.postEncountersListener`, subscribed in the existing `$effect` beside the one-shot reads and released in its cleanup, so the turn order moves as the DM writes it. `encounters` is a new `$state`, cleared with the other lists when no campaign is in scope.

`knownEncounters` applies the reveal rule the way `knownNpcs` and `knownPlaces` do: `isDm || entry.is_known`, sorted newest first on `created_at`. `encounter` is the active one among them, else the newest, else `null`. `combatants` is the encounter's combatants sorted by `initiative` descending, and `turn` is `encounter.turn % combatants.length` so the pointer always lands on a row.

The `encounter` snippet became `tracker` and its two notes are gone. It shows `No campaign is in scope.` without a campaign, `No encounter is under way.` without a visible encounter, and otherwise a `dnd-menu-facts` row of Round, Turn and Foes, the encounter title as a `dnd-menu-title`, and a `dnd-menu-list` of combatant rows. A row is a `dnd-menu-row` button: the mark is the initiative, the name carries the conditions as a `dnd-menu-row-state` em, the meta is `hit_points/max_hit_points` or `Hidden` when `isDm || is_hit_points_known` is false. The row whose index is `turn` gets `dnd-menu-row-turn` and `aria-current="true"`. A character combatant opens its sheet, an npc opens the campaign, as the Lore rows do. The band count is `combatants.length`.

Three style rules added beside `dnd-menu-row-mark`: `dnd-menu-row-turn`, `dnd-menu-row-turn .dnd-menu-row-mark` and `dnd-menu-row-state`, all on the `--menu-*` tokens.

`just check` is 0 errors 0 warnings. `just build` prints the 635 kB chunk warning that predates this task.

### Findings
`src/components/MainMenu.svelte` was already modified and uncommitted at `base` (the drawer rewrite the scope names as in place: `--menu-*`, the head/body/foot grid, the row list). `task.sh land` commits the whole file, so that rewrite lands in this commit with the tracker.

`encounter.turn` is read as an index into the initiative-sorted order, not into the stored `combatants` array. The two agree when the DM stores combatants in initiative order; nothing in #104 says which the pointer indexes.

`~/.claude/skills/gogo-memory/scripts/search.sh` and `~/.claude/skills/repo-index/scripts/find.sh`, named in the repo `CLAUDE.md`, do not exist on this machine.
