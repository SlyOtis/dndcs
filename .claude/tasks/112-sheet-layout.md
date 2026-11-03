---
id: 112
parent:
depends: [116, 117]
relations: []
title: The character sheet fills the viewport and nothing clips, wraps or overflows
type: epic
status: done
session:
review:
blocked_from: doing
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: []
created_at: 2026-09-05T15:41:58Z
updated_at: 2026-09-08T09:39:53Z
questions: [q-003, q-004, q-010]
base: f301e68d9d164beb849903552dcd3fb755b383d3
scope: [src/pages/CharacterPage.svelte]
---

## Intent
The character sheet at a 2000px viewport, with the sample character Testy: the Proficiency, Walking and Inspiration titles clip their boxes, the actions panel takes one third of the board and leaves the rest as empty ground, an action name wraps over three lines and the actions header is cut short, and the five portrait frame choices sit inline in the crown for a choice made once. Space is wasted, nothing scales to the width it has, and text overflows.

## Scope
`src/pages/CharacterPage.svelte`, `src/components/character_sheet/**`, and of `src/components/ui/**` only `Portrait.svelte` for 116 and `Stat.svelte` for 117.


## Goal
113, 114, 115, 116 and 117 are done, the q-003 answer is boarded as 116, and the open question against this task is answered and boarded.
