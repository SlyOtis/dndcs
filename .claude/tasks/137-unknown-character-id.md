---
id: 137
parent:
depends: [122]
relations: [122]
title: An unknown character id shows an empty sheet with one message instead of the fixture and permission errors
type: bug
status: staged
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: []
created_at: 2026-09-06T20:12:27Z
updated_at: 2026-09-06T20:13:44Z
questions: []
images: []
---

## Intent
The 110 walk: `/character/<unknown id>` keeps the fixture Lucky Lars on screen for good and logs a Firestore permissions error plus two scope errors. `CharacterPage.svelte` calls `getCharacter(route.params.id)`, applies the document when one comes back, and on failure only logs `Character did not load`; nothing on the page changes. 122 removes the fixture, so after it an unknown id shows an empty store and the same three errors.

## Scope
`src/pages/CharacterPage.svelte`, `src/lib/firestore.service.ts` for `getCharacter`. Not `firestore.rules`: a denied read is the right answer for another user's character. Runs after 122, which owns the same load path.

## Order
1. dndcs: when `getCharacter` rejects or returns no document, the sheet renders one message in the page's language, the character was not found or is not yours, inside `Shell`, with the way back to the hearth, and renders no board, no tabs and no drawer content.
2. dndcs: the denied read is handled, not logged as an error, and the two scope errors that follow it do not occur because nothing downstream runs on a character that never loaded.
3. verify: `just gate`, then `just dev` and open `/character/does-not-exist` with the console open.

## Done when
`/character/does-not-exist` shows the one message and the way back, the console carries no error, Testy's sheet still loads, and `just gate` is clean.

## Summary
