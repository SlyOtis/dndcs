---
id: 147
parent: 145
depends: [146]
relations: []
title: The hearth carries Maps, Cast, Places and Encounters panels drawn across the user's campaigns
type: task
status: staged
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [data, components]
commits: []
created_at: 2026-09-06T22:29:21Z
updated_at: 2026-09-06T22:31:15Z
questions: []
images: []
---

## Intent
A campaign holds maps, npcs, locations and encounters, read by `getMaps`, `getNpcs`, `getLocations` and `getEncounters` on `campaignService` in `src/lib/firestore.service.ts`, each per campaign id and shown only on `CampaignPage`. The hearth already aggregates sessions, quests and party across the user's campaigns with `getRecentSessions`, `getActiveQuests` and `getPartyMembers`: a `Promise.all` over the campaigns that stamps `campaign_id` and `campaign_name` onto each row. Maps, Cast, Places and Encounters get the same: one aggregating read each and one panel each on the grid 146 lays.

## Scope
`src/lib/firestore.service.ts` and `src/lib/firestore.types.ts` for the four reads and their row types beside `CampaignChronicle` and `CampaignErrand`; four new files under `src/pages/main/`; `src/pages/MainPage.svelte` to load and place them. Not `src/components/campaign/**`, not `firestore.rules`: the reads use the campaign membership already granted. Runs after 146 and never beside 148, which shares its parent.

## Order
1. dndcs: the four reads on `campaignService`, shaped like `getRecentSessions`, with their row types in `firestore.types.ts`.
2. dndcs: `MapsPanel`, `CastPanel`, `PlacesPanel` and `EncountersPanel` under `src/pages/main/`, shaped like `ChroniclesPanel`. A row names its campaign and opens `/campaign/:id`; an encounter row carries its combatant count; each empty string in the hearth's voice.
3. dndcs: `MainPage.svelte` loads the four inside the existing `Promise.all` and places each in its grid area.
4. verify: `just gate`, then `just walk` against `just dev`.

## Done when
With a campaign carrying at least one map, npc, location and encounter, the hearth shows each in its panel under the campaign's name; a campaign with none shows the four empty states; `just gate` is clean.

## Summary
