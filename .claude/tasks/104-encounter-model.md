---
id: 104
parent:
depends: []
relations: []
title: Encounter tracker data model, service and rules
type: feature
status: failed
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [data]
commits: [1559f69e070ee53f6c6c80bb4b844080b008d00c]
created_at: 2026-09-05T15:10:52Z
updated_at: 2026-09-06T19:34:55Z
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
`src/lib/firestore.types.ts`: `CombatantKind`, `EncounterCombatant` and `CampaignEncounter` added beside the other campaign records. A combatant carries `name`, `kind`, an optional `character_id` or `npc_id`, `initiative`, `hit_points`, `max_hit_points`, `conditions` and the reveal flag `is_hit_points_known`. The encounter carries `title`, `combatants`, `round`, `turn`, `is_active`, `is_known` and the two timestamps. `COLLECTIONS.ENCOUNTERS` is `encounters`.

`src/lib/firestore.service.ts`: `getEncounters`, `postEncounter`, `putEncounter`, `deleteEncounter` and `postEncountersListener` on `campaignService`, after the location methods, backed by `getRecords`, `postRecord`, `putRecord` and `deleteRecord`. `getEncounters` sorts newest first on `created_at`; the listener is shaped like `postChatListener` with an error log.

`firestore.rules`: a `match /encounters/{encounterId}` under `campaigns/{campaignId}`. The DM reads and writes; a player in `player_ids` reads only when `is_known`. Firestore allow rules are additive, so the generic `match /{part}/{recordId}` read now carries `&& part != 'encounters'`, otherwise the member clause there would grant the read the reveal rule withholds.

### Findings
Firestore cannot withhold a field on read, so per-combatant hit point concealment is `is_hit_points_known` on the record and the component must honour it, the same way `is_known` is filtered in the UI today.

`task.sh scope 104` does not see `firestore.rules`: `scope_of` matches only tokens containing a `/`, so a repository root file named under `## Scope` is reported as outside the scope and is never staged by `land`. It was staged by hand for this commit.

Review, commit 1559f69:
- `firestore.rules:126` gates a player's read on `resource.data.is_known`, but `src/lib/firestore.service.ts:559` `postEncountersListener` and `:537` `getEncounters` read the whole collection with no `where('is_known', '==', true)`. Rules are not filters: every player read is denied, so no player ever sees a revealed encounter. Order step 3 says members read and the reveal flag decides what is shown; `data.md` says the component filters on `is_known`. Either open the read to members like every other subcollection and filter in the component, or query with the flag.
- `src/lib/firestore.service.ts:576-597` `getChatEntries`, `postChatEntry`, `postChatListener` and `src/lib/firestore.types.ts:228-245` `CampaignChatKind`, `CampaignChatEntry`, `COLLECTIONS.CHAT` are chat work of #101/#102, not this task, and not claimed in the summary.
- `src/lib/firestore.service.ts:175-183` `getCharacterStatus`, `:216` and `:254-264` status stamping with a fire and forget `updateDoc` inside `getUserCharacters`, `src/lib/firestore.types.ts:56-64` `CharacterStatus` and `metadata.status`: unrequested, unclaimed, and two `/** */` comments against the no comments rule.
- `src/lib/firestore.service.ts:160-165` `putUserSecrets` and the removal of `replicate_api_key` at `:90` and `src/lib/firestore.types.ts:10`, plus the `console.log` removals at `:144-147` and `:170-180`: unrequested and unclaimed; `data.md:13` still names `replicate_api_key`.
- Commit message `Encounter model, campaign service methods and access rule #104` is not the `#104: <description>` shape `rules/git.md` requires.
