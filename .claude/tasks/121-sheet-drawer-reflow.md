---
id: 121
parent:
depends: [117]
relations: [117]
title: The sheet board shrinks with the content area when a drawer opens and the ability column keeps its width
type: task
status: staged
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: []
created_at: 2026-09-06T19:12:48Z
updated_at: 2026-09-06T19:16:41Z
questions: []
---

## Intent
The 110 walk: with a drawer open the board keeps its 850px max-content width, the ability column drops to 263px with the chat open and to 12px with both drawers open, and the board covers it. `Shell` narrows the content column by `--shell-menu` and `--shell-chat`, up to 400px each, and the sheet grid does not give that width back.

## Scope
`src/pages/CharacterPage.svelte` (`.sheet-grid`, `.sheet-board`, `.sheet-stats`, `.sheet-tabs`). Not `src/components/ui/Shell.svelte`. Runs after 117, which owns the same rules and sets the floors to zero.

## Order
1. dndcs: when the menu, the chat or both drawers open, the board gives up width first and the ability column keeps the width it has with no drawer open; nothing overlaps and nothing is cut.
2. verify: `just gate`, then `just dev` on Testy at 1280 and 1600 with each drawer and both open.

## Done when
At 1280 and 1600 wide with both drawers open the ability column is as wide as with none, the board sits beside it without overlap, the page never scrolls sideways, and `just gate` is clean.

## Summary
