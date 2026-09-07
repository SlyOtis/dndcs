---
id: 123
parent:
depends: []
relations: [144]
title: A blob: portrait address is never persisted and an existing one renders as missing without a console error
type: bug
status: testing
blocked_from: doing
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [data, components]
commits: [f8e0537fc777fe8ab71c1344bb42f066cd3050d3, 6f2697858bc510f80a7ad408562e0e6268d3f54a, fdf2a35c77584f416b59778887d4b1eea68df6a8, 507451a74a600c7e4c61d81e034581a2d415559d]
created_at: 2026-09-06T19:12:48Z
updated_at: 2026-09-07T09:11:00Z
questions: [q-008]
base: 0841be945ad7c5f1fa74c8114956919207319def
agent: a072995e85f270246
---

## Intent
The 110 walk: three characters carry `blob:http://localhost:5174/...` as `imageUrl` and every page that lists them logs a console error. `getFileUrl` in `src/lib/storage.service.ts` returns `URL.createObjectURL(...)` for a chunked, pulled or legacy file, an address that lives for one page in one browser, and somewhere that resolved address was written back onto the character instead of the file address it was resolved from.

## Scope
`src/lib/storage.service.ts`, `src/lib/firestore.service.ts`, `src/lib/characterInfo.ts`, `src/components/CharacterInfo.svelte`, `src/components/ui/StoredImage.svelte`, `src/components/ui/Portrait.svelte`. `src/pages/CharacterCreatePage.svelte`. Not `firestore.rules`. `src/lib/firestore.service.ts` is here because q-008 answers that the scrub and the `updateDoc` that drops the address live in `getCharacter` and `getUserCharacters`; `src/pages/CharacterCreatePage.svelte` is here because the review found its `blob:` preview is what `isDeadFile` blanks.

## Order
1. dndcs: find the write that persists a `blob:` address as `imageUrl` and make it persist the file address, `chunks:`, hosted or `local:`, that `getFileUrl` resolves at render.
2. dndcs: a character that already carries a `blob:` address renders the portrait fallback with no console error, and the next save of that character drops the dead address.
3. verify: `just gate`, then `just dev` and open the hearth with the three characters listed and the console open.

## Done when
No character can be saved with a `blob:` `imageUrl`, the hearth and the sheet log no error for the three that carry one, and `just gate` is clean.

## Summary
`src/lib/storage.service.ts`: the diff from `base` is the Firestore file store the working tree already carried uncommitted when the task was taken; `StoredImage.svelte` at `base` imports `isStoredFile` and `deleteFilePlace` from it, and `CampaignPage.svelte` at f5fcdd6 imports `$lib/swarm`. It replaces Firebase Storage: `FileRecord` and `FilePlace`, a `file:` address naming a record document with SHA-256 block hashes and an `etag`, a webp floor at `MAX_EDGE` 1600 in `chunks` of `CHUNK_BYTES`, the original in IndexedDB `dndcs-files` with a `places` store, `getSwarmFile` pulling the original from peers, and `deleteFile` removing the record, its chunks and the local blob. This task adds `BLOB_PREFIX` and `isDeadFile(address)` beside `isLocalFile`, `isFileRecord` and `isStoredFile`, `getFileUrl` returning `''` for a dead address before anything else, and single quotes on the `''` in `getRecordPath`.

`src/components/ui/StoredImage.svelte`: a dead address resolves to `''` in the sync branch, so the missing mark draws and no `<img src="blob:...">` is ever set; the src prop doc names `file:` and `blob:`.

`src/components/ui/Portrait.svelte`: `picture` is `$derived` from `src` and `isDeadFile`; a dead address falls to the initial letter, the portrait fallback on the sheet and the frame dialog. The hearth and campaign cards go through `Card` to `StoredImage` and draw the missing mark.

`src/lib/firestore.service.ts`: q-008 answers Order 2. `deleteDeadPortrait(document)` sits beside `getCharacterStatus`, imports `isDeadFile` from `./storage.service`, blanks `document.character.info.imageUrl` on the object it returns and fires `updateDoc(doc(db, COLLECTIONS.CHARACTERS, document.id), { 'character.info.imageUrl': '' })` with the same detached `.catch(() => undefined)` the status rewrite in `getUserCharacters` already uses. `getCharacter` calls it on the document it resolves, `getUserCharacters` on every document in the loop, so a first read renders correctly and cleans the three live documents once.

`src/pages/CharacterCreatePage.svelte`: the review's defect. `imagePreview` and its `URL.createObjectURL(file)` are gone; `postPortrait` only awaits `postFile(file, { kind: 'user' })` into `creationData.imageUrl`, and the drop zone draws `<Portrait src={creationData.imageUrl}>`, so the preview is the `file:` address the character is created with and `StoredImage` resolves it. No `blob:` is made on the page any more.

`just check` 0 errors 0 warnings; `just build` passes with the pre-existing chunk size note.
