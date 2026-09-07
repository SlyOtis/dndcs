---
id: 129
parent:
depends: [118]
relations: []
title: The walk's sign in waits for the hearth at /
type: bug
status: done
blocked_from: review
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [test]
commits: []
created_at: 2026-09-06T19:16:40Z
updated_at: 2026-09-07T00:01:36Z
questions: [q-014]
agent: a48f97b062271a32f
base: 99b174e5782b45f6a6793253edf584c1586d436d
---

## Intent
The 110 walk against 118: sign in lands on `/`, the alias of `/main`, so the walk's wait for the hearth times out. The unignored playwright folders are 136.

## Scope
`test/walk.sh`.

## Order
1. dndcs: the walk waits for the hearth's rendered content after sign in rather than for the `/main` path, so `/` satisfies it.
2. verify: the `just` recipe 118 added runs green against `just dev`.

## Done when
The walk runs through sign in without a timeout, and `just gate` is clean.

## Summary
Order 1 landed under 118 before this task was taken: `be3bfba` moved `hearth` above sign in in `test/walk.sh` and replaced the `location.pathname === '/main'` wait with `($hearth) || document.querySelector('.gate-error') !== null`, and the check after it reads `$hearth` rather than the path, so `/` and `/main` both satisfy it. Nothing in `test/` changed under this task; no commit.

Order 2: `task.sh run just walk` against the `just dev` on 5173 with `WALK_EMAIL` and `WALK_PASSWORD` filled printed `the walk is clean`, exit 0, sign in included.

Reviewed: `test/walk.sh` at `be3bfba` carries the change the summary claims, `test/` is clean in the tree and nothing landed under this task. `just gate` exit 0, `test/129/20260906T234340Z-just-gate.md`. `just walk` printed `the walk is clean`, exit 0, `test/129/20260906T234340Z-just-walk.md`, after the dev server on 5173 was restarted through `task.sh serve`; the run against the stale server, `test/129/20260906T234340Z-just-walk-on-the-stale-server.md`, failed on 504 Outdated Optimize Dep and not on `test/walk.sh`. The worker's three findings are all resolved: `test/walk.sh` is committed, `## Scope` resolves, and `just check` reports 0 errors and 0 warnings on `MenuPanel.svelte`.
