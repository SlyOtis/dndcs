---
id: 110
parent:
depends: []
relations: []
title: Verify every screen end to end in the browser
type: task
status: review
blocked_from: doing
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: []
commits: []
created_at: 2026-09-05T15:10:52Z
updated_at: 2026-09-06T19:44:41Z
questions: [q-001, q-005]
base: 9c6454279d0caeb611188943bc943798452fdb7b
images: [110/hearth.jpeg, 110/sheet-1280.jpeg, 110/sheet-1600.jpeg, 110/sheet-both-drawers.jpeg, 110/chat-open.jpeg, 110/menu-open.jpeg, 110/import-dialog.jpeg, 110/theme-dialog.jpeg, 110/dialog-unpinned.jpeg, 110/class-detail.jpeg, 110/race.jpeg, 110/race-detail.jpeg, 110/profile.jpeg, 110/create-portrait.jpeg, 110/campaign-create.jpeg, 110/campaign.jpeg]
---

## Intent
Everything since the gothic pass, 111, 113 and 115 included, is confirmed only by `just gate`; a build is not a run. This task sees every screen render through the playwright MCP driving Brave, with `playwright-cli` as the scripted driver, and runs solo because only the main conversation holds the MCP tools.

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
Walked through the playwright MCP driving Brave at 1280, 1600 and 2000 wide as `WALK_EMAIL`: sign in, sign up, hearth, Testy's sheet and its tabs, create, class catalog and detail, race catalog and detail, profile, campaign create. No document scrolls horizontally. Cmd K, a second Cmd K, Escape and the bar button work on every routed page. The crown has no picker and the portrait opens Choose Your Frame. Level up and theme dialogs open centred and close on Escape, also in a full 1728 by 1003 window; the off centre look was the pinned test viewport. Export downloads JSON, a portrait previews on create, the source import takes a class JSON.

### Findings
- A drawer open keeps the board at its 850px max-content width; the ability column drops to 263px with the chat, 12px with both, and the board covers it. 121.
- The sheet shows the fixture Lucky Lars until the routed character loads. 122.
- Three characters carry `blob:http://localhost:5174/` as `imageUrl`; a console error on every page. 123.
- SoundManager preloads nineteen missing `.wav` files: nineteen warnings per sheet. 124.
- The import sources dialog puts `role=dialog` on the backdrop, lacks `#dialog-title`, ignores Escape, and its emoji buttons leave the gothic language. 125.
- Roll Dice and the attack hit button leave the chat log empty. 126.
- Buttons, panels and frames drift from `docs/inspiration`; sizes are fixed where the user wants all dynamic. 127.
- Testy reads Gunslinger Gunslinger: the race field holds the class. 128.
- Campaign page The Shadow of Blackwood, raised through the forge because the account owned none: clean console, no overflow, search works. Its bar carries no menu or chat toggle, so the navigator drawer cannot open on the page meant to fill it. 118 line 28 and q-006 are wrong: the hearth listed 0 campaigns before this walk.
- 118: sign in lands on `/`, the alias of `/main`, so its wait times out. `.playwright-cli/` and `.playwright-mcp/` are not ignored.
- The shell is 6px wider than the viewport, hidden. The video iframe is a fixed 1600px. 127.
- Review answered: sixteen screenshots attached through `task.sh image`, the campaign page walked and the ownership claim corrected above.
