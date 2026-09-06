---
id: 123
parent:
depends: []
relations: []
title: A blob: portrait address is never persisted and an existing one renders as missing without a console error
type: bug
status: review
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [data, components]
commits: [577230226a1a6458a463579a08831dc5ab849cb1]
created_at: 2026-09-06T19:12:48Z
updated_at: 2026-09-06T19:20:29Z
questions: []
base: d32b80c645e6bfe46355798c42feca0d1210fce4
---

## Intent
The 110 walk: three characters carry `blob:http://localhost:5174/...` as `imageUrl` and every page that lists them logs a console error. `getFileUrl` in `src/lib/storage.service.ts` returns `URL.createObjectURL(...)` for a chunked, pulled or legacy file, an address that lives for one page in one browser, and somewhere that resolved address was written back onto the character instead of the file address it was resolved from.

## Scope
`src/lib/storage.service.ts`, `src/lib/characterInfo.ts`, `src/components/CharacterInfo.svelte`, `src/components/ui/StoredImage.svelte`, `src/components/ui/Portrait.svelte`. Not `firestore.rules`.

## Order
1. dndcs: find the write that persists a `blob:` address as `imageUrl` and make it persist the file address, `chunks:`, hosted or `local:`, that `getFileUrl` resolves at render.
2. dndcs: a character that already carries a `blob:` address renders the portrait fallback with no console error, and the next save of that character drops the dead address.
3. verify: `just gate`, then `just dev` and open the hearth with the three characters listed and the console open.

## Done when
No character can be saved with a `blob:` `imageUrl`, the hearth and the sheet log no error for the three that carry one, and `just gate` is clean.

## Summary
`src/lib/storage.service.ts`: `BLOB_PREFIX` and `isDeadFile(address)` beside `isLocalFile`, `isFileRecord` and `isStoredFile`; `getFileUrl` returns `''` for a dead address before anything else.

`src/components/ui/StoredImage.svelte`: a dead address resolves to `''` in the sync branch, so the missing mark draws and no `<img src="blob:...">` is ever set; the src prop doc names `file:` and `blob:`.

`src/components/ui/Portrait.svelte`: `picture` is `$derived` from `src` and `isDeadFile`; a dead address falls to the initial letter, which is the portrait fallback on the sheet and the frame dialog. The hearth and campaign cards go through `Card` to `StoredImage` and draw the missing mark.

`just check` 0 errors 0 warnings; `just build` passes with the pre-existing chunk size note.

### Findings

The write that persisted a `blob:` left the tree in f5fcdd6: the old `CharacterCreatePage` set `creationData.imageUrl = URL.createObjectURL(file)`; it now sets `await postFile(file, { kind: 'user' })`, a `file:` address, and `CharacterRacePage` carries that into `createCharacter`. No live path writes a `blob:`.

No code writes a loaded character back to Firestore: `characterService.updateCharacter` has no caller and the sheet store in `engine.ts` persists to `localStorage` under `ch_<id>_*` only. There is no save on which the dead address could be dropped, so the three documents keep `blob:` until a write-back exists; they render the fallback in the meantime. A scrub would sit in `applyStateToCharacter` in `engine.ts` or in `firestore.service.ts`, both outside scope.

`src/lib/characterInfo.ts` and `src/components/CharacterInfo.svelte` are not imported by anything; `characterUtils.getCharacterImage` and the `/default-character.png` it names are dead. `src/components/CharacterInfoPanel.svelte` is also unmounted and holds a bare `<img src>` against the data rule.
