---
id: 123
parent:
depends: []
relations: []
title: A blob: portrait address is never persisted and an existing one renders as missing without a console error
type: bug
status: staged
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [data, components]
commits: []
created_at: 2026-09-06T19:12:48Z
updated_at: 2026-09-06T19:16:41Z
questions: []
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
