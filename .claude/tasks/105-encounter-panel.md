---
id: 105
parent:
depends: [104]
relations: []
title: Encounter tracker in the left drawer, reading the model
type: feature
status: done
session:
review:
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: [3cf6da750caec237da664614d9cf2b1a7c0936a1]
created_at: 2026-09-05T15:10:52Z
updated_at: 2026-09-07T10:53:25Z
questions: []
base: ff1be73afc233d4fecff3f48b1d791bb1f22e3ba
---

## Intent
The Encounter tracker section of the left drawer renders an empty state explaining it needs a data model. With the model landed it becomes the live turn order the table plays from.

## Scope
`src/components/MainMenu.svelte` only. The drawer's `--menu-*` variables, its head, body and actions grid and its whole-row list sizing are already in place and this section adopts them.

## Findings
`src/components/MainMenu.svelte` was already modified and uncommitted at `base` (the drawer rewrite the scope names as in place: `--menu-*`, the head/body/foot grid, the row list). `task.sh land` commits the whole file, so that rewrite lands in this commit with the tracker.

`encounter.turn` is read as an index into the initiative-sorted order, not into the stored `combatants` array. The two agree when the DM stores combatants in initiative order; nothing in #104 says which the pointer indexes.

`~/.claude/skills/gogo-memory/scripts/search.sh` and `~/.claude/skills/repo-index/scripts/find.sh`, named in the repo `CLAUDE.md`, do not exist on this machine.

## Goal
The Encounter section lists a real encounter's combatants in initiative order, the empty state shows only when there is no encounter, and `just gate` is clean.
