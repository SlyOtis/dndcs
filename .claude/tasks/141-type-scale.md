---
id: 141
parent: 139
depends: [140]
relations: []
title: Every text on screen sits on one type scale that follows the theme and no component sets its own size
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
created_at: 2026-09-06T21:24:24Z
updated_at: 2026-09-08T09:39:36Z
questions: []
images: []
scope: [src/app.css, index.html]
base: b56157768c1dd382cdf366edde993b9455cb12e6
---

## Intent
The user: no handling of text size and nothing following the text theme. `src/app.css` declares `--font-display`, `--font-body` and a third face, five `--text-*` steps, and four roles, `dnd-heading`, `dnd-heading-hero`, `dnd-label` and `dnd-caption`. Components bypass them: eleven `font-size` literals in `rem` and one in `px` across components and pages, and `Frame`, `Button`, `Stat`, `Shell` and the rest size themselves in pixels. Text does not scale with the viewport or with the theme.

## Scope
`src/app.css`, `src/components/ui/**`. Not the pages or the sheet, which 127 brings onto the scale.


## Goal
`grep -rn "font-size: [0-9]" src/components/ui/` returns nothing, every role in `app.css` is a `clamp`, switching theme changes the type where the README says it should, and `just gate` is clean.
