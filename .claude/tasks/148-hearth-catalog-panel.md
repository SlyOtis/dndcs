---
id: 148
parent: 145
depends: [146]
relations: []
title: The hearth carries a Catalog panel listing the imported classes, races and documents
type: task
status: staged
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: []
created_at: 2026-09-06T22:29:21Z
updated_at: 2026-09-06T22:31:15Z
questions: []
images: []
---

## Intent
`src/lib/catalog.ts` holds the imported classes, races and documents, `src/components/CatalogList.svelte` lists one kind, and `SourcePage` shows one entry at `/sources/:kind/:id`. The only way to any of it is the class and race pick pages inside character creation. The hearth gets a Catalog panel: the kinds with their counts, the most recent entries, and a row that opens `/sources/:kind/:id`.

## Scope
One new file under `src/pages/main/`, `src/pages/MainPage.svelte` to place it, and `src/lib/catalog.ts` only if a read of the recent entries across kinds does not already exist there. Not `CatalogList.svelte` beyond reuse, not `SourcePage.svelte`, not the import dialog, which stays where it is. Runs after 146 and never beside 147, which shares its parent.

## Order
1. dndcs: `CatalogPanel` under `src/pages/main/`, shaped like `CampaignsPanel`, reading through `$lib/catalog`; a row opens `/sources/:kind/:id` for its entry; the panel carries no import action.
2. dndcs: `MainPage.svelte` places it in its grid area.
3. verify: `just gate`, then `just walk` against `just dev`.

## Done when
With classes and races imported, the hearth lists them under Catalog with a count per kind, a click lands on `/sources/:kind/:id` for that entry, and `just gate` is clean.

## Summary
