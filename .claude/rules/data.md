---
description: The Postgres schema, the claims that decide who reads what, the api the client reaches it through, live events and uploads
paths:
  - "database/**"
  - "internal/**"
  - "cmd/**"
  - "web/src/lib/api.ts"
  - "web/src/lib/firestore.service.ts"
  - "web/src/lib/firestore.types.ts"
  - "web/src/lib/storage.service.ts"
  - "web/src/lib/collab.ts"
  - "web/src/lib/swarm.ts"
---

## Casing

The schema and the api are snake_case throughout: `user_id`, `campaign_id`, `party_ids`, `character_ids`, `is_active`, `is_hidden`, `share_users`, `dm_claim_id`. A camelCase reader is a bug, not a variant.

`Character` nests identity under `info`. `character.info.name`, never `character.name`.

## The tables

`database/base/` holds them, one file per concern, migrated by smig through `database/migrate.yml` after the claimius schema of `samna-auth-middleware`. Every table that holds what a player owns carries the claimius columns (`sa_owner_id`, `sa_created_by`, `sa_created_at`, `sa_updated_at`, `sa_deleted_at`) and ends with `SELECT claimius.upsert_table_info('public.<table>')`, so claims can bind it. `sa_owner_id` is always the Knights of the Cauldron organization, `SERVER_OWNER_ID`. A delete is soft: it sets `sa_deleted_at`.

- `profile`: a player's name, picture, preferences and friends, and `details`, the integration keys.
- `character` and its sources: the sheet as stored data.
- `party`: a party stands on its own, with its `character_ids` and its `member_claim_id`.
- `campaign`: identity, settings, `party_ids`, and the `dm_claim_id` and `player_claim_id` of its table.
- Under a campaign by `campaign_id`: `campaign_map`, `encounter`, `chat_entry`, `song`, and the runtime `peer` and `signal`.
- `resource`: every kind of lore, by `kind`, with `title`, the rest of the page in `fields`, a `campaign_id` when a campaign keeps it, and sub pages through `sa_parent_id` and `sa_root_id`. `resource_update` holds the Yjs updates of live editing.
- `file` and `file_piece`: uploads.
- `catalog_entry`: the shared class and race readings.

`public.prune` ages only the runtime rows, `peer` and `signal`. Application data is never aged.

## The campaign is the story

Everything the party lives through is a `resource` row of one of the ten kinds, held by the campaign through `campaign_id`. A player's own lore is the same row without one. The campaign kinds the table reads:

- `sessions` is the log: a number, a title, a play date, a summary, and who was present.
- `quests` carries a state of active, done or abandoned, the character who gave it and the place it points at.
- `npcs` is the cast, called **Characters** everywhere a player reads it: a role, a disposition, where they are found, a portrait.
- `locations` is every **Place** charted, its kind, and the map and marker that fix its position.
- `items` is every **Item**: a kind, a rarity, whether it needs attunement, its weight and worth, who holds it and where it lies.

The kind names stay as they are; the display names are Characters, Items and Places. `CampaignRecordKind` is the display vocabulary, `'place' | 'character' | 'item' | 'quest' | 'session'`.

Prose on a resource is a block document, stored as the JSON that `web/src/lib/blocks.ts` writes, never as loose markdown. `getDocument` reads a stored string whether it is that JSON or older markdown, so a page written before the editor still opens.

A map pin holds `record_kind` and `record_id` rather than its own prose. A place is one resource whether it is read on the map or in the list. Never duplicate a description onto a pin.

## Claims decide every read and write

There is no rule file and no readers list. Access is a claim bound to the row, granted to the players who hold it, and checked by claimius on every request: a list goes through `sdb.ObjectWhere`, one row through `MutationAccess`, and a create checks EXECUTE on the owner organization, stamps the creator's grant and binds the creator's claim to the new row. A component never filters on access; what the api answers is what the reader may see.

- The creator holds the row through their own grant. Every new row is also bound to the app's Member claim with entry only, so it exists for the organization but grants no read; a public sheet, a profile, the catalog and a player's own files are bound with read.
- A campaign makes two claims. **Dungeon master** holds all, granted to the one who runs it. **Players** holds read, granted when the DM seats a player by their email. Maps and campaign files are bound DM all and Players read; only the DM draws maps.
- A chat entry is bound DM read, and Players read unless `is_hidden`, so a hidden roll reaches the DM alone. Only the author edits or deletes an entry, and the DM cannot delete a player's.
- A party makes **Party members**, read, granted to its members.
- A sheet that joins a campaign is bound DM read and write and Players read, and loses both when it leaves.
- Sharing is `share_users`, `share_campaigns` and `share_parties` on a resource, an encounter or a song. A shared campaign binds its DM and Players claims read, a shared party its Party members claim, and the named players get the row's own **Readers** claim, `reader_claim_id`. Every change reconciles the bindings and the grants in the same transaction. Sharing binds the DM too: a page the owner did not share is hidden from the DM.
- Integration keys in `profile.details` are answered only with write on the profile, which only its owner holds.

A claim, a binding or a grant is made only through the claim helpers in `internal/handler/share.go` and the claim routes, never by SQL against claimius.

## The api

`cmd/main.go` mounts every route under `/api`, behind the Samna Auth user middleware: `/profile`, `/character`, `/party`, `/campaign` with its `map`, `encounter`, `song`, `chat`, `peer` and `signal`, `/resource` with its `update`, `/file`, `/catalog`, and `/claim` with `/:type/:id/claim`. Sign in, the callback, sign out and `/api/auth/me` come from the middleware.

On the web, `web/src/lib/api.ts` holds the fetch envelope, the session and `getStream`. The service objects in `firestore.service.ts` (`userService`, `characterService`, `partyService`, `campaignService`) keep their exported names and call the api; a new read or write is a typed method beside the others, never a second helper.

Function names start with `get`, `post`, `put` or `delete`, in Go and in TypeScript.

## Live events

`internal/broker` is the one event path. A write posts an event after it succeeds: the event goes at once to the streams on the same instance and through `NOTIFY` on `dndcs_event` to the others, and every instance skips the events it sent itself. An event carries a topic, a kind, an id and an op, never a row.

The streams are `/api/campaign/:id/stream`, `/api/profile/stream` and `/api/resource/:id/stream`, server-sent events with a heartbeat and a retry. Opening one needs read like the matching REST read, and every event is checked again before it is sent, so a hidden roll never reaches a player's stream and a signal reaches only its own seat.

On the web a listener (`postChatListener`, `postMapsListener`, `postEncountersListener`, `postSongsListener`, `subscribeToProfile`, the updates in `collab.ts`, the peers and signals in `swarm.ts`) shares one EventSource per stream and reloads through its REST getter on connect and on every event of its kind, so what it shows always matches the api.

## Uploads

Every upload goes through `postFile` in `web/src/lib/storage.service.ts` with a scope of `user`, `campaignMap` or `campaignAudio`. It checks the signed in player, the content type and the size. Never write a file any other way.

A `file` row names its `path`, a `file:` address, with `name`, `type`, `size`, `etag` and `count`. A campaign file's path sits under that campaign's files, and the row is bound to the campaign's claims like the rest of the campaign. `etag` is the version: it changes when the bytes change.

`count` is what the table can see without the owner. An image is re-encoded to 1600px WebP at 0.82 and stored as `file_piece` rows of base64, so `count` is the number of pieces. Audio and video have no downscale and carry `count: 0`.

`blocks` is the original split at `block_size`, each block hashed SHA-256 and held base64, and describes the original, never the floor.

An address held on a row is a hosted URL, a `file:` address, or a `local:` reference left by an older upload. `getFileUrl` resolves it. Render it with `StoredImage`, never a bare `<img src>`, and remember its scoped CSS needs `:global(img)`.

## The swarm

`web/src/lib/swarm.ts` is the mesh that carries originals between players. A player at a campaign takes a seat through `/api/campaign/:id/peer` and beats every 20s, and a seat unseen for 60s is ignored. Offers, answers and candidates pass through `/api/campaign/:id/signal` and are deleted as they are read. The peer with the lower id offers, so a pair connects once. STUN is Google's and there is no TURN, so a pair behind symmetric NAT will not connect and the floor is what they get.

The api carries presence and signals and nothing else. Block availability is asked over the data channel, `have?` answered with `have`, `want` answered with a binary frame whose first four bytes are the request id. Every block is checked against its hash before it is kept, and a block that fails is dropped and asked of the next holder, so a bad peer cannot poison a file.

## Sign in

`App.svelte` sends a visitor without a session to `/login` for every path outside `/login` and `/signup`, and signing in and out go through Samna Auth at `/api/auth/login` and `/api/auth/logout`.
