---
id: 101
parent:
depends: []
relations: []
title: Ship the campaign chat rules so the shared roll log works
type: task
status: staged
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [data]
commits: []
created_at: 2026-09-05T15:10:51Z
updated_at: 2026-09-05T15:10:51Z
questions: []
---

## Intent
The shared campaign chat and roll log was built against `campaigns/{id}/chat` but the rules that permit it have never reached the project. Until they do, every write is denied and the table sees nothing. `data.md` requires a rule change to ship with the code that needs it, so this closes a change that is already in the tree.

## Scope
`firestore.rules` only. No source. The chat match and the `part != 'chat'` guard on the generic campaign block are already written; this task ships them and proves the path.

## Order
1. dndcs: confirm the chat match and the amended generic write rule are present in `firestore.rules`.
2. dndcs: `just rules`.
3. verify: sign in as two accounts in one campaign, roll on each, confirm both entries appear for both.

## Done when
`just rules` reports the rules released, and a roll made by one member appears in the other member's log without a reload.

## Summary
