---
id: 144
parent:
depends: [122]
relations: [123]
title: An edit on the character sheet is written to the character's Firestore document
type: bug
status: done
session:
review:
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [data, components]
commits: [6e0473ebd7193200090423dc0c85c02029be80d8, f654c963bf713994e2d2555c007c8a68a83f1dc5]
created_at: 2026-09-06T21:39:01Z
updated_at: 2026-09-07T16:18:15Z
questions: []
images: []
agent: aac0b4cceff658ab2
base: 42f3bd38c96b31cd2bcbddb9c6f9bfd8ebb198a6
---

## Intent
Found under q-008: nothing writes a loaded character back to Firestore. `characterService.updateCharacter` in `src/lib/firestore.service.ts` has no caller, `createCharacter` is the only character write, and `getCharacterStore` in `src/lib/engine.ts` persists the sheet to localStorage under `ch_info`. Every hit point, condition, item and frame changed on Testy's sheet lives in one browser and dies with it, while `setup.md` says Firestore holds what the table shares.

## Scope
`src/lib/engine.ts`, `src/lib/firestore.service.ts`, `src/pages/CharacterPage.svelte`. Not `firestore.rules`, which already allows the owner's update. Runs after 122, which owns the load path, and answers together with 123, which waits on where a dead address is dropped.


## Goal
A change on Testy's sheet reads back after a reload in a second browser, `updateCharacter` has a caller, one slider drag produces one write, and `just gate` is clean.
