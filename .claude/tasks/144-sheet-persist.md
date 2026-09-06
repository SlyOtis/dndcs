---
id: 144
parent:
depends: [122]
relations: [123]
title: An edit on the character sheet is written to the character's Firestore document
type: bug
status: staged
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [data, components]
commits: []
created_at: 2026-09-06T21:39:01Z
updated_at: 2026-09-06T21:39:01Z
questions: []
images: []
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
