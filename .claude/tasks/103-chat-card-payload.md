---
id: 103
parent:
depends: [101]
relations: []
title: Persist the card payload so item and NPC cards survive the shared log
type: bug
status: review
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [data]
commits: [986c89369f2f830b251f575bbeee96e985f42f90]
created_at: 2026-09-05T15:10:52Z
updated_at: 2026-09-06T23:16:08Z
questions: []
agent: af273ec30366da1b4
base: d317c82e4f83feef6c051a8023c13408571cc975
---

## Intent
`ChatItem` gives an entry its `.card` treatment from `logItem.data.data?.type` being `item_card` or `npc_card`. The shared log does not persist that payload, so an item or NPC card read back from the campaign renders as plain prose. The markdown survives; the styling does not.

## Scope
`src/lib/firestore.types.ts`, `src/lib/chat.ts`, `src/components/chat/ChatItem.svelte`.

## Order
1. dndcs: carry the card kind on `CampaignChatEntry` so the payload that decides the treatment is stored, not the whole opaque blob.
2. dndcs: set it when publishing and read it back in `asLogItem`.
3. verify: `just gate`.

## Done when
An item card posted by one member renders with its card treatment for another member, and `just gate` is clean.

## Summary
`src/lib/firestore.types.ts`: `CampaignCardKind` is `'' | 'item_card' | 'npc_card'` and `CampaignChatEntry` carries `card_kind?: CampaignCardKind` beside `is_hidden`. Only the kind is stored, never the item or NPC blob.

`src/lib/chat.ts`: `asCardKind` narrows an unknown `type` to `CampaignCardKind`. `asMessageEntry` sets `card_kind` from `item.data?.type`, so an entry that is not a card publishes `''` rather than `undefined`, which `setDoc` rejects. `asLogItem` rebuilds `data: { type: cardKind }` on the chat payload when the kind is set, which is what `ChatItem` reads for `class:card`.

`src/components/chat/ChatItem.svelte`: unchanged. Its condition already reads `logItem.data.data?.type` and the rebuilt payload satisfies it.

`card_kind` is optional because `asRollEntry` in `src/lib/engine.ts` and the `CampaignChatEntry` fixtures in `chat.spec.ts` and `firestore.service.spec.ts` are outside this scope and do not set it.

`just check` is 88 files, 0 errors, 0 warnings. `just build` is clean; the >500 kB chunk note is pre-existing and unrelated.
