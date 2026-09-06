---
id: 101
parent:
depends: []
relations: []
title: Ship the campaign chat rules so the shared roll log works
type: task
status: review
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [data]
commits: [2ad16c4a38130762ec928e9b48c66159fa5ae3db]
created_at: 2026-09-05T15:10:51Z
updated_at: 2026-09-06T19:36:20Z
questions: []
own: [firestore.rules]
base: 9c6454279d0caeb611188943bc943798452fdb7b
---

## Intent
The shared campaign chat and roll log was built against `campaigns/{id}/chat` but the rules that permit it have never reached the project. Until they do, every write is denied and the table sees nothing. `data.md` requires a rule change to ship with the code that needs it, so this closes a change that is already in the tree.

## Scope
`firestore.rules` only. No source. The chat match and the `part != 'chat'` guard on the generic campaign block are already written; this task ships them and proves the path.

## Order
1. dndcs: confirm the chat match and the amended generic write rule are present in `firestore.rules`.
2. dndcs: `just rules`.
3. verify: sign in as two accounts in one campaign, roll on each, confirm both entries appear for both.

## Done when
`just rules` reports the rules released, and a roll made by one member appears in the other member's log without a reload.

## Summary
`firestore.rules`, one commit `2ad16c4`, 52 lines added and one changed, deployed to `dndcs-420` by `just rules`: rules compiled, `firestore.rules` released to cloud.firestore, indexes deployed. No source touched.

Each block the commit lands and what it permits:

- `users/{userId}/files/{document=**}` (31-34): any signed in user reads, the owner writes. The `file:` record and its chunks for a portrait, per `data.md` Uploads.
- `campaigns/{campaignId}/files/{fileId}/{document=**}` (81-88): the DM and `player_ids` read, the DM writes. Campaign maps and audio as `file:` records.
- `campaigns/{campaignId}/peers/{peerId}` (90-98): members read; a member writes only the seat whose id before the first `.` is their own uid. The swarm presence in `src/lib/swarm.ts`.
- `campaigns/{campaignId}/signals/{signalId}` (100-108): members read and delete; a member creates only when `from` before the first `.` is their own uid. WebRTC offers, answers and candidates.
- `campaigns/{campaignId}/chat/{entryId}` (110-118): members read; a member creates only when `author_id == uid()`; update and delete are the author's alone. The shared roll log.
- `campaigns/{campaignId}/{part}/{recordId}` write (131): `&& part != 'chat'`. Firestore allows are additive, so without the guard the DM could write any chat entry, including another author's, through the generic match; the guard removes that path so the chat match alone decides chat writes.
- `catalog/{kind}/entries/{entryId}` (137-141): any signed in user reads; the owner named in `owner_id` creates, updates and deletes. The shared catalog in `src/lib/catalog.ts`.

The four blocks beyond chat were in the working tree when the task was taken, uncommitted rules for `storage.service.ts`, `swarm.ts` and `catalog.ts`, and shipped with this commit because `data.md` requires a rule to ship with the code that needs it.

### Findings
`task.sh scope` finds no path in a `## Scope` that names a repo-root file, because `scope_of` matches only strings containing a slash. `own: [firestore.rules]` in the frontmatter is what makes `land` and `diff` see this task's one file.

Order step 3, two accounts rolling in one campaign, is the interactive proof in `## Done when` and is left to the tester; it cannot be run from this session.

`firestore.rules` gained `campaigns/{campaignId}/encounters/{encounterId}` and `part != 'encounters'` on the generic read in `1559f69` (#104) after this commit; neither is this task's.
