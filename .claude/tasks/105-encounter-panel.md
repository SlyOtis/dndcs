---
id: 105
parent:
depends: [104]
relations: []
title: Encounter tracker in the left drawer, reading the model
type: feature
status: staged
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: []
created_at: 2026-09-05T15:10:52Z
updated_at: 2026-09-05T15:10:52Z
questions: []
---

## Intent
The Encounter tracker section of the left drawer renders an empty state explaining it needs a data model. With the model landed it becomes the live turn order the table plays from.

## Scope
`src/components/MainMenu.svelte` only. The drawer's `--menu-*` variables, its head/body/actions grid and its whole-row list sizing are already in place and this section adopts them.

## Order
1. dndcs: read the campaign's encounters through the service and render the combatants in initiative order with hit points, conditions and whose turn it is.
2. dndcs: honour the reveal rule so a player does not see what the DM has not revealed.
3. verify: `just gate`.

## Done when
The Encounter section lists a real encounter's combatants in initiative order, the empty state shows only when there is no encounter, and `just gate` is clean.

## Summary
