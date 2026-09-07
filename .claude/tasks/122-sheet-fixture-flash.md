---
id: 122
parent:
depends: []
relations: [137]
title: The sheet shows nothing until the routed character loads instead of the fixture character
type: bug
status: done
session:
review:
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: [4e9495eaa7e8dc7b9fa48cdbeecb84c6d1345701]
created_at: 2026-09-06T19:12:48Z
updated_at: 2026-09-07T10:53:28Z
questions: []
agent: lcp-worker-122
base: e9863db94b2d0c16886f25e21191702959d4890c
---

## Intent
The 110 walk: the sheet renders the fixture character, Lucky Lars, until the routed character loads. `src/lib/engine.ts` imports `testCharacter` from `character.fixture` and seeds the character store with it, so every sheet opens on a stranger for the length of the Firestore read.

## Scope
`src/lib/engine.ts`, `src/pages/CharacterPage.svelte`. `src/lib/character.fixture.ts` stays: the spec files read it.


## Goal
No frame of Testy's sheet shows Lucky Lars or any fixture value, `character.fixture` is imported from no file under `src/` other than a `*.spec.ts`, and `just gate` is clean.
