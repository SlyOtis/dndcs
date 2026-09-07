---
id: 128
parent:
depends: []
relations: []
title: The race a character carries is the race picked and never the class
type: bug
status: done
session:
review:
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: [1191b8c978537c27757e54ca7cc1530595d54a94]
created_at: 2026-09-06T19:16:40Z
updated_at: 2026-09-07T10:53:29Z
questions: []
base: bc7e2dd83666a57d992c24497743477eb1697605
---

## Intent
The 110 walk: Testy's crown reads Gunslinger Gunslinger, the race field holding the class name. `CharacterRacePage.svelte` writes the race in two shapes, `race: { name: selectedRace, type: selectedRace }` at one call and `race: selectedRace` at another, and whether Testy's document was written by a flow that put the class there or the data was edited by hand is unsettled.

## Scope
`src/pages/CharacterRacePage.svelte`, `src/pages/CharacterClassPage.svelte`, `src/lib/characterInfo.ts`, `src/lib/character.types.ts`. Not Firestore data: what Testy's document holds is reported in the summary, not rewritten.

## Findings
Testy `qVjjQHfduthuXT9jKjtv` was written by the flow, not by hand: created 2026-09-04 with tags `ai-generated, sources-uploaded`, one source, `data/details.selectedRace` "Gunslinger", `info.race` `{ name: "Gunslinger", type: "Gunslinger" }` which is exactly the old `{ name: selectedRace, type: selectedRace }` write, and `metadata.race` "Gunslinger". The class Gunslinger is not a Player's Handbook class, so the old page appended it to the race list from the AI reading and it was picked or suggested there. The document still holds it; correct `character.info.race` and `metadata.race` by hand or let a later task do it from the sheet.

A second Testy on the hearth reads "Level 2 Unknown Cleric": its class is Unknown and its race Cleric, the same defect from an earlier run.

After Continue on the race page the sheet rendered with the new character while `location.pathname` read `/main/create/character`; a direct visit to `/character/<id>` stays on the sheet. Outside scope, not changed.

`just build` prints the rolldown chunk size warning for the main bundle; it is not from this change.

The dev server on 5173 answers 504 "Outdated Optimize Dep" for every module because `just build` removes `node_modules/.vite` under it; it needs a restart. Measurement ran on a second `vite --port 5174`, since stopped.

### Tested
`just gate` clean: svelte-check 88 files 0 errors 0 warnings, vitest 168 passed in 8 files, `vite build` succeeded. The rolldown chunk size advisory is the build tool's, unchanged by this task.

The flow was run in the browser on a second `vite --port 5199`, since stopped, because `just gate`'s build removes `node_modules/.vite` under the dev server on 5173 and every module there answers 504 until it restarts. Kin128 created through class Gunslinger then race Tiefling: the race catalog offered the nine core races and "Define your own" and no Gunslinger row, the crown read "Gunslinger Tiefling", and the stored document holds `metadata.class` Gunslinger, `metadata.race` Tiefling, `info.race` `{ name: Tiefling, type: Unknown }`, details `abilityScores, attributes, creationMethod`. Reopening `/character/8RB7duE1JsbQ5OuALMZk` from the hearth read the same crown off the persisted document. That id is a test character and can be deleted.

Coverage: `test/walk.sh` gains an assertion on the race catalog that no row carries a name the classes index names, which is the original symptom, Gunslinger offered as a race. Verified against the live race page, no strays. The file also carries another session's in-flight edits, so it is left uncommitted here.

`location.pathname` still reads `/main/create/character` while the sheet renders after Continue, as the worker reported. Outside scope.

## Goal
A character created through the flow shows its class and its race as two different names on the crown, `race` has one shape in `character.types.ts` and both call sites, and `just gate` is clean.
