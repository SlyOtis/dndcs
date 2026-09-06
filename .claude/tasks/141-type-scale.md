---
id: 141
parent: 139
depends: [140]
relations: []
title: Every text on screen sits on one type scale that follows the theme and no component sets its own size
type: task
status: staged
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: []
created_at: 2026-09-06T21:24:24Z
updated_at: 2026-09-06T21:24:26Z
questions: []
images: []
---

## Intent
The user: no handling of text size and nothing following the text theme. `src/app.css` declares `--font-display`, `--font-body` and a third face, five `--text-*` steps, and four roles, `dnd-heading`, `dnd-heading-hero`, `dnd-label` and `dnd-caption`. Components bypass them: eleven `font-size` literals in `rem` and one in `px` across components and pages, and `Frame`, `Button`, `Stat`, `Shell` and the rest size themselves in pixels. Text does not scale with the viewport or with the theme.

## Scope
`src/app.css`, `src/components/ui/**`. Not the pages or the sheet, which 127 brings onto the scale.

## Order
1. dndcs: read the type hierarchy 140 wrote into `docs/inspiration/README.md` before changing anything.
2. dndcs: one type scale in `app.css`, roles for display, heading, label, body, numeral and caption, each a token with a fluid size in `clamp` and a face, weight, tracking and case, redeclared per theme where the theme wants a different face or tracking.
3. dndcs: every primitive under `ui/` sets text through a role and never a `font-size` of its own; a numeral in `Stat`, `Meter` and `Sigil` uses the numeral role.
4. verify: `just gate`, then `grep -rn "font-size" src/components/ui/` returns only `app.css` roles.

## Done when
`grep -rn "font-size: [0-9]" src/components/ui/` returns nothing, every role in `app.css` is a `clamp`, switching theme changes the type where the README says it should, and `just gate` is clean.

## Summary
