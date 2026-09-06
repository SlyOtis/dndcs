---
id: 134
parent: 127
depends: [117]
relations: []
title: The crown holds the portrait, name, level and kin at their own width and no wider
type: task
status: staged
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: []
created_at: 2026-09-06T19:29:48Z
updated_at: 2026-09-06T19:29:51Z
questions: []
images: []
---

## Intent
The user, on a screenshot of the crown: this does not need to fill the full top. After 115 the crown holds the portrait, the name, the level and the kin and nothing else, and still stretches across the whole sheet as a near empty bar.

## Scope
`src/pages/CharacterPage.svelte` (`.sheet-crown`, `.sheet-lines` and their styles). Not the frame dialog, not the board. Runs after 117, which owns the same file's grid.

## Order
1. dndcs: the crown takes the width its portrait, name, level and kin need and no more, in the reference language of `docs/inspiration/README.md`, sitting at the sheet's start rather than spanning it; the ground it gives up goes to the board.
2. verify: `just gate`, then `just dev` on Testy at 1280 and 2000 wide.

## Done when
On Testy the crown is no wider than its content at 1280 and 2000 wide, the name and kin stay on one line each, and `just gate` is clean.

## Summary
