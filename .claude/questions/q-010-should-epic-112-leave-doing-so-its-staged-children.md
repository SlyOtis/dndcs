---
id: q-010
task: 112
parent:
relations: []
files: []
status: open
asked_by: worker
created_at: 2026-09-06T22:37:50Z
answered_at:
---

## Question
Should epic 112 leave doing so its staged children 114, 116 and 117 can be picked up, and to which state?

## Why it blocks
`task.sh next` treats every task in `doing` as holding its whole scope and skips any candidate whose scope overlaps it. 112 is an epic whose `## Order` says the work lands in 113, 114, 115, 116 and 117, and whose scope is `src/pages/CharacterPage.svelte`, `src/components/character_sheet/**`, `Portrait.svelte` and `Stat.svelte`, the union of the children's paths. With 112 in `doing`, its children 114, 116 and 117 conflict, and the failed tasks 106 and 111 conflict through `src/components/ui/` and `src/pages/CharacterPage.svelte`, so `next 6` prints nothing and the whole worker queue is stalled.

The worker cannot resolve it. 112 is not blocked, q-003 and q-004 are both answered. It is not `review`, since 114, 116 and 117 are not done. `draft` is the planner's transition, not the worker's. 113 and 115 are done.

## Answer
