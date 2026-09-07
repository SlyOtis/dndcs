---
id: q-008
task: 123
parent:
relations: []
files: [src/lib/firestore.service.ts, src/lib/engine.ts]
status: done
asked_by: worker
created_at: 2026-09-06T21:37:25Z
answered_at: 2026-09-06T22:55:32Z
session:
question: Where should a character's dead blob: imageUrl be dropped, given no code writes a loaded character back to Firestore: characterService.updateCharacter in src/lib/firestore.service.ts has no caller and engine.ts persists the sheet to localStorage only. A scrub on read in getCharacter and getUserCharacters, an updateDoc on read that rewrites the three documents, or leave them carrying blob: and rendering the fallback?
why: `## Order` 2 says the next save of the character drops the dead address, and `## Scope` names no file that saves a character. `src/lib/characterInfo.ts` and `src/components/CharacterInfo.svelte` are imported by nothing; the only Firestore write of a character is `createCharacter`, and `updateCharacter` has no caller. Dropping the address needs a write in `src/lib/firestore.service.ts` or `src/lib/engine.ts`, both outside scope, and which of a scrub on read, a rewrite of the three documents, or nothing is a choice on live data the worker cannot make alone.
answer: Both. getCharacter and getUserCharacters scrub a blob: imageUrl from the character they return so the render is correct on the first read, and the same read writes the field away with updateDoc so the three live documents are cleaned once and never carry the dead address again.
updated_at: 2026-09-07T12:39:08Z
---
