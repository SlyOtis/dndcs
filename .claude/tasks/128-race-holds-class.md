---
id: 128
parent:
depends: []
relations: []
title: The race a character carries is the race picked and never the class
type: bug
status: testing
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: [1191b8c978537c27757e54ca7cc1530595d54a94]
created_at: 2026-09-06T19:16:40Z
updated_at: 2026-09-06T19:38:57Z
questions: []
base: bc7e2dd83666a57d992c24497743477eb1697605
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
`src/pages/CharacterRacePage.svelte` is the only file changed. The race page no longer calls `aiService.analyzeCharacterSources` and no longer pushes the `classes` that call returns into `availableRaces`, which was the path by which a class name became a pickable race. `suggestedRace` is a `$derived` that drops a suggestion equal to `selectedClass`, and `getRaces` replaces `analyzeCharacterSources` with the catalog load and the suggestion match alone. The race is written once, as `RaceInfo` `{ name: selectedRace, type: "Unknown" }` on `character.info`; the `name`, `level`, `class` and `race` overrides on the `createCharacter` metadata argument are gone since `createCharacter` derives `metadata.class` and `metadata.race` from `info`, and `selectedClass` and `selectedRace` are no longer written to `data/details`. The loading note reads "Reading the races…" since the page reads no material.

`CharacterClassPage.svelte`, `characterInfo.ts` and `character.types.ts` needed no change: `RaceInfo` already is `{ name, type }` and `getCharacterRace` reads `race.name`.

Measured on `just dev`: creating Walk128 through Gunslinger then Dwarf gives a document with `metadata.class` Gunslinger, `metadata.race` Dwarf, `info.race` `{ name: Dwarf, type: Unknown }`, details holding only `abilityScores`, `attributes` and `creationMethod`, and a crown reading "Gunslinger Dwarf". Document `g4BJp7i8vcY7sjjSZgQl` is that test character and can be deleted.

### Findings
Testy `qVjjQHfduthuXT9jKjtv` was written by the flow, not by hand: created 2026-09-04 with tags `ai-generated, sources-uploaded`, one source, `data/details.selectedRace` "Gunslinger", `info.race` `{ name: "Gunslinger", type: "Gunslinger" }` which is exactly the old `{ name: selectedRace, type: selectedRace }` write, and `metadata.race` "Gunslinger". The class Gunslinger is not a Player's Handbook class, so the old page appended it to the race list from the AI reading and it was picked or suggested there. The document still holds it; correct `character.info.race` and `metadata.race` by hand or let a later task do it from the sheet.

A second Testy on the hearth reads "Level 2 Unknown Cleric": its class is Unknown and its race Cleric, the same defect from an earlier run.

After Continue on the race page the sheet rendered with the new character while `location.pathname` read `/main/create/character`; a direct visit to `/character/<id>` stays on the sheet. Outside scope, not changed.

`just build` prints the rolldown chunk size warning for the main bundle; it is not from this change.

The dev server on 5173 answers 504 "Outdated Optimize Dep" for every module because `just build` removes `node_modules/.vite` under it; it needs a restart. Measurement ran on a second `vite --port 5174`, since stopped.
