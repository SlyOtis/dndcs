---
id: 113
parent: 112
depends: []
relations: []
title: The stat boxes fit their titles and the board and tabs take the full remaining width
type: task
status: staged
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: []
created_at: 2026-09-05T15:41:58Z
updated_at: 2026-09-05T15:41:59Z
questions: []
---

## Intent
In the board's first row the Proficiency, Walking and Inspiration titles overflow their boxes and run into each other. `.sheet-tabs` declares `grid-column: 1 / -1` yet the tabs panel renders as a narrow third column with empty ground to its right, and the sheet as a whole does not reflow between a laptop width and 2000px.

## Scope
`src/pages/CharacterPage.svelte` (`.sheet-grid`, `.sheet-board`, `.sheet-tabs` and the board markup), `src/components/character_sheet/PlainBox.svelte`, `Inspiration.svelte`, `Initiative.svelte`, `HitPoints.svelte`, `DefensesNConditions.svelte`. Not the tab contents, which is 114. Not the crown, which is 115.

## Order
1. dndcs: every title in a stat box fits inside its frame at the narrowest track the board grants it. A title that cannot fit shrinks or wraps within its own box and never clips or overlaps a neighbour.
2. dndcs: the board and the tabs panel take the whole width left of the sheet column, at the sheet's narrowest and at 2000px, with no empty column and no sideways scroll.
3. verify: `just gate`, then `just dev` and read the sheet at 1280, 1600 and 2000 wide.

## Done when
No stat box clips its title at any of the three widths, the tabs panel reaches the right edge of the board, the page never scrolls sideways, and `just gate` is clean.

## Summary
