---
id: 108
parent:
depends: []
relations: [107]
title: Author traits for the nine core races
type: task
status: staged
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [engine]
commits: []
created_at: 2026-09-05T15:10:52Z
updated_at: 2026-09-05T15:11:58Z
questions: []
---

## Intent
The nine core races were authored with size, speed, ability bonuses and prose, and `traits: []`. The detail page renders a traits panel and says nothing is written down.

## Scope
`public/sources/races/*.json`. No source, no component.

## Order
1. dndcs: read `public/sources/classes/gunslinger.json` for the feature shape the race traits mirror.
2. dndcs: author the traits for each of the nine races.
3. verify: every file parses and the detail page renders the traits.

## Done when
No race carries an empty `traits` array, and `/sources/races/:id` shows them.

## Summary
