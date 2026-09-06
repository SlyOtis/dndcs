---
id: 118
parent: 110
depends: []
relations: []
title: A playwright-cli walk under test/ drives every screen without the extension
type: task
status: blocked
blocked_from: doing
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [test]
commits: []
created_at: 2026-09-06T18:31:20Z
updated_at: 2026-09-06T18:33:27Z
questions: [q-006]
base: 3ae793d4388082f5252e49011258a3bc9234e8d9
---

## Intent
110 walks every screen through the Chrome extension, which only a paired main conversation holds, so an agent cannot take it. The scripted half does not need the extension: `playwright-cli` at `/opt/homebrew/bin/playwright-cli` drives a browser from the terminal, `playwright-cli open`, `goto`, `click`, `fill`, and an agent can write and run it. This task is that half, split out of 110 so each half has one owner and one commit.

## Scope
`test/` only, one script beside the existing suite, plus the `justfile` recipe that runs it. Not `src/**`: a defect the walk finds is boarded, never fixed here. Not the extension walk or the findings list, which stay in 110.

## Order
1. dndcs: a `playwright-cli` script under `test/` that starts from `just dev`, signs in with the credentials the environment provides, and visits the hearth, the character sheet on Testy, a campaign, the create flow through class and race, the class and race detail pages, the profile, sign in and sign up.
2. dndcs: on every page the script asserts the console is clean, the document is no wider than the viewport at 1280, 1600 and 2000, Cmd K opens the search dialog and Cmd K again and Escape close it, and the bar search button toggles it.
3. dndcs: on the character sheet the script asserts the crown carries no frame picker and clicking the portrait opens the frame dialog.
4. dndcs: a `just` recipe runs it so nobody hand rolls the invocation; `just gate` is not widened to include it, since it needs a running dev server and a signed-in session.
5. verify: the recipe runs green against `just dev`, and `just gate` stays clean.

## Done when
The recipe under `justfile` runs the walk to completion against a running `just dev`, every assertion in steps 2 and 3 passes or its failure is boarded as a task, and `just gate` is clean.

## Summary
