---
id: 113
parent: 112
depends: []
relations: []
title: The stat boxes fit their titles and the board and tabs take the full remaining width
type: task
status: done
session:
review:
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: [a59b94f014a8c611202a68fda3af812f8af89761, 0925e0dc3aaac49a394ce8432a74e46999d6a3e3]
created_at: 2026-09-05T15:41:58Z
updated_at: 2026-09-07T10:53:26Z
questions: []
base: 60f7513206c7f23f7eae9786964b58becf626147
---

## Intent
In the board's first row the Proficiency, Walking and Inspiration titles overflow their boxes and run into each other. `.sheet-tabs` declares `grid-column: 1 / -1` yet the tabs panel renders as a narrow third column with empty ground to its right, and the sheet as a whole does not reflow between a laptop width and 2000px.

## Scope
`src/pages/CharacterPage.svelte` (`.sheet-grid`, `.sheet-board`, `.sheet-tabs` and the board markup), `src/components/character_sheet/PlainBox.svelte`, `src/components/character_sheet/Inspiration.svelte`, `src/components/character_sheet/Initiative.svelte`, `src/components/character_sheet/HitPoints.svelte`, `src/components/character_sheet/DefensesNConditions.svelte`. Not the tab contents, which is 114. Not the crown, which is 115.

## Findings
`src/components/ui/Stat.svelte` is outside `## Scope` and was not touched. `.dnd-stat-label` is an `inline-flex` whose text node cannot break, so a title can only ever fit by the track being wide enough, never by wrapping. The `min-content` floor makes that hold, but the second sentence of `## Order` 1, a title that shrinks or wraps within its own box, has no implementation and would need `Stat`.

The tester ran `## Done when` at 1280, 1600 and 2000 on the running app. No leaf title in `.sheet-stats` leaves its own box at any width, the seven boxes never overlap, `.sheet-tabs` right edge equals `.sheet-board` right edge to the pixel, `scrollWidth - innerWidth` is 0, and `just gate` is 88 files, zero errors, zero warnings, 168 tests passing.

`test/walk.sh` now carries the coverage inside the Testy sheet block: the stat box count, the leaf title containment and the tabs to board right edge, each at the three widths. Checked out at base `60f7513` the tabs assertion fails by 342px at every width and passes on the landed layout.

`e51251e` reverted `CharacterPage.svelte`, `HitPoints.svelte` and `DefensesNConditions.svelte` to their base blobs while another session committed the working tree. `35dc6b6` restores them to `1824aeb`, byte for byte.

## Goal
No stat box clips its title at any of the three widths, the tabs panel reaches the right edge of the board, the page never scrolls sideways, and `just gate` is clean.
