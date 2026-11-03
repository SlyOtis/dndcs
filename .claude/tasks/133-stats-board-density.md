---
id: 133
parent: 127
depends: [117, 121]
relations: []
title: The stats board is a dense strip with no empty ground under Defences and Conditions
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
updated_at: 2026-09-08T09:39:41Z
questions: []
images: []
scope: [src/pages/CharacterPage.svelte, src/components/character_sheet/DefensesNConditions.svelte]
base: b56157768c1dd382cdf366edde993b9455cb12e6
---

## Intent
The user, on a screenshot of the stats board: here we are just wasting space. Proficiency, Walking, Inspiration, Initiative and Armor each take a full card for one number and a caption, Hit Points spreads a gauge, a slider and three fields across two cards' width, and Defences and Conditions is a two column grid on empty ground reading `None` twice, as tall as the cards beside it.

## Scope
`src/pages/CharacterPage.svelte` (`.sheet-stats` and the board markup), `src/components/character_sheet/PlainBox.svelte`, `Inspiration.svelte`, `Initiative.svelte`, `HitPoints.svelte`, `DefensesNConditions.svelte`. Not the tabs. Runs after 117 and 121, which own the board's tracks.


## Goal
On Testy the board above the tabs is no taller than the crown plus the ability row at 1280, 1600 and 2000 wide, no box holds more empty ground than its number and caption, Defences and Conditions collapse to their content, every value still edits where it edited before, and `just gate` is clean.
