---
id: 120
parent:
depends: [119]
relations: []
title: The same script pulls every race and its images from D&D Beyond
type: task
status: staged
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: []
commits: []
created_at: 2026-09-06T19:09:43Z
updated_at: 2026-09-06T19:09:44Z
questions: []
---

## Intent
119 builds the fetcher and pulls the classes. The race documents under `public/sources/races/` were authored the same way, 108 from memory and 109 for emblems, and want the same reference beside them: D&D Beyond's species pages with their traits, subraces, descriptions and art.

## Scope
`scripts/reference.sh` and `reference/dndbeyond/races/`. Not `public/sources/**`, not `src/**`, and the same rule as 119: the set stays local, gitignored, never shipped.

## Order
1. dndcs: `races` becomes a kind in `scripts/reference.sh`, reading D&D Beyond's species listing and writing `reference/dndbeyond/races/<slug>/` with the page text as markdown, every trait, every subrace, and every image the page carries.
2. verify: `just reference races`, then `ls reference/dndbeyond/races`.

## Done when
`just reference races` fills a folder per species D&D Beyond lists, every race in `public/sources/races/index.json` among them, each holding the markdown and at least one image, `git status` shows nothing under `reference/`, and `just gate` is clean.

## Summary
