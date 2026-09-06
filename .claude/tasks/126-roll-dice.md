---
id: 126
parent:
depends: [102]
relations: []
title: Roll Dice and the attack hit button post a roll to the chat log
type: bug
status: staged
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: []
created_at: 2026-09-06T19:12:49Z
updated_at: 2026-09-06T19:16:42Z
questions: []
---

## Intent
The 110 walk: Roll Dice and the attack hit button leave the chat log empty. Every roll in `src/lib/engine.ts` goes through `writeRollLog`, which today appends to the local `rollStore` and relies on an observer in `getChatLog` to republish; 102 makes `writeRollLog` post the shared entry itself. After 102, a roll that still does not reach the log is a button that never calls a roll, and the search command `dice` in `Search.svelte` is a `console.log`.

## Scope
The Roll Dice control wherever it renders on the sheet or in the drawer, `src/components/character_sheet/main_tabs/ActionAttack.svelte`, `src/components/search/Search.svelte`, `src/lib/chat.ts`. Not `writeRollLog` itself, which is 102.

## Order
1. dndcs: after 102 lands, press Roll Dice and the attack hit button on Testy with the chat open and find which of the two never reaches `writeRollLog` and which reaches it but is not rendered.
2. dndcs: both post one entry to the chat log, with the formula and the total the way an ability roll already does, and the `dice` command in search does the same instead of logging to the console.
3. verify: `just gate`, then `just dev` on Testy with the chat open.

## Done when
Roll Dice, the attack hit button and the search `dice` command each add one roll entry to the chat log on Testy, and `just gate` is clean.

## Summary
