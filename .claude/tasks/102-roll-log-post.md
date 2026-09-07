---
id: 102
parent:
depends: [101]
relations: []
title: writeRollLog posts the shared entry instead of mirroring it
type: task
status: done
session:
review:
blocked_from: doing
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [data]
commits: [4bbadba01f07862e54a564cdd70b92f3b80d4503, 8cff7ba16c30d8117ac50458e4564884e0f4e8ca]
created_at: 2026-09-05T15:10:51Z
updated_at: 2026-09-07T13:36:29Z
questions: [q-016]
agent: aa046906ca5b4827c
base: 2678b268945262a10d6eaae22f3799bfb3e1d07a
---

## Intent
A roll is written to the local `rollStore` by `writeRollLog`, and `getChatLog` observes that append and republishes it to the campaign. The mirror exists because the two lived in different files during the original change, not because the design wants it. One write should reach both.

## Scope
`src/lib/engine.ts`, `src/lib/chat.ts`, `src/lib/chat.spec.ts`. Do not change `RollLogItem` or the ten call sites: they already pass the formula. The spec is in by q-016: the two cases that drive `rollStore` inside a campaign call `writeRollLog` instead, and nothing else in it moves.


## Goal
`getChatLog` no longer watches `rollStore` for entries to publish, a roll in a campaign appears once and not twice, and `just gate` is clean.
