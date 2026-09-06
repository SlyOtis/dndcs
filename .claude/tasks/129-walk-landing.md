---
id: 129
parent:
depends: [118]
relations: []
title: The walk's sign in waits for the hearth at /
type: bug
status: review
blocked_from: review
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [test]
commits: []
created_at: 2026-09-06T19:16:40Z
updated_at: 2026-09-06T23:26:31Z
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
Order 1 landed under 118 before this task was taken: `9fc5342` moved `hearth` above sign in in `test/walk.sh` and replaced the `location.pathname === '/main'` wait with `($hearth) || document.querySelector('.gate-error') !== null`, and the check after it reads `$hearth` rather than the path, so `/` and `/main` both satisfy it. Nothing in `test/` changed under this task; no commit.

Order 2: `task.sh run just walk` against the `just dev` on 5173 with `WALK_EMAIL` and `WALK_PASSWORD` filled printed `the walk is clean`, exit 0, sign in included.

### Findings

1. `test/walk.sh` carries an uncommitted encounter tracker block from 105, which is `done`; the walk above ran with it in place. `task.sh land 129` would have swept it into this task's commit, so nothing was landed.
2. `## Scope` read `` `test/` ``, which `scope_of` in `task.sh` cannot resolve, so `files`, `diff` and `land` printed nothing and exited 1; it now reads `test/walk.sh`.
3. `test/118/20260906T220545Z-just-gate.log` fails `just check` on `src/components/MenuPanel.svelte:37`, `SoundBoard | undefined` against `SoundBoard | null`, which is outside `test/` and belongs to whichever task holds `MenuPanel.svelte`.
