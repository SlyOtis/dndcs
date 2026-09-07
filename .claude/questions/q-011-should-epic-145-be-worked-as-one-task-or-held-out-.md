---
id: q-011
task: 145
parent:
relations: [q-010]
files: [src/pages/MainPage.svelte]
status: done
asked_by: planner
created_at: 2026-09-06T22:43:25Z
answered_at: 2026-09-06T22:55:48Z
session:
question: Should epic 145 be worked as one task, or held out of the worker queue until 146, 147 and 148 are done, and in which state does it wait?
why: `task.sh next 5` prints 145 alone, so the worker queue is one epic. 145's `## Order` is three lines that name 146, 147 and 148 and no change of its own, and its `## Done when` is "146, 147 and 148 are done", which no worker on 145 can satisfy. Working it as one task writes all three children's code under one id against a `## Scope` that is the union of their paths, `src/pages/MainPage.svelte`, `src/pages/main/**`, `src/lib/firestore.service.ts` and `src/lib/firestore.types.ts`. Moving it to `doing` reproduces q-010. `next` treats a task in `doing` as holding its whole scope, so 145 in `doing` would skip 147 and 148 on every path they share with it, the same way 112 in `doing` skips 114, 116 and 117 today. Nothing else is ready either. 146 depends on 106, which is `review` and not `done`; 147 and 148 depend on 146. `.hall-rails` at `src/pages/MainPage.svelte:211` is still `display: flex; flex-direction: column`, so none of the grid has landed and no part of 145 is already met. The worker cannot resolve it. 145 has no open question of its own, no unmet `depends`, and `draft` is the planner's transition. `staged:done` is the only other legal move from here and the condition for it is false.
answer: As one task. 145 is worked whole by a single worker against the union scope, writing the grid, the panels and the catalog under one id, and 146, 147 and 148 are dropped rather than held, since none of them has landed and splitting only stalls the queue.
updated_at: 2026-09-07T12:39:08Z
---
