---
id: 133
parent: 127
depends: [117, 121]
relations: []
title: The stats board is a dense strip with no empty ground under Defences and Conditions
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
The user, on a screenshot of the stats board: here we are just wasting space. Proficiency, Walking, Inspiration, Initiative and Armor each take a full card for one number and a caption, Hit Points spreads a gauge, a slider and three fields across two cards' width, and Defences and Conditions is a two column grid on empty ground reading `None` twice, as tall as the cards beside it.

## Scope
`src/pages/CharacterPage.svelte` (`.sheet-stats` and the board markup), `src/components/character_sheet/PlainBox.svelte`, `Inspiration.svelte`, `Initiative.svelte`, `HitPoints.svelte`, `DefensesNConditions.svelte`. Not the tabs. Runs after 117 and 121, which own the board's tracks.

## Order
1. dndcs: read `docs/inspiration/README.md` and `7.png` and `8.png`, the runic meters and the forged HUD, before changing anything.
2. dndcs: the five single value boxes become one dense strip of medallions in the reference language, each no larger than its number and caption need; Hit Points keeps the gauge and the three fields at the height of that strip.
3. dndcs: Defences and Conditions take their content height, listing entries inline and reading one short line when empty; no panel on the board sits on empty ground.
4. verify: `just gate`, then `just dev` on Testy at 1280, 1600 and 2000 wide.

## Done when
On Testy the board above the tabs is no taller than the crown plus the ability row at 1280, 1600 and 2000 wide, no box holds more empty ground than its number and caption, Defences and Conditions collapse to their content, every value still edits where it edited before, and `just gate` is clean.

## Summary
