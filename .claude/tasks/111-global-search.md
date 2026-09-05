---
id: 111
parent:
depends: []
relations: []
title: Cmd or Ctrl K opens the search dialog on every page and the top bar carries a search button
type: task
status: staged
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: []
created_at: 2026-09-05T15:41:58Z
updated_at: 2026-09-05T15:41:58Z
questions: []
---

## Intent
Cmd or Ctrl K, and the search dialog it opens, exist only on the character sheet: `initializeGlobalEvents` is called from `CharacterPage`'s `onMount` and `<Search />` is mounted there alone. On `/main`, `/user`, a campaign or a source page the shortcut does nothing and there is no button to open search. Nimpress binds the shortcut once at its app root and its header carries the button; this app does the same.

## Scope
`src/App.svelte`, `src/components/ui/Shell.svelte`, `src/lib/globalEvents.ts`, `src/pages/CharacterPage.svelte`, `src/components/search/Search.svelte`. Not the dialog's command list, which is a later task. Not `src/lib/stores/ui.store.ts`, which already carries `openSearchDialog`, `closeSearchDialog` and `toggleSearchDialog`.

## Order
1. dndcs: mount `Search` and the global keydown once at the root in `src/App.svelte`, the way `/Users/slyotis/Projects/nimtech/nimpress/src/layout/App.svelte` binds `onKey` on `svelte:window`, so every routed page has it. Take the mount and the `initializeGlobalEvents` call out of `CharacterPage`; undo, redo and the chat shortcut move with them and keep working on the sheet.
2. dndcs: the shortcut toggles, so a second press closes the dialog. Escape closes it as it does now.
3. dndcs: a search `Sigil` holding `Glyph name="search"` in the `Shell` bar, between `tools` and the split, on every page, calling `uiStore.toggleSearchDialog`. Its title names the shortcut.
4. verify: `just gate`.

## Done when
On `/main`, `/user`, `/campaign/:id` and `/character/:id`: Cmd K opens the search dialog, Cmd K again or Escape closes it, and the bar button does the same. `just gate` is clean.

## Summary
