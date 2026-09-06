---
id: q-015
task: 103
parent:
relations: []
files: [src/lib/chat.spec.ts]
status: open
asked_by: reviewer
created_at: 2026-09-06T23:21:01Z
answered_at:
---

## Question
Should 103 wait for 102 to land the chat.spec.ts rewrite it already lists as its finding, or take src/lib/chat.spec.ts into its own scope and rewrite the two roll cases itself?

## Why it blocks
`## Done when` on 103 names `just gate` clean. The gate is red: `src/lib/chat.spec.ts` cases "publishes a local roll with the author id the create rule tests" and "publishes a roll once and shows it through the stream, never twice" drive `rollStore.set(...)` and expect `wire.posted` to fill, which 102 removed when `writeRollLog` took over the post. `test/103/20260906T232025Z-just-gate.md` holds the run: 2 failed, 261 passed. Nothing in 103's diff reaches rolls, `chat.spec.ts` is outside 103's `## Scope`, and 102 is still in review carrying the same finding. Sending 103 back to its worker would order a change outside its scope; passing it forward hands the tester a red gate.

## Answer
