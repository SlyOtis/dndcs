---
id: 127
parent:
depends: [117, 114, 131, 132, 133, 134]
relations: [116, 117]
title: The sheet's panels, frames and buttons follow the inspiration layouts under docs/inspiration and nothing is sized fixed
type: task
status: staged
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: []
created_at: 2026-09-06T19:12:49Z
updated_at: 2026-09-06T19:29:49Z
questions: []
---

## Intent
The 110 walk: the sheet's buttons, panels and frames drift from `docs/inspiration`, and sizes are fixed where the user wants every size dynamic. The shell is 6px wider than the viewport, hidden by its overflow, and the video iframe in `Background.svelte` is a fixed 1600px. `docs/inspiration/README.md` names, for each of the eleven images, the primitive that carries its vocabulary.

## Scope
`src/pages/CharacterPage.svelte`, `src/components/character_sheet/**`, `src/components/ui/Shell.svelte` for the 6px, `src/components/Background.svelte` for the iframe. Not `src/components/ui/Frame.svelte`, `Ornament.svelte` or `Button.svelte` themselves, which already carry the vocabulary. Runs after 117 and 114, which own the same files.

## Order
1. dndcs: read `docs/inspiration/README.md` and its eleven images before changing anything.
2. dndcs: the roll buttons, the saving throws, the stats board and the crown are 131, 132, 133 and 134 and land first; this task is the pass over what they leave.
3. dndcs: every panel, frame and button on the sheet reaches for the primitive the README names for it, `Frame`, `Ornament`, `Button`, `Glyph`, instead of a page-local box.
3. dndcs: no fixed pixel size remains on the sheet: a size is a token from `src/app.css`, a fraction of its container, or a `clamp`; the shell is never wider than the viewport; the background iframe fills its layer.
4. verify: `just gate`, then `just dev` on Testy at 1280, 1600 and 2000 wide, each drawer open and closed.

## Done when
`grep -rn "[0-9]px" src/pages/CharacterPage.svelte src/components/character_sheet/` returns only hairline borders, `document.documentElement.scrollWidth` equals the viewport width on the sheet at the three widths, every panel reads as the README's language, and `just gate` is clean.

## Summary
