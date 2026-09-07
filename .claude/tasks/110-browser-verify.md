---
id: 110
parent:
depends: []
relations: []
title: Verify every screen end to end in the browser
type: task
status: done
session:
review:
blocked_from: doing
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: []
commits: []
created_at: 2026-09-05T15:10:52Z
updated_at: 2026-09-07T10:53:26Z
questions: [q-001, q-005]
base: 9c6454279d0caeb611188943bc943798452fdb7b
images: [110/hearth.jpeg, 110/sheet-1280.jpeg, 110/sheet-1600.jpeg, 110/sheet-both-drawers.jpeg, 110/chat-open.jpeg, 110/menu-open.jpeg, 110/import-dialog.jpeg, 110/theme-dialog.jpeg, 110/dialog-unpinned.jpeg, 110/class-detail.jpeg, 110/race.jpeg, 110/race-detail.jpeg, 110/profile.jpeg, 110/create-portrait.jpeg, 110/campaign-create.jpeg, 110/campaign.jpeg]
---

## Intent
Everything since the gothic pass, 111, 113 and 115 included, is confirmed only by `just gate`; a build is not a run. This task sees every screen render through the playwright MCP driving Brave, with `playwright-cli` as the scripted driver, and runs solo because only the main conversation holds the MCP tools.

## Scope
No source unless a defect is found, and then a defect is boarded rather than fixed in place. This task is verification and a findings list. Not 117, which already carries the sheet overflow, and not `test/`, which is 118. It runs solo: `/lcp-worker solo`, never dispatched to an agent.

## Findings
- `/character/<unknown id>` keeps Lucky Lars on screen for good and logs a permissions error plus two scope errors. 137.
- `/login` and `/signup` carry no search button and Cmd K opens the palette signed out with signed in commands on it. 138.
- 129 retitled to the sign in landing alone; 136 owns the folders.

## Goal
Every screen has been seen through the playwright MCP in Brave, the console is clean on each, the search shortcut and button work on every page, and every defect found is a task on the board.
