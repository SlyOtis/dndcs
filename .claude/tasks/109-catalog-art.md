---
id: 109
parent:
depends: []
relations: [107]
title: Artwork for every class and race document
type: task
status: done
session:
review:
blocked_from: doing
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [data]
commits: [539945d55c41379ec57eed1f4020fa3e91d19ad3]
created_at: 2026-09-05T15:10:52Z
updated_at: 2026-09-07T10:53:26Z
questions: [q-002]
base: 0f6e45333d959e86ef1651000b211c9a4a6b78f0
---

## Intent
Every class and race document carries `image: ""`. The field, the rendering and the fallbacks are wired: `CatalogList` shows a portrait per row and `SourcePage` a large one, both falling back to the initial or the crest. There is no artwork, and none should be invented as a path that resolves to nothing.

## Scope
`public/sources/classes/*.json`, `public/sources/races/*.json`, and `public/sources/art/`, where q-002 settled that the art is stored. Not the components, which already read the field.

## Findings
Every emblem is one 96x128 frame: a `ground` gradient rect, the two lancet arch strokes and the base line in `#6d5717`, then the device. The palette is the default theme baked in, `#c9a227` metal, `#2f8f7d` verdigris, `#ff8a3d` ember, because `StoredImage` renders a plain path through `<img src>` and an SVG loaded that way sees neither the page's CSS custom properties nor `currentColor`. An emblem therefore does not follow a theme switch; matching `Ornament.svelte` would mean inlining the vectors into a component, which is outside this scope.

`isStoredFile` rejects a plain path, so `StoredImage` sets `resolved` to the address directly and nothing reaches Firestore or IndexedDB for these. The files are copied verbatim into `dist/sources/art/` by the public asset pass, so a hosted visitor gets them too.

`getCatalogFacts` and both pickers were untouched; `CatalogList` already branches on `entry.image` and the initial fallback is now unreachable for a bundled document.

Outside `## Scope`: `src/lib/characterInfo.ts:116` falls back to `/default-character.png`, which does not exist under `public/`. Unrelated to the catalogue, but that address resolves to nothing.

## Goal
No class or race document carries an empty `image`, and no portrait falls back to its initial in either picker.
