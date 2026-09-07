---
id: 115
parent: 112
depends: []
relations: []
title: The portrait frame picker leaves the crown for a dialog
type: task
status: done
session:
review:
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: [82087071ad4024733f7ba3ae1fc78ec20ca91791]
created_at: 2026-09-05T15:41:59Z
updated_at: 2026-09-07T10:53:27Z
questions: []
base: 57fef3f3bca747e4fea3ae843a44329b927197b5
---

## Intent
The crown header renders the five portrait frame choices inline as five portraits, taking the right half of the crown on every visit for a choice made once. One-off choices on the sheet are dialogs: `Dialogs.svelte` opens one on `postUIAction` and `src/lib/dialogs/*.ts` holds each one's state, the theme dialog being the nearest sibling.

## Scope
`src/pages/CharacterPage.svelte` (the `.sheet-crown` markup and styles), `src/components/dialogs/Dialogs.svelte`, `src/lib/dialogs/`, `src/components/FrameDialog.svelte`. Not the board.

## Findings
`setUIActionDispatcher` in `src/lib/chat.ts` is a single global slot, and `src/components/CharacterInfo.svelte` sets it too. Whichever component mounts last owns every action. `CharacterInfo` is not on the character page, so nothing breaks today.

`info.imageFrame` is typed `string` in `src/lib/character.types.ts:310` while `Portrait` takes `PortraitFrame`, so the cast at the call site stays.

## Goal
The crown carries no frame picker, clicking the portrait opens a dialog that changes the frame and the change shows on the crown at once, and `just gate` is clean.
