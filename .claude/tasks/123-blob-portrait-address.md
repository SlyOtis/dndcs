---
id: 123
parent:
depends: []
relations: [144]
title: A blob: portrait address is never persisted and an existing one renders as missing without a console error
type: bug
status: done
session:
review:
blocked_from: doing
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [data, components]
commits: [f8e0537fc777fe8ab71c1344bb42f066cd3050d3, 6f2697858bc510f80a7ad408562e0e6268d3f54a, fdf2a35c77584f416b59778887d4b1eea68df6a8, 507451a74a600c7e4c61d81e034581a2d415559d, b89208b2378492c46eb7a723fa408511444cc631]
created_at: 2026-09-06T19:12:48Z
updated_at: 2026-09-07T14:12:45Z
questions: [q-008]
base: 0841be945ad7c5f1fa74c8114956919207319def
agent: a072995e85f270246
---

## Intent
The 110 walk: three characters carry `blob:http://localhost:5174/...` as `imageUrl` and every page that lists them logs a console error. `getFileUrl` in `src/lib/storage.service.ts` returns `URL.createObjectURL(...)` for a chunked, pulled or legacy file, an address that lives for one page in one browser, and somewhere that resolved address was written back onto the character instead of the file address it was resolved from.

## Scope
`src/lib/storage.service.ts`, `src/lib/firestore.service.ts`, `src/lib/characterInfo.ts`, `src/components/CharacterInfo.svelte`, `src/components/ui/StoredImage.svelte`, `src/components/ui/Portrait.svelte`. `src/pages/CharacterCreatePage.svelte`. Not `firestore.rules`. `src/lib/firestore.service.ts` is here because q-008 answers that the scrub and the `updateDoc` that drops the address live in `getCharacter` and `getUserCharacters`; `src/pages/CharacterCreatePage.svelte` is here because the review found its `blob:` preview is what `isDeadFile` blanks.


## Goal
No character can be saved with a `blob:` `imageUrl`, the hearth and the sheet log no error for the three that carry one, and `just gate` is clean.
