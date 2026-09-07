---
id: 101
parent:
depends: []
relations: []
title: Ship the campaign chat rules so the shared roll log works
type: task
status: done
session:
review:
blocked_from: testing
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [data]
commits: [2ad16c4a38130762ec928e9b48c66159fa5ae3db]
created_at: 2026-09-05T15:10:51Z
updated_at: 2026-09-07T10:53:24Z
questions: [q-007]
scope: [firestore.rules]
base: 9c6454279d0caeb611188943bc943798452fdb7b
---

## Intent
The shared campaign chat and roll log was built against `campaigns/{id}/chat` but the rules that permit it have never reached the project. Until they do, every write is denied and the table sees nothing. `data.md` requires a rule change to ship with the code that needs it, so this closes a change that is already in the tree.

## Scope
`firestore.rules` only. No source. The chat match and the `part != 'chat'` guard on the generic campaign block are already written; this task ships them and proves the path.

## Findings
`task.sh scope` finds no path in a `## Scope` that names a repo-root file, because `scope_of` matches only strings containing a slash. `own: [firestore.rules]` in the frontmatter is what makes `land` and `diff` see this task's one file.

Order step 3, two accounts rolling in one campaign, is the interactive proof in `## Done when` and is left to the tester; it cannot be run from this session.

`firestore.rules` gained `campaigns/{campaignId}/encounters/{encounterId}` and `part != 'encounters'` on the generic read in `1559f69` (#104) after this commit; neither is this task's.

## Goal
`just rules` reports the rules released, and a roll made by one member appears in the other member's log without a reload.
