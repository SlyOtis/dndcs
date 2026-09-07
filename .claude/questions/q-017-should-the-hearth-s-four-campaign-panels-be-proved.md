---
id: q-017
task: 145
parent:
relations: []
files: [src/pages/main/EncountersPanel.svelte, src/lib/firestore.service.ts]
status: done
asked_by: reviewer
created_at: 2026-09-07T11:07:43Z
answered_at: 2026-09-07T13:34:42Z
session:
question: Should the hearth's four campaign panels be proved against a seeded campaign, and who writes the seed?
why: `goal` asks for a campaign carrying at least one map, npc, location and encounter, and for each campaign row to sit under its campaign's name. Signed in on the walk account at 1280 and 1600 the hearth draws all ten panels in the grid, no empty column and no overflow at 360, 640, 900, 1280, 1600 or 2000, and the catalog tallies `14 classes, 9 races`, but Maps, Cast, Places and Encounters all draw their empty line: campaign Y93oKQmd3vqjSczJb2EJ carries none of the four. The populated half of the goal is unproved and neither shot in `images` shows a campaign row. The app cannot make one. `postMap`, `postNpc` and `postLocation` have call sites on `CampaignMaps.svelte:75`, `CampaignCast.svelte:72` and `CampaignPlaces.svelte:63`, so a DM can add a map, a soul and a place. `postEncounter` at `src/lib/firestore.service.ts:648` has no call site anywhere in `src`; `MainMenu.svelte:73` only listens. An encounter can only exist by a hand write into Firestore, and `src/components/campaign/**` is out of 145's scope so no encounter form is 145's to build. Seeding the live project is a write the reviewer does not decide. Memory holds the user's 2026-09-06 statement that everything in that campaign and its subcollections is disposable test data, but not that a session may add to it. q-007 settled fixtures for 101's test suite only, and 145 has no suite: `just walk` is its run and it passes green on the empty states. Choices: 145 passes on what stands, and the campaign rows are proved by whichever task builds encounter authoring; or the campaign is seeded by hand with one map, npc, location and encounter and the walk reshoots at 1280 and 1600 before it passes; or 145 goes to `testing` and the tester seeds its own fixtures the way q-007 settled for 101.
answer: All three, in order. 145 passes on what stands: the empty states are proved and the campaign rows are proved durably by whichever task builds encounter authoring, since the app has no way to make an encounter and the campaign components are out of 145's scope. The campaign is seeded by hand with one map, npc, location and encounter now, for this test run only, and the walk reshoots at 1280 and 1600 before 145 passes; a hand seed is not the standing method. 145 then goes to testing and the tester seeds its own fixtures the way q-007 settled for 101. Decided by the user 2026-09-07.
updated_at: 2026-09-07T13:34:42Z
---
