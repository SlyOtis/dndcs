---
id: 102
parent:
depends: [101]
relations: []
title: writeRollLog posts the shared entry instead of mirroring it
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
A roll is written to the local `rollStore` by `writeRollLog`, and `getChatLog` observes that append and republishes it to the campaign. The mirror exists because the two lived in different files during the original change, not because the design wants it. One write should reach both.

## Scope
`src/lib/engine.ts`, `src/lib/chat.ts`. Do not change `RollLogItem` or the ten call sites: they already pass the formula.

## Order
1. dndcs: make `writeRollLog` post the shared entry directly when a campaign is in scope, and drop the observer in `getChatLog` that republishes local appends.
2. dndcs: keep the local store as the only path when no campaign is in scope.
3. verify: `just gate`.

## Done when
`getChatLog` no longer watches `rollStore` for entries to publish, a roll in a campaign appears once and not twice, and `just gate` is clean.

## Summary
