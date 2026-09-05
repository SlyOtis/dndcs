---
id: 107
parent:
depends: []
relations: [108, 109]
title: Author level features for the thirteen core classes
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
The thirteen core classes were authored with identity, hit die, primary ability, saving throws and prose, and `features: []`. The detail page at `/sources/classes/:id` groups features into a panel per level and says plainly that nothing is written down. Gunslinger is the worked example of a full document.

## Scope
`public/sources/classes/*.json` except `gunslinger.json`. No source, no component.

## Order
1. dndcs: read `public/sources/classes/gunslinger.json` for the feature shape and `.claude/rules/engine.md` for what a system document may declare.
2. dndcs: author the level features for each of the thirteen classes in that shape, with the level each arrives at.
3. verify: every file parses and the detail page renders a panel per level.

## Done when
No core class carries an empty `features` array, and `/sources/classes/:id` shows features grouped by level for each.

## Summary
