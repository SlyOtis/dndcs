---
id: 104
parent:
depends: []
relations: []
title: Encounter tracker data model, service and rules
type: feature
status: review
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [data]
commits: [1559f69e070ee53f6c6c80bb4b844080b008d00c, cabc587d3586cd06b16efe187fdfe79ab7bf4375]
created_at: 2026-09-05T15:10:52Z
updated_at: 2026-09-06T19:38:20Z
questions: []
base: 9c6454279d0caeb611188943bc943798452fdb7b
---

## Intent
There is no encounter or initiative model in this repo. `firestore.types.ts` carries campaigns, sessions, quests, NPCs, locations and maps and nothing combat shaped, `COLLECTIONS` names no encounter collection, and `campaignService` has no encounter call. The drawer already shows an honest empty state waiting for one. This task defines the data and its access, and writes no interface.

## Scope
`src/lib/firestore.types.ts`, `src/lib/firestore.service.ts`, `firestore.rules`. No component, no page.

## Order
1. dndcs: define `CampaignEncounter` under a campaign holding combatants with a name, initiative, current and max hit points, conditions and a link to a character or an NPC, plus a round number and a turn pointer. Follow the snake_case and reveal-flag conventions the other campaign records use.
2. dndcs: add the typed methods beside the existing campaign subcollection methods, backed by `getRecords`, `postRecord`, `putRecord` and `deleteRecord`, with a live listener shaped like `postMapsListener`.
3. dndcs: add the rules clause. Members read, the DM writes, and the reveal rule decides what a player sees of an enemy's hit points.
4. verify: `just gate`.

## Done when
`campaignService` exposes encounter reads, writes and a listener; `firestore.rules` covers the path; `just gate` is clean.

## Summary
Commit 1559f69 carried the model, the service methods and the first rules clause. This pass answers the review.

`firestore.rules`: the `match /encounters/{encounterId}` clause and the `part != 'encounters'` exclusion on the generic read are gone. Encounters are read by members and written by the DM through `match /{part}/{recordId}` like sessions, quests, npcs and locations. `is_known` on the encounter and `is_hit_points_known` on each combatant are filtered in the component, per `data.md`, since `getEncounters` and `postEncountersListener` read the whole collection and a rule gated on `resource.data.is_known` denied every player read.

`src/lib/firestore.service.ts`: the `/** */` line above `getCharacterStatus` removed. `src/lib/firestore.types.ts`: the `/** */` line above `CharacterStatus` removed.

`src/lib/firestore.types.ts`: `CombatantKind`, `EncounterCombatant` and `CampaignEncounter` beside the other campaign records. A combatant carries `name`, `kind`, an optional `character_id` or `npc_id`, `initiative`, `hit_points`, `max_hit_points`, `conditions` and `is_hit_points_known`. The encounter carries `title`, `combatants`, `round`, `turn`, `is_active`, `is_known` and the two timestamps. `COLLECTIONS.ENCOUNTERS` is `encounters`.

`src/lib/firestore.service.ts`: `getEncounters`, `postEncounter`, `putEncounter`, `deleteEncounter` and `postEncountersListener` on `campaignService`, backed by `getRecords`, `postRecord`, `putRecord` and `deleteRecord`. `getEncounters` sorts newest first on `created_at`.

### Findings
1559f69 also landed, in the scope files, work the review named as not this task's: `CampaignChatKind`, `CampaignChatEntry`, `COLLECTIONS.CHAT`, `getChatEntries`, `postChatEntry` and `postChatListener` (#101/#102, now read by `src/lib/chat.ts:245`); `CharacterStatus`, `metadata.status`, `getCharacterStatus` and the status stamping in `createCharacter` and `getUserCharacters` (now read by `src/pages/main/CharactersPanel.svelte:54`); `putUserSecrets` (now called by `src/pages/UserPage.svelte:70`) and the drop of `replicate_api_key` from `UserProfile`, the key living on `users/{uid}/data/details` as `auth.service.ts:31` and `putUserSecrets` write it. Every one of these is depended on by code that landed after, so none is reverted here; they are claimed as landed in 1559f69.

Firestore cannot withhold a field on read, so per-combatant hit point concealment is `is_hit_points_known` on the record and the component honours it, the same way `is_known` is filtered in the UI today.

`task.sh scope 104` does not see `firestore.rules`: `scope_of` matches only tokens containing a `/`, so a repository root file named under `## Scope` is never staged by `land`. It was staged by hand for both commits.

`task.sh land` appends ` #<id>` to every message, so a `#104: <description>` message lands as `#104: <description> #104`, the same shape as #123, #124 and #125 on this branch.

`just build` prints the chunk size warning on `index-*.js` at 635 kB; it predates this task.
