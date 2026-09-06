---
id: 118
parent: 110
depends: []
relations: [136]
title: A playwright-cli walk under test/ drives every screen without the extension
type: task
status: failed
blocked_from: doing
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [test]
commits: [b5178ca3f8332b0ffaa3ef8645c13280570f08e0, 31a074c313831a7483c2173ef6b8f429d4742d5e]
created_at: 2026-09-06T18:31:20Z
updated_at: 2026-09-06T20:10:57Z
questions: [q-006]
base: 3ae793d4388082f5252e49011258a3bc9234e8d9
---

## Intent
110 walks every screen through the playwright MCP driving Brave, which only a main conversation holds, so an agent cannot take it. The scripted half does not need the extension: `playwright-cli` at `/opt/homebrew/bin/playwright-cli` drives a browser from the terminal, `playwright-cli open`, `goto`, `click`, `fill`, and an agent can write and run it. This task is that half, split out of 110 so each half has one owner and one commit.

## Scope
`test/walk.sh`, one script beside the existing suite, the `walk` recipe in `./justfile`, and the two key names in `./.env.example`. Not `src/**`: a defect the walk finds is boarded, never fixed here. Not the extension walk or the findings list, which stay in 110.

## Order
1. dndcs: a `playwright-cli` script under `test/` that starts from `just dev`, signs in by filling `#login-email` and `#login-password` from an email key and a password key read from `.env`, both named in `.env.example` without a `VITE_` prefix since a secret never enters the bundle, per q-006. The account behind them owns Testy and a campaign. It then visits the hearth, the character sheet on Testy, a campaign, the create flow through class and race, the class and race detail pages, the profile, sign in and sign up.
2. dndcs: on every page the script asserts the console is clean, the document is no wider than the viewport at 1280, 1600 and 2000, Cmd K opens the search dialog and Cmd K again and Escape close it, and the bar search button toggles it.
3. dndcs: on the character sheet the script asserts the crown carries no frame picker and clicking the portrait opens the frame dialog.
4. dndcs: a `just` recipe runs it so nobody hand rolls the invocation; `just gate` is not widened to include it, since it needs a running dev server and a signed-in session.
5. verify: the recipe runs green against `just dev`, and `just gate` stays clean.

## Done when
The recipe under `justfile` runs the walk to completion against a running `just dev`, every assertion in steps 2 and 3 passes or its failure is boarded as a task, and `just gate` is clean.

## Summary
`test/walk.sh` reads `WALK_EMAIL` and `WALK_PASSWORD` from `.env`, stops when either is empty or nothing answers on 5173, and drives a headless `playwright-cli` session named `walk`. It checks `/login` and `/signup`, signs in, then visits the hearth, Testy through its card, the first campaign card, the character form, the class catalog after `Continue`, the first class detail, the race catalog after picking the first class, the first race detail and `/user`. Every page is a fresh `goto`, so the console read is that page alone. On each: zero console errors and warnings, `scrollWidth` within `innerWidth` at 1280, 1600 and 2000, Cmd K opens `#search-command`, Cmd K closes, Cmd K opens, Escape closes, and where a bar exists a pointer press on the search sigil opens and a second closes. On the sheet `.sheet-crown` holds no `select`, `.trace` or `aria-pressed` control and names no frame, and the portrait opens `Choose Your Frame`. Failures are listed at the end, exit 1.

`justfile`: `walk` runs `bash test/walk.sh`; `gate` unchanged; `env` reads only the `VITE_` keys `.env.example` names, so an empty `WALK_EMAIL` or `WALK_PASSWORD` stops `just walk` alone and never `just dev`, `just build` or `just gate`. `.env.example` names the two keys after the six Firebase values; `.env` carries them empty.

### Findings

1. `test/walk.sh:90` with the keys filled, `/login` and `/signup` pass, then every `js` call after the Sign In click prints `The browser 'walk' is not open`; the walk never reaches `/main`. Find why the session is lost at sign in and run `just walk` through before review.
2. `test/walk.sh:15` `js` pipes the cli's error text into `jq`, 57 `jq: parse error` lines for one lost session; test `pw eval` before `jq` and exit once with the cli's message.
3. `## Done when` says the walk runs to completion; Summary Finding 1 said step 5 never ran. A task lands in review after its `## Done when` has been run, not before.
