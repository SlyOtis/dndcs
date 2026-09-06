---
id: 117
parent: 112
depends: [113]
relations: [121, 127]
title: The sheet never exceeds the viewport and a stat title fits by wrapping inside its box
type: epic
status: staged
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: []
created_at: 2026-09-05T16:22:55Z
updated_at: 2026-09-06T19:12:49Z
questions: []
---

## Intent
After 113 the sheet is wider than the window. At 2000px the Strength box is cut at the left edge, the Charisma box, the Inspiration box and the Defences panel are cut at the right, and the whole sheet renders larger than before. 113 made every track floor `min-content`: `.sheet-grid` is `minmax(min-content, max-content) minmax(min-content, 1fr)` and `.sheet-stats` is `repeat(5, minmax(min-content, 1fr))`, so the grid can never be narrower than its widest content and the page grows instead of the content fitting. 113's own findings name the missing half: `.dnd-stat-label` in `src/components/ui/Stat.svelte` is an `inline-flex` whose text cannot break, so a title only fits when the track is wide enough.

## Scope
`src/pages/CharacterPage.svelte` (`.sheet-grid`, `.sheet-stats`, `.sheet-tabs`), `src/components/ui/Stat.svelte`, `src/components/character_sheet/Abilities.svelte`, `SavingThrows.svelte`, `PlainBox.svelte`. Not the tab contents, which is 114.

## Order
1. dndcs: the sheet and its board have a floor of zero, not content: the outer grid and the stats grid fit the viewport at 1280, 1600 and 2000 wide, the ability row included, and nothing is cut at either edge.
2. dndcs: a stat title fits by shrinking or wrapping inside its own box in `Stat`, so a title never clips and never widens its track past its share.
3. verify: `just gate`, then `just dev` and read the sheet on Testy at the three widths.

## Done when
At 1280, 1600 and 2000 wide the sheet's left edge and right edge are both inside the window, no stat title clips, the page never scrolls sideways, and `just gate` is clean.

## Summary
