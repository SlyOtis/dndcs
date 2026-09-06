---
id: 110
parent:
depends: []
relations: []
title: Verify every screen end to end in the browser
type: task
status: staged
blocked_from: doing
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [claude-in-chrome]
commits: []
created_at: 2026-09-05T15:10:52Z
updated_at: 2026-09-06T18:25:06Z
questions: [q-001]
base: 9c6454279d0caeb611188943bc943798452fdb7b
---

## Intent
The gothic pass, the drawer rebuild, the portrait frames, the glyph set, the shared chat, and since then the global search shortcut and bar button of 111, the board layout of 113 and the frame dialog of 115 are all confirmed only by `just gate`. A type check is not a behaviour and a build is not a run. Nothing has been seen rendering: the Chrome extension has never paired with this account, `list_connected_browsers` returns empty, and the Playwright MCP server fails to connect. `playwright-cli` at `/opt/homebrew/bin/playwright-cli` is installed and is the scripted driver; the extension is the visual one. This task runs solo in a worker session, not through an agent, because only the main conversation holds the `mcp__claude-in-chrome__*` tools.

## Scope
No source unless a defect is found, and then a defect is boarded rather than fixed in place. This task is verification and a findings list. Not 117, which already carries the sheet overflow.

## Order
1. dndcs: pair the Chrome extension with the account this session runs as, and confirm `list_connected_browsers` returns a device. Then `playwright-cli open` against the dev server and confirm it drives a page.
2. dndcs: `just dev`, then walk every screen with the extension: hearth, character sheet, campaign, the create flow through class and race, the class and race detail pages, the profile, sign in and sign up.
3. dndcs: on each, read the console, confirm no horizontal scroll at 1280, 1600 and 2000 wide, and confirm the drawer, the top bar tools, the portraits and the icon buttons render.
4. dndcs: on every routed page, Cmd K opens the search dialog, Cmd K again and Escape close it, and the bar search button toggles it, per 111.
5. dndcs: on the character sheet Testy, the crown carries no frame picker and clicking the portrait opens the frame dialog, per 115; the stat boxes and the tabs panel are read against 113 and 117 and any remaining clip or overflow is noted, not fixed.
6. dndcs: exercise the features: upload a portrait, import a source, pick a class and a race, roll dice, open each dialog.
7. dndcs: repeat steps 2 to 5 as a `playwright-cli` script, so the walk is repeatable without the extension, and keep the script under `test/` beside the existing suite.
8. dndcs: board a task for every defect found.

## Done when
Every screen has been seen through the extension and driven once by `playwright-cli`, the console is clean on each, the search shortcut and button work on every page, and every defect found is a task on the board.

## Summary
