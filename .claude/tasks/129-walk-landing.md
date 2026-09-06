---
id: 129
parent:
depends: [118]
relations: []
title: The walk's sign in waits for the hearth at / and the playwright folders are ignored
type: bug
status: staged
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [test]
commits: []
created_at: 2026-09-06T19:16:40Z
updated_at: 2026-09-06T19:16:43Z
questions: []
---

## Intent
The 110 walk against 118: sign in lands on `/`, the alias of `/main`, so the walk's wait for the hearth times out. The unignored playwright folders are 136.

## Scope
`test/`.

## Order
1. dndcs: the walk waits for the hearth's rendered content after sign in rather than for the `/main` path, so `/` satisfies it.
2. verify: the `just` recipe 118 added runs green against `just dev`.

## Done when
The walk runs through sign in without a timeout, and `just gate` is clean.

## Summary
