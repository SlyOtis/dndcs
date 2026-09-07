---
id: 104
parent:
depends: []
relations: []
title: Encounter tracker data model, service and rules
type: feature
status: done
session:
review:
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [data]
commits: [1559f69e070ee53f6c6c80bb4b844080b008d00c, cabc587d3586cd06b16efe187fdfe79ab7bf4375]
created_at: 2026-09-05T15:10:52Z
updated_at: 2026-09-07T10:53:24Z
questions: []
base: 9c6454279d0caeb611188943bc943798452fdb7b
---

## Intent
There is no encounter or initiative model in this repo. `firestore.types.ts` carries campaigns, sessions, quests, NPCs, locations and maps and nothing combat shaped, `COLLECTIONS` names no encounter collection, and `campaignService` has no encounter call. The drawer already shows an honest empty state waiting for one. This task defines the data and its access, and writes no interface.

## Scope
`src/lib/firestore.types.ts`, `src/lib/firestore.service.ts`, `firestore.rules`. No component, no page.

## Findings
1559f69 also landed, in the scope files, work the review named as not this task's: `CampaignChatKind`, `CampaignChatEntry`, `COLLECTIONS.CHAT`, `getChatEntries`, `postChatEntry` and `postChatListener` (#101/#102, now read by `src/lib/chat.ts:245`); `CharacterStatus`, `metadata.status`, `getCharacterStatus` and the status stamping in `createCharacter` and `getUserCharacters` (now read by `src/pages/main/CharactersPanel.svelte:54`); `putUserSecrets` (now called by `src/pages/UserPage.svelte:70`) and the drop of `replicate_api_key` from `UserProfile`, the key living on `users/{uid}/data/details` as `auth.service.ts:31` and `putUserSecrets` write it. Every one of these is depended on by code that landed after, so none is reverted here; they are claimed as landed in 1559f69.

Firestore cannot withhold a field on read, so per-combatant hit point concealment is `is_hit_points_known` on the record and the component honours it, the same way `is_known` is filtered in the UI today.

`task.sh scope 104` does not see `firestore.rules`: `scope_of` matches only tokens containing a `/`, so a repository root file named under `## Scope` is never staged by `land`. It was staged by hand for both commits.

`task.sh land` appends ` #<id>` to every message, so a `#104: <description>` message lands as `#104: <description> #104`, the same shape as #123, #124 and #125 on this branch.

`just build` prints the chunk size warning on `index-*.js` at 635 kB; it predates this task.

## Goal
`campaignService` exposes encounter reads, writes and a listener; `firestore.rules` covers the path; `just gate` is clean.
