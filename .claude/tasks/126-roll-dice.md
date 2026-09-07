---
id: 126
parent:
depends: [102]
relations: []
title: Roll Dice and the attack hit button post a roll to the chat log
type: bug
status: doing
session: 8dec51df-8b9f-47a4-9877-00e448df3116
review:
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: []
created_at: 2026-09-06T19:12:49Z
updated_at: 2026-09-07T14:37:57Z
questions: []
base: 3cf051a21d310bec85863dd6f6d10041c437d302
---

## Intent
The 110 walk: Roll Dice and the attack hit button leave the chat log empty. Every roll in `src/lib/engine.ts` goes through `writeRollLog`, which today appends to the local `rollStore` and relies on an observer in `getChatLog` to republish; 102 makes `writeRollLog` post the shared entry itself. After 102, a roll that still does not reach the log is a button that never calls a roll, and the search command `dice` in `Search.svelte` is a `console.log`.

## Scope
The Roll Dice control wherever it renders on the sheet or in the drawer, `src/components/character_sheet/main_tabs/ActionAttack.svelte`, `src/components/search/Search.svelte`, `src/lib/chat.ts`. Not `writeRollLog` itself, which is 102.


## Goal
Roll Dice, the attack hit button and the search `dice` command each add one roll entry to the chat log on Testy, and `just gate` is clean.
