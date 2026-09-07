---
id: 145
parent:
depends: [106]
relations: []
title: The hearth is a grid of panels carrying every feature the app has
type: task
status: review
session:
review: held
blocked_from: review
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [data, components]
commits: [a51974329a0f6713779f6b1072680012c6283176, 059fe25cbf8b7bad468a1c64dea917eb10710ddd, c91c66d01310d9f07d6d7ccbcd79116cbd6acbf1, b66342d126a9ce53fde5c61c349b909fd98c6f8a]
created_at: 2026-09-06T22:29:21Z
updated_at: 2026-09-07T13:34:42Z
questions: [q-011, q-017]
images: [145/page-2026-09-07t10-41-32-325z.png, 145/page-2026-09-07t10-44-37-964z.png]
agent: af4354b045527bd4f
base: f50c87eaeef442649bb505d162a07bbf08928f33
---

## Intent
The user: the home screen needs to include and support all the new features and be more of a grid, the UI divided in a sensible way based on the panels. `src/pages/MainPage.svelte`, the hearth at `/main`, draws a centred hero and then stacks five `Rail` panels, Characters, Campaigns, Chronicles, Quests and Party, in one flex column, `.hall-rails`; each rail scrolls its own track sideways and a hearth with two characters is a long page of mostly empty rails. Since it was written the app gained maps, cast, places and encounters on a campaign, read by `getMaps`, `getNpcs`, `getLocations` and `getEncounters` on `campaignService` and shown only on `CampaignPage`, and a catalog of imported classes, races and documents in `src/lib/catalog.ts`, listed by `CatalogList.svelte` and shown at `/sources/:kind/:id`, reachable only from the class and race pick steps. None of it reaches the hearth. The features decided on 2026-09-06 and not built, the discover directory, friends, direct chat, shared resources and tags, get no panel here; each adds its own when it lands. Worked as one task by the answer to q-011.

## Scope
`src/pages/MainPage.svelte`; `src/pages/main`, the five panels and the five new ones; `src/lib/firestore.service.ts` and `src/lib/firestore.types.ts` for the four aggregating reads and their row types; `src/lib/catalog.ts` only if no read of the recent entries across kinds exists. Not `src/components/ui/**`, which 139 owns, not `src/components/ui/Shell.svelte`, which 143 redesigns, not `src/components/campaign/**`, not `firestore.rules`. The drawers and the bar stay and the page keeps its `nav`, `tools`, `menu` and `chat` snippets. Runs after 106, which carries the gothic language onto this page.


## Goal
`just gate` is clean. With a campaign carrying at least one map, npc, location and encounter and classes and races imported, the hearth shots the walk takes at 1280 and 1600 show the hero and all ten panels in the grid, no empty column, no horizontal scroll, each campaign row under its campaign's name and the catalog counts per kind. A campaign with none shows the empty states.
