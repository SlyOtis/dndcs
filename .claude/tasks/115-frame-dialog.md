---
id: 115
parent: 112
depends: []
relations: []
title: The portrait frame picker leaves the crown for a dialog
type: task
status: staged
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: []
created_at: 2026-09-05T15:41:59Z
updated_at: 2026-09-05T15:41:59Z
questions: []
---

## Intent
The crown header renders the five portrait frame choices inline as five portraits, taking the right half of the crown on every visit for a choice made once. One-off choices on the sheet are dialogs: `Dialogs.svelte` opens one on `postUIAction` and `src/lib/dialogs/*.ts` holds each one's state, the theme dialog being the nearest sibling.

## Scope
`src/pages/CharacterPage.svelte` (the `.sheet-crown` markup and styles), `src/components/dialogs/Dialogs.svelte`, `src/lib/dialogs/`, `src/components/ThemeDialog.svelte` if the frame joins it. Not the board.

## Order
1. dndcs: the frame choice moves into a dialog on the existing `Dialogs` path, opened from the portrait in the crown. Its own dialog after the pattern of `theme.ts` and `ThemeDialog.svelte`, or a section of the theme dialog; the worker decides which reads better.
2. dndcs: the crown keeps the portrait, name, level and kin and nothing else.
3. verify: `just gate`.

## Done when
The crown carries no frame picker, clicking the portrait opens a dialog that changes the frame and the change shows on the crown at once, and `just gate` is clean.

## Summary
