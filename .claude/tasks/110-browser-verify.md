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
skills: [claude-in-chrome]
commits: []
created_at: 2026-09-05T15:10:52Z
updated_at: 2026-09-05T15:37:41Z
questions: [q-001]
base: 9c6454279d0caeb611188943bc943798452fdb7b
---

## Intent
The gothic pass, the drawer rebuild, the portrait frames, the glyph set and the shared chat are all confirmed only by `just gate`. A type check is not a behaviour and a build is not a run. Nothing has been seen rendering, because the Chrome extension has never paired with this account: `list_connected_browsers` returns empty.

## Scope
No source unless a defect is found, and then a defect is boarded rather than fixed in place. This task is verification and a findings list.

## Order
1. dndcs: pair the Chrome extension with the account this session runs as, and confirm `list_connected_browsers` returns a device.
2. dndcs: `just dev`, then walk every screen: hearth, character sheet, campaign, the create flow through class and race, the class and race detail pages, the profile, sign in and sign up.
3. dndcs: on each, read the console, confirm no horizontal scroll at any width, and confirm the drawer, the top bar tools, the portraits and the icon buttons render.
4. dndcs: exercise the features: upload a portrait, import a source, pick a class and a race, roll dice, open each dialog.
5. dndcs: board a task for every defect found.

## Done when
Every screen has been seen, the console is clean on each, and every defect found is a task on the board.

## Summary
