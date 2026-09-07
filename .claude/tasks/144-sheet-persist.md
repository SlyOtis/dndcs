---
id: 144
parent:
depends: [122]
relations: [123]
title: An edit on the character sheet is written to the character's Firestore document
type: bug
status: review
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [data, components]
commits: [6e0473ebd7193200090423dc0c85c02029be80d8]
created_at: 2026-09-06T21:39:01Z
updated_at: 2026-09-07T09:03:24Z
questions: []
images: []
agent: aac0b4cceff658ab2
base: 42f3bd38c96b31cd2bcbddb9c6f9bfd8ebb198a6
---

## Intent
Found under q-008: nothing writes a loaded character back to Firestore. `characterService.updateCharacter` in `src/lib/firestore.service.ts` has no caller, `createCharacter` is the only character write, and `getCharacterStore` in `src/lib/engine.ts` persists the sheet to localStorage under `ch_info`. Every hit point, condition, item and frame changed on Testy's sheet lives in one browser and dies with it, while `setup.md` says Firestore holds what the table shares.

## Scope
`src/lib/engine.ts`, `src/lib/firestore.service.ts`, `src/pages/CharacterPage.svelte`. Not `firestore.rules`, which already allows the owner's update. Runs after 122, which owns the load path, and answers together with 123, which waits on where a dead address is dropped.

## Order
1. dndcs: when the sheet holds a routed character, a change to the character store is written through `updateCharacter` to its document, coalesced so a slider drag is one write, and the local copy is a cache and not the source; the `local` id keeps localStorage alone.
2. dndcs: a write that fails is surfaced on the sheet and retried on the next change; nothing is lost silently.
3. verify: `just gate`, then `just dev`: change Testy's hit points, reload in another browser, read the same value.

## Done when
A change on Testy's sheet reads back after a reload in a second browser, `updateCharacter` has a caller, one slider drag produces one write, and `just gate` is clean.

## Summary
`src/lib/engine.ts`: `characterService` is imported beside `campaignService`, and the store gained the write path. Each per key `propStore.subscribe` still writes localStorage, and for any id other than `local` it now debounces one `putCharacter` on a shared module timer, `characterWriteDelay` 600ms, so a slider drag and every keystroke coalesce into one write. `putCharacter` assembles the whole `Character` from the live stores with `getCharacterState`, compares it to `characterWritten`, the JSON the document is known to hold, and calls `characterService.updateCharacter(id, character)` only when it differs. Success sets `characterWritten` and clears `characterWriteError`; failure logs and sets `characterWriteError`, leaving `characterWritten` behind, so the next change writes the whole character again. Both branches drop out when `characterStoreId` moved on, so an in flight write for the previous sheet cannot arm or alarm the next one.

`characterWritten` is the arming flag as well as the comparison: it starts empty and `putCharacter` returns while it is empty, so nothing is written before the document has been read. `applyStateToCharacter` takes a second argument, `fromDocument`, and when it is true it cancels any pending write and stamps `characterWritten` from the store it just filled. That is the load path alone; undo and redo reach it through `globalThis.__applyCharacterState` with one argument and their state is written like any other change. Swapping the store in `getCharacterStore` flushes a pending write first, then clears `characterWritten` and the error, so a sheet left with an unwritten edit lands it before the next store is built.

`src/pages/CharacterPage.svelte`: the load calls `applyStateToCharacter(document.character, true)`, and `characterWriteError` renders as `<p class="sheet-alarm" role="alert">` between the crown and the grid, styled off `--state-bad` the way `.user-alarm` on `/user` is.

`src/lib/firestore.service.ts` is unchanged: `updateCharacter` already replaces the whole `character` map and stamps `metadata.updated_at` and `metadata.last_played_at`, and `db` is initialised with `ignoreUndefinedProperties`, so an optional field left undefined does not throw.

`just check` is 88 files, 0 errors, 0 warnings. `just build` is clean; the only note is the pre-existing 500 kB chunk-size advisory.

Noticed outside `## Order`: `getCharacterStore()` defaults to the `local` id, and `src/lib/chat.ts` calls it that way at 22 sites. On a routed sheet that tears the routed store down and builds a `local` one, so a chat driven edit never reaches the sheet's stores and now never reaches the document either. `metadata.name`, `level`, `class`, `race` and `status`, which back the list on `/main`, are not refreshed by `updateCharacter`, so a level up on the sheet leaves the card stale.
