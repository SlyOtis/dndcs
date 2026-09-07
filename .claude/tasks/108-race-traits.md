---
id: 108
parent:
depends: []
relations: [107]
title: Author traits for the nine core races
type: task
status: done
session:
review:
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [engine]
commits: [5d96ed82a6ac2a680f0ec2479e5d58e14072ba41]
created_at: 2026-09-05T15:10:52Z
updated_at: 2026-09-07T10:53:25Z
questions: []
base: eb072f02fc2429875246cb253145577d4fa78546
---

## Intent
The nine core races were authored with size, speed, ability bonuses and prose, and `traits: []`. The detail page renders a traits panel and says nothing is written down.

## Scope
`public/sources/races/*.json`. No source, no component.

## Findings

`public/sources/races/` is untracked in git in its entirety, `index.json` included, so the nine race documents had no committed listing. The whole directory lands with this task under the `public/sources/races/*.json` glob in `## Scope`.

The `chunks are larger than 500 kB` notice from `just build` is on `index-*.js` and `sources-*.js` and predates this task; a JSON file under `public/` is not bundled.

## Goal
No race carries an empty `traits` array, and `/sources/races/:id` shows them.
