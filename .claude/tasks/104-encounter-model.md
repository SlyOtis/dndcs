---
id: 104
parent:
depends: []
relations: []
title: Encounter tracker data model, service and rules
type: feature
status: staged
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [data]
commits: []
created_at: 2026-09-05T15:10:52Z
updated_at: 2026-09-05T15:10:52Z
questions: []
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
