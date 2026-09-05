---
id: 103
parent:
depends: [101]
relations: []
title: Persist the card payload so item and NPC cards survive the shared log
type: bug
status: staged
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [data]
commits: []
created_at: 2026-09-05T15:10:52Z
updated_at: 2026-09-05T15:10:52Z
questions: []
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
