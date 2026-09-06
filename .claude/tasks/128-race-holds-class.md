---
id: 128
parent:
depends: []
relations: []
title: The race a character carries is the race picked and never the class
type: bug
status: staged
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: []
created_at: 2026-09-06T19:16:40Z
updated_at: 2026-09-06T19:16:42Z
questions: []
---

## Intent
The 110 walk: Testy's crown reads Gunslinger Gunslinger, the race field holding the class name. `CharacterRacePage.svelte` writes the race in two shapes, `race: { name: selectedRace, type: selectedRace }` at one call and `race: selectedRace` at another, and whether Testy's document was written by a flow that put the class there or the data was edited by hand is unsettled.

## Scope
`src/pages/CharacterRacePage.svelte`, `src/pages/CharacterClassPage.svelte`, `src/lib/characterInfo.ts`, `src/lib/character.types.ts`. Not Firestore data: what Testy's document holds is reported in the summary, not rewritten.

## Order
1. dndcs: create a character through class and race in `just dev` and read what `race` and `class` hold on the document and on the crown.
2. dndcs: the race is written in one shape everywhere and can never receive the class; the two call sites in `CharacterRacePage` agree with `character.types.ts`.
3. dndcs: report in the summary whether Testy's stored race is the class, so the user corrects the document or a later task lets the sheet do it.
4. verify: `just gate`.

## Done when
A character created through the flow shows its class and its race as two different names on the crown, `race` has one shape in `character.types.ts` and both call sites, and `just gate` is clean.

## Summary
