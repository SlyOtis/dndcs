---
description: The Firestore schema, the campaign store, uploads, and who may read what
paths:
  - "src/lib/firestore.service.ts"
  - "src/lib/firestore.types.ts"
  - "src/lib/storage.service.ts"
  - "firestore.rules"
  - "storage.rules"
---

## Casing

Firestore is snake_case throughout: `display_name`, `photo_url`, `replicate_api_key`, `player_ids`, `character_ids`, `is_active`, `owner_id`, `dm_id`. A camelCase reader is a bug, not a variant.

`Character` nests identity under `info`. `character.info.name`, never `character.name`.

## The campaign is the story

A campaign document holds only its identity, its members and its settings. Everything the party lives through sits in four subcollections under it:

- `sessions` is the log: a number, a title, a play date, a summary, and who was present.
- `quests` carries a state of active, done or abandoned, the NPC who gave it and the place it points at.
- `npcs` is the cast: a role, a disposition, where they are found, a portrait.
- `locations` is every place charted, its kind, and the map and marker that fix its position.

Every record carries a reveal flag, `is_known`, so the DM decides what the party sees. A component filters on it rather than trusting the query.

A map pin holds `record_kind` and `record_id` rather than its own prose. A place is one record whether it is read on the map or in the list. Never duplicate a description onto a pin.

## Reading and writing

`getRecords`, `postRecord`, `putRecord` and `deleteRecord` in `firestore.service.ts` back every campaign subcollection. Add a typed method beside the others, never a second helper.

Verb prefixes are `get`, `post`, `put` and `delete`.

## Uploads

Every upload goes through `postFile` in `src/lib/storage.service.ts` with a scope of `user`, `campaignMap` or `campaignAudio`. It checks the signed in user, the content type and the size limit. Never call `uploadBytes` directly.

Cloud Storage needs a billing account and this project has none, so `postFile` falls back to IndexedDB and returns a `local:` reference. A `local:` file lives in one browser and no other player can see it. Attaching billing moves new uploads to Storage with no code change.

An address held on a document is therefore either a hosted URL or a `local:` reference. Render it with `StoredImage`, never a bare `<img src>`, and remember its scoped CSS needs `:global(img)`.

## Access

`firestore.rules` and `storage.rules` are the access model and both end in a deny. A user owns their profile and their `data` subtree. A character is reachable by its owner, its viewers, its editors, the DM of its campaign, or anyone when `metadata.is_public`. A campaign is reachable by its DM and its `player_ids`, and its subcollections are read by members and written by the DM.

A rule change ships with the code that needs it. `just deploy` pushes both.

`App.svelte` sends an unauthenticated visitor to `/login` for every path outside `/login` and `/signup`.
