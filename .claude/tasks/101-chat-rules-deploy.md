---
id: 101
parent:
depends: []
relations: []
title: Ship the campaign chat rules so the shared roll log works
type: task
status: review
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [data]
commits: [2ad16c4a38130762ec928e9b48c66159fa5ae3db]
created_at: 2026-09-05T15:10:51Z
updated_at: 2026-09-05T15:25:56Z
questions: []
own: [firestore.rules]
base: 9c6454279d0caeb611188943bc943798452fdb7b
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
`firestore.rules`: the `campaigns/{campaignId}/chat/{entryId}` match was already in the tree and is confirmed present at line 110. Members, the DM by `dm_id` and anyone in `player_ids`, read; a member creates only when `request.resource.data.author_id == uid()`; update and delete are the author's alone. The generic `campaigns/{campaignId}/{part}/{recordId}` match below it carries `part != 'chat'` on its write, so the DM-only write no longer shadows the chat match.

`just rules` deployed to `dndcs-420`: rules compiled, `firestore.rules` released to cloud.firestore, indexes deployed. No source touched, nothing outside the scope changed.

### Findings
`task.sh scope` finds no path in a `## Scope` that names a repo-root file, because `scope_of` matches only strings containing a slash. `own: [firestore.rules]` in the frontmatter is what makes `land` and `diff` see this task's one file.

Order step 3, two accounts rolling in one campaign, is the interactive proof in `## Done when` and is left to the tester; it cannot be run from this session.
