---
id: 129
parent:
depends: [118]
relations: []
title: The walk's sign in waits for the hearth at /
type: bug
status: done
session:
review:
blocked_from: review
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [test]
commits: []
created_at: 2026-09-06T19:16:40Z
updated_at: 2026-09-07T10:53:30Z
questions: [q-014]
agent: a48f97b062271a32f
base: 99b174e5782b45f6a6793253edf584c1586d436d
---

## Intent
The 110 walk against 118: sign in lands on `/`, the alias of `/main`, so the walk's wait for the hearth times out. The unignored playwright folders are 136.

## Scope
`test/walk.sh`.


## Goal
The walk runs through sign in without a timeout, and `just gate` is clean.
