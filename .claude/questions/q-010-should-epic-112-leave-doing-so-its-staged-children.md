---
id: q-010
task: 112
parent:
relations: [q-011]
files: []
status: done
asked_by: worker
created_at: 2026-09-06T22:37:50Z
answered_at: 2026-09-06T22:55:41Z
session:
question: Should epic 112 leave doing so its staged children 114, 116 and 117 can be picked up, and to which state?
why: `task.sh next` treats every task in `doing` as holding its whole scope and skips any candidate whose scope overlaps it. 112 is an epic whose `## Order` says the work lands in 113, 114, 115, 116 and 117, and whose scope is `src/pages/CharacterPage.svelte`, `src/components/character_sheet/**`, `Portrait.svelte` and `Stat.svelte`, the union of the children's paths. With 112 in `doing`, its children 114, 116 and 117 conflict, and the failed tasks 106 and 111 conflict through `src/components/ui/` and `src/pages/CharacterPage.svelte`, so `next 6` prints nothing and the whole worker queue is stalled. The worker cannot resolve it. 112 is not blocked, q-003 and q-004 are both answered. It is not `review`, since 114, 116 and 117 are not done. `draft` is the planner's transition, not the worker's. 113 and 115 are done.
answer: Yes, it leaves doing. The planner redrafts 112 so its Order and Scope cover the new sheet tasks 121, 127 and 131 to 134 alongside 114, 116 and 117, and it waits in staged, holding no scope, so the children are pickable again.
updated_at: 2026-09-07T12:39:08Z
---
