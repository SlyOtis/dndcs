---
id: 146
parent: 145
depends: [106]
relations: []
title: The hearth lays its hero and panels on one grid divided by panel instead of a single column
type: task
status: draft
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: []
created_at: 2026-09-06T22:29:21Z
updated_at: 2026-09-06T22:56:40Z
questions: []
images: []
---

## Intent
`.hall-rails` on `src/pages/MainPage.svelte` is a flex column, so the five panels stack full width and each `Rail` scrolls its own track sideways; a hearth with two characters and one campaign is a long page of mostly empty rails under a centred hero. The user wants a grid: the page divided into regions by panel, a panel's place and span following what it holds. This task lays that grid, and 147 and 148 place their panels onto it.

## Scope
`src/pages/MainPage.svelte` and the five files under `src/pages/main/`. The panels keep their data; their frame stays `Rail` unless the grid area asks for a stacked list, in which case `Panel` from `src/components/ui/` is the frame. Nothing under `src/components/ui/**`. Runs after 106, which carries the gothic language onto this page.

## Order
1. dndcs: read `docs/inspiration/README.md` for how a fantasy screen divides its ground before changing anything.
2. dndcs: replace `.hall-rails` with one grid on `MainPage.svelte` whose areas are named per panel, the hero one area among them. Characters and Campaigns are the primary areas, Chronicles, Quests and Party the secondary; the spans follow that. Declared so a further panel is one more area and one more line, not a rewrite.
3. dndcs: the columns collapse with width using the `minmax(min(var(--col), 100%), 1fr)` pattern the pages already carry, `min-width: 0` on every track, no page literal colour and no pixel size; page variables over `--space-*`.
4. dndcs: a panel whose area is a column shows its entries stacked; one whose area is a row keeps the sideways track.
5. verify: `just gate`, then `just walk` against `just dev` and read the hearth shots.

## Done when
`just gate` is clean, and the hearth shots the walk takes at 1280 and 1600 show the hero and all five panels in the grid with no empty column and no horizontal scroll.

## Summary
