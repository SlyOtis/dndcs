---
id: 123
parent:
depends: []
relations: []
title: A blob: portrait address is never persisted and an existing one renders as missing without a console error
type: bug
status: blocked
blocked_from: doing
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [data, components]
commits: [577230226a1a6458a463579a08831dc5ab849cb1, 899c92f0ff22b2372fdf25b55150ad006dec3ea6]
created_at: 2026-09-06T19:12:48Z
updated_at: 2026-09-06T21:37:35Z
questions: [q-008]
base: d32b80c645e6bfe46355798c42feca0d1210fce4
agent: a072995e85f270246
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
`src/lib/storage.service.ts`: the diff from `base` is the Firestore file store the working tree already carried uncommitted when the task was taken; `StoredImage.svelte` at `base` imports `isStoredFile` and `deleteFilePlace` from it, and `CampaignPage.svelte` at f5fcdd6 imports `$lib/swarm`. It replaces Firebase Storage: `FileRecord` and `FilePlace`, a `file:` address naming a record document with SHA-256 block hashes and an `etag`, a webp floor at `MAX_EDGE` 1600 in `chunks` of `CHUNK_BYTES`, the original in IndexedDB `dndcs-files` with a `places` store, `getSwarmFile` pulling the original from peers, and `deleteFile` removing the record, its chunks and the local blob. This task adds `BLOB_PREFIX` and `isDeadFile(address)` beside `isLocalFile`, `isFileRecord` and `isStoredFile`, `getFileUrl` returning `''` for a dead address before anything else, and single quotes on the `''` in `getRecordPath`.

`src/components/ui/StoredImage.svelte`: a dead address resolves to `''` in the sync branch, so the missing mark draws and no `<img src="blob:...">` is ever set; the src prop doc names `file:` and `blob:`.

`src/components/ui/Portrait.svelte`: `picture` is `$derived` from `src` and `isDeadFile`; a dead address falls to the initial letter, the portrait fallback on the sheet and the frame dialog. The hearth and campaign cards go through `Card` to `StoredImage` and draw the missing mark.

`just check` 0 errors 0 warnings; `just build` passes with the pre-existing chunk size note.

### Findings
- `src/lib/swarm.ts` is untracked and outside scope; `storage.service.ts` and `CampaignPage.svelte` (f5fcdd6, before `base`) import it, so HEAD does not resolve on a clean checkout until it is committed.
- No live path writes a `blob:` since f5fcdd6: `CharacterCreatePage` sets `creationData.imageUrl = await postFile(file, { kind: 'user' })` and `CharacterRacePage` carries it into `createCharacter`.
- Order 2's drop on save has no save to sit on: `characterService.updateCharacter` in `src/lib/firestore.service.ts` has no caller and `engine.ts` persists the sheet to `localStorage` under `ch_<id>_*`. The question against this task asks where the address is dropped.
- `src/lib/characterInfo.ts` and `src/components/CharacterInfo.svelte` are imported by nothing; `characterUtils.getCharacterImage` and `/default-character.png` are dead. `src/components/CharacterInfoPanel.svelte` is unmounted and holds a bare `<img src>`.
