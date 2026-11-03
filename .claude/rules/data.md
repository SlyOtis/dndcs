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

A campaign document holds only its identity, its members and its settings. Everything the party lives through sits in five subcollections under it:

- `sessions` is the log: a number, a title, a play date, a summary, and who was present.
- `quests` carries a state of active, done or abandoned, the character who gave it and the place it points at.
- `npcs` is the cast, called **Characters** everywhere a player reads it: a role, a disposition, where they are found, a portrait.
- `locations` is every **Place** charted, its kind, and the map and marker that fix its position.
- `items` is every **Item**: a kind, a rarity, whether it needs attunement, its weight and worth, who holds it and where it lies.

The collection names are the old ones and stay that way; the display names are Characters, Items and Places. `CampaignRecordKind` is the display vocabulary, `'place' | 'character' | 'item' | 'quest' | 'session'`.

Prose on a record is a block document, stored as the JSON that `src/lib/blocks.ts` writes, never as loose markdown. `getDocument` reads a stored string whether it is that JSON or older markdown, so a record written before the editor still opens.

Every record carries the access fields, not a reveal flag. `owner_id` is the uid that made it and is the only one who may write it. `share` is `private`, `campaign`, `party` or `users`; `share_party` names the party when it is one; `share_users` names people who read it whatever `share` says. `is_known` is gone and so is the DM override: a record the owner did not share is hidden from the DM too.

`readers` is the resolved uid list, written by `getReaders` in `resources.ts` at every write. Firestore rules filter nothing, so a list query that a rule would reject is rejected whole; every read is therefore `where('readers', 'array-contains', uid)` and the rule reads the same field. Membership changes do not propagate to `readers` on their own, so a resource is rewritten when the campaign or party it is shared with changes.

A component never filters on access. What the query returns is what the reader may see.

A map pin holds `record_kind` and `record_id` rather than its own prose. A place is one record whether it is read on the map or in the list. Never duplicate a description onto a pin.

## Reading and writing

`getRecords`, `postRecord`, `putRecord` and `deleteRecord` in `firestore.service.ts` back every campaign subcollection. Add a typed method beside the others, never a second helper.

Verb prefixes are `get`, `post`, `put` and `delete`.

## Uploads

Every upload goes through `postFile` in `src/lib/storage.service.ts` with a scope of `user`, `campaignMap` or `campaignAudio`. It checks the signed in user, the content type and the size limit. Never call `uploadBytes` directly.

There is no size limit. The original goes to `media/` on the machine that made it, at full size, and is served by that player's own dev server.

Cloud Storage needs a billing account and this project has none, so `postFile` falls back to a `file:` record in Firestore: `users/{uid}/files/{id}` or `campaigns/{id}/files/{id}`, carrying `name`, `type`, `size`, `etag`, `count` and `owner_id`. The rules that already govern the owner govern the record.

`count` is what the table can see without the owner. An image is re-encoded to 1600px WebP at 0.82 and written as base64 in 500KB pieces under `<path>/chunks/{index}`, so `count` is the number of pieces and anyone may read it. Audio and video have no downscale and would eat the quota, so they carry `count: 0` and reach another player only from the machine that holds them.

Firestore on the free plan is 1 GiB stored and 10 GiB egress a month, and it cannot bill: over quota it refuses, it does not charge. The downscaled floor is what keeps a table inside that, so never write an original to a chunk.

An address held on a document is a hosted URL, a `file:` record, or a `local:` reference left by an older upload. `getFileUrl` tries the local `media/` store first and serves the original when it is there, then IndexedDB, then the floor, which it mirrors into IndexedDB so each browser reads it once. Render it with `StoredImage`, never a bare `<img src>`, and remember its scoped CSS needs `:global(img)`.

`etag` is the version. It comes from the media store, changes when the bytes change, and is what a peer compares to decide whether the copy it holds is stale.

## The swarm

`blocks` on the record is the torrent: the original split at `block_size`, 64KB, each piece hashed SHA-256 and held base64. It describes the original, never the floor, and the record id carries the original extension so the media store answers with the right content type.

`src/lib/swarm.ts` is the mesh. A player joining a campaign takes a seat at `campaigns/{id}/peers/{uid}.{session}` and beats every 20s; a seat unseen for 60s is ignored. Offers, answers and candidates pass through `campaigns/{id}/signals` and are deleted as they are read. The peer with the lower id offers, so a pair connects once. STUN is Google's; there is no TURN, so a pair behind symmetric NAT will not connect and the floor is what they get.

Firestore carries presence and nothing else. Block availability is asked over the data channel, `have?` answered with `have`, `want` answered with a binary frame whose first four bytes are the request id. Every block is checked against its hash before it is kept, and a block that fails is dropped and asked of the next holder, so a bad peer cannot poison a file.

A file with `count: 0` has no floor and the swarm is the only source, so `getFileUrl` waits for it. A file with a floor renders from the floor at once and pulls the original in the background, which lands in `media/` and is what the next load serves. Once a player holds a file they seed it, so the DM is not the only source.

## Access

`firestore.rules` and `storage.rules` are the access model and both end in a deny. A user owns their profile, their `data` subtree and their `files` subtree, and any signed in user reads `files` so a portrait renders at another table. A character is reachable by its owner, its viewers, its editors, the DM of its campaign, or anyone when `metadata.is_public`. A campaign is reachable by its DM and its `player_ids`. Its subcollections are read by anyone in the record's `readers`, created by anyone at the table, and updated or deleted only by `owner_id`. A user's own resources sit at `users/{uid}/{kind}` for the same ten kinds and follow the same rule. A party is its own document at `parties/{id}`, read by its `member_ids` and written by its `owner_id`.

A rule change ships with the code that needs it. `just deploy` pushes both.

`App.svelte` sends an unauthenticated visitor to `/login` for every path outside `/login` and `/signup`.
