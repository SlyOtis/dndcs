---
id: 113
parent: 112
depends: []
relations: []
title: The stat boxes fit their titles and the board and tabs take the full remaining width
type: task
status: review
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: [a59b94f014a8c611202a68fda3af812f8af89761, 0925e0dc3aaac49a394ce8432a74e46999d6a3e3]
created_at: 2026-09-05T15:41:58Z
updated_at: 2026-09-05T15:54:56Z
questions: []
base: 60f7513206c7f23f7eae9786964b58becf626147
---

## Intent
In the board's first row the Proficiency, Walking and Inspiration titles overflow their boxes and run into each other. `.sheet-tabs` declares `grid-column: 1 / -1` yet the tabs panel renders as a narrow third column with empty ground to its right, and the sheet as a whole does not reflow between a laptop width and 2000px.

## Scope
`src/pages/CharacterPage.svelte` (`.sheet-grid`, `.sheet-board`, `.sheet-tabs` and the board markup), `src/components/character_sheet/PlainBox.svelte`, `src/components/character_sheet/Inspiration.svelte`, `src/components/character_sheet/Initiative.svelte`, `src/components/character_sheet/HitPoints.svelte`, `src/components/character_sheet/DefensesNConditions.svelte`. Not the tab contents, which is 114. Not the crown, which is 115.

## Order
1. dndcs: every title in a stat box fits inside its frame at the narrowest track the board grants it. A title that cannot fit shrinks or wraps within its own box and never clips or overlaps a neighbour.
2. dndcs: the board and the tabs panel take the whole width left of the sheet column, at the sheet's narrowest and at 2000px, with no empty column and no sideways scroll.
3. verify: `just gate`, then `just dev` and read the sheet at 1280, 1600 and 2000 wide.

## Done when
No stat box clips its title at any of the three widths, the tabs panel reaches the right edge of the board, the page never scrolls sideways, and `just gate` is clean.

## Summary
`src/pages/CharacterPage.svelte`: the board was a three track grid while `HitPoints` sat at `grid-column: 4 / 6` and `DefensesNConditions` at `3 / 6`, so columns four and five were implicit `auto` tracks. They took their content width first and left the three `1fr` tracks the remainder, which is what squeezed the stat titles, and `.sheet-tabs` at `grid-column: 1 / -1` reached line four, the end of the explicit grid, not line six, which is the empty column to the right of the tabs panel.

`.sheet-board` is now a flex column holding `.sheet-stats` and `.sheet-tabs`. `.sheet-stats` is `repeat(5, minmax(min-content, 1fr))` and the seven boxes auto place: proficiency, walking, inspiration and hit points on row one, initiative, armor and defences on row two. The six wrapper `div`s that carried `style:grid-column` are gone; the components are grid items themselves. `.sheet-tabs` is a sibling of the stats grid, so it spans the board by being a flex item rather than by a line number.

`min-content` is the track floor, so a track is never narrower than the widest title it holds and no title can clip. `.sheet-grid` is `minmax(min-content, max-content) minmax(min-content, 1fr)`: the sheet column takes what it needs up to what it wants and the board takes the rest, never less than its stat row. `.sheet-tabs` carries `contain: inline-size` so the tab contents, `InventoryTab` at six `auto` tracks and `ActionAttack` at `white-space: nowrap`, cannot drive the board's floor past the stat row's.

`src/components/character_sheet/HitPoints.svelte`: `.vitals` `grid-column: 4 / 6` to `span 2`.

`src/components/character_sheet/DefensesNConditions.svelte`: `.root` `grid-column: 3 / 6` and `grid-row: 2` to `span 3`.

`just check` is 87 files, zero errors, zero warnings. `just build` is clean; the chunk size note on `index-*.js` predates this task.

### Findings
`src/components/ui/Stat.svelte` is outside `## Scope` and was not touched. `.dnd-stat-label` is an `inline-flex` whose text node cannot break, so a title can only ever fit by the track being wide enough, never by wrapping. The `min-content` floor makes that hold, but the second sentence of `## Order` 1, a title that shrinks or wraps within its own box, has no implementation and would need `Stat`.
