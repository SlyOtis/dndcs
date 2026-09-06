---
id: 145
parent:
depends: []
relations: []
title: The hearth is a grid of panels carrying every feature the app has
type: epic
status: blocked
blocked_from: staged
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: []
created_at: 2026-09-06T22:29:21Z
updated_at: 2026-09-06T22:43:42Z
questions: [q-011]
images: []
agent: lcp-worker-145
---

## Intent
The user: the home screen needs to include and support all the new features and be more of a grid, the UI divided in a sensible way based on the panels. `src/pages/MainPage.svelte`, the hearth at `/main`, draws a centred hero and then stacks five `Rail` panels, Characters, Campaigns, Chronicles, Quests and Party, in one flex column, `.hall-rails`. Since it was written the app gained maps, cast, places and encounters on a campaign, a catalog of imported classes, races and documents at `/sources/:kind/:id`, the encounter tracker and the soundboard in the left drawer and the chat in the right. None of it reaches the hearth. The features decided on 2026-09-06 and not yet built, the discover directory, friends, direct chat, shared resources and tags, get no panel here; each adds its own when it lands.

## Scope
`src/pages/MainPage.svelte`, `src/pages/main/**`, and the aggregating reads in `src/lib/firestore.service.ts` with their row types in `src/lib/firestore.types.ts`. Not `src/components/ui/**`, which 139 owns, and not `src/components/ui/Shell.svelte`, which 143 redesigns. The drawers and the bar stay as they are and the page keeps its `nav`, `tools`, `menu` and `chat` snippets.

## Order
1. dndcs: 146 lays the grid.
2. dndcs: 147 and 148 add their panels onto it, one after the other.
3. verify: `just gate`, then `just walk` against `just dev`.

## Done when
146, 147 and 148 are done, and the hearth shows every panel in the grid with no horizontal scroll at the 1280 and 1600 widths the walk shoots.

## Summary
