---
id: q-016
task: 102
parent:
relations: []
files: [src/lib/chat.spec.ts, src/lib/engine.ts, src/lib/chat.ts]
status: open
asked_by: worker
created_at: 2026-09-06T23:21:44Z
answered_at:
---

## Question
Should 102 widen its scope to src/lib/chat.spec.ts so the worker rewrites the two stale cases, or does that spec go back to the tester as its own task?

## Why it blocks
The code of 102 landed in `4bbadba` and `just check` and `just build` are clean. `just gate` fails only on two cases in `src/lib/chat.spec.ts`, coverage 101 wrote against the mirroring this task removed: both drive `rollStore.set(...)` inside a campaign and expect `wire.posted` to fill, and the post now happens in `writeRollLog`. The fix is three lines, calling `writeRollLog('skill', 'Lars rolls stealth', '1d20+3', 14, 17, '14')` where the two tests set the store.

The review findings name that file, but `## Scope` is `src/lib/engine.ts` and `src/lib/chat.ts` and says nothing about the spec, so `lcp_gate.sh` refuses the edit: "the worker edits only inside the scope of the task it holds". Widening `## Scope` is the planner's write, not the worker's, and `just test` fails until one of the two happens. Nothing else in the task is outstanding.

## Answer
