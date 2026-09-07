---
id: 137
parent:
depends: [122]
relations: [122]
title: An unknown character id shows an empty sheet with one message instead of the fixture and permission errors
type: bug
status: done
session:
review:
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: [7e35384beb73c8377f51930f5467114cb5f5b443, 8558bae27fc7064e3ac427bbc4f8bc0a582c24d7]
created_at: 2026-09-06T20:12:27Z
updated_at: 2026-09-07T16:18:15Z
questions: []
images: []
agent: ae33abd8e37d60435
base: 107422c0a5a9739fb6272af6a8d881fb1769e9a3
---

## Intent
The 110 walk: `/character/<unknown id>` keeps the fixture Lucky Lars on screen for good and logs a Firestore permissions error plus two scope errors. `CharacterPage.svelte` calls `getCharacter(route.params.id)`, applies the document when one comes back, and on failure only logs `Character did not load`; nothing on the page changes. 122 removes the fixture, so after it an unknown id shows an empty store and the same three errors.

## Scope
`src/pages/CharacterPage.svelte`, `src/lib/firestore.service.ts` for `getCharacter`. Not `firestore.rules`: a denied read is the right answer for another user's character. Runs after 122, which owns the same load path.


## Goal
`/character/does-not-exist` shows the one message and the way back, the console carries no error, Testy's sheet still loads, and `just gate` is clean.
