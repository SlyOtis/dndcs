---
id: 134
parent: 127
depends: [117]
relations: []
title: The crown holds the portrait, name, level and kin at their own width and no wider
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
created_at: 2026-09-06T19:29:48Z
updated_at: 2026-09-08T09:39:42Z
questions: []
images: []
scope: [src/pages/CharacterPage.svelte]
base: b56157768c1dd382cdf366edde993b9455cb12e6
---

## Intent
The user, on a screenshot of the crown: this does not need to fill the full top. After 115 the crown holds the portrait, the name, the level and the kin and nothing else, and still stretches across the whole sheet as a near empty bar.

## Scope
`src/pages/CharacterPage.svelte` (`.sheet-crown`, `.sheet-lines` and their styles). Not the frame dialog, not the board. Runs after 117, which owns the same file's grid.


## Goal
On Testy the crown is no wider than its content at 1280 and 2000 wide, the name and kin stay on one line each, and `just gate` is clean.
