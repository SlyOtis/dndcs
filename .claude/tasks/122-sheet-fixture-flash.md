---
id: 122
parent:
depends: []
relations: [137]
title: The sheet shows nothing until the routed character loads instead of the fixture character
type: bug
status: done
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: [4e9495eaa7e8dc7b9fa48cdbeecb84c6d1345701]
created_at: 2026-09-06T19:12:48Z
updated_at: 2026-09-06T23:22:13Z
questions: []
agent: lcp-worker-122
base: e9863db94b2d0c16886f25e21191702959d4890c
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
`src/lib/engine.ts`: the `character.fixture` import is gone. `getCharacter` is now `getEmptyCharacter` and returns a `Character` with every key present and no values: `getEmptyCharacterInfo()` for `info`, empty arrays for `feats`, `abilities`, `savingThrows`, `skills`, `senses`, `actions`, `spells`, `proficients`, `inventory` and `equipped`, `{}` for `currency`, empty strings for `background` and `special`, and an empty `soundBoard`. It is the default `character` argument of `getCharacterStore`, so the store still builds one writable per key and `MainPage` gets the same empty context.

`src/pages/CharacterPage.svelte`: `loaded` is `$state(false)` and set in a `.finally()` on `characterService.getCharacter(characterId)`, which now runs unconditionally on `characterId` instead of behind an `if (route?.params?.id)`. `sheet-crown` and `sheet-grid` are inside `{#if loaded}`, so until the read settles the page is the `Shell` chrome alone, with its title falling to `Character`. No new loading markup was added.

`just check` is 88 files, 0 errors, 0 warnings. `just build` is clean; the only note is the pre-existing 500 kB chunk-size advisory. `Lucky Lars` appears nowhere in `dist`, and `character.fixture` is imported only by `src/lib/rules/store.spec.ts` and `src/lib/rules/sheet.spec.ts`.

Noticed outside `## Scope`: a failed or missing read leaves `loaded` true with an empty store, so the sheet renders blank rather than saying anything. That is 137's work.
