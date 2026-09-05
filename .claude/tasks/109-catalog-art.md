---
id: 109
parent:
depends: []
relations: [107]
title: Artwork for every class and race document
type: task
status: doing
blocked_from: doing
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [data]
commits: []
created_at: 2026-09-05T15:10:52Z
updated_at: 2026-09-05T15:37:45Z
questions: [q-002]
base: 0f6e45333d959e86ef1651000b211c9a4a6b78f0
---

## Intent
Every class and race document carries `image: ""`. The field, the rendering and the fallbacks are wired: `CatalogList` shows a portrait per row and `SourcePage` a large one, both falling back to the initial or the crest. There is no artwork, and none should be invented as a path that resolves to nothing.

## Scope
`public/sources/classes/*.json`, `public/sources/races/*.json`, and wherever the art is stored. Not the components, which already read the field.

## Order
1. dndcs: decide where catalogue art lives and how it is addressed, given `postFile` writes a `file:` record and the bundled documents are static under `public/`.
2. dndcs: set `image` on each document to an address that resolves.
3. verify: every row in the class and race pickers shows art rather than an initial.

## Done when
No class or race document carries an empty `image`, and no portrait falls back to its initial in either picker.

## Summary
