---
id: 132
parent: 127
depends: [117]
relations: []
title: The six saving throws read as one compact unit instead of six ability sized tiles
type: task
status: done
session:
review:
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: []
created_at: 2026-09-06T19:29:48Z
updated_at: 2026-09-08T09:39:40Z
questions: []
images: []
scope: [src/components/character_sheet/SavingThrows.svelte, src/components/character_sheet/SavingThrow.svelte]
base: b56157768c1dd382cdf366edde993b9455cb12e6
---

## Intent
The user, on a screenshot of the saving throws block: this needs to be way better. Six `Stat` tiles the size of the ability cards, each holding one small number, stacked in two columns under a `SAVING THROWS` caption, spend the height of the skills table on six values. q-003 settled that the block stays on the sheet as a display block; how it reads is open.

## Scope
`src/components/character_sheet/SavingThrows.svelte`, `SavingThrow.svelte`. Not `src/components/ui/Stat.svelte`, which 117 owns. The attribute list comes from the declared system through `getAttributeId`, never a constant, per `engine.md`.


## Goal
On Testy the saving throws block is no taller than two ability cards at 1280 and 2000 wide, every save shows name, bonus and proficiency, each rolls, and `just gate` is clean.
