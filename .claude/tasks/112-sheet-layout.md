---
id: 112
parent:
depends: []
relations: []
title: The character sheet fills the viewport and nothing clips, wraps or overflows
type: epic
status: staged
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: []
created_at: 2026-09-05T15:41:58Z
updated_at: 2026-09-05T15:43:42Z
questions: [q-003]
---

## Intent
The character sheet at a 2000px viewport, with the sample character Testy: the Proficiency, Walking and Inspiration titles clip their boxes, the actions panel takes one third of the board and leaves the rest as empty ground, an action name wraps over three lines and the actions header is cut short, and the five portrait frame choices sit inline in the crown for a choice made once. Space is wasted, nothing scales to the width it has, and text overflows.

## Scope
`src/pages/CharacterPage.svelte`, `src/components/character_sheet/**`. Not `src/components/ui/**`, which holds the primitives.

## Order
1. dndcs: this is the parent. The work lands in 113, 114 and 115.
2. verify: `just gate` once all three are done.

## Done when
113, 114 and 115 are done and the open question against this task is answered and boarded.

## Summary
