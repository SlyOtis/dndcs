---
id: 120
parent:
depends: [119]
relations: []
title: The same script pulls every race and its images from D&D Beyond
type: task
status: done
session:
review:
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: []
commits: [8aa853e1d4f157c00ecf9c49671a05462ad0d772]
created_at: 2026-09-06T19:09:43Z
updated_at: 2026-09-07T10:53:28Z
questions: []
agent: a026a758720fb4809
base: 35dc6b6eb991d7cce11695aea909726806fd4ae0
---

## Intent
119 builds the fetcher and pulls the classes. The race documents under `public/sources/races/` were authored the same way, 108 from memory and 109 for emblems, and want the same reference beside them: D&D Beyond's species pages with their traits, subraces, descriptions and art.

## Scope
`scripts/reference.sh` and the `races` folder under `reference/`, beside `classes`. Not `public/sources/**`, not `src/**`, and the same rule as 119: the set stays local, gitignored, never shipped.

## Findings
- 201 of the 224 links redirect to `marketplace.dndbeyond.com` and are reported `skip <slug>: not a species page`; the anonymous listing carries every species but serves only the free core ones.
- `2175513-manikin` and `2175514-scourgeborne` answer 404 on their own page.
- `## Scope` named `reference/dndbeyond/races/` as a path, which `land` cannot `git add` because `reference/` is ignored; it now names the folder in prose so the landed scope is `scripts/reference.sh` alone.
- The 2024 species pages carry only the traits section; the description and names of a core species live on its 2014 page.

## Goal
`just reference races` fills a folder per species D&D Beyond lists, every race in `public/sources/races/index.json` among them, each holding the markdown and at least one image, `git status` shows nothing under `reference/`, and `just gate` is clean.
