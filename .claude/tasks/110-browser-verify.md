---
id: 110
parent:
depends: []
relations: []
title: Verify every screen end to end in the browser
type: task
status: doing
blocked_from: doing
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: []
commits: []
created_at: 2026-09-05T15:10:52Z
updated_at: 2026-09-06T18:32:54Z
questions: [q-001, q-005]
base: 9c6454279d0caeb611188943bc943798452fdb7b
---

## Intent
The gothic pass, the drawer rebuild, the portrait frames, the glyph set, the shared chat, and since then the global search shortcut and bar button of 111, the board layout of 113 and the frame dialog of 115 are all confirmed only by `just gate`. A type check is not a behaviour and a build is not a run. Nothing has been seen rendering. `playwright-cli` at `/opt/homebrew/bin/playwright-cli` is the scripted driver; the playwright MCP driving Brave is the visual one, and the Chrome extension is never used. This task runs solo in a worker session, not through an agent, because only the main conversation holds the MCP tools.

## Scope
No source unless a defect is found, and then a defect is boarded rather than fixed in place. This task is verification and a findings list. Not 117, which already carries the sheet overflow, and not `test/`, which is 118. It runs solo: `/lcp-worker solo`, never dispatched to an agent.

## Order
1. dndcs: confirm the playwright MCP is connected and drives Brave, then `playwright-cli open` against the dev server and confirm it drives a page.
2. dndcs: `just dev`, then walk every screen through the playwright MCP in Brave, signed in as `WALK_EMAIL` from `.env`: hearth, character sheet, campaign, the create flow through class and race, the class and race detail pages, the profile, sign in and sign up.
3. dndcs: on each, read the console, confirm no horizontal scroll at 1280, 1600 and 2000 wide, and confirm the drawer, the top bar tools, the portraits and the icon buttons render.
4. dndcs: on every routed page, Cmd K opens the search dialog, Cmd K again and Escape close it, and the bar search button toggles it, per 111.
5. dndcs: on the character sheet Testy, the crown carries no frame picker and clicking the portrait opens the frame dialog, per 115; the stat boxes and the tabs panel are read against 113 and 117 and any remaining clip or overflow is noted, not fixed.
6. dndcs: exercise the features: upload a portrait, import a source, pick a class and a race, roll dice, open each dialog.
7. dndcs: the `playwright-cli` walk is 118, a sub task an agent can run; this task does not write it.
8. dndcs: board a task for every defect found.

## Done when
Every screen has been seen through the playwright MCP in Brave, the console is clean on each, the search shortcut and button work on every page, and every defect found is a task on the board.

## Summary
