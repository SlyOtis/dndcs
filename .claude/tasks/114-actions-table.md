---
id: 114
parent: 112
depends: [113]
relations: []
title: The actions and inventory tables fit their columns at every width
type: task
status: staged
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: []
created_at: 2026-09-05T15:41:59Z
updated_at: 2026-09-05T15:43:29Z
questions: []
---

## Intent
The actions list in `ActionsTab.svelte` lays a row out on `grid-template-columns: auto auto auto auto 1fr`. With Testy's Hand Cannon Attack the name wraps over three lines, the header's last column is cut to a single letter, and the No ammo badge sits over the range cell instead of in its own.

## Scope
`src/components/character_sheet/main_tabs/ActionsTab.svelte`, `ActionAttack.svelte`, `ActionSpecial.svelte`, `InventoryTab.svelte`, `MainTabs.svelte`. Not `src/pages/CharacterPage.svelte`.

## Order
1. dndcs: an action row shows name, range, hit or DC, damage and notes on one line at the width the tabs panel has after 113. Long text truncates with an ellipsis and carries its full text on `title`. No header is clipped.
2. dndcs: a badge such as No ammo sits in flow inside its own cell, never over another.
3. dndcs: the same rule for the inventory table.
4. verify: `just gate`, then `just dev` and read the actions and inventory tabs on Testy at 1280 and 2000 wide.

## Done when
On Testy no action or inventory name occupies more than one line, every column header reads in full, no badge overlaps a cell, and `just gate` is clean.

## Summary
