---
id: 127
parent:
depends: [117, 114, 131, 132, 133, 134, 141, 142]
relations: [116, 117]
title: The sheet's panels, frames and buttons follow the inspiration layouts under docs/inspiration and nothing is sized fixed
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
created_at: 2026-09-06T19:12:49Z
updated_at: 2026-09-08T09:39:51Z
questions: []
scope: [src/pages/CharacterPage.svelte, src/components/character_sheet, src/components/Background.svelte]
base: b56157768c1dd382cdf366edde993b9455cb12e6
---

## Intent
The 110 walk: the sheet's buttons, panels and frames drift from `docs/inspiration`, and sizes are fixed where the user wants every size dynamic. The shell is 6px wider than the viewport, hidden by its overflow, and the video iframe in `Background.svelte` is a fixed 1600px. `docs/inspiration/README.md` names, for each of the eleven images, the primitive that carries its vocabulary.

## Scope
`src/pages/CharacterPage.svelte`, `src/components/character_sheet/**`, `src/components/ui/Shell.svelte` for the 6px, `src/components/Background.svelte` for the iframe. Not `src/components/ui/Frame.svelte`, `Ornament.svelte` or `Button.svelte` themselves, which already carry the vocabulary. Runs after 117 and 114, which own the same files.


## Goal
`grep -rn "[0-9]px" src/pages/CharacterPage.svelte src/components/character_sheet/` returns only hairline borders, `document.documentElement.scrollWidth` equals the viewport width on the sheet at the three widths, every panel reads as the README's language, and `just gate` is clean.
