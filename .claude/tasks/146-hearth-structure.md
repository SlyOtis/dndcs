---
id: 146
parent:
depends: [142]
relations: []
title: The hearth follows the app's structure with panels of differing focus and size, no header plates, no party and nothing scrolling sideways or clipped
type: task
status: doing
session:
review:
blocked_from: staged
github:
assignee: Martin Ottersland
scope: [src/pages/MainPage.svelte, src/pages/main, src/components/ui/Rail.svelte, src/lib/firestore.service.ts, src/lib/firestore.types.ts, firestore.rules, test/walk.sh, test/sigils.spec.ts]
repos: [dndcs]
skills: []
commits: []
created_at: 2026-09-07T17:00:04Z
updated_at: 2026-09-07T19:40:53Z
questions: [q-018, q-019, q-020]
images: [146/1.png, 146/hearth-1280.png, 146/hearth-1600.png]
base: 157495815d817cd284ddb31363f199cac3b63301
---

## Intent
The user, on the hearth 145 landed, with the shot in `146/1.png`: it is an even grid in a structure that makes no sense, every header is broken and should not be there, the cards are broken, horizontal scroll is back, and the content is not even viewable. The panels must differ in focus and size and the page must follow how the app is structured. The layout the user wants: a friends list along one side, campaigns on the left laid horizontally, characters as a grid, then a Lore section that is one list with dividers gathering quests, chronicles, maps, characters, places and encounters. Party is not a thing outside a campaign, cast is not a thing and catalog is not a thing on the hearth. `src/pages/MainPage.svelte` lays `.hall-grid` as four equal tracks with two rows of four equal cells under a two by two split of Characters and Campaigns, so the ten panels read as one flat grid of tiles regardless of what they hold. `CharactersPanel.svelte` and `CampaignsPanel.svelte` are the only users of `Rail.svelte`, whose `.dnd-rail-track` scrolls sideways and whose `.dnd-rail-head` carries the crest, the count note, the rule, the search, a sigil and the two step arrows; the third character card is cut at the cell edge. The eight others sit in `Panel.svelte`, whose `.dnd-panelbox-head` is the cusped plate the user is calling out, and whose body scrolls inside a cell of `--hall-run`, so the catalog shows one and a half of twenty three rows. Nothing in the code holds a friend: `UserProfile` in `src/lib/firestore.types.ts` carries uid, email, display name, photo and preferences, and no read in `src/lib/firestore.service.ts` returns other users.

## Scope
`src/pages/MainPage.svelte`, `.hall-grid`, its areas, tracks and the media query, and the reads it gathers; `src/pages/main/**`, where `CampaignsPanel.svelte` and `CharactersPanel.svelte` stay, `ChroniclesPanel.svelte`, `QuestsPanel.svelte`, `MapsPanel.svelte`, `PlacesPanel.svelte` and `EncountersPanel.svelte` fold into the one Lore list, and `PartyPanel.svelte`, `CastPanel.svelte` and `CatalogPanel.svelte` leave, the worker printing the `rm` for each; the friends list is a panel here reading `friends` on the user document; `src/components/ui/Rail.svelte`, used nowhere else, leaves or loses its sideways track, its head and its steps; `src/lib/firestore.types.ts`, `friends` on `UserProfile` and the row type the Lore list reads, and `getPartyMembers`, `PartyMember`, `getKnownNpcs` and `CampaignFigure` dropped if nothing else reads them; `src/lib/firestore.service.ts`, the read of the friends' profiles, and the Lore read if the six existing reads do not already give it; `firestore.rules` only if reading another user's profile by uid is refused today; `test/walk.sh`, the hearth measure at lines 109 to 119 that counts ten panels. Not `Panel.svelte`, `Card.svelte` or any other file under `src/components/ui/`, which 142 rebuilds; the hearth composes what 142 delivers and asks nothing of it that its props do not give. Not `Shell.svelte`, which is 143. Not `src/components/campaign/**` and not `CampaignPage.svelte`, where cast stays. The page keeps its `nav`, `tools`, `menu` and `chat` snippets. Runs after 142.

## Goal
`just gate` is clean. The walk's hearth shots at 1280 and 1600 show, and the walk asserts, four regions and no others: a friends list along one side running the page's height, campaigns as one horizontal row on the left that wraps and never scrolls, characters as a grid of whole cards under it, and one Lore list below with a divider naming each kind, quests, chronicles, maps, characters, places and encounters, in that order, every row under its divider; no header plate, no rail head, no step arrows, no party, cast or catalog panel. `document.scrollingElement.scrollWidth` equals the viewport width and no element inside `.hall-grid` has `scrollWidth` greater than its `clientWidth`; every card and row the page renders is reachable by the page's own vertical scroll and never by a scroll inside a cell. A user with no friends and a campaign with nothing in it show the empty states.
