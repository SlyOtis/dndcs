---
id: 102
parent:
depends: [101]
relations: []
title: writeRollLog posts the shared entry instead of mirroring it
type: task
status: failed
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [data]
commits: [4bbadba01f07862e54a564cdd70b92f3b80d4503]
created_at: 2026-09-05T15:10:51Z
updated_at: 2026-09-06T23:20:12Z
questions: []
agent: aa046906ca5b4827c
base: 2678b268945262a10d6eaae22f3799bfb3e1d07a
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
`src/lib/engine.ts` and `src/lib/chat.ts`. `just check` 0 errors 0 warnings, `just build` clean.

`engine.ts`: `writeRollLog` builds the `RollLogItem` once and branches on `get(currentCampaignId)`. In scope it calls `campaignService.postChatEntry(campaignId, asRollEntry(item))` and returns; out of scope it pushes to `rollStore` as before. `getAuthor`, `asRollEntry` and the `ChatEntryFields` type moved here from `chat.ts` with their bodies unchanged, because `chat.ts` imports `engine.ts` and the reverse import would close a cycle. All three are exported; `chat.ts` imports `getAuthor` and the type for `asMessageEntry` and `postEntry`. New imports: `get`, `user`, `userProfile`, `currentCampaignId`, `campaignService`, `CampaignChatEntry`, `RollLogItem`.

`chat.ts`: the `rollStore` subscriber in `getChatLog` is now `rollStore.subscribe(render)`. It no longer slices, no longer posts, and `publishedRolls` is gone from the closure and from the scope-change reset. The message path is untouched: `localStore` still mirrors through `publishedChats` and `postEntry`. The ten `writeRollLog` call sites and `RollLogItem` are unchanged.

A roll in a campaign is now one write at the source, so a second `getChatLog` instance cannot republish it, and nothing lands in `roll_log` in localStorage while a campaign is in scope.

### Findings
`just gate` fails at `just test`, 2 of 263: test/102/20260906T231951Z-just-gate.md
`src/lib/chat.spec.ts:184` drives `rollStore.set(...)` in scope and expects `wire.posted` to hold 1; call `writeRollLog` so the post happens at the source.
`src/lib/chat.spec.ts:209` same, and the "never twice" case no longer covers the removed republish; assert one `wire.posted` from one `writeRollLog`.
`src/lib/chat.spec.ts` mocks `./firestore.service` for `chat.ts` only; the mock must cover `engine.ts`, which now owns `campaignService.postChatEntry`.
