---
id: 132
parent: 127
depends: [117]
relations: []
title: The six saving throws read as one compact unit instead of six ability sized tiles
type: task
status: staged
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: []
created_at: 2026-09-06T19:29:48Z
updated_at: 2026-09-06T19:29:50Z
questions: []
images: []
---

## Intent
The user, on a screenshot of the saving throws block: this needs to be way better. Six `Stat` tiles the size of the ability cards, each holding one small number, stacked in two columns under a `SAVING THROWS` caption, spend the height of the skills table on six values. q-003 settled that the block stays on the sheet as a display block; how it reads is open.

## Scope
`src/components/character_sheet/SavingThrows.svelte`, `SavingThrow.svelte`. Not `src/components/ui/Stat.svelte`, which 117 owns. The attribute list comes from the declared system through `getAttributeId`, never a constant, per `engine.md`.

## Order
1. dndcs: read `docs/inspiration/README.md` and the sheets it names for meters and medallions, `2.png`, `7.png`, `8.png`, before changing anything.
2. dndcs: the six saves read as one compact unit, one row or a tight grid of medallions each carrying the attribute's short name, the bonus and the proficiency mark, in the reference language; the whole block takes no more height than two ability cards.
3. dndcs: a save still rolls on click through `rollSave` and posts to the log.
4. verify: `just gate`, then `just dev` on Testy at 1280 and 2000 wide.

## Done when
On Testy the saving throws block is no taller than two ability cards at 1280 and 2000 wide, every save shows name, bonus and proficiency, each rolls, and `just gate` is clean.

## Summary
