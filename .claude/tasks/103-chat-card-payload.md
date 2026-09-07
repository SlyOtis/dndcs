---
id: 103
parent:
depends: [101]
relations: []
title: Persist the card payload so item and NPC cards survive the shared log
type: bug
status: done
session:
review:
blocked_from: review
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [data]
commits: [986c89369f2f830b251f575bbeee96e985f42f90]
created_at: 2026-09-05T15:10:52Z
updated_at: 2026-09-07T10:53:24Z
questions: [q-015]
agent: af273ec30366da1b4
base: d317c82e4f83feef6c051a8023c13408571cc975
---

## Intent
`ChatItem` gives an entry its `.card` treatment from `logItem.data.data?.type` being `item_card` or `npc_card`. The shared log does not persist that payload, so an item or NPC card read back from the campaign renders as plain prose. The markdown survives; the styling does not.

## Scope
`src/lib/firestore.types.ts`, `src/lib/chat.ts`, `src/components/chat/ChatItem.svelte`.


## Goal
An item card posted by one member renders with its card treatment for another member, and `just gate` is clean.
