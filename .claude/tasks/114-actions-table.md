---
id: 114
parent: 112
depends: [113]
relations: []
title: The actions and inventory tables fit their columns at every width
type: task
status: testing
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: [165841af5ccbeebc99d4b995983206d940b1834c]
created_at: 2026-09-05T15:41:59Z
updated_at: 2026-09-06T23:14:09Z
questions: []
agent: lcp-worker-114
base: 57d079d606f529c9a96735f1b3ac30b67751201e
---

## Intent
The actions list in `ActionsTab.svelte` lays a row out on `grid-template-columns: auto auto auto auto 1fr`. With Testy's Hand Cannon Attack the name wraps over three lines, the header's last column is cut to a single letter, and the No ammo badge sits over the range cell instead of in its own.

## Scope
`src/components/character_sheet/main_tabs/ActionsTab.svelte`, `src/components/character_sheet/main_tabs/ActionAttack.svelte`, `src/components/character_sheet/main_tabs/ActionSpecial.svelte`, `src/components/character_sheet/main_tabs/InventoryTab.svelte`, `src/components/character_sheet/main_tabs/MainTabs.svelte`. Not the character page.

## Order
1. dndcs: an action row shows name, range, hit or DC, damage and notes on one line at the width the tabs panel has after 113. Long text truncates with an ellipsis and carries its full text on `title`. No header is clipped.
2. dndcs: a badge such as No ammo sits in flow inside its own cell, never over another.
3. dndcs: the same rule for the inventory table.
4. verify: `just gate`, then `just dev` and read the actions and inventory tabs on Testy at 1280 and 2000 wide.

## Done when
On Testy no action or inventory name occupies more than one line, every column header reads in full, no badge overlaps a cell, and `just gate` is clean.

## Summary
`ActionsTab.svelte`: `.attack` moves from `auto auto auto auto 1fr` to `2fr auto auto auto 2fr`. An `fr` track is `minmax(auto, Nfr)`, so its floor is the largest minimum contribution among its items. The header spans keep `overflow: visible`, so each track is floored at its own header's width and no header can clip, while every data cell now carries `overflow: hidden`, which makes its automatic minimum size zero and lets the name and the properties shrink to the ellipsis. `.attack-header span` is `white-space: nowrap` so a header never breaks mid word.

`ActionAttack.svelte`: `.title` and `.properties` are `min-width: 0; overflow: hidden`; the `h4`, the `.sub` and the properties span are `nowrap` with `text-overflow: ellipsis`. The name carries `title={action.name}` and the properties a `properties` derived, one string on the span and on its `title`. `.range` is `nowrap` in an `auto` track, so it never wraps and never needs the ellipsis.

The No ammo badge is in flow. The `.debug-info` wrapper is gone and `.ammo-warning` is a plain `span` inside `.hit` and `.attack`, which are flex columns with a 4px gap. It was two nested `position: absolute` boxes at `top: -20px` and `top: -25px` translated to `left: 50%`, which is what put it over the neighbouring cell and the row above.

`InventoryTab.svelte`: `ul` moves from six `auto` tracks to `auto 2fr auto auto auto 3fr` and `justify-items: start` is dropped. Under `start` an item takes its fit-content width, which for nowrap text is the full string, so it would have bled past its track instead of ellipsising; the default `stretch` binds it to the track. `.items-header span` and `.center` are `nowrap`, `.name` and `.notes` are `min-width: 0; overflow: hidden`, their children ellipsise, and `.notes > p` loses the default paragraph margin it had. The item name carries `title={item.title}` and the note `title={item.description}`.

Measured on the built app at 1280 and 2000 with a probe row injected into both tables, since Testy's actions and inventory are empty on this account. Both widths: no header span clipped, no cell past the list's content edge, no pair of cells overlapping, the name box exactly one line high at its own line height with the ellipsis engaged, the note the same, and both No ammo badges inside their own cell's rect. Actions tracks at 1280 are 456/55/68/73/456, inventory 48/374/55/28/66/561.

`just check` is 88 files, zero errors, zero warnings. `just build` is clean; the chunk size note on `index-*.js` predates this task.

### Findings
`## Scope` named four of its five files by bare filename, so `task.sh scope` parsed only `ActionsTab.svelte`, and it parsed `src/pages/CharacterPage.svelte` out of the sentence that forbids it, granting the worker the one file the task excludes. The five names are unchanged, written as full paths, and the exclusion now reads "Not the character page."

`ActionSpecial.svelte` and `MainTabs.svelte` are in `## Scope` and were not touched. A special action is a flex column of a heading and a paragraph, not a table, and nothing there clips. `MainTabs.svelte` `.content` carries `max-height: 540px`, a literal that owns the tab panel's height and is unrelated to column fit.

`just build` runs `rm -rf node_modules/.vite`, which strands a dev server that is already running on stale optimised dep hashes: the one on 5173 answers 504 for every dep and cannot recover without a restart. The measurement above ran against `just preview` on 4173 instead.
