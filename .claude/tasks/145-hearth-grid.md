---
id: 145
parent:
depends: [106]
relations: []
title: The hearth is a grid of panels carrying every feature the app has
type: task
status: staged
blocked_from: draft
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [data, components]
commits: []
created_at: 2026-09-06T22:29:21Z
updated_at: 2026-09-07T08:29:13Z
questions: [q-011]
images: []
agent: lcp-worker-145
---

## Intent
The user: the home screen needs to include and support all the new features and be more of a grid, the UI divided in a sensible way based on the panels. `src/pages/MainPage.svelte`, the hearth at `/main`, draws a centred hero and then stacks five `Rail` panels, Characters, Campaigns, Chronicles, Quests and Party, in one flex column, `.hall-rails`; each rail scrolls its own track sideways and a hearth with two characters is a long page of mostly empty rails. Since it was written the app gained maps, cast, places and encounters on a campaign, read by `getMaps`, `getNpcs`, `getLocations` and `getEncounters` on `campaignService` and shown only on `CampaignPage`, and a catalog of imported classes, races and documents in `src/lib/catalog.ts`, listed by `CatalogList.svelte` and shown at `/sources/:kind/:id`, reachable only from the class and race pick steps. None of it reaches the hearth. The features decided on 2026-09-06 and not built, the discover directory, friends, direct chat, shared resources and tags, get no panel here; each adds its own when it lands. Worked as one task by the answer to q-011.

## Scope
`src/pages/MainPage.svelte`; `src/pages/main/**`, the five panels and the five new ones; `src/lib/firestore.service.ts` and `src/lib/firestore.types.ts` for the four aggregating reads and their row types; `src/lib/catalog.ts` only if no read of the recent entries across kinds exists. Not `src/components/ui/**`, which 139 owns, not `src/components/ui/Shell.svelte`, which 143 redesigns, not `src/components/campaign/**`, not `firestore.rules`. The drawers and the bar stay and the page keeps its `nav`, `tools`, `menu` and `chat` snippets. Runs after 106, which carries the gothic language onto this page.

## Order
1. dndcs: read the images under `docs/inspiration/` for how a fantasy screen divides its ground before changing anything.
2. dndcs: four reads on `campaignService` shaped like `getRecentSessions`, a `Promise.all` over the campaigns stamping `campaign_id` and `campaign_name` onto each row, with row types beside `CampaignChronicle` and `CampaignErrand`.
3. dndcs: `MapsPanel`, `CastPanel`, `PlacesPanel` and `EncountersPanel` under `src/pages/main/` shaped like `ChroniclesPanel`; a row names its campaign and opens `/campaign/:id`, an encounter row carries its combatant count. `CatalogPanel` shaped like `CampaignsPanel`, reading through `$lib/catalog`, a count per kind, a row opening `/sources/:kind/:id`, no import action. Each empty string in the hearth's voice.
4. dndcs: replace `.hall-rails` with one grid on `MainPage.svelte` whose areas are named per panel, the hero one area among them. Characters and Campaigns are the primary areas, the rest secondary, spans following that. A panel in a column area stacks its entries; one in a row area keeps the sideways track, `Panel` or `Rail` from `src/components/ui/` as the frame. Columns collapse with width through the `minmax(min(var(--col), 100%), 1fr)` pattern the pages carry, `min-width: 0` on every track, no literal colour, no pixel size, page variables over `--space-*`.
5. dndcs: the existing `Promise.all` in `MainPage.svelte` loads the five new panels beside the three it has.
6. verify: `just gate`, then `just walk` against `just dev` and read the hearth shots.

## Done when
`just gate` is clean. With a campaign carrying at least one map, npc, location and encounter and classes and races imported, the hearth shots the walk takes at 1280 and 1600 show the hero and all ten panels in the grid, no empty column, no horizontal scroll, each campaign row under its campaign's name and the catalog counts per kind. A campaign with none shows the empty states.

## Summary
