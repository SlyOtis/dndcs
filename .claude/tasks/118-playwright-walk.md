---
id: 118
parent: 110
depends: []
relations: [136]
title: A playwright-cli walk under test/ drives every screen without the extension
type: task
status: done
session:
review:
blocked_from: doing
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [test]
commits: [b5178ca3f8332b0ffaa3ef8645c13280570f08e0, 31a074c313831a7483c2173ef6b8f429d4742d5e, 9fc5342a941ab6c34a8532c02783caba699bbfee]
created_at: 2026-09-06T18:31:20Z
updated_at: 2026-09-07T10:53:27Z
questions: [q-006]
base: 3ae793d4388082f5252e49011258a3bc9234e8d9
---

## Intent
110 walks every screen through the playwright MCP driving Brave, which only a main conversation holds, so an agent cannot take it. The scripted half does not need the extension: `playwright-cli` at `/opt/homebrew/bin/playwright-cli` drives a browser from the terminal, `playwright-cli open`, `goto`, `click`, `fill`, and an agent can write and run it. This task is that half, split out of 110 so each half has one owner and one commit.

## Scope
`test/walk.sh`, one script beside the existing suite, the `walk` recipe in `./justfile`, and the two key names in `./.env.example`. Not `src/**`: a defect the walk finds is boarded, never fixed here. Not the extension walk or the findings list, which stay in 110.

## Findings

1. `just walk` ran to completion twice against `just dev` with the keys filled: `the walk is clean`, exit 0, no output but that line, about four minutes a run.
2. Sign in lands on `/`: `LoginPage.svelte:22` calls `navigate("/")` and the router renders the hearth there without moving the URL to `/main`, so the old wait for `location.pathname === '/main'` timed out and line 90 exited. `walk.sh` now waits for the hearth itself, `.hall-hero-name` present and `.dnd-loading` gone, or `.gate-error`. The URL after sign in is a `src/**` matter and is not changed here.
3. `js` reads `pw eval` into a variable and, on a non zero exit, prints `playwright-cli: <message>` to stderr and sends the script `TERM`, so a lost session is one line and the `EXIT` trap still closes the browser. The two `.click()` evals return `?? null`, since `--raw` prints `undefined` for a void result and `jq` refused it.
4. The `browser 'walk' is not open` run was against a dev server answering 504 `Outdated Optimize Dep` on every module: `just build` runs `rm -rf node_modules/.vite` and a `just dev` already running never re-optimizes, so every page is blank until it restarts. `touch vite.config.ts` restarts it. `justfile:29` is outside `## Scope`.

## Goal
The recipe under `justfile` runs the walk to completion against a running `just dev`, every assertion in steps 2 and 3 passes or its failure is boarded as a task, and `just gate` is clean.
