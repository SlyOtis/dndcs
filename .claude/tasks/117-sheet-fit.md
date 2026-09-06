---
id: 117
parent: 112
depends: [113]
relations: [121, 127]
title: The sheet never exceeds the viewport and a stat title fits by wrapping inside its box
type: epic
status: review
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: [570e1b332f5ae31e0b674a964f53e136b8c3667e]
created_at: 2026-09-05T16:22:55Z
updated_at: 2026-09-06T23:09:00Z
questions: []
agent: lcp-worker-117
base: 792b48564eca3fa72f6f3f263ad3e00e17efd0b0
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
`src/pages/CharacterPage.svelte`: `.sheet-grid` is `minmax(0, max-content) minmax(0, 1fr)` and `.sheet-stats` is `repeat(5, minmax(0, 1fr))`. Both track sets had a `min-content` floor, so the track sum could exceed the grid box and the overflow was cut by `.dnd-shell-scroll`'s `overflow-x: hidden`. With a floor of zero the tracks are capped by the available width. `.sheet-tabs` already carried `min-width: 0` and `contain: inline-size` and was left as it is.

`src/components/ui/Stat.svelte`: `.dnd-stat-label` is `display: block` with `max-width: 100%`, `text-align: center` and `overflow-wrap: anywhere`, so the title wraps inside the box and its min-content contribution is one character instead of the whole word. The two flanking rules became `display: inline-block` with `vertical-align: middle`, and the flex `gap: var(--space-2)` became `margin-inline-end` on `::before` and `margin-inline-start` on `::after`, so the spacing is unchanged. `.dnd-stat` gained `min-width: 0` so the box can shrink inside a `1fr` track; `.dnd-stat-face`'s `min-width: 64px` stays and is now the only content floor a stat contributes.

`src/components/character_sheet/Abilities.svelte`: `.root` gained `flex-wrap: wrap` and `min-width: 0`, so the six ability plates wrap instead of forcing the left grid track wider than its share.

`just check` and `just build` were run through `task.sh run`. The build is clean. `just check` reports four errors, all in `src/lib/chat.spec.ts` at 160, 240 and 254, `Property 'author'/'text' does not exist on type 'ReplicateLogItem | RollLogItem'`. That file is untracked in the tree, is not written by this task and is outside its scope.

`SavingThrows.svelte` and `PlainBox.svelte` are named in `## Scope` but need no change. `PlainBox` is a pass-through to `Stat`. `.saves` in `SavingThrows` is `1fr 1fr`, whose `auto` floor now resolves to the 64px face rather than the label, which is the floor the plate needs anyway. Both are also outside the paths `task.sh scope 117` resolves, since the file names them without a directory.

Outside `## Scope`, noted and not changed: `.vitals` in `HitPoints.svelte` spans two stat columns and `.root` in `DefensesNConditions.svelte` spans three with `width: 100%; min-width: 100%`, so both are sized by the `.sheet-stats` tracks this task capped.

The three-width read on Testy in `## Order` step 3 was not done; it is part of `## Done when`.
