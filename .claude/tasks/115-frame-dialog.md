---
id: 115
parent: 112
depends: []
relations: []
title: The portrait frame picker leaves the crown for a dialog
type: task
status: done
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: [82087071ad4024733f7ba3ae1fc78ec20ca91791]
created_at: 2026-09-05T15:41:59Z
updated_at: 2026-09-06T21:21:13Z
questions: []
base: 57fef3f3bca747e4fea3ae843a44329b927197b5
---

## Intent
The crown header renders the five portrait frame choices inline as five portraits, taking the right half of the crown on every visit for a choice made once. One-off choices on the sheet are dialogs: `Dialogs.svelte` opens one on `postUIAction` and `src/lib/dialogs/*.ts` holds each one's state, the theme dialog being the nearest sibling.

## Scope
`src/pages/CharacterPage.svelte` (the `.sheet-crown` markup and styles), `src/components/dialogs/Dialogs.svelte`, `src/lib/dialogs/`, `src/components/FrameDialog.svelte`. Not the board.

## Order
1. dndcs: the frame choice moves into a dialog on the existing `Dialogs` path, opened from the portrait in the crown. Its own dialog after the pattern of `theme.ts` and `ThemeDialog.svelte`, or a section of the theme dialog; the worker decides which reads better.
2. dndcs: the crown keeps the portrait, name, level and kin and nothing else.
3. verify: `just gate`.

## Done when
The crown carries no frame picker, clicking the portrait opens a dialog that changes the frame and the change shows on the crown at once, and `just gate` is clean.

## Summary
The frame picker is its own dialog on the `Dialogs` path, opened from the portrait.

`src/lib/dialogs/frame.ts` is new: `createFrameStore` holding `isOpen` with `open` and `close`, the shape of `createThemeStore` minus the persisted value, since the frame lives on the character as `info.imageFrame` and not in local storage.

`src/components/FrameDialog.svelte` is new, a `BaseDialog` beside `ThemeDialog.svelte`. It takes `isOpen` and `frame` bindable plus `src` and `alt`, and renders `PORTRAIT_FRAMES` as a grid of buttons, each a `Portrait` of the character in that frame with its title under it, the taken one lit and marked with a quatrefoil `Ornament`. Clicking one writes `frame`.

`src/components/dialogs/Dialogs.svelte` creates `frameStore`, adds the `openFrameDialog` case to the UI action dispatcher, and renders `FrameDialog` with `bind:frame={$info.imageFrame}`, so a click in the dialog writes the character store and the crown redraws at once.

`src/pages/CharacterPage.svelte` drops the `.sheet-frames` group, the five `.sheet-frame` buttons and their styles, and the `PORTRAIT_FRAMES` import. The crown portrait is now a `.sheet-face` button posting `openFrameDialog`; the crown holds the portrait, name, level and kin and nothing else.

`just check` is 88 files, 0 errors, 0 warnings. `just build` is clean; the chunk size notice on `index` and `sources` predates this change.

### Findings
`setUIActionDispatcher` in `src/lib/chat.ts` is a single global slot, and `src/components/CharacterInfo.svelte` sets it too. Whichever component mounts last owns every action. `CharacterInfo` is not on the character page, so nothing breaks today.

`info.imageFrame` is typed `string` in `src/lib/character.types.ts:310` while `Portrait` takes `PortraitFrame`, so the cast at the call site stays.
