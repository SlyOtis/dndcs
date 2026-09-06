---
id: 122
parent:
depends: []
relations: []
title: The sheet shows nothing until the routed character loads instead of the fixture character
type: bug
status: staged
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: []
created_at: 2026-09-06T19:12:48Z
updated_at: 2026-09-06T19:16:41Z
questions: []
---

## Intent
The 110 walk: the sheet renders the fixture character, Lucky Lars, until the routed character loads. `src/lib/engine.ts` imports `testCharacter` from `character.fixture` and seeds the character store with it, so every sheet opens on a stranger for the length of the Firestore read.

## Scope
`src/lib/engine.ts`, `src/pages/CharacterPage.svelte`. `src/lib/character.fixture.ts` stays: the spec files read it.

## Order
1. dndcs: the character store starts empty and the sheet renders nothing of a character until `getCharacter` for the routed id resolves; the loading state is the one `App.svelte` and `Shell` already draw, not a placeholder character.
2. dndcs: the fixture is imported by tests only.
3. verify: `just gate`, then `just dev` and open Testy's sheet with the network throttled.

## Done when
No frame of Testy's sheet shows Lucky Lars or any fixture value, `character.fixture` is imported from no file under `src/` other than a `*.spec.ts`, and `just gate` is clean.

## Summary
