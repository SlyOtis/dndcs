---
id: q-002
task: 109
parent:
relations: []
files: [public/sources/classes/index.json, public/sources/races/index.json]
status: answered
asked_by: worker
created_at: 2026-09-05T15:35:54Z
answered_at: 2026-09-05T15:37:44Z
---

## Question
What supplies the twenty three pieces of catalogue art: SVG emblems authored in the repo's own Ornament idiom, or raster files you drop under public/ yourself?

## Why it blocks
Addressing is settled: a bundled document is static under `public/`, so its art is static beside it and `image` reads `/sources/art/classes/<id>.webp`. `isStoredFile` rejects a plain path, so `StoredImage` renders it straight and nothing touches the Firestore quota. `postFile` is wrong here because a `file:` record is scoped to the uploading user, and a document every player clones cannot depend on one player's subtree.

What is missing is the art itself. There is no raster asset anywhere in the repo, `public/vite.svg` is the only image file, and no class, race, npc or character document carries a populated `image`. `ai.ts` reads images and does not make them, so nothing in the app can generate them. A worker can author SVG, and the repo already draws its whole ornamental vocabulary as inline SVG paths in `Ornament.svelte` and `Sigil.svelte`, so twenty three emblems in that idiom are the one deliverable this session can produce. If the intent was painted portraits, every file and every address written here is thrown away.

## Answer

Author the twenty three pieces as SVG emblems in the repo's own Ornament idiom, under public/sources/art/ and addressed as plain paths. The repo already draws its whole ornamental vocabulary as inline SVG in Ornament.svelte and Sigil.svelte, nothing in the app generates raster art, and an emblem set stays consistent with the gothic language the pages carry.
